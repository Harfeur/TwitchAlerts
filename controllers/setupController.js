const {TextInputBuilder, ActionRowBuilder, ModalBuilder, PermissionsBitField} = require("discord.js");
const logger = require("../modules/logger");

module.exports = class SetupController {
    static async setup(client, interaction) {
        if (!interaction.channel.permissionsFor(client.user).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.ViewChannel])) {
            logger.debug(`Missing bot permissions in channel ${interaction.channel.id} in guild ${interaction.guild.id}`);
            if (!client.container.debug) await interaction.reply({
                content: interaction.getLocalizedString("SETUP_NO_PERMISSIONS"),
                ephemeral: true
            });
            return;
        }

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

        if (!client.container.debug) await interaction.showModal(modal);
        logger.debug(`Setup modal sent to ${interaction.user.id} in ${interaction.guild.id}`);
    }

    static async modalSubmit(client, interaction) {
        if (!client.container.debug) await interaction.deferReply({ephemeral: true});

        const user = await client.container.twitch.users.getUserByName(interaction.fields.getTextInputValue("streamer"));
        if (!user) {
            logger.debug(`Failed to retrieve streamer ${interaction.fields.getTextInputValue("streamer")}`);
            if (!client.container.debug) await interaction.editReply(interaction.getLocalizedString("SETUP_NO_RESULT"));
            return;
        }

        const alert = await client.container.pg.getAlert(interaction.guild.id, user.id);
        if (alert.length !== 0) {
            logger.debug(`Streamer ${user.displayName} already existing in server ${interaction.guild.id}`);
            if (!client.container.debug) await interaction.editReply(interaction.getLocalizedString("SETUP_ALREADY"), {
                command: interaction.getLocalizedString("DELETE_CMD_NAME")
            });
            return;
        }

        const messageLIVE = interaction.fields.getTextInputValue("start").replaceAll("'", "''");
        const messageFIN = interaction.fields.getTextInputValue("end").replaceAll("'", "''");

        if (!client.container.debug) {
            await client.container.pg.addAlert(interaction.guild.id, user.id, interaction.channel.id, messageLIVE, messageFIN);
            await interaction.editReply(interaction.getLocalizedString("SETUP_SUCCESS"));
        }

        logger.debug(`New alert added for ${user.displayName} in guild ${interaction.guild.id}`);
    }
}