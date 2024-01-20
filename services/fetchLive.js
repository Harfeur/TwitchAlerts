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
    }

    async markAsReady() {
        if (this.ready) return;
        this.ready = true;

        setInterval((function (self) {
            return function () {
                self.checkCurrentStreams();
            }
        })(this), 200000, this);
        await this.checkCurrentStreams();
        logger.log("Streams status checked", "ready");
    }

    async checkCurrentStreams() {
        const alerts = await this.client.container.pg.listAllAlerts();
        let oldAlerts = [];
        const alertsBy100 = [];
        while (alerts.length) {
            alertsBy100.push(alerts.splice(0, 100));
        }

        for (const alertGroup of alertsBy100) {
            const ids = alertGroup.map(a => a.streamer_id);
            const streams = await this.client.container.twitch.streams.getStreamsByUserIds(ids);
            for (const alert of alertGroup) {
                let stream = streams.filter(stream => stream.userId === alert.streamer_id)[0];
                if (stream && !alert.streamer_live) {
                    await this.client.container.pg.streamOnline(alert.streamer_id);
                } else if (!stream && alert.streamer_live) {
                    await this.client.container.pg.streamOffline(alert.streamer_id);
                    oldAlerts.push(alert);
                }
            }
        }
        await this.fetchLive(oldAlerts);
    }

    streamerAdded(streamer) {
        return // Removed because it's not working
        if (!this.subscriptions.has(streamer)) {
            let webhookID = Math.floor(this.subscriptions.size / 2000);
            if (webhookID >= parseInt(process.env.WEBHOOK_CLIENTS)) {
                webhookID = parseInt(process.env.WEBHOOK_CLIENTS) - 1;
                logger.warn("You need to add more webhooks clients !!");
            }
            const webhook = this.webhooks[webhookID] // Max 5000 streamers per webhook
            const ev1 = webhook.onStreamOnline(streamer, async event => {
                await this.client.container.pg.streamOnline(event.broadcasterId);
                const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);
                const stream = await event.getStream();

                for (const alert of alerts) {
                    await this.updateAlert(alert, stream);
                }
            });

            const ev2 = webhook.onStreamOffline(streamer, async event => {
                await this.client.container.pg.streamOffline(event.broadcasterId);
                const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);

                for (const alert of alerts) {
                    await this.updateAlert(alert, null);
                }
            });

            logger.debug(`Subscriptions on for ${streamer} on webhook${webhookID}`);
            this.subscriptions.set(streamer, [webhook, ev1, ev2]);
        }
    }

    async streamerRemoved(streamer) {
        return // Removed because it's not working
        if (this.subscriptions.has(streamer)) {
            const alerts = await this.client.container.pg.listAlertsByStreamer(streamer);
            if (alerts.length === 0) {
                logger.debug(`Subscriptions off for ${streamer}`)
                const sub = this.subscriptions.get(streamer);
                sub[1].stop();
                sub[2].stop();
                this.subscriptions.delete(streamer);
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
                    }).catch(logger.error);
                })
                .catch(err => {
                    logger.debug(`Can't find message ${alert.alert_message} in channel ${channel.id}`)
                    if (err.code === 10008) {
                        this.client.container.pg.removeAlertMessage(alert.guild_id, alert.streamer_id);
                    }
                })
        }
    }

    async showStreamOfflineMessage(alert, channel, lang) {
        await this.client.container.pg.removeAlertMessage(alert.guild_id, alert.streamer_id);

        const videos = await this.client.container.twitch.videos.getVideosByUser(alert.streamer_id, {
            limit: 1,
            orderBy: "time",
            type: "archive"
        });
        const video = videos.data.length !== 0 ? videos.data[0] : null
        if (alert.alert_message)
            channel.messages.fetch(alert.alert_message)
                .then(message => {
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
                            }).catch(logger.error);
                        } else {
                            message.edit(alert.alert_end).catch(logger.error);
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
                            }).catch(logger.error);
                        } else {
                            message.edit(`${alert.alert_end} <${video.url}>`).catch(logger.error);
                        }
                    }
                }).catch(logger.error);
    }

    async updateAlert(alert, stream, user=null) {
        // Fetch server
        let guild;
        try {
            guild = await this.client.guilds.fetch(alert.guild_id);
        } catch (e) {
            if (this.client.container.debug) logger.debug(`Guild ${alert.guild_id} not found`);
            return;
        }
        if (!guild.available) return;

        // Fetch channel
        let channel;
        try {
            channel = await guild.channels.fetch(alert.alert_channel);
        } catch (e) {
            if (this.client.container.debug) logger.debug(`Channel ${alert.alert_channel} not found`);
            return;
        }
        if (!channel.permissionsFor(this.client.user).has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ViewChannel
        ])) {
            if (this.client.container.debug) logger.debug(`Channel ${alert.alert_channel} missing permissions`);
            return;
        }

        const lang = alert.guild_language !== "default" ? alert.guild_language : guild.preferredLocale;

        if (stream) {
            await this.showStreamOnlineMessage(alert, stream, channel, user, lang);
        } else {
            await this.showStreamOfflineMessage(alert, channel, lang);
        }
    }

    async fetchLive(oldAlerts) {
        let alerts = await this.client.container.pg.listAllAlerts();
        alerts = [...alerts.filter(alert => alert.streamer_live), ...oldAlerts];
        const nbAlerts = alerts.length;
        logger.debug(`Fetching live for ${nbAlerts} alerts ...`);
        const alertsBy100 = [];
        while (alerts.length) {
            alertsBy100.push(alerts.splice(0, 100));
        }

        for (const alertGroup of alertsBy100) {
            const ids = alertGroup.map(a => a.streamer_id);
            const streams = await this.client.container.twitch.streams.getStreamsByUserIds(ids);
            const users = await this.client.container.twitch.users.getUsersByIds(ids);

            for (const alert of alertGroup) {
                const stream = streams.filter(stream => stream.userId === alert.streamer_id)[0];
                const user = users.filter(user => user.id === alert.streamer_id)[0];

                await this.updateAlert(alert, stream, user);
            }
        }
        logger.debug(`Fetching live for ${nbAlerts} alerts ... done !`);
    }
}

module.exports = FetchLive;