const {EmbedBuilder, PermissionsBitField} = require("discord.js");
const {getString} = require("../modules/language");

class FetchLive {
    constructor(client) {
        this.client = client;
    }

    async fetchLive(client) {
        const query = await client.container.pg.query('SELECT * FROM twitch LEFT JOIN guilds ON twitch.serverid = guilds.guild_id');
        const querySplice = [];
        while (query.rows.length) {
            querySplice.push(query.rows.splice(0, 100));
        }
        for (const index in querySplice) {
            const queries = querySplice[index];
            const ids = queries.map(q => q.channelid);
            const resAll = await client.container.twitch.getStreams({
                channels: ids,
                first: 100
            })
            for (const rowIndex in queries) {
                const row = queries[rowIndex];
                if (row.canalid === "0") continue;

                const messageID = row.messageid;
                const messageLive = row.messagelive;
                const messageFin = row.messagefin;
                const channelid = row.channelid;
                const canalid = row.canalid;
                const serverid = row.serverid;

                let stream = resAll.data.filter(stream => stream.user_id === channelid);
                stream = stream.length !== 0 ? stream[0] : null

                const serveur = client.guilds.resolve(serverid);
                if (serveur == null || !serveur.available) continue;
                const canal = serveur.channels.resolve(canalid);
                if (canal == null || !canal.permissionsFor(client.user).has([
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.EmbedLinks,
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.ReadMessageHistory
                ])) continue;

                const lang = row.language ?? serveur.preferredLocale;

                if (stream) {
                    const twitchUser = await client.container.twitch.getUsers(channelid);

                    if (twitchUser.data.length === 0) continue;

                    const user = twitchUser.data[0];

                    const now = Date.now();
                    const debut = new Date(stream.started_at);

                    const heures = Math.trunc(((now - debut) / 60000) / 60);
                    const minutes = Math.trunc((now - debut) / 60000 - heures * 60);

                    const embed = new EmbedBuilder()
                        .setColor(9442302)
                        .setTimestamp(new Date(stream.started_at))
                        .setTitle("🔴 " + getString(lang, "TITLE", {name: user.display_name}))
                        .setURL(`https://www.twitch.tv/${user.login}`)
                        .setThumbnail(user.profile_image_url)
                        .setImage(`https://static-cdn.jtvnw.net/ttv-boxart/${stream.game_name.split(" ").join("%20")}-272x380.jpg`)
                        .setFooter({
                            text: getString(lang, "START")
                        })
                        .setAuthor({
                            name: "Twitch",
                            url: `https://www.twitch.tv/${user.login}`,
                            icon_url: "https://cdn3.iconfinder.com/data/icons/social-messaging-ui-color-shapes-2-free/128/social-twitch-circle-512.png"
                        })
                        .setFields(
                            {
                                name: getString(lang, "STATUS"),
                                value: `❯ ${stream.title}`
                            },
                            {
                                name: getString(lang, "GAME"),
                                value: `❯ ${stream.game_name}`,
                                inline: true
                            },
                            {
                                name: getString(lang, "LENGTH"),
                                value: "❯ " + getString(lang, "LENGTH_TIME", {hours: heures, minutes: minutes}),
                                inline: true
                            },
                            {
                                name: getString(lang, "VIEWERS"),
                                value: `❯ ${stream.viewer_count}`,
                                inline: true
                            });

                    if (messageID === "0") {
                        canal.send({
                            content: `${messageLive}\n<https://www.twitch.tv/${user.login}>`,
                            embeds: [embed]
                        }).then(msg => {
                            client.container.pg.query(`UPDATE twitch SET messageID = '${msg.id}' WHERE channelID=${channelid} AND serverid='${serverid}';`)
                        }).catch(console.error);
                    } else {
                        canal.messages.fetch(messageID)
                            .then(message => {
                                message.edit({
                                    content: `${messageLive}\n<https://www.twitch.tv/${user.login}>`,
                                    embeds: [embed]
                                });
                            })
                            .catch(err => {
                                if (err.code === 10008) {
                                    client.container.pg.query(`UPDATE twitch SET messageID = '0' WHERE channelID=${channelid} AND serverid='${serverid}';`)
                                } else {
                                    console.error(err);
                                }
                            })
                    }
                } else if (messageID !== "0") {
                    await client.container.pg.query(`UPDATE twitch SET messageID = '0' WHERE channelid=${channelid} AND serverid='${serverid}';`);

                    let video = await client.container.twitch.getVideos({
                        user_id: channelid,
                        type: "archive"
                    });
                    video = video.data.length !== 0 ? video.data[0] : null
                    canal.messages.fetch(messageID)
                        .then(message => {
                            let embed;
                            if (!video) {
                                // Pas de redif
                                if (message.embeds.length > 0) {
                                    embed = new EmbedBuilder(message.embeds[0].data);
                                    embed.setTitle(getString(lang, "LIVE_END"));
                                    embed.setFields(embed.data.fields.filter(field => field.name !== "Viewers"));
                                    message.edit({
                                        content: messageFin,
                                        embeds: [embed]
                                    }).catch(console.error);
                                } else {
                                    message.edit(messageFin).catch(console.error);
                                }
                            } else {
                                if (message.embeds.length > 0) {
                                    embed = new EmbedBuilder(message.embeds[0].data);
                                    embed.setTitle(getString(lang, "LIVE_END"));
                                    embed.setFields(embed.data.fields.filter(field => field.name !== "Viewers"));
                                    embed.setURL(video.url);
                                    message.edit({
                                        content: `${messageFin} <${video.url}>`,
                                        embeds: [embed]
                                    }).catch(console.error);
                                } else {
                                    message.edit(`${messageFin} <${video.url}>`).catch(console.error);
                                }
                            }
                        }).catch(console.error)
                }
            }
        }
    }
}

module.exports = FetchLive;