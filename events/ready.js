const logger = require("../modules/logger.js");
const FetchLive = require('../services/fetchLive');
const {ReverseProxyAdapter, EventSubHttpListener} = require("@twurple/eventsub-http");
const {AppTokenAuthProvider} = require("@twurple/auth");
const {ApiClient} = require("@twurple/api");

module.exports = async client => {
    logger.log(`${client.user.tag}, ready to serve ${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b)} users in ${client.guilds.cache.size} servers.`, "ready");
    await client.application.fetch();
    await client.application.commands.fetch();

    let webhooks = [];
    for (let i = 0; i < parseInt(process.env.WEBHOOK_CLIENTS); i++) {
        const authProvider = new AppTokenAuthProvider(process.env[`WEBHOOK_CLIENT_${i}`], process.env[`WEBHOOK_SECRET_${i}`])
        const apiClient = new ApiClient({authProvider});
        const webhookMiddleware = new EventSubHttpListener({
            apiClient: apiClient,
            adapter: new ReverseProxyAdapter({
                hostName: `webhook${i}.${process.env.DOMAIN}`,
                port: process.env.PORT + i + 1,
            }),
            secret: process.env[`WEBHOOK_SECRET_${i}`],
            legacySecrets: false
        });
        webhooks.push(webhookMiddleware);
        webhookMiddleware.onSubscriptionCreateFailure((sub, err) => {
            logger.error(err);
        });
        webhookMiddleware.onRevoke(sub => {
            logger.error("Revocation");
        });
    }
    const fl = new FetchLive(client, webhooks);
    client.container.pg.passFetchLive(fl);

    await require('../web.js')(client.container.pg, client, client.container.twitch, fl);
};
