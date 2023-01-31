const GeneralController = require("../controllers/generalController");
const {getString} = require("../modules/language");

exports.run = GeneralController.info;

exports.commandData = {
    name: getString("en-US", "INFO_CMD_NAME"),
    description: getString("en-US", "INFO_CMD_DESC"),
};

exports.conf = {
    guildOnly: false,
    translate: true
};