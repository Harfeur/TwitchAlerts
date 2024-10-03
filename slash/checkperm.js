const GeneralController = require("../controllers/generalController");

exports.run = GeneralController.checkperm;

exports.commandData = {
    name: "checkperm",
    description: "Check if the bot has all the required permissions in this channel.",
    dm_permission: false,
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false,
    translate: true
};