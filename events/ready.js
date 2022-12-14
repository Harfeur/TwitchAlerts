const logger = require("../modules/logger.js");
const FetchLive = require('../services/fetchLive');

module.exports = async client => {
    logger.log(`${client.user.tag}, ready to serve ${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)} users in ${client.guilds.cache.size} servers.`, "ready");
    const fetchLive = new FetchLive(client);
    setInterval(fetchLive.fetchLive, 90000, client)
    await client.application.fetch();
};
