const {ActionRowBuilder, PermissionsBitField} = require("discord.js");
const embedService = require("../models/embedService");
const buttonService = require("../models/buttonService");


module.exports = class GeneralController {
    static async stats(client, interaction) {
        const statsEmbed = embedService.generateStatEmbed(client, interaction);
        if (!client.container.debug) await interaction.reply({embeds: [statsEmbed]});
    }

    static async info(client, interaction) {
        const statsEmbed = embedService.generateInfoEmbed(client, interaction);
        const link = new ActionRowBuilder()
            .addComponents(
                buttonService.getLinkButton("GitHub", "https://github.com/Harfeur/TwitchAlerts"),
                buttonService.getLinkButton(interaction.getLocalizedString("INFO_INVITE"), "https://discord.com/oauth2/authorize?client_id=748846588163784794&scope=bot+applications.commands&permissions=216064"),
                buttonService.getLinkButton(interaction.getLocalizedString("INFO_SUPPORT"), "https://discord.gg/uY98wtmvXf")
            )
        if (!client.container.debug) await interaction.reply({embeds: [statsEmbed], components: [link]});
    }

    static async checkperm(client, interaction) {
        await interaction.deferReply({ephemeral: true});

        const channel = interaction.channel;

        let message = `Permissions in <#${channel.id}>:\n`;

        const sendMsg = channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages);
        const embedLinks = channel.permissionsFor(client.user).has(PermissionsBitField.Flags.EmbedLinks);
        const viewChan = channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ViewChannel);
        const everyone = channel.permissionsFor(client.user).has(PermissionsBitField.Flags.MentionEveryone);
        const readMsg = channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ReadMessageHistory);

        message += `- Send Message: ${sendMsg ? "✅" : "❌"}\n`;
        message += `- Embed Links: ${embedLinks ? "✅" : "❌"}\n`;
        message += `- View Channel: ${viewChan ? "✅" : "❌"}\n`;
        message += `- Mention everyone: ${everyone ? "✅" : "❌"}\n`;
        message += `- Read Message History: ${readMsg ? "✅" : "❌"}`;

        await interaction.editReply({content: message});
    }
}