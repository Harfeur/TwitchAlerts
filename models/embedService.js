const {version, EmbedBuilder} = require("discord.js");
const {DurationFormatter} = require("@sapphire/time-utilities");
const {getString} = require("../modules/language");
const durationFormatter = new DurationFormatter();

module.exports = {
    generateStatEmbed: (client, interaction) => {
        const duration = durationFormatter.format(client.uptime);
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: interaction.getLocalizedString("STATS_TITLE"),
                iconURL: client.user.avatarURL(),
                url: 'https://truckyapp.com'
            })
            .setThumbnail(client.user.avatarURL())
            .addFields([
                {
                    name: interaction.getLocalizedString("STATS_MEMORY"),
                    value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB",
                    inline: true
                },
                {name: interaction.getLocalizedString("STATS_UPTIME"), value: duration, inline: true},
                {
                    name: interaction.getLocalizedString("STATS_USERS"),
                    value: client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b).toLocaleString(),
                    inline: true
                },
                {
                    name: interaction.getLocalizedString("STATS_SERVERS"),
                    value: client.guilds.cache.size.toLocaleString(),
                    inline: true
                },
                {
                    name: interaction.getLocalizedString("STATS_CHANNELS"),
                    value: client.channels.cache.size.toLocaleString(),
                    inline: true
                },
                {name: 'Discord.js', value: "v" + version, inline: true},
                {name: 'NodeJS', value: process.version, inline: true},
            ])
            .setTimestamp();
    },

    generateInfoEmbed: (client, interaction) => {
        return new EmbedBuilder()
            .setTitle(interaction.getLocalizedString("INFO_TITLE"))
            .setURL("https://twitchbot.harfeur.fr")
            .setDescription(interaction.getLocalizedString("INFO_DESCRIPTION", {setup: interaction.getLocalizedString("SETUP_CMD_NAME")}))
            .setColor('#e603f8')
            .setThumbnail(client.user.avatarURL())
            .addFields([
                {
                    name: interaction.getLocalizedString("INFO_PERMISSIONS"),
                    value: interaction.getLocalizedString("INFO_PERMISSIONS_DESC")
                },
                {
                    name: interaction.getLocalizedString("INFO_ERROR"),
                    value: interaction.getLocalizedString("INFO_ERROR_DESC")
                },
                {
                    name: interaction.getLocalizedString("INFO_LANGUAGE"),
                    value: interaction.getLocalizedString("INFO_LANGUAGE_DESC", {language: interaction.getLocalizedString("LANGUAGE_CMD_NAME")})
                },
                {
                    name: interaction.getLocalizedString("INFO_TRANSLATE"),
                    value: interaction.getLocalizedString("INFO_TRANSLATE_DESC")
                },
            ])
            .setTimestamp();
    },

    generateLiveEmbed: (user, stream, lang) => {
        const now = Date.now();
        const debut = new Date(stream.started_at);

        const heures = Math.trunc(((now - debut) / 60000) / 60);
        const minutes = Math.trunc((now - debut) / 60000 - heures * 60);

        return new EmbedBuilder()
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
    }

}