const {TextInputBuilder, ActionRowBuilder, ModalBuilder, PermissionsBitField} = require("discord.js");
const logger = require("../modules/logger");

module.exports = class SetupController {
    static async setup(client, interaction) {
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator))
            return await interaction.reply(interaction.getLocalizedString("NO_RIGHTS"));

        const inputStreamer = new TextInputBuilder()
            .setCustomId("streamer")
            .setLabel(interaction.getLocalizedString("SETUP_STREAMER"))
            .setStyle(1)
            .setPlaceholder("harfeur")
            .setRequired(true);
        const inputStart = new TextInputBuilder()
            .setCustomId("start")
            .setLabel(interaction.getLocalizedString("SETUP_START"))
            .setStyle(2)
            .setPlaceholder(interaction.getLocalizedString("SETUP_START_PLACEHOLDER"))
            .setRequired(true);
        const inputEnd = new TextInputBuilder()
            .setCustomId("end")
            .setLabel(interaction.getLocalizedString("SETUP_END"))
            .setStyle(2)
            .setPlaceholder(interaction.getLocalizedString("SETUP_END_PLACEHOLDER"))
            .setRequired(true);

        const row1 = new ActionRowBuilder()
            .addComponents(inputStreamer);
        const row2 = new ActionRowBuilder()
            .addComponents(inputStart);
        const row3 = new ActionRowBuilder()
            .addComponents(inputEnd);

        const modal = new ModalBuilder()
            .setTitle(interaction.getLocalizedString("SETUP_TITLE"))
            .setCustomId("setup_modal")
            .addComponents(row1, row2, row3);

        await interaction.showModal(modal);
    }

    static async modalSubmit(client, interaction) {
        const twitchRes = await client.container.twitch.getUsers(interaction.fields.getTextInputValue("streamer"));
        if (!twitchRes.data || twitchRes.data.length === 0) return await interaction.reply(interaction.getLocalizedString("SETUP_NO_RESULT"))

        let userId = twitchRes.data[0].id;

        const query = await client.container.pg.query(`SELECT * FROM twitch WHERE channelid=${userId} AND serverid='${interaction.guild.id}';`);
        if (query.rowCount !== 0) return await interaction.reply(interaction.getLocalizedString("SETUP_ALREADY"), {
            command: interaction.getLocalizedString("DELETE_CMD_NAME")
        });

        if (!interaction.channel.permissionsFor(client.user).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.ViewChannel]))
            return await interaction.reply(interaction.getLocalizedString("SETUP_NO_PERMISSIONS"));

        const channelID = interaction.channel.id;
        const messageLIVE = interaction.fields.getTextInputValue("start").replaceAll("'", "''");
        const messageFIN = interaction.fields.getTextInputValue("end").replaceAll("'", "''");

        await client.container.pg.query(`INSERT INTO twitch(channelid, serverid, canalid, messagelive, messagefin) VALUES (${userId}, '${interaction.guild.id}', '${channelID}', '${messageLIVE}', '${messageFIN}');`);
        await interaction.reply(interaction.getLocalizedString("SETUP_SUCCESS"));

        logger.log("New alert added");
    }
}