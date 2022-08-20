const {ActionRowBuilder} = require("discord.js");
const embedService = require("../models/embedService");
const buttonService = require("../models/buttonService");


module.exports = class GeneralController {
    static async stats(client, interaction) {
        const statsEmbed = embedService.generateStatEmbed(client, interaction);
        await interaction.reply({embeds: [statsEmbed]});
    }

    static async info(client, interaction) {
        const statsEmbed = embedService.generateInfoEmbed(client, interaction);
        const link = new ActionRowBuilder()
            .addComponents(
                buttonService.getLinkButton("GitHub", "https://github.com/Harfeur/TwitchAlerts"),
                buttonService.getLinkButton(interaction.getLocalizedString("INFO_INVITE"), "https://discord.com/oauth2/authorize?client_id=748846588163784794&scope=bot+applications.commands&permissions=216064"),
                buttonService.getLinkButton(interaction.getLocalizedString("INFO_SUPPORT"), "https://discord.gg/uY98wtmvXf")
            )
        await interaction.reply({embeds: [statsEmbed], components: [link]});
    }
}