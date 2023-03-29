const logger = require("../modules/logger.js");

module.exports = async (client, guild) => {
    logger.log(`[GUILD JOIN] ${guild.id} added the bot. Owner: ${guild.ownerId}`);
    await client.container.pg.addNewGuild(guild.id);
};
