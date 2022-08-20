const GeneralController = require("../controllers/generalController");
const {languagesList, getString} = require("../modules/language");

exports.run = GeneralController.info;

let names = {}
let descs = {}

for (const [lang, _] of languagesList) {
    names[lang] = getString(lang, "INFO_CMD_NAME");
    descs[lang] = getString(lang, "INFO_CMD_DESC");
}

exports.commandData = {
    name: "info",
    description: "Show Twitch Alerts bot information and help."
};

exports.conf = {
    guildOnly: false
};