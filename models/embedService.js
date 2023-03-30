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

    generateLiveEmbed: (user, stream, game, alert, lang) => {
        const now = Date.now();
        const debut = stream.startDate;

        const heures = Math.trunc(((now - debut) / 60000) / 60);
        const minutes = Math.trunc((now - debut) / 60000 - heures * 60);

        const embed = new EmbedBuilder()
            .setColor(9442302)
            .setTimestamp(debut)
            .setTitle("🔴 " + getString(lang, "TITLE", {name: user.displayName}))
            .setURL(`https://www.twitch.tv/${user.name}`)
            .setThumbnail(user.profilePictureUrl)
            .setFooter({
                text: getString(lang, "START")
            })
            .setAuthor({
                name: "Twitch",
                url: `https://www.twitch.tv/${user.name}`,
                icon_url: "https://cdn3.iconfinder.com/data/icons/social-messaging-ui-color-shapes-2-free/128/social-twitch-circle-512.png"
            })
            .addFields({
                name: getString(lang, "STATUS"),
                value: `❯ ${stream.title}`
            });
        if (game && alert.alert_pref_display_game)
            embed.setImage(game.getBoxArtUrl(272, 380))
                .addFields({
                    name: getString(lang, "GAME"),
                    value: `❯ ${game.name}`,
                    inline: true
                });
        embed.addFields({
            name: getString(lang, "LENGTH"),
            value: "❯ " + getString(lang, "LENGTH_TIME", {hours: heures, minutes: minutes}),
            inline: true
        });
        if (alert.alert_pref_display_viewers)
            embed.addFields({
                name: getString(lang, "VIEWERS"),
                value: `❯ ${stream.viewers}`,
                inline: true
            });

        return embed;
    }

}