const LanguageController = require("../controllers/languageController");
const {languagesList, getString} = require("../modules/language");

exports.run = LanguageController.language;

let language = [{
    name: getString("en-US", "LANGUAGE_DEFAULT"),
    name_localizations: {},
    value: "default"
}]

for (const [lang, _] of languagesList) {
    language[0].name_localizations[lang] = getString(lang, "LANGUAGE_DEFAULT");
    language.push({
        name: getString(lang, "LANGUAGE"),
        value: lang
    })
}

exports.commandData = {
    name: getString("en-US", "LANGUAGE_CMD_NAME"),
    description: getString("en-US", "LANGUAGE_CMD_DESC"),
    dm_permission: false,
    options: [
        {
            type: 3,
            name: getString("en-US", "LANGUAGE_OPTION_NAME"),
            description: getString("en-US", "LANGUAGE_OPTION_DESC"),
            required: true,
            choices: language
        }
    ],
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false,
    translate: true
};