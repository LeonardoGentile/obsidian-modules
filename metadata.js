const presets = self.require("_modules/presets.js");


/**
 * Gets the preset value for the given frontmatter metadata field.
 *
 * @param {string} name - The metadata field name to get the preset for.
 * @return {any} The preset value for the given field.
 */
function getFrontmatterPreset(name) {
    if (!Object.keys(presets.frontmatter).includes(name)) {
        new Notice(`Undefined preset: ${name}`, 5000);
        console.error(`Undefined preset: ${name}`);
    }
    return presets.frontmatter[name];
}

/**
 * Gets the preset value for the given inline metadata field.
 *
 * @param {string} name - The metadata field name to get the preset for.
 * @return {any} The preset value for the given field.
 */
function getInlinePreset(name) {
    if (!Object.keys(presets.inline).includes(name)) {
        new Notice(`Undefined preset: ${name}`, 5000);
        console.error(`Undefined preset: ${name}`);
    }
    return presets.inline[name];
}

/**
 * Gets all unique metadata values for the given key across all markdown files in the vault.
 *
 * Iterates through all markdown files, gets the frontmatter data,
 * checks if the data contains the given key, and adds any values to a Set to get the unique values.
 *
 * @param {string} key - The metadata key to get values for
 * @return {Array} An array of the unique metadata values for the given key.
*/
function getAllMetadataValues(key) {
    const values = new Set();
    app.vault.getMarkdownFiles().forEach(file => {
        const cache = app.metadataCache.getFileCache(file);
        const data = cache.frontmatter;
        if (data && data[key])
            values.add(data[key]);
    });
    console.log(values);
    return Array.from(values);
}

module.exports = {
    getFrontmatterPreset,
    getInlinePreset,
    getAllMetadataValues,
};
