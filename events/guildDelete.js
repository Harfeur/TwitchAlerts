const logger = require("../modules/logger.js");

module.exports = (client, guild) => {
    if (!guild.available) return; // If there is an outage, return.

    logger.log(`[GUILD LEAVE] ${guild.id} removed the bot.`);
    client.container.pg.query(`DELETE FROM twitch WHERE serverid='${guild.id}';`)
    client.container.pg.query(`DELETE FROM guilds WHERE guild_id='${guild.id}';`)
};
