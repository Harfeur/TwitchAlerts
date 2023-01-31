const defaultLocale = "en";
const supportedLocales = ["fr", "en", "cs", "de"];

let locale;
let translations = {};

const initialLocale = supportedOrDefault(browserLocales(true));

$(() => {
    setLocale(initialLocale);

    bindLocaleSwitcher(initialLocale);
});

/**
 * Load translations for the given locale and translate
 * the page to this locale
 *
 * @param {string} newLocale
 */
async function setLocale(newLocale) {
    if (newLocale === locale) return;

    const newTranslations = await fetchTranslationsFor(newLocale);

    locale = newLocale;
    translations = newTranslations;

    $("html").attr("lang", locale);
    localStorage.setItem("lang", locale);

    translatePage();
}

// Retrieve translations JSON object for the given
// locale over the network
function fetchTranslationsFor(newLocale) {
    return $.get(`/assets/js/translations/${newLocale}.json`);
}

// Replace the inner text of each element that has a
// data-i18n-key attribute with the translation corresponding
// to its data-i18n-key
function translatePage() {
    $("[data-i18n]").each(function () {
        $(this).text(translations[$(this).attr("data-i18n")]);
    });
    $("[data-i18n-label]").each(function () {
        $(this).attr("data-label", translations[$(this).attr("data-i18n-label")]);
    });
    $("[data-i18n-placeholder]").each(function () {
        $(this).attr("placeholder", translations[$(this).attr("data-i18n-placeholder")]);
    });
}

//// LANGUAGE SWITCHING

/**
 * Whenever the user selects a new locale, we
 * load the locale's translations and update
 * the page
 *
 * @param {string} initialValue
 */
function bindLocaleSwitcher(initialValue) {
    $("#translation-switcher")
        .val(initialValue)
        .on('change', function () {
            setLocale($(this).val());
        });
}

//// DETECT THE USER'S PREFERRED LANGUAGE

/**
 * Return True if the given locale is in the supported locales array
 *
 * @param {string} locale
 * @return {boolean}
 */
function isSupported(locale) {
    return supportedLocales.indexOf(locale) > -1;
}

/**
 * Retrieve the first locale we support from the given
 * array, or return our default locale
 *
 * @param {Array<string>} locales
 * @return {string}
 */
function supportedOrDefault(locales) {
    return localStorage.getItem("lang") || locales.find(isSupported) || defaultLocale;
}

/**
 * Retrieve user-preferred locales from the browser
 *
 * @param {boolean} languageCodeOnly - when true, returns
 * ["en", "fr"] instead of ["en-US", "fr-FR"]
 * @returns {Array | undefined}
 */
function browserLocales(languageCodeOnly = false) {
    return navigator.languages.map((locale) =>
        languageCodeOnly ? locale.split("-")[0] : locale,
    );
}