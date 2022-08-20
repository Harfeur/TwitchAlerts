const logger = require("../modules/logger.js");

module.exports = (client, guild) => {
    logger.log(`[GUILD JOIN] ${guild.id} added the bot. Owner: ${guild.ownerId}`);
};
