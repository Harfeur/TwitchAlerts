const logger = require("../modules/logger.js");

module.exports = (client, guild) => {
    if (!guild.available) return; // If there is an outage, return.

    logger.log(`[GUILD LEAVE] ${guild.id} removed the bot.`);
    if (!client.container.debug) {
        client.container.pg.deleteGuild(guild.id);
    }
};
