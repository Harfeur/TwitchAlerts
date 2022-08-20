const {getString} = require("../modules/language");
const {PermissionsBitField} = require("discord.js");
module.exports = class LanguageController {
    static async language(client, interaction) {
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator))
            return await interaction.reply(interaction.getLocalizedString("NO_RIGHTS"));

        const newLang = interaction.options.getString("value");
        if (newLang === "default") {
            await client.container.pg.query(`DELETE FROM guilds WHERE guild_id='${interaction.guild.id}'`)
            await interaction.reply(interaction.getLocalizedString("LANGUAGE_UPDATE", {
                language: `**${interaction.getLocalizedString("LANGUAGE_DEFAULT")}**`
            }));
        } else {
            await client.container.pg.query(`INSERT INTO guilds(guild_id, language) VALUES (${interaction.guild.id},'${newLang}')
                            ON CONFLICT (guild_id) DO UPDATE SET language = '${newLang}';`);
            await interaction.reply(interaction.getLocalizedString("LANGUAGE_UPDATE", {
                language: `**${getString(newLang, "LANGUAGE")}**`
            }));
        }
    }

}