const metadata = self.require("_modules/metadata.js");

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
    superClassName = superClassName || "journal";
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

module.exports = {
    getPlugin,
    getFormatSettings,
    getSettingsForFileClasses,
    getSettingsForPeriodicNotes,
};
