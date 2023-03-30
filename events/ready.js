const logger = require("../modules/logger.js");
const FetchLive = require('../services/fetchLive');
const {EventSubMiddleware} = require("@twurple/eventsub-http");

module.exports = async client => {
    logger.log(`${client.user.tag}, ready to serve ${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)} users in ${client.guilds.cache.size} servers.`, "ready");

    const middleware = new EventSubMiddleware({
        apiClient: client.container.twitch,
        hostName: process.env.DOMAIN,
        pathPrefix: '/twitch',
        secret: process.env.MY_SECRET,
        legacySecrets: false
    });
    const fl = new FetchLive(client, middleware);
    client.container.pg.passFetchLive(fl);

    await require('../web.js')(client.container.pg, client, client.container.twitch, middleware, fl);
};
