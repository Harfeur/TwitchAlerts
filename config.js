const {GatewayIntentBits, Partials} = require("discord.js");

const config = {
    // Bot Support, level 8 by default. Array of user ID strings
    "support": [],

    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel],
};

module.exports = config;
