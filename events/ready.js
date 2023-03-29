const logger = require("../modules/logger.js");
const FetchLive = require('../services/fetchLive');
const {EventSubMiddleware} = require("@twurple/eventsub-http");

module.exports = async client => {
    logger.log(`${client.user.tag}, ready to serve ${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)} users in ${client.guilds.cache.size} servers.`, "ready");

    const middleware = new EventSubMiddleware({
        apiClient: client.container.twitch,
        hostName: 'twitchbot.harfeur.fr',
        pathPrefix: '/twitch',
        secret: process.env.MY_SECRET
    });
    const fl = new FetchLive(client, middleware);

    await require('../web.js')(client.container.pg, client, client.container.twitch, fl);
};
