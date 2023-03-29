const express = require('express');
const Database = require('../models/database');
const DiscordOauth2 = require("discord-oauth2");
const Discord = require('discord.js');
const {ApiClient} = require("@twurple/api");
const f = require("./functions");


/**
 * @param {express.Application} app Application express
 * @param {Database} pgsql Base de données
 * @param {DiscordOauth2} oauth Discord Bot
 * @param {Discord.Client} discord
 * @param {ApiClient} twitch
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
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Error("Permissions insuffisantes pour l'utilisateur");
                } catch (err) {
                    console.error(err);
                    res.sendStatus(401);
                    return;
                }
                try {
                    const user = await twitch.users.getUserByName(req.body.streamer_name);
                    if (!user) {
                        res.sendStatus(406);
                        return;
                    }
                    await pgsql.editAlert(req.body.guild_id.replaceAll("'", "''"), req.body.streamer_id, user.id, req.body.start.replaceAll("'", "''"), req.body.end.replaceAll("'", "''"))
                    res.send(user); // TODO : Update HTML/JS
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
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Error("Permissions insuffisantes pour l'utilisateur");
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
                        if (!channel) throw new Error("Non trouvé");
                    }
                    if (channel.type !== Discord.ChannelType.GuildText && channel.type !== Discord.ChannelType.GuildAnnouncement) throw new Error("Canal non texte");
                } catch (e) {
                    res.sendStatus(404);
                    return;
                }

                try {
                    await pgsql.moveAlert(req.body.guild_id.replaceAll("'", "''"), req.body.streamer_id, channel.id);
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
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Error("Permissions insuffisantes pour l'utilisateur");
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
                        if (!channel) throw new Error("Non trouvé");
                    }
                    if (channel.type !== Discord.ChannelType.GuildText && channel.type !== Discord.ChannelType.GuildAnnouncement) throw new Error("Canal non texte");
                } catch (e) {
                    res.sendStatus(404);
                    return;
                }
                // Check twitch and upload
                try {
                    const user = await twitch.users.getUserByName(req.body.streamer_name);
                    if (!user) {
                        res.sendStatus(406);
                        return;
                    }
                    await pgsql.addAlert(req.body.guild_id.replaceAll("'", "''"), user.id, channel.id, req.body.start.replaceAll("'", "''"), req.body.end.replaceAll("'", "''"));
                    res.send({
                        alert: {
                            icon: user.profilePictureUrl,
                            name: user.displayName,
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
                    if (!member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) throw new Error("Permissions insuffisantes pour l'utilisateur");
                } catch (err) {
                    console.error(err);
                    res.sendStatus(401);
                    return;
                }
                try {
                    await pgsql.deleteAlert(req.body.guild_id.replaceAll("'", "''"), req.body.streamer_id);
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