const DeleteController = require("../controllers/deleteController");
const {getString} = require("../modules/language");

exports.run = DeleteController.delete;

exports.selectMenu = DeleteController.menuSelect;

exports.commandData = {
    name: getString("en-US", "DELETE_CMD_NAME"),
    description: getString("en-US", "DELETE_CMD_DESC"),
    dm_permission: false,
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false,
    translate: true
};