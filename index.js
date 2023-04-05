// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split(".")[0]) < 16) throw new Error("Node 16.x or higher is required. Update Node on your system.");

const {Client, Collection} = require("discord.js");
const Database = require('./models/database');

const {readdirSync} = require("fs");
const {intents, partials} = require("./config");
const logger = require("./modules/logger");
const {translateCommand} = require("./modules/language");
const {AppTokenAuthProvider} = require("@twurple/auth");
const {ApiClient} = require("@twurple/api");

const client = new Client({intents, partials, shards:'auto'});

const slashcmds = new Collection();

client.container = {
    slashcmds,
    debug: process.env.NODE_ENV !== "production",
    pg: new Database(process.env.DATABASE_URL)
};

const init = async () => {

    const slashFiles = readdirSync("./slash").filter(file => file.endsWith(".js"));
    for (const file of slashFiles) {
        const command = require(`./slash/${file}`);
        const commandName = file.split(".")[0];
        logger.log(`Loading Slash command: ${commandName}. 👌`, "log");

        translateCommand(command, commandName);

        client.container.slashcmds.set(command.commandData.name, command);
    }

    const eventFiles = readdirSync("./events/").filter(file => file.endsWith(".js"));
    for (const file of eventFiles) {
        const eventName = file.split(".")[0];
        logger.log(`Loading Event: ${eventName}. 👌`, "log");
        const event = require(`./events/${file}`);

        client.on(eventName, event.bind(null, client));
    }

    // Twitch
    const authProvider = new AppTokenAuthProvider(process.env.TWITCH_BOT_CLIENT_ID, process.env.TWITCH_BOT_CLIENT_SECRET);
    client.container.twitch = new ApiClient({authProvider});

    await client.login(process.env.TWITCHBOT);
};

init();
