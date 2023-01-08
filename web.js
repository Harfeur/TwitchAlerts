const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const pgModule = require('pg');
const DiscordOauth2 = require("discord-oauth2");
const Discord = require("discord.js");
const {intents, partials} = require("./config");
const {default: TwitchApi} = require("node-twitch");

// Connexion à la base
const pgsql = new pgModule.Client({
    connectionString: process.env.DATABASE_URL, ssl: {
        rejectUnauthorized: false
    }
});

pgsql.connect();

// Connexion à Discord
const oauth = new DiscordOauth2({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: process.env.DISCORD_REDIRECT_URI
});

const discord = new Discord.Client({intents, partials});
discord.login(process.env.TWITCHBOT);

// Connexion à Twitch
const twitch = new TwitchApi({
    client_id: process.env.TWITCH_BOT_CLIENT_ID, client_secret: process.env.TWITCH_BOT_CLIENT_SECRET
});

let cookies = new Map();

const app = express();

// CONFIGURATION ==================================
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', express.static('public'));

// ROUTES =========================================

let functions = require('./app/functions')(oauth, cookies);

require('./app/getAPI.js')(app, pgsql, oauth, discord, twitch, functions, __dirname, cookies);
require('./app/postAPI.js')(app, pgsql, oauth, discord, twitch, functions, __dirname, cookies);

// LAUNCH ========================================
app.listen(process.env.PORT, function () {
    console.log("Serveur démarré sur le port " + process.env.PORT);
});