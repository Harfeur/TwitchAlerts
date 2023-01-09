const express = require('express');
const {Client} = require('pg');
const DiscordOauth2 = require("discord-oauth2");
const Discord = require('discord.js');
const {default: TwitchApi} = require("node-twitch");
const f = require("./functions");


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

    app.post("/edit", async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            if (req.body.guild_id && req.body.streamer_id && req.body.streamer_name && req.body.start && req.body.end && /^\d+$/.test(req.body.streamer_id)) {
                try {
                    let guild = await discord.guilds.fetch(req.body.guild_id);
                    let member = await guild.members.fetch(cookies.get(req.cookies.user).id);
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Exception("Permissions insuffisantes pour l'utilisateur");
                } catch (err) {
                    console.error(err);
                    res.sendStatus(401);
                    return;
                }
                try {
                    let users = await twitch.getUsers(req.body.streamer_name);
                    if (users.data.length !== 1) {
                        res.sendStatus(406);
                        return;
                    }
                    await pgsql.query(`UPDATE twitch SET channelid=${users.data[0].id}, messagelive='${req.body.start.replaceAll("'", "''")}', messagefin='${req.body.end.replaceAll("'", "''")}' WHERE channelid=${req.body.streamer_id} AND serverid='${req.body.guild_id.replaceAll("'", "''")}'`);
                    res.send(users.data[0]);
                } catch (err) {
                    if (err.code === "23505") res.sendStatus(409); else {
                        res.sendStatus(500);
                        console.error(err);
                    }
                }
            } else {
                res.sendStatus(400);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.post("/move", async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            if (req.body.guild_id && req.body.streamer_id && req.body.channel && /^\d+$/.test(req.body.streamer_id)) {
                let guild;
                try {
                    guild = await discord.guilds.fetch(req.body.guild_id);
                    let member = await guild.members.fetch(cookies.get(req.cookies.user).id);
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Exception("Permissions insuffisantes pour l'utilisateur");
                } catch (err) {
                    console.error(err);
                    res.sendStatus(401);
                    return;
                }

                let channel;
                try {
                    if (/^\d+$/.test(req.body.channel)) {
                        channel = await guild.channels.fetch(req.body.channel);
                    } else {
                        channel = guild.channels.cache.find(c => c.name === req.body.channel);
                        if (!channel) throw Exception("Non trouvé");
                    }
                    if (channel.type !== Discord.ChannelType.GuildText && channel.type !== Discord.ChannelType.GuildAnnouncement) throw Exception("Canal non texte");
                } catch (e) {
                    res.sendStatus(404);
                    return;
                }

                try {
                    let query = await pgsql.query(`UPDATE twitch SET canalid='${channel.id}', messageid='0' WHERE channelid=${req.body.streamer_id} AND serverid='${req.body.guild_id.replaceAll("'", "''")}'`);
                    console.log(query);
                    res.send({
                        channel_id: channel.id, channel_name: channel.name
                    });
                } catch (err) {
                    res.sendStatus(500);
                    console.error(err);
                }
            } else {
                res.sendStatus(400);
            }
        } else {
            res.sendStatus(401);
        }
    })

    app.post("/create", async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            if (req.body.guild_id && req.body.streamer_name && req.body.start && req.body.end && req.body.channel) {
                // Check rights
                let guild;
                try {
                    guild = await discord.guilds.fetch(req.body.guild_id);
                    let member = await guild.members.fetch(cookies.get(req.cookies.user).id);
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Exception("Permissions insuffisantes pour l'utilisateur");
                } catch (err) {
                    console.error(err);
                    res.sendStatus(401);
                    return;
                }
                //Check channel
                let channel;
                try {
                    if (/^\d+$/.test(req.body.channel)) {
                        channel = await guild.channels.fetch(req.body.channel);
                    } else {
                        channel = guild.channels.cache.find(c => c.name === req.body.channel);
                        if (!channel) throw Exception("Non trouvé");
                    }
                    if (channel.type !== Discord.ChannelType.GuildText && channel.type !== Discord.ChannelType.GuildAnnouncement) throw Exception("Canal non texte");
                } catch (e) {
                    res.sendStatus(404);
                    return;
                }
                // Check twitch and upload
                try {
                    let users = await twitch.getUsers(req.body.streamer_name);
                    if (users.data.length !== 1) {
                        res.sendStatus(406);
                        return;
                    }
                    let user = users.data[0];
                    await pgsql.query(`INSERT INTO twitch (channelid, serverid, canalid, messagelive, messagefin) VALUES (${user.id}, '${req.body.guild_id.replaceAll("'", "''")}', ${channel.id}, '${req.body.start.replaceAll("'", "''")}', '${req.body.end.replaceAll("'", "''")}');`);
                    res.send({
                        alert: {
                            icon: user.profile_image_url,
                            name: user.display_name,
                            id: user.id,
                            channel_id: channel.id,
                            channel_name: channel.name,
                            start: req.body.start,
                            end: req.body.end
                        },
                        guild_id: guild.id,
                        guild_name: guild.name,
                        icon: guild.icon ? "https://cdn.discordapp.com/icons/" + guild.id + "/" + guild.icon + ".png" : "/assets/img/icons/discord.png"
                    });
                } catch (err) {
                    if (err.code === "23505") res.sendStatus(409); else {
                        res.sendStatus(500);
                        console.error(err);
                    }
                }
            } else {
                res.sendStatus(400);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.post("/delete", async (req, res) => {
        if (req.cookies.user && await functions.checkToken(req.cookies.user)) {
            if (req.body.guild_id && req.body.streamer_id && /^\d+$/.test(req.body.streamer_id)) {
                try {
                    let guild = await discord.guilds.fetch(req.body.guild_id);
                    let member = await guild.members.fetch(cookies.get(req.cookies.user).id);
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Exception("Permissions insuffisantes pour l'utilisateur");
                } catch (err) {
                    console.error(err);
                    res.sendStatus(401);
                    return;
                }
                try {
                    await pgsql.query(`DELETE FROM twitch WHERE channelid=${req.body.streamer_id} AND serverid='${req.body.guild_id.replaceAll("'", "''")}'`);
                    res.send("Done");
                } catch (err) {
                    if (err.code === "23505") res.sendStatus(409); else {
                        res.sendStatus(500);
                        console.error(err);
                    }
                }
            } else {
                res.sendStatus(400);
            }
        } else {
            res.sendStatus(401);
        }
    });
}