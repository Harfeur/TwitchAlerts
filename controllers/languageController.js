const {getString} = require("../modules/language");
const logger = require("../modules/logger");
module.exports = class LanguageController {
    static async language(client, interaction) {
        if (!client.container.debug) await interaction.deferReply({ephemeral: true});

        const newLang = interaction.options.getString("value");
        if (!client.container.debug) {
            await client.container.pg.setGuildLanguage(interaction.guild.id, newLang);
            await interaction.editReply(interaction.getLocalizedString("LANGUAGE_UPDATE", {
                language: `**${newLang === "default" ? interaction.getLocalizedString("LANGUAGE_DEFAULT") : getString(newLang, "LANGUAGE")}**`
            }));
        }
        logger.debug(`Changed language to ${newLang} in guild ${interaction.guild.id}`);
    }

}