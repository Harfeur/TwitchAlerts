const {ButtonBuilder, ButtonStyle} = require("discord.js");
const {DurationFormatter} = require("@sapphire/time-utilities");
new DurationFormatter();
module.exports = {
    getLinkButton: (name, link, emoji = "") => {
        const button = new ButtonBuilder()
            .setLabel(name)
            .setURL(link)
            .setStyle(ButtonStyle.Link);
        if (emoji !== "") button.setEmoji(emoji);
        return button;
    },

    getButton: (name, style, id, emoji = "", disabled = false) => {
        const button = new ButtonBuilder()
            .setLabel(name)
            .setStyle(style)
            .setCustomId(id)
            .setDisabled(disabled);
        if (emoji !== "") button.setEmoji(emoji);
        return button;
    }
}