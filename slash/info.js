const GeneralController = require("../controllers/generalController");

exports.run = GeneralController.info;

exports.commandData = {
    name: "info",
    description: "Show Trucky mobile app download links, Trucky Discord server invite and issue tracker.",
    options: []
};

exports.conf = {
    guildOnly: false
};