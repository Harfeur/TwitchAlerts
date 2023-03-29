const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const DiscordOauth2 = require("discord-oauth2");

// Connexion à Discord
const oauth = new DiscordOauth2({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: "https://" + process.env.DOMAIN + "/connect"
});

async function init(pgsql, discord, twitch, middleware, fetchlive){
    let cookies = new Map();

    const app = express();

// CONFIGURATION ==================================
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.use('/', express.static('public'));

    middleware.apply(app);

// ROUTES =========================================

    let functions = require('./app/functions')(oauth, cookies);

    require('./app/getAPI.js')(app, pgsql, oauth, discord, twitch, functions, __dirname, cookies);
    require('./app/postAPI.js')(app, pgsql, oauth, discord, twitch, functions, __dirname, cookies);

// LAUNCH ========================================
    app.listen(process.env.PORT, "twitchbot.harfeur.fr", async function () {
        await fetchlive.markAsReady();
        console.log("Serveur démarré sur le port " + process.env.PORT);
    });

}

module.exports = init;