const logger = require("../modules/logger.js");
const {getLocalizedString} = require("../modules/language");
const {InteractionType} = require('discord.js');

module.exports = async (client, interaction) => {
    const language = interaction.language = interaction.locale ?? "en-US"
    interaction.getLocalizedString = getLocalizedString(language);

    const cmd = client.container.slashcmds.get(interaction.commandName ?? interaction.customId.split("_")[0]);

    if (!cmd) return;

    try {
        if (interaction.type === InteractionType.ApplicationCommand) {
            logger.log(`${interaction.user.id} on server ${interaction.guild.id} ran slash command ${interaction.commandName}`, "cmd");
            await cmd.run(client, interaction);
        } else if (interaction.isStringSelectMenu()) {
            logger.log(`${interaction.user.id} on server ${interaction.guild.id} ran string menu ${interaction.customId}`, "cmd");
            await cmd.selectMenu(client, interaction);
        } else if (interaction.isModalSubmit()) {
            logger.log(`${interaction.user.id} on server ${interaction.guild.id} ran modal submit ${interaction.customId}`, "cmd");
            await cmd.modalSubmit(client, interaction);
        }
    } catch (e) {
        logger.error(e.message);
        console.error(e);
        if (client.container.debug) return;
        if (interaction.replied)
            interaction.followUp({
                content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``,
                ephemeral: true
            })
                .catch(e => console.error("An error occurred following up on an error", e));
        else if (interaction.deferred)
            interaction.editReply({
                content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``,
                ephemeral: true
            })
                .catch(e => console.error("An error occurred following up on an error", e));
        else
            interaction.reply({
                content: `There was a problem with your request.\n\`\`\`${e.message}\`\`\``,
                ephemeral: true
            })
                .catch(e => console.error("An error occurred replying on an error", e));
    }
};
