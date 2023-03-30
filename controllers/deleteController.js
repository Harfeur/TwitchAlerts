const {ActionRowBuilder, StringSelectMenuBuilder} = require("discord.js");
const logger = require("../modules/logger");

module.exports = class DeleteController {
    static async delete(client, interaction) {
        if (!client.container.debug) await interaction.deferReply({ephemeral: true});

        const guild = interaction.guild;
        const alerts = await client.container.pg.listAlertsByGuild(guild.id);

        if (alerts.length === 0) {
            logger.debug(`No alerts for guild ${interaction.guild.id}`);
            if (!client.container.debug) await interaction.editReply(interaction.getLocalizedString("DELETE_EMPTY", {
                command: interaction.getLocalizedString("SETUP_CMD_NAME")
            }));
            return;
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId("delete_select")
            .setPlaceholder(interaction.getLocalizedString("DELETE_CHOOSE_PLACEHOLDER"));

        for (let i = 0; i < alerts.rowCount && i < 25; i++) {
            let q = alerts.rows[i];
            let user = await client.container.twitch.users.getUserById(q.streamer_id);
            menu.addOptions([{
                label: user.displayName,
                value: user.id,
                description: guild.channels.resolve(q.canalid)?.name ?? interaction.getLocalizedString("DELETE_CHANNEL_NOT_FOUND", {canalid: q.canalid})
            }]);
        }

        const row = new ActionRowBuilder().addComponents(menu);

        if (!client.container.debug) await interaction.editReply({components: [row]});
        logger.debug(`Sent alerts list on guild ${interaction.guild.id}`);
    }

    static async menuSelect(client, interaction) {
        if (!client.container.debug) {
            await client.container.pg.deleteAlert(interaction.guild.id, interaction.values[0]);
            await interaction.update({
                content: interaction.getLocalizedString("DELETE_SUCCESS"),
                components: []
            });
        }
        logger.debug(`Deleted alert for streamer ${interaction.values[0]} in guild ${interaction.guild.id}`);
    }
}