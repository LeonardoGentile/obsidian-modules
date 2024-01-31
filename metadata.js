const {fileSuggester, dvQuerySuggester, IMAGE_FILE_EXTS} = self.require("_modules/file.js");
const {promptForDate, promptYesOrNo} = self.require("_modules/prompt.js");
const T = self.require("_modules/template.js");
const yt = self.require("_modules/youtube.js");

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
 * Gets the Metadata Menu plugin instance.
 *
 * Checks if the "metadata-menu" plugin is installed and active,
 * and returns the plugin instance.
 *
 * @return {object} Metadata menu plugin
 * @throws {Error} if the plugin is not foun
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
 * Description
 * @param {any} mm
 * @return {any}
 */
function getFileClasses(mm) {
    const globalSettings = mm.settings;
    const fileClassFolder = globalSettings.classFilesPath;
    return app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(fileClassFolder));
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
 * Merges metadata fields from a file class inheritance chain.
 *
 * Traverses the inheritance chain for a given file class, merges metadata
 * fields and field order arrays from all classes in the chain, giving priority
 * to bottom-most classes.
 *
 * @param {Object} fileClassData - Data container of file class data objects
 * @return {Object} An object with the merged fields and metadata
 */
function mergeFieldsWithInheritance(fileClassData) {
    const mergedItems = [];
    for (const fileClassName of Object.keys(fileClassData)) {
        // Chain together the hierarchy of file class objects
        const chain = getInheritanceChain(fileClassName, fileClassData);

        const mergedItem = {};

        // Merge fields using 'id' as the unique key
        mergedItem.fields = mergeArrayFromChain(chain, "fields", "id");

        // Merge fieldsOrder directly since it's an array of strings (identifiers)
        mergedItem.fieldsOrder = mergeOrderFromChain(chain, "fieldsOrder");

        // Sort the fields
        sortFieldsByOrder(mergedItem.fields, mergedItem.fieldsOrder);

        // The bottom-most item is the last in the chain
        const bottomMostClassName = Object.keys(chain[chain.length - 1])[0];
        const bottomMostClassData = chain[chain.length - 1][bottomMostClassName];

        // Copy the bottom-most item's data to the merged item
        // Avoiding direct copy of fields and fieldsOrder as they are already merged
        for (const key in bottomMostClassData) {
            if (key !== "fields" && key !== "fieldsOrder")
                mergedItem[key] = bottomMostClassData[key];
        }

        // Add the class name to the merged item
        mergedItem.className = bottomMostClassName;

        // Add the items to the return value
        mergedItems.push(mergedItem);
    }

    return mergedItems;
}

/**
 * Gets the inheritance chain for a given file class.
 *
 * Traverses up the inheritance chain for the provided fileClassName,
 * adding each class to an array. Reverses the array before returning
 * so the chain starts with the topmost parent class.
 *
 * @param {string} fileClassName - The name of the file class to get the inheritance chain for
 * @param {Object} fileClassData - Data container of file class data objects
 * @return {Object[]} An array representing the inheritance chain, starting with the topmost parent class
*/
function getInheritanceChain(fileClassName, fileClassData) {
    const chain = [];
    let currentClassName = fileClassName;

    // Traverse up the inheritance chain
    while (currentClassName && fileClassData[currentClassName]) {
        const currentClass = fileClassData[currentClassName];
        chain.push({[currentClassName]: currentClass}); // Add the current class to the chain
        currentClassName = currentClass.extends; // Move up the chain
    }

    // Reverse the chain to start with the topmost parent
    return chain.reverse();
}

/**
 * Merges arrays from chained objects into a single array.
 *
 * Loops through each object in the chain, gets the array value for the specified property name,
 * and adds each item to the merged array.
 *
 * @param {Array} chain - The array of chained objects
 * @param {string} propertyName - The property name to get the array from each object
 * @return {Array} The merged array
*/
function mergeOrderFromChain(chain, propertyName) {
    const mergedArray = [];
    for (const classObj of chain) {
        const className = Object.keys(classObj)[0];
        const classData = classObj[className];
        const propertyValues = classData[propertyName];
        if (Array.isArray(propertyValues)) {
            for (const item of propertyValues)
                mergedArray.push(item);
        }
    }
    return mergedArray;
}

/**
 * Merges arrays from chained objects into a single array.
 *
 * Loops through each object in the chain, gets the array value for the specified property name,
 * and adds each item to the merged array using the uniqueKey as the key if provided.
 *
 * @param {Array} chain - The array of chained objects
 * @param {string} propertyName - The property name to get the array from each object
 * @param {string} uniqueKey - Optional unique key to use as the key when merging items
 * @return {Array} The merged array
*/
function mergeArrayFromChain(chain, propertyName, uniqueKey) {
    const excludes = new Set();
    // Build up the map of excluded field names
    for (let i = chain.length - 1; i >= 0; i--) {
        const classObj = chain[i];
        const className = Object.keys(classObj)[0];
        const classData = classObj[className];
        if (classData.excludes)
            classData.excludes.forEach(p => excludes.add(p));
    }

    const mergedObject = {};
    for (let i = chain.length - 1; i >= 0; i--) {
        const classObj = chain[i];
        const className = Object.keys(classObj)[0];
        const classData = classObj[className];
        const propertyValues = classData[propertyName];
        const filteredProps = propertyValues?.filter(p => !excludes.has(p.name));
        if (Array.isArray(filteredProps)) {
            for (const item of filteredProps) {
                // Take the first item if 2+ items being merged have the same name
                // to prevent duplicates
                let duplicateItem;
                for (const mergedItem of Object.values(mergedObject)) {
                    if (mergedItem.name && item.name && mergedItem.name === item.name) {
                        duplicateItem = true;
                        break;
                    }
                }
                if (duplicateItem)
                    continue;
                const key = item[uniqueKey] || className;
                mergedObject[key] = item;
            }
        }
    }
    return Object.values(mergedObject);
}

/**
 * Sorts an array of field objects based on their order defined in a separate array.
 *
 * Creates a map for quick lookup of each field's sort order index.
 * Sorts the fields array, comparing the index for each field.
 * Fields not found in the order array will be placed at the end.
 *
 * @param {Object[]} fields - Array of field objects to sort
 * @param {string[]} fieldsOrder - Array of field IDs in desired order
 * @return {Object[]} New array containing sorted fields
*/
function sortFieldsByOrder(fields, fieldsOrder) {
    // Create a map for quick lookup of field index by id
    const orderMap = new Map(fieldsOrder.map((id, index) => [id, index]));

    // Sort the fields based on the index defined in fieldsOrder
    // If a field's id is not found in fieldsOrder, it will be placed at the end
    const sortedFields = fields.sort((a, b) => {
        const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : fieldsOrder.length;
        const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : fieldsOrder.length;
        return indexA - indexB;
    });

    return sortedFields;
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
            // create or modified date fields
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
 * Handles prompting for yaml input fields.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field definition object
 * @param {Object} promptOptions - Prompt options object
 * @return {string} value for yaml field
*/
async function handleYamlField(tp, field, promptOptions) {
    let value;
    const defaultValue = promptOptions.getValueForField(field.name);
    switch (field.name) {
        case "system_commands":
            const promptFiles = await app.vault.getMarkdownFiles()
                .filter(f => f.path.startsWith(promptOptions.system_prompts))
                .sort(p => p.stat.mtime, "desc");
            if (!promptFiles)
                new Notice("No system prompt files found");
            const selection = await tp.system.suggester(
                tfile => tfile.basename, promptFiles, false, `Choose ${field.name} <ESC to skip>`);
            if (!selection)
                new Notice("No system prompt selected.");
            let systemPrompt = selection ? await app.vault.cachedRead(selection) : null;
            if (!systemPrompt)
                new Notice("Empty system prompt.");
            else
                systemPrompt = systemPrompt.replace(/  +/g, " ").replace(/\n\n+/g, "\n").replace(/\n/g, " ");
            value = systemPrompt ? systemPrompt.length ? `\n  - ${systemPrompt}` : "" : null;
            break;
        default:
            value = await promptForYamlField(tp, field, defaultValue);
    }
    return value;
}

/**
 * Handles prompting for boolean input fields.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field definition object
 * @param {Object} promptOptions - Prompt options object
 * @return {boolean} boolean value
*/
async function handleBooleanField(tp, field, promptOptions) {
    const defaultValue = promptOptions.getValueForField(field.name);
    return await promptYesOrNo(tp, `${field.name}?`, defaultValue || false);
}

/**
 * Handles prompting for number input fields.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field definition object
 * @param {Object} promptOptions - Prompt options object
 * @return {number} number value
*/
async function handleNumberField(tp, field, promptOptions) {
    const defaultValue = promptOptions.getValueForField(field.name);
    const reply = await tp.system.prompt(`${field.name}?`, `${defaultValue}` || "");
    const value = parseFloat(reply);
    return value;
}

/**
 * Handles prompting for date input fields.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field definition object
 * @param {Object} promptOptions - Prompt options object
 * @return {string} Formatted date string
*/
async function handleDateField(tp, field, promptOptions) {
    let value;
    switch (field.name) {
        case "published":
            value = yt.getDatePublished(promptOptions.querySelector).format(field.options.dateFormat || "YYYY-MM-DD");
            break;
        case "datePublished":
            value = yt.getDatePublished(promptOptions.querySelector).format(field.options.dateFormat || "YYYY-MM-DD");
            break;
        case "uploadDate":
            value = yt.getUploadDate(promptOptions.querySelector).format(field.options.dateFormat || "YYYY-MM-DD");
            break;
        default:
            value = await promptForDate(tp, `${field.name}?`, field.options.dateFormat);
    }
    return value;
}

/**
 * An abstraction for getting values for different types of input field.
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field object
 * @param {Object} templateParams - Template parameters object
 * @param {Object} promptOptions - Prompt options
 * @return {string} value for input field
 */
async function handleInputField(tp, field, templateParams, promptOptions) {
    let value;
    switch (field.name) {
        case "progress":
            value = T.progressView({title: templateParams.title});
            break;
        case "target":
            value = T.targetView({title: templateParams.title});
            break;
        case "projectDV":
            value = T.overview({
                title: templateParams.title,
                linked: true,
                interval: -1,
                tags: templateParams.tags.asString(),
            });
            break;
        case "projectTV":
            value = T.projectTableView({title: templateParams.title});
            break;
        case "projects":
            value = T.projectListView({title: templateParams.title});
            break;
        case "nav":
            value = T.navigationView({title: templateParams.title});
            break;
        case "overview":
            value = T.overview({
                title: templateParams.title,
                interval: promptOptions.period,
                tags: templateParams.tags.asString(),
            });
            break;
        case "jobPosts":
            value = T.jobPostView({
                title: templateParams.title,
                tags: templateParams.tags.asString(),
            });
            break;
        case "timestampUrl":
            value = T.timestampUrlBlock({url: promptOptions.url});
            break;
        case "ytdlp":
            value = T.ytdlpCmd({url: promptOptions.url});
            break;
        case "duration":
            value = yt.getDuration(promptOptions.querySelector);
            break;
        case "canonical":
            value = `<${yt.getCanonical(promptOptions.querySelector)}>`;
            break;
        case "description":
            value = yt.getDescription(promptOptions.querySelector);
            break;
        case "keywords":
            value = yt.getKeywords(promptOptions.querySelector);
            break;
        case "shortlinkUrl":
            value = `<${yt.getShorlinkUrl(promptOptions.querySelector)}>`;
            break;
        case "imageSrc":
            value = `<${yt.getImageSrc(promptOptions.querySelector)}>`;
            break;
        case "authorUrl":
            value = `<${yt.getAuthorUrl(promptOptions.querySelector)}>`;
            break;
        case "authorName":
            value = yt.getAuthorName(promptOptions.querySelector);
            break;
        case "thumbnailUrl":
            value = `<${yt.getThumbnailUrl(promptOptions.querySelector)}>`;
            break;
        case "channel":
            value = yt.getChannel(promptOptions.querySelector);
            break;
        case "genre":
            value = yt.getGenre(promptOptions.querySelector);
            break;
        case "ogSiteName":
            value = yt.getOgSiteName(promptOptions.querySelector);
            break;
        case "ogUrl":
            value = `<${yt.getOgUrl(promptOptions.querySelector)}>`;
            break;
        case "ogTitle":
            value = yt.getOgTitle(promptOptions.querySelector);
            break;
        case "ogImage":
            value = `<${yt.getOgImage(promptOptions.querySelector)}>`;
            break;
        case "ogDescription":
            value = yt.getOgDescription(promptOptions.querySelector);
            break;
        default:
            value = await promptForInputField(tp, field);
    }
    return value;
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
 * Prompts the user for input for any fields of type "input".
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field object
 * @param {string} defaultValue - Default placeholder value
 * @return {Object} Object with key/value pairs for input field values
*/
async function promptForInputField(tp, field, defaultValue) {
    const result = await tp.system.prompt(`${field.name}?`, defaultValue || "");
    return result;
}

/**
 * Gets user input values for a YAML field.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - The YAML field object
 * @param {string} defaultValue - Default placeholder value
 * @return {Object} Object with key/value pairs for field values
*/
async function promptForYamlField(tp, field, defaultValue) {
    const result = await tp.system.prompt(`${field.name}?`, defaultValue || "");
    return result;
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

module.exports = {
    getAllMetadataValues,
    getFileClassMetadata,
    getFileClasses,
    getInheritanceChain,
    getMetadataMenu,
    getOptionsFromValuesListNotePath,
    mergeFieldsWithInheritance,
    sortFieldsByOrder,
    getResultValuesForFields,
    getValuesForFields,
    getAllFileClassMetadata,
    getFileClassData,
    promptForFileClass,
};
