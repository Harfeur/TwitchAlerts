const LanguageController = require("../controllers/languageController");
const {languagesList, getString} = require("../modules/language");

exports.run = LanguageController.language;

let names = {}
let descs = {}
let namesOption = {}
let descsOption = {}
let language = [{
    name: getString("en-US", "LANGUAGE_DEFAULT"),
    name_localizations: {},
    value: "default"
}]

for (const [lang, _] of languagesList) {
    names[lang] = getString(lang, "LANGUAGE_CMD_NAME");
    descs[lang] = getString(lang, "LANGUAGE_CMD_DESC");
    namesOption[lang] = getString(lang, "LANGUAGE_OPTION_NAME");
    descsOption[lang] = getString(lang, "LANGUAGE_OPTION_DESC");
    language[0].name_localizations[lang] = getString(lang, "LANGUAGE_DEFAULT");
    language.push({
        name: getString(lang, "LANGUAGE"),
        value: lang
    })
}

exports.commandData = {
    name: getString("en-US", "LANGUAGE_CMD_NAME"),
    name_localizations: names,
    description: getString("en-US", "LANGUAGE_CMD_DESC"),
    description_localizations: descs,
    dm_permission: false,
    options: [
        {
            type: 3,
            name: getString("en-US", "LANGUAGE_OPTION_NAME"),
            name_localizations: namesOption,
            description: getString("en-US", "LANGUAGE_OPTION_DESC"),
            description_localizations: descsOption,
            required: true,
            choices: language
        }
    ],
    default_member_permissions: "32"
};

exports.conf = {
    guildOnly: false
};