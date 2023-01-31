const SetupController = require("../controllers/setupController");
const {getString} = require("../modules/language");

exports.run = SetupController.setup;

exports.modalSubmit = SetupController.modalSubmit;

exports.commandData = {
    name: getString("en-US", "SETUP_CMD_NAME"),
    description: getString("en-US", "SETUP_CMD_DESC"),
    dm_permission: false,
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false,
    translate: true
};