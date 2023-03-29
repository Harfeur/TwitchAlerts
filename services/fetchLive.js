const {EmbedBuilder, PermissionsBitField} = require("discord.js");
const {getString} = require("../modules/language");
const logger = require("../modules/logger");
const {ReverseProxyAdapter, EventSubMiddleware, EventSubStreamOnlineEvent, EventSubStreamOfflineEvent} = require("@twurple/eventsub-http");
const {generateLiveEmbed} = require("../models/embedService");

class FetchLive {

    /**
     *
     * @param client
     * @param middleware {EventSubMiddleware}
     */
    constructor(client, middleware) {
        this.client = client;
        const adapter = new ReverseProxyAdapter({
            hostName: "twitch-webhook.harfeur.fr",
            port: 8395
        });

        this.eventsub = middleware;
        this.ready = false;

        this.subscriptions = new Map();
    }

    async markAsReady() {
        if (this.ready) return;
        this.ready = true;

        await this.eventsub.markAsReady();

        const alerts = await this.client.container.pg.listAllAlerts();
        for (const alert of alerts) {
            if (!this.subscriptions.has(alert.alert_streamer)) {
                const ev1 = this.eventsub.onStreamOnline(alert.alert_streamer, this.streamOnline);
                const ev2 = this.eventsub.onStreamOffline(alert.alert_streamer, this.streamOffline);
                this.subscriptions.set(alert.alert_streamer, [ev1, ev2]);
            }
        }
    }

    async checkCurrentStreams() {
        const alerts = await this.client.container.pg.listAllAlerts();
        const alertsBy100 = [];
        while (alerts.length) {
            alertsBy100.push(alerts.splice(0, 100));
        }

        for (const alertGroup of alertsBy100) {
            const ids = alertGroup.map(a => a.alert_streamer);
            const streams = await this.client.container.twitch.streams.getStreamsByUserIds(ids);
            for (const alert of alertGroup) {
                let stream = streams.filter(stream => stream.userId === alert.alert_streamer)[0];
                if (stream && !alert.alert_live) {
                    await this.client.container.pg.streamOnline(alert.guild_id, alert.alert_streamer);
                } else if (!stream && alert.alert_live) {
                    await this.client.container.pg.streamOffline(alert.guild_id, alert.alert_streamer);
                }
            }
        }
    }

    /**
     *
     * @param event {EventSubStreamOnlineEvent}
     */
    async streamOnline(event) {
        await this.client.container.pg.streamOnline(event.broadcasterId);
        const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);
        const stream = await event.getStream();

        for (const alert of alerts) {
            await this.updateAlert(alert, stream);
        }
    }

    /**
     *
     * @param event {EventSubStreamOfflineEvent}
     */
    async streamOffline(event) {
        await this.client.container.pg.streamOffline(event.broadcasterId);
        const alerts = await this.client.container.pg.listAlertsByStreamer(event.broadcasterId);

        for (const alert of alerts) {
            await this.updateAlert(alert, null);
        }
    }

    async showStreamOnlineMessage(alert, stream, channel, lang) {
        const user = await stream.getUser();
        if (!user) return;

        const embed = generateLiveEmbed(user, stream, lang)

        if (alert.alert_message === "0") {
            channel.send({
                content: `${alert.alert_start}\n<https://www.twitch.tv/${user.name}>`,
                embeds: [embed]
            }).then(msg => {
                this.client.container.pg.setAlertMessage(alert.guild_id, alert.alert_streamer, msg.id);
            }).catch(logger.error);
        } else {
            channel.messages.fetch(alert.alert_message)
                .then(message => {
                    message.edit({
                        content: `${alert.alert_start}\n<https://www.twitch.tv/${user.name}>`,
                        embeds: [embed]
                    });
                })
                .catch(err => {
                    logger.error(`Can't find message ${alert.alert_message} in channel ${channel.id}`)
                    if (err.code === 10008) {
                        this.client.container.pg.removeAlertMessage(alert.guild_id, alert.alert_streamer);
                    } else {
                        logger.error(err);
                    }
                })
        }
        logger.debug(`Embed sent/updated for streamer ${user.id} in guild ${alert.guild_id}`);
    }

    async showStreamOfflineMessage(alert, channel, lang) {
        await this.client.container.pg.removeAlertMessage(alert.guild_id, alert.alert_streamer);

        const videos = await this.client.container.twitch.videos.getVideosByUser(alert.alert_streamer, {
            limit: 1,
            orderBy: "time",
            type: "archive"
        });
        const video = videos.data.length !== 0 ? videos.data[0] : null
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
        alerts = alerts.filter(alert => alert.alert_live)
        const alertsBy100 = [];
        while (alerts.length) {
            alertsBy100.push(alerts.splice(0, 100));
        }

        for (const alertGroup of alertsBy100) {
            const ids = alertGroup.map(a => a.alert_streamer);
            const streams = await this.client.container.twitch.streams.getStreamsByUserIds(ids);
            for (const alert of alertGroup) {
                let stream = streams.filter(stream => stream.userId === alert.alert_streamer)[0];

                await this.updateAlert(alert, stream)
            }
        }
    }
}

module.exports = FetchLive;