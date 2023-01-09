const express = require('express');
const {Client} = require('pg');
const DiscordOauth2 = require("discord-oauth2");
const Discord = require('discord.js');
const {PermissionsBitField} = require("discord.js");
const {default: TwitchApi} = require("node-twitch");
const f = require("./functions");

const SCOPE = "guilds identify guilds.members.read";

/**
 * @param {express.Application} app Application express
 * @param {Client} pgsql Base de données
 * @param {DiscordOauth2} oauth Discord Bot
 * @param {Discord.Client} discord
 * @param {TwitchApi} twitch
 * @param {f} functions
 * @param {String} dirname Nom du répertoire du serveur
 * @param {Map} cookies Liste des utilisateurs connectés et leurs cookies
 */
module.exports = function (app, pgsql, oauth, discord, twitch, functions, dirname, cookies) {

    const DISCORD_URL = oauth.generateAuthUrl({
        scope: SCOPE,
        redirectUri: process.env.URL + "/connect",
        clientId: process.env.DISCORD_CLIENT_ID,
        prompt: "none",
        responseType: "code"
    })

    app.get('/dashboard', async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            res.sendFile('/public/dashboard.html', {
                root: dirname
            });
        } else {
            res.redirect(DISCORD_URL);
        }
    });

    app.get('/dashboard/:guild_id', async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            try {
                let guild = await discord.guilds.fetch(req.params.guild_id);
                let member = await guild.members.fetch(cookies.get(req.cookies.user).id);
                if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Exception("Permissions insuffisantes pour l'utilisateur");
            } catch (err) {
                console.error(err);
                res.redirect("/dashboard");
                return;
            }
            res.sendFile('/public/server.html', {
                root: dirname
            });
        } else {
            res.redirect(DISCORD_URL);
        }
    });

    app.get('/connect', async (req, res) => {
        if (req.query.guild_id) {
            res.redirect("/dashboard/" + req.query.guild_id);
        } else if (req.query.code) {
            try {
                let data = await oauth.tokenRequest({
                    code: req.query.code, scope: SCOPE, grantType: "authorization_code"
                });

                // Create a cookie
                let cookie;
                do {
                    cookie = functions.makeid(32);
                } while (cookies.has(cookie));

                // Cache user values
                let user = await oauth.getUser(data.access_token);
                let guilds = await oauth.getUserGuilds(data.access_token);

                cookies.set(cookie, {
                    time: Date.now(), timeGuilds: Date.now(), id: user.id, guilds: guilds, ...data
                });

                res.cookie("user", cookie, {
                    maxAge: 3600000 * 24 * 30,
                    secure: true,
                    httpOnly: true
                });
                res.redirect("/dashboard");
            } catch (err) {
                res.sendStatus(500);
                console.error(err);
            }
        } else {
            res.redirect(DISCORD_URL);
        }
    });

    app.get('/servers', async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            let guilds = cookies.get(req.cookies.user).guilds;

            let data = {
                active: [], inactive: []
            }

            try {
                for (const i in guilds) {
                    const guild_partial = guilds[i];
                    let permissions = new PermissionsBitField(guild_partial.permissions);
                    if (permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) {
                        try {
                            let guild = await discord.guilds.fetch(guild_partial.id);
                            let query = await pgsql.query(`SELECT count(channelid) FROM twitch WHERE serverid='${guild.id}';`);
                            data.active.push({
                                name: guild.name,
                                id: guild.id,
                                alerts: query.rows[0].count,
                                icon: guild.icon ? "https://cdn.discordapp.com/icons/" + guild.id + "/" + guild.icon + ".png" : "/assets/img/icons/discord.png"
                            });
                        } catch (err) {
                            data.inactive.push({
                                name: guild_partial.name,
                                id: guild_partial.id,
                                icon: guild_partial.icon ? "https://cdn.discordapp.com/icons/" + guild_partial.id + "/" + guild_partial.icon + ".png" : "/assets/img/icons/discord.png",
                                invite: oauth.generateAuthUrl({
                                    clientId: process.env.DISCORD_CLIENT_ID,
                                    scope: "bot applications.commands",
                                    permissions: 478208,
                                    guildId: guild_partial.id,
                                    disableGuildSelect: true
                                })
                            });
                        }
                    }
                }
            } catch (err) {
                res.sendStatus(500);
                console.error(err);
                return;
            }
            res.send(data);
        } else {
            res.sendStatus(401);
        }
    })

    app.get('/alerts', async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user) && req.query.server) {
            let guild;
            try {
                guild = await discord.guilds.fetch(req.query.server);
                let member = await guild.members.fetch(cookies.get(req.cookies.user).id);
                if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Exception("Permissions insuffisantes pour l'utilisateur");
            } catch (err) {
                console.error(err);
                res.sendStatus(401);
                return;
            }

            let data = {
                alerts: [],
                guild_id: guild.id,
                guild_name: guild.name,
                icon: guild.icon ? "https://cdn.discordapp.com/icons/" + guild.id + "/" + guild.icon + ".png" : "/assets/img/icons/discord.png"
            }

            let query = await pgsql.query(`SELECT * FROM twitch WHERE serverid='${guild.id}';`);
            for (const i in query.rows) {
                let alert = query.rows[i];
                let users = await twitch.getUsers(alert.channelid);
                let user = users.data[0];
                let channel;
                try {
                    channel = await guild.channels.fetch(alert.canalid);
                } catch (e) {
                    console.error(e);
                    res.sendStatus(500);
                    return;
                }

                data.alerts.push({
                    icon: user.profile_image_url,
                    name: user.display_name,
                    id: user.id,
                    channel_id: channel.id,
                    channel_name: channel.name,
                    start: alert.messagelive,
                    end: alert.messagefin
                });
            }
            data.alerts.sort((a, b) => {
                let fa = a.name.toLowerCase();
                let fb = b.name.toLowerCase();

                if (fa < fb) {
                    return 1;
                }
                if (fa > fb) {
                    return -1;
                }
                return 0;
            })
            res.send(data);
        } else {
            res.sendStatus(402);
        }
    });

}