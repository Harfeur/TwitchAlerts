const {ActionRowBuilder, SelectMenuBuilder, PermissionsBitField} = require("discord.js");

module.exports = class DeleteController {
    static async delete(client, interaction) {
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator))
            return await interaction.reply(interaction.getLocalizedString("NO_RIGHTS"));

        await interaction.deferReply();

        const guild = interaction.guild;
        const query = await client.container.pg.query(`SELECT * FROM twitch WHERE serverid='${interaction.guild.id}';`)

        if (query.rowCount === 0) return await interaction.editReply(interaction.getLocalizedString("DELETE_EMPTY", {
            command: interaction.getLocalizedString("SETUP_CMD_NAME")
        }));

        const menu = new SelectMenuBuilder()
            .setCustomId("delete_select")
            .setPlaceholder(interaction.getLocalizedString("DELETE_CHOOSE_PLACEHOLDER"));

        for (let i = 0; i < query.rowCount && i < 25; i++) {
            let q = query.rows[i];
            let user = await client.container.twitch.getUsers(q.channelid);
            menu.addOptions([{
                label: user.data[0].display_name,
                value: q.channelid,
                description: guild.channels.resolve(q.canalid)?.name ?? interaction.getLocalizedString("DELETE_CHANNEL_NOT_FOUND", {canalid: q.canalid})
            }])
        }

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.editReply({components: [row]});
    }

    static async menuSelect(client, interaction) {
        await client.container.pg.query(`DELETE FROM twitch WHERE channelid=${interaction.values[0]} AND serverid='${interaction.guild.id}';`);
        await interaction.update({
            content: interaction.getLocalizedString("DELETE_SUCCESS"),
            components: []
        })
    }
}