const metadata = self.require("_modules/metadata/metadata.js");

const PREFIXED_REGEX = /^(?<prefix>[0-9]+-[0-9]+-[0-9]+)(?<suffix>.*)/;

/**
 * Gets the Periodic notes plugin instance.
 *
 * Checks if the "metadata-menu" plugin is installed and active,
 * and returns the plugin instance.
 *
 * @return {object} Periodic notes plugin
 * @throws {Error} if the plugin is not found
 */
function getPlugin() {
    const plugin = app.plugins.getPlugin("periodic-notes");
    if (!plugin) {
        new Notice("Periodic notes plugin not found");
        throw new Error("Periodic notes plugin not found.");
    }
    return plugin;
}

/**
 * Gets the format settings for the given class name from the Periodic Notes plugin settings.
 *
 * @param {string} className - The class name to get format settings for.
 * @returns {Object} The format settings for the given class name.
 */
function getFormatSettings(className) {
    const settings = getSettingsForPeriodicNotes();
    return settings[className]?.format;
}

/**
 * Gets settings from the Periodic Notes plugin for a given super class name.
 *
 * @param {string} superClassName - (Optional) Name of the super class to get child classes for.
 * @returns {Object} The settings for the matched child classes.
 */
function getSettingsForPeriodicNotes(superClassName) {
    const plugin = getPlugin();
    superClassName = superClassName || "periodic";
    const fileClassData = metadata.getFileClassData();
    const childFileClasses = metadata.getChildClasses(fileClassData, superClassName);
    const fileClassNames = Object.values(childFileClasses).map(value => value.className);
    return getSettingsForFileClasses(plugin, fileClassNames);
}

/**
 * Gets settings from the Periodic Notes plugin for the given file class names.
 *
 * @param {Object} plugin - Periodic notes plugin instance
 * @param {string[]} classNames - Array of file class names to get settings for
 * @returns {Object} Settings for the matched file classes
 */
function getSettingsForFileClasses(plugin, classNames) {
    const globalSettings = plugin.settings;
    return Object.fromEntries(
        Object.entries(globalSettings).filter(entry => classNames.includes(entry[0]))
    );
}

/**
 * Converts a string (presumably a file title) to a Moment object
 *
 * Handles special cases like quarters and prefixed dates.
 *
 * Strings with a date prefix in the format YYYY-MM-DD will be parsed directly by Moment.
 * Strings containing a quarter in the format YYYY-Q# will be parsed by getting the year and quarter,
 * then passing to Moment's .quarter() method.
 * Other strings are parsed directly by Moment.
 *
 * @param {string} text - The string to convert to a Moment object
 * @returns {Moment} The Moment object representing the date
 */
function toMoment(text) {
    /** Strings such as 2024-02-08-journal */
    const match = text.match(PREFIXED_REGEX);
    const datePrefix = match?.groups ? match.groups.prefix : null;
    if (datePrefix) {
        return moment(datePrefix);
    }

    const quarterlyRegex = /(?<year>[0-9]+)-Q(?<quarter>[1-4])/;
    const isQuarterly = text.replace(quarterlyRegex, "") === "";
    const weeklyRegex = /(?<year>[0-9]+)-W(?<week>[0-9]+)/;
    const isWeekly = text.replace(weeklyRegex, "") === "";

    /**
     * Special cases for Quarterly and Weekly notes since the date cannot be parsed
     * directly by moment
    */
    if (isWeekly) {
        const year = text.match(weeklyRegex).groups.year;
        const week = text.match(weeklyRegex).groups.week;
        return moment(year).week(week);
    } else if (isQuarterly) {
        const year = text.match(quarterlyRegex).groups.year;
        const quarter = text.match(quarterlyRegex).groups.quarter;
        return moment(year).quarter(quarter);
    } else {
        return moment(text);
    }
}

module.exports = {
    PREFIXED_REGEX,
    getPlugin,
    getFormatSettings,
    getSettingsForFileClasses,
    getSettingsForPeriodicNotes,
    toMoment,
};
