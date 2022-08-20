const {readdirSync} = require("fs");

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

module.exports = {
    languagesList: languages,

    getLocalizedString: (language) => {
        const lang = languages.get(language) ?? languages.get("en-US");
        return function (id, vars = {}) {
            const string = lang.get(id) ?? "";
            return createString(string, vars);
        }
    },

    getString: (language, id, vars = {}) => {
        const lang = languages.get(language) ?? languages.get("en-US");
        const string = lang.get(id) ?? "";
        return createString(string, vars);
    }
}