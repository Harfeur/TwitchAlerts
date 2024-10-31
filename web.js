const express = require('express');
const cookieParser = require('cookie-parser');
const DiscordOauth2 = require("discord-oauth2");
const logger = require("./modules/logger");

// Connexion à Discord
const oauth = new DiscordOauth2({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: "https://" + process.env.DOMAIN + "/connect"
});

async function init(pgsql, discord, twitch, fetchLive){
    let cookies = new Map();

    const app = express();

// CONFIGURATION ==================================
    app.use(cookieParser());

    app.use('/', express.static('public'));

// ROUTES =========================================

    let functions = require('./app/functions')(oauth, cookies);

    require('./app/getAPI.js')(app, pgsql, oauth, discord, twitch, functions, __dirname, cookies);
    require('./app/postAPI.js')(app, pgsql, oauth, discord, twitch, functions, __dirname, cookies);

// LAUNCH ========================================
    app.listen(process.env.PORT, async function () {
        logger.log(`Server started on port ${process.env.PORT}`);
        fetchLive.markAsReady();
    });
}

module.exports = init;