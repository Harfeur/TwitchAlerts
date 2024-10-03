const GeneralController = require("../controllers/generalController");
const {getString} = require("../modules/language");

exports.run = GeneralController.checkperm;

exports.commandData = {
    name: getString("en-US", "CHECKPERM_CMD_NAME"),
    description: getString("en-US", "CHECKPERM_CMD_DESC"),
    dm_permission: false,
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false,
    translate: true
};