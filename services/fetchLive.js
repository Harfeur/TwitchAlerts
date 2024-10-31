const {EmbedBuilder, PermissionsBitField} = require("discord.js");
const {getString} = require("../modules/language");
const logger = require("../modules/logger");
const {generateLiveEmbed} = require("../models/embedService");

class FetchLive {

    /**
     *
     * @param client
     * @param webhooks {EventSubHttpListener[]}
     */
    constructor(client, webhooks) {
        this.client = client;

        this.webhooks = webhooks;
        this.ready = false;

        this.subscriptions = new Map();

        // Stores data of current streams
        this.streamers = new Map();

        // Stores guild or channel not found to delete old alerts
        this.notfound = new Map();
    }

    async markAsReady() {
        if (this.ready) return;
        this.ready = true;

        while (true) {
            logger.debug("Checking streams...");
            await this.checkCurrentStreams();
            await this.updateAlerts();
            logger.debug("Alerts updated");
        }

        return;

        setInterval((function (self) {
            return async function () {
                logger.debug("Checking streams...");
                await self.checkCurrentStreams();
                await self.updateAlerts();
                logger.debug("Alerts updated");
            }
        })(this), 200000, this);
        await this.checkCurrentStreams();
        await this.updateAlerts();
    }

    deleteNotFound(id) {
        if (!this.notfound.get(id)) this.notfound.set(id, 0);
        this.notfound.set(id, this.notfound.get(id) + 1);

        if (this.notfound.get(id) === 10) {
            this.notfound.delete(id);
            this.client.container.pg.deleteFromID(id);
        }
    }

    async checkCurrentStreams() {
        const s = Date.now()

        const streamers = await this.client.container.pg.listAllStreamers();
        while (streamers.length) {
            // We take the first 100 streamers, because we're limited by Twitch
            const streamers100 = streamers.splice(0, 100).map(s => s.streamer_id);
            const streamsData = await this.client.container.twitch.streams.getStreamsByUserIds(streamers100);

            // We save the data of the current stream in this.streamers.
            for (const streamerID of streamers100) {
                const stream = streamsData.filter(stream => stream.userId === streamerID)[0];
                if (stream) {
                    this.streamers.set(streamerID, stream);
                } else {
                    this.streamers.delete(streamerID);
                }
            }
        }

        logger.debug(`${this.streamers.size} streamers are streaming`);
    }

    async updateAlerts() {
        const alerts = await this.client.container.pg.listAllAlerts();
        for (const alert of alerts) {
            const stream = this.streamers.get(alert.streamer_id);
            if (stream || alert.alert_message) {
                await this.updateAlert(alert, stream);
            }
        }
    }

    async showStreamOnlineMessage(alert, stream, channel, user, lang) {
        if (!user) user = await stream.getUser();
        const game = await stream.getGame();

        const embed = await generateLiveEmbed(user, stream, game, alert, lang)

        if (!alert.alert_message) {
            channel.send({
                content: `${alert.alert_start}\n<https://www.twitch.tv/${user.name}>`,
                embeds: [embed]
            }).then(msg => {
                this.client.container.pg.setAlertMessage(alert.guild_id, alert.streamer_id, msg.id);
            }).catch(err => {
                    logger.debug(`Can't send message in channel ${channel.id}`)
                });
        } else {
            channel.messages.fetch(alert.alert_message)
                .then(message => {
                    message.edit({
                        content: `${alert.alert_start}\n<https://www.twitch.tv/${user.name}>`,
                        embeds: [embed]
                    }).catch(err => {
                        logger.debug(`Can't edit message ${alert.alert_message} in channel ${channel.id}`);
                    });
                })
                .catch(err => {
                    logger.debug(`Can't find message ${alert.alert_message} in channel ${channel.id}`)
                })
        }
    }

    async showStreamOfflineMessage(alert, channel, lang) {
        await this.client.container.pg.removeAlertMessage(alert.guild_id, alert.streamer_id);
        if (alert.alert_message)
            channel.messages.fetch(alert.alert_message)
                .then(async message => {

                    const videos = await this.client.container.twitch.videos.getVideosByUser(alert.streamer_id, {
                        limit: 1,
                        orderBy: "time",
                        type: "archive"
                    });
                    const video = videos.data.length !== 0 ? videos.data[0] : null

                    let embed;

                    if (!video) {
                        // Pas de redif
                        if (message.embeds.length > 0) {
                            embed = new EmbedBuilder(message.embeds[0].data);
                            embed.setTitle(getString(lang, "LIVE_END"));
                            embed.setFields(embed.data.fields.filter(field => field.name !== getString(lang, "VIEWERS")));
                            message.edit({
                                content: alert.alert_end,
                                embeds: [embed]
                            }).catch(err => {
                                logger.debug(`Can't edit message ${alert.alert_message} in channel ${channel.id}`);
                            });
                        } else {
                            message.edit(alert.alert_end).catch(err => {
                                logger.debug(`Can't edit message ${alert.alert_message} in channel ${channel.id}`);
                            });
                        }
                    } else {
                        if (message.embeds.length > 0) {
                            embed = new EmbedBuilder(message.embeds[0].data);
                            embed.setTitle(getString(lang, "LIVE_END"));
                            embed.setFields(embed.data.fields.filter(field => field.name !== getString(lang, "VIEWERS")));
                            embed.setURL(video.url);
                            message.edit({
                                content: `${alert.alert_end} <${video.url}>`,
                                embeds: [embed]
                            }).catch(err => {
                                logger.debug(`Can't edit message ${alert.alert_message} in channel ${channel.id}`);
                            });
                        } else {
                            message.edit(`${alert.alert_end} <${video.url}>`).catch(err => {
                                logger.debug(`Can't edit message ${alert.alert_message} in channel ${channel.id}`);
                            });
                        }
                    }
                }).catch(err => {
                    logger.debug(`Can't find message ${alert.alert_message} in channel ${channel.id}`)
            });
    }

    async updateAlert(alert, stream, user=null) {
        // Fetch server
        let guild;
        try {
            guild = await this.client.guilds.fetch(alert.guild_id);
        } catch (e) {
            this.deleteNotFound(alert.guild_id);
            if (this.client.container.debug) logger.debug(`Guild ${alert.guild_id} not found`);
            return;
        }
        if (!guild.available) return;

        // Fetch channel
        let channel;
        try {
            channel = await guild.channels.fetch(alert.alert_channel);
        } catch (e) {
            this.deleteNotFound(alert.alert_channel);
            if (this.client.container.debug) logger.debug(`Channel ${alert.alert_channel} not found`);
            return;
        }
        if (!channel.permissionsFor(this.client.user).has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ])) {
            if (alert.alert_message) await this.client.container.pg.removeAlertMessage(alert.guild_id, alert.streamer_id);
            return;
        }

        const lang = alert.guild_language !== "default" ? alert.guild_language : guild.preferredLocale;

        if (stream) {
            await this.showStreamOnlineMessage(alert, stream, channel, user, lang);
        } else {
            await this.showStreamOfflineMessage(alert, channel, lang);
        }
    }
}

module.exports = FetchLive;