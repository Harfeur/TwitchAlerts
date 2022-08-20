const DeleteController = require("../controllers/deleteController");
const {languagesList, getString} = require("../modules/language");

exports.run = DeleteController.delete;

exports.selectMenu = DeleteController.menuSelect;

let names = {}
let descs = {}

for (const [lang, _] of languagesList) {
    names[lang] = getString(lang, "DELETE_CMD_NAME");
    descs[lang] = getString(lang, "DELETE_CMD_DESC");
}

exports.commandData = {
    name: getString("en-US", "DELETE_CMD_NAME"),
    name_localizations: names,
    description: getString("en-US", "DELETE_CMD_DESC"),
    description_localizations: descs,
    dm_permission: false,
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false
};