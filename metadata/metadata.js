const { fileSuggester, dvQuerySuggester, IMAGE_FILE_EXTS } = self.require("_modules/templater/file.js");
const { mergeFieldsWithInheritance } = self.require("_modules/metadata/inheritance.js");
const {handleYamlField, handleBooleanField, handleNumberField, handleDateField, handleInputField} = self.require("_modules/metadata/fields.js");

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
    return Array.from(values);
}

/**
 * Gets the Metadata Menu plugin instance.
 *
 * Checks if the "metadata-menu" plugin is installed and active,
 * and returns the plugin instance.
 *
 * @return {object} Metadata menu plugin
 * @throws {Error} if the plugin is not found
 */
function getMetadataMenu() {
    const plugin = app.plugins.getPlugin("metadata-menu");
    if (!plugin) {
        new Notice("Metadata menu plugin not found");
        throw new Error("Metadata menu plugin not found.");
    }
    return plugin;
}

/**
 * Gets file classes from the Metadata Menu plugin instance.
 *
 * Retrieves the file class folder path from the plugin's settings.
 * Gets all markdown files from the vault, and filters for ones whose
 * path starts with the file class folder path.
 *
 * @param {Object} mm - Metadata Menu plugin instance
 * @returns {Array[]} Array of file classes
 */
function getFileClasses(mm) {
    const globalSettings = mm.settings;
    const fileClassFolder = globalSettings.classFilesPath;
    return app.vault
        .getMarkdownFiles()
        .filter((file) => file.path.startsWith(fileClassFolder));
}

/**
 * Gets file class data from frontmatter for the given file classes.
 *
 * Iterates through the provided file classes, gets the frontmatter metadata for each file,
 * and returns an array of objects mapping the file name (without .md) to the frontmatter data.
 *
 * @param {TFile[]} fileClasses - Array of file classes to get data for
 * @return {Object} Data container of file class data objects
*/
function getFileClassMetadata(fileClasses) {
    const fileClassData = {};
    for (const fileClass of fileClasses) {
        const frontmatter = app.metadataCache.getFileCache(fileClass)?.frontmatter;
        if (frontmatter)
            fileClassData[fileClass.name.replace(".md", "")] = frontmatter;
    }
    return fileClassData;
}

/**
 * Gets file class data by retrieving all file classes and extracting their frontmatter.
 *
 * Gets the Metadata Menu plugin instance. Retrieves all file classes using the
 * plugin's methods. Extracts frontmatter data from each file class into an object
 * mapping file class name to frontmatter.
 *
 * @return {Object} Object mapping file class name to frontmatter data
 * @throws {Error} if no file classes were found
*/
function getAllFileClassMetadata() {
    const mm = getMetadataMenu();

    const allFileClasses = getFileClasses(mm);
    if (!allFileClasses) {
        const msg = "No file classes found, quitting...";
        new Notice(msg);
        throw new Error(msg);
    }

    // Get file class data from frontmatter for all file classes.
    return getFileClassMetadata(allFileClasses);
}

/**
 * Gets file class data by retrieving metadata for all file classes and merging inherited fields.
 *
 * Calls getAllFileClassMetadata() to get metadata for all file classes.
 * Calls mergeFieldsWithInheritance() to merge inherited fields into file class metadata.
 *
 * @return {Object} Object mapping file class name to merged metadata
 */
function getFileClassData() {
    const fileClassData = getAllFileClassMetadata();
    const mergedFileClassData = mergeFieldsWithInheritance(fileClassData);
    return mergedFileClassData;
}

/**
 * Gets the option values from a values list note path.
 *
 * Gets the AbstractFile for the note path from the vault.
 * Reads the cached content of the note.
 * Splits the content into an array by newline character.
 *
 * Returns the array of options.
 *
 * @param {string} path - The values list note path
 * @return {Promise<string[]>} The array of option values
*/
async function getOptionsFromValuesListNotePath(path) {
    const notePath = app.vault.getAbstractFileByPath(path);
    if (!notePath) {
        const msg = "Values from note path configuration error.";
        new Notice(msg);
        throw new Error(msg);
    }
    const content = await app.vault.cachedRead(notePath);
    return content.split("\n");
}

/**
 * Gets user input values for the given fields.
 *
 * Loops through the provided fields array and prompts the user for input
 * based on the field type. Supports input, YAML, boolean, values list,
 * and date input types.
 *
 * @param {Object} tp - Templater instance
 * @param {Object[]} fields - Array of field objects
 * @param {Object} templateParams - Template parameters
 * @param {Object} promptOptions - Prompt options
 * @return {Object[]} Array of result objects with name, id, type and values
*/
async function getValuesForFields(tp, fields, templateParams, promptOptions) {
    const results = [];
    for (const field of fields) {
        const result = {
            name: field.name,
            id: field.id,
            type: field.type,
            values: null,
        };

        if (promptOptions.ignore_fields.has(field.name)) {
            // This sets default values for `created` and `modified` fields
            let defaultDateFmt;
            if (["date", "datetime"].includes(field.type.toLowerCase()))
                defaultDateFmt = field.options.dateFormat || "YYYY-MM-DD";
            const defaultValue = defaultDateFmt ?
                tp.date.now(defaultDateFmt) :
                promptOptions.getValueForField(field.name);
            result.values = defaultValue; // null OK
            results.push(result);
            continue;
        }

        if (field.type.toLowerCase() === "input") {
            result.values = await handleInputField(tp, field, templateParams, promptOptions);
        } else if (field.type.toLowerCase() === "multimedia") {
            try {
                result.values = await fileSuggester(
                    tp, field.options.folders, field.options.customSorting,
                    `Choose ${field.name} <ESC to skip>`, IMAGE_FILE_EXTS, field.options.embed);
            } catch (error) {
                console.error(`Getting image failed for field: ${field.name}`, error.stack);
            }
        } else if (field.type.toLowerCase() === "file") {
            try {
                result.values = await dvQuerySuggester(
                    tp,
                    field.options.dvQueryString,
                    field.options.customSorting,
                    field.options.customRendering,
                    `Choose ${field.name} <ESC to skip>`,
                );
            } catch (error) {
                console.error(`Getting file failed for field: ${field.name}`, error.stack);
            }
        } else if (field.type.toLowerCase() === "yaml") {
            result.values = await handleYamlField(tp, field, promptOptions);
        } else if (field.type.toLowerCase() === "boolean") {
            result.values = await handleBooleanField(tp, field, promptOptions);
        } else if (field.type.toLowerCase() === "number") {
            result.values = await handleNumberField(tp, field, promptOptions);
        } else if (field.options.sourceType === "ValuesListNotePath") {
            try {
                const fieldOptions = await getOptionsFromValuesListNotePath(field.options.valuesListNotePath);
                if (!fieldOptions)
                    console.warn(`No default values configured for field ${field.name}`);
                else
                    result.values = await tp.system.suggester(fieldOptions, fieldOptions, false, `${field.name}?`);
            } catch (error) {
                console.error(`Getting options failed for field: ${field.name}`, error.stack);
            }
        } else if (field.options.sourceType === "ValuesList") {
            const fieldOptions = Object.values(field.options.valuesList);
            if (!fieldOptions)
                console.warn(`No default values configured for field ${field.name}`);
            else
                result.values = await tp.system.suggester(fieldOptions, fieldOptions, false, `${field.name}?`);
        } else if (field.options.dateFormat) {
            result.values = await handleDateField(tp, field, promptOptions);
        }
        results.push(result);
    }
    return results;
}

/**
 * Populates a result object with values for the given fields based on a value map.
 *
 * Loops through the provided fields array and checks if the field name exists in the
 * value map. If so, sets that value on the result object.
 *
 * @param {Object[]} fields - Array of field objects
 * @param {Map} valueMap - Map of field name to prerecorded value
 * @return {Object} Result object with values populated
*/
function getResultValuesForFields(fields, valueMap) {
    const results = [];
    for (const field of fields) {
        const result = {
            name: field.name,
            id: field.id,
            type: field.type,
        };
        if (valueMap.has(field.name))
            result.values = valueMap.get(field.name);
        results.push(result);
    }
    return results;
}

/**
 * Prompts the user to select a file class from the available options.
 *
 * Gets the file class metadata, then uses the system suggester to prompt the user to select a file class.
 * Returns the selected file class name and data instance.
 *
 * @param {Object} tp - Templater instance
 * @return {Array} - Array containing [selected file class name, file class data instance]
 */
async function promptForFileClass(tp) {
    const fileClassData = getFileClassData();

    const fileClass = await tp.system.suggester(
        data => data.className,
        fileClassData,
        false,
        "Choose File Class",
    );

    return [fileClass.className, fileClass];
}

/**
 * Gets child file classes that extend the given super class name.
 *
 * Accepts file class data returned from `getFileClassData`
 * @param {Object} fileClassData - Object mapping file class names to metadata
 * @param {string} superClassName - Name of parent class to get child classes for
 * @returns {Object} Child file classes extending the given super class
 */
function getChildClasses(fileClassData, superClassName) {
    return Object.fromEntries(
        Object.entries(fileClassData).filter(
            (entry) => entry[1].extends === superClassName
        )
    );
}

/**
 * Gets file class object with the given class name.
 *
 * Accepts file class data returned from `getFileClassData`
 * @param {Object} fileClassData - Object mapping file class names to metadata
 * @param {string} superClassName - Name of class to get object for
 * @returns {Object} File class with the given name
 */
function getClass(fileClassData, className) {
    try {
        return Object.entries(fileClassData).find(entry => entry[0] === className).pop()
    } catch (error) {
        console.error(error.stack);
        console.error(`A class with the name '${className}' does not exist`);
    }
}

module.exports = {
    getAllMetadataValues,
    getFileClassMetadata,
    getFileClasses,
    getMetadataMenu,
    getOptionsFromValuesListNotePath,
    getResultValuesForFields,
    getValuesForFields,
    getAllFileClassMetadata,
    getFileClassData,
    promptForFileClass,
    getChildClasses,
    getClass,
};
