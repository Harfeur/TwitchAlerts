const {EmbedBuilder, PermissionsBitField} = require("discord.js");
const {getString} = require("../modules/language");
const logger = require("../modules/logger");
const {EventSubMiddleware} = require("@twurple/eventsub-http");
const {generateLiveEmbed} = require("../models/embedService");

class FetchLive {

    /**
     *
     * @param client
     * @param middleware {EventSubMiddleware}
     */
    constructor(client, middleware) {
        this.client = client;

        this.eventsub = middleware;
        this.ready = false;

        this.subscriptions = new Map();

        this.eventsub.onSubscriptionCreateFailure((sub, err) => {
            logger.error(err);
        });
        this.eventsub.onRevoke(sub => {
            logger.error("Revocation");
        });
    }

    async markAsReady() {
        if (this.ready) return;
        this.ready = true;

        await this.eventsub.markAsReady();

        const alerts = await this.client.container.pg.listAllAlerts();
        for (const alert of alerts) {
            if (!this.subscriptions.has(alert.streamer_id)) {
                const ev1 = this.eventsub.onStreamOnline(alert.streamer_id, async event => {
                    await this.client.container.pg.streamOnline(event.broadcasterId);
                    const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);
                    const stream = await event.getStream();

                    for (const alert of alerts) {
                        await this.updateAlert(alert, stream);
                    }
                });
                const ev2 = this.eventsub.onStreamOffline(alert.streamer_id, async event => {
                    await this.client.container.pg.streamOffline(event.broadcasterId);
                    const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);

                    for (const alert of alerts) {
                        await this.updateAlert(alert, null);
                    }
                });
                this.subscriptions.set(alert.streamer_id, [ev1, ev2]);
            }
        }
        logger.log("Subscriptions are ready", "ready");
        await this.checkCurrentStreams();
        logger.log("Streams status checked", "ready");

        setInterval((function (self) {
            return function () {
                self.fetchLive();
            }
        })(this), 120000, this);
        await this.fetchLive();
    }

    async checkCurrentStreams() {
        const alerts = await this.client.container.pg.listAllAlerts();
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
                }
            }
        }
    }

    streamerAdded(streamer) {
        if (!this.subscriptions.has(streamer)) {
            logger.debug(`Subscriptions on for ${streamer}`)
            const ev1 = this.eventsub.onStreamOnline(streamer, async event => {
                await this.client.container.pg.streamOnline(event.broadcasterId);
                const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);
                const stream = await event.getStream();

                for (const alert of alerts) {
                    await this.updateAlert(alert, stream);
                }
            });
            const ev2 = this.eventsub.onStreamOffline(streamer, async event => {
                await this.client.container.pg.streamOffline(event.broadcasterId);
                const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);

                for (const alert of alerts) {
                    await this.updateAlert(alert, null);
                }
            });
            this.subscriptions.set(streamer, [ev1, ev2]);
        }
    }

    async streamerRemoved(streamer) {
        if (this.subscriptions.has(streamer)) {
            const alerts = await this.client.container.pg.listAlertsByStreamer(streamer);
            if (alerts.length === 0) {
                logger.debug(`Subscriptions off for ${streamer}`)
                const sub = this.subscriptions.get(streamer);
                sub[0].stop();
                sub[1].stop();
                this.subscriptions.delete(streamer);
            }
        }
    }

    async showStreamOnlineMessage(alert, stream, channel, lang) {
        const user = await stream.getUser();
        const game = await stream.getGame();

        const embed = await generateLiveEmbed(user, stream, game, alert, lang)

        if (!alert.alert_message) {
            channel.send({
                content: `${alert.alert_start}\n<https://www.twitch.tv/${user.name}>`,
                embeds: [embed]
            }).then(msg => {
                this.client.container.pg.setAlertMessage(alert.guild_id, alert.streamer_id, msg.id);
            }).catch(logger.error);
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

    async updateAlert(alert, stream) {
        // Fetch server
        let guild;
        try {
            guild = await this.client.guilds.fetch(alert.guild_id);
        } catch (e) {
            logger.debug(`Guild ${alert.guild_id} not found`);
            return;
        }
        if (!guild.available) return;

        // Fetch channel
        let channel;
        try {
            channel = await guild.channels.fetch(alert.alert_channel);
        } catch (e) {
            logger.debug(`Channel ${alert.alert_channel} not found`);
            return;
        }
        if (!channel.permissionsFor(this.client.user).has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ViewChannel
        ])) {
            logger.debug(`Channel ${alert.alert_channel} missing permissions`);
            return;
        }

        const lang = alert.guild_language !== "default" ? alert.guild_language : guild.preferredLocale;

        if (stream) {
            await this.showStreamOnlineMessage(alert, stream, channel, lang);
        } else {
            await this.showStreamOfflineMessage(alert, channel, lang);
        }
    }

    async fetchLive() {
        let alerts = await this.client.container.pg.listAllAlerts();
        alerts = alerts.filter(alert => alert.streamer_live);
        logger.debug(`Fetching live for ${alerts.length} alerts ...`);
        const alertsBy100 = [];
        while (alerts.length) {
            alertsBy100.push(alerts.splice(0, 100));
        }

        for (const alertGroup of alertsBy100) {
            const ids = alertGroup.map(a => a.streamer_id);
            const streams = await this.client.container.twitch.streams.getStreamsByUserIds(ids);
            for (const alert of alertGroup) {
                let stream = streams.filter(stream => stream.userId === alert.streamer_id)[0];

                await this.updateAlert(alert, stream)
            }
        }
        logger.debug(`Fetching live for ${alerts.length} alerts ... done !`);
    }
}

module.exports = FetchLive;