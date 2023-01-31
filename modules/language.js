const {readdirSync} = require("fs");
const logger = require("./logger");

// Initialisation of languages
const languages = new Map();
const langs = readdirSync("./languages/").filter(file => file.endsWith(".json"));
for (const lang of langs) {
    const json = require(`../languages/${lang}`);
    const language = new Map();
    for (const key of Object.keys(json))
        language.set(key, json[key]);
    languages.set(lang.split(".json")[0], language);
}

function createString(string, vars = {}) {
    for (const key of Object.keys(vars)) {
        string = string.replaceAll(`{${key}}`, vars[key]);
    }
    return string;
}

function getLocalizedString(language) {
    const lang = languages.get(language) ?? languages.get("en-US");
    return function (id, vars = {}) {
        const string = lang.get(id) ?? "";
        return createString(string, vars);
    }
}

function getString(language, id, vars = {}) {
    const lang = languages.get(language) ?? languages.get("en-US");
    const string = lang.get(id) ?? "";
    return createString(string, vars);
}

const regex = new RegExp('^[-_\\p{L}\\p{N}\\p{sc=Deva}\\p{sc=Thai}]{1,32}$', 'um')

module.exports = {
    languagesList: languages,

    getLocalizedString,

    getString,

    translateCommand: (command, commandName) => {
        if (command.conf.translate) {
            let objects = [command.commandData]
            while (objects.length !== 0) {
                let obj = objects.shift();
                let names = {}
                let descs = {}
                for (const [lang, _] of languages) {
                    if ("type" in obj) {
                        names[lang] = getString(lang, `${commandName.toUpperCase()}_OPTION_NAME`).toLocaleLowerCase().replaceAll(" ", "_").substring(0, 32);
                        descs[lang] = getString(lang, `${commandName.toUpperCase()}_OPTION_DESC`)
                        if (descs[lang].length > 100) {
                            descs[lang] = descs[lang].substring(0, 96) + " ..."
                        }

                        if (! regex.test(names[lang])) {
                            logger.error(`Please check string ${commandName.toUpperCase()}_OPTION_NAME (${names[lang]}) in file ${lang}.json : Regex not matched by Discord`);
                            names[lang] = obj.name;
                        }
                    }
                    else if ("description" in obj) {
                        names[lang] = getString(lang, `${commandName.toUpperCase()}_CMD_NAME`).toLocaleLowerCase().replaceAll(" ", "_").substring(0, 32);
                        descs[lang] = getString(lang, `${commandName.toUpperCase()}_CMD_DESC`)
                        if (descs[lang].length > 100) {
                            descs[lang] = descs[lang].substring(0, 96) + " ..."
                        }

                        if (! regex.test(names[lang])) {
                            logger.error(`Please check string ${commandName.toUpperCase()}_CMD_NAME} (${names[lang]}) in file ${lang}.json : Regex not matched by Discord`);
                            names[lang] = obj.name;
                        }
                    }
                    if (names[lang] === "") {
                        names[lang] = obj.name;
                    }

                    if (descs[lang] === "") {
                        descs[lang] = obj.description;
                    }


                }
                obj.name_localizations = names;
                obj.description_localizations = descs;

                if (obj.options) obj.options.forEach(opt => objects.push(opt));
            }
        }
    }
}