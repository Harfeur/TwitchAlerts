const GeneralController = require("../controllers/generalController");

exports.run = GeneralController.info;

exports.commandData = {
    name: "info",
    description: "Show Twitch Alerts bot information and help."
};

exports.conf = {
    guildOnly: false
};