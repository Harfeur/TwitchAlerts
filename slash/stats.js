const GeneralController = require("../controllers/generalController");

exports.run = GeneralController.stats;

exports.commandData = {
    name: "stats",
    description: "Show's the bots stats.",
    options: []
};

exports.conf = {
    guildOnly: false
};