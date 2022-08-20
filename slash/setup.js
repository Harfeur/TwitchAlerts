const SetupController = require("../controllers/setupController");
const {languagesList, getString} = require("../modules/language");

exports.run = SetupController.setup;

exports.modalSubmit = SetupController.modalSubmit;

let names = {}
let descs = {}

for (const [lang, _] of languagesList) {
    names[lang] = getString(lang, "SETUP_CMD_NAME");
    descs[lang] = getString(lang, "SETUP_CMD_DESC");
}

exports.commandData = {
    name: getString("en-US", "SETUP_CMD_NAME"),
    name_localizations: names,
    description: getString("en-US", "SETUP_CMD_DESC"),
    description_localizations: descs,
    dm_permission: false,
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false
};