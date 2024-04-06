const constants = self.require("_modules/config/constants.js");

const { multiTagSuggester } = self.require("_modules/templater/suggester.js");
const T = self.require("_modules/templater/template.js");
const { promptYesOrNo, promptForInputField } = self.require("_modules/templater/prompt.js");

const metadata = self.require("_modules/metadata/metadata.js");
const { sortFieldsByOrder } = self.require("_modules/metadata/inheritance.js");
const { toMoment } = self.require("_modules/utils/periodic.js");
const yt = self.require("_modules/utils/youtube.js");

const { capitalizeWord, capitalizeWords, textToFilename } = self.require("_modules/utils/text.js");
const { filterFieldsByNameAndType, filterFieldsById } = self.require("_modules/utils/fields.js");
const options = self.require("_modules/options.js");

/**
 * Converts title text to alias. For periodic notes, dates are formatted so they
 * are in natural language and for all other notes, the title is converted to
 * a space separated string with the beginnings of words capitalized.
 *
 * @requires text
 * @requires moment
 * @param {Object} tp - Templater instance
 * @param {string} title - The title of the current note
 * @param {string} dateFmt - (Optional) Moment.js date format string
 * @param {string} type - Type of note, or name of file class
 * @return {string} The user input value for the aliases field
 */
function titleToAlias(tp, title, dateFmt, type) {
    dateFmt = dateFmt ?? "ddd Do MMM";
    let alias;
    try {
        const fileDate = tp.date.now(dateFmt, 0, title, "YYYY-MM-DD"); // TOFIX
        const titleWODate = title.split(fileDate + "-")[1];
        alias = titleWODate ?
            capitalizeWords(titleWODate.split("-")).join(" ") :
            fileDate + " " + capitalizeWord(type) + " Note";
    }
    catch (e) {
        alias = "";
    }
    return alias;
}

/**
 * Splits field objects into separate arrays by field type and formats each field
 * appropriately for its destination in the file.
 *
 * @param {Array<Object>} fields - Array of field objects with name and values properties
 * @return {Object} Object with arrays for each section to format
 */
function splitAndFormatFields(fields) {
    return fields.reduce((map, field) => {
        if (constants.FRONTMATTER_FIELD_NAMES.includes(field.name))
            map.frontmatter.push(asFrontmatterProp(field));
        if (constants.INLINE_DV_FIELD_NAMES.includes(field.name))
            map.inlineDV.push(asDataviewProp(field));
        if (constants.INLINE_JS_FIELD_NAMES.includes(field.name))
            map.inlineJS.push(asDataviewProp(field, "js"));
        if (constants.HEAD_DQL_FIELD_NAMES.includes(field.name)) {
            if (field.values != undefined)
                map.inlineDQL.push(asDataviewProp(field, "dql"));
        }
        if (constants.LOWER_DQL_FIELD_NAMES.includes(field.name)) {
            if (field.values != undefined)
                map.lowerInlineDQL.push(asDataviewProp(field, "dql"));
        }
        if (constants.BODY_FIELD_NAMES.includes(field.name))
            map.body.push(field.values || "");
        if (constants.EXTRA_FIELD_NAMES.includes(field.name))
            map[field.name] = field.values;
        return map;
    }, {
        // Head
        frontmatter: [],
        inlineDV: [],
        inlineJS: [],
        inlineDQL: [],
        // Body
        body: [],
        // Foot
        lowerInlineDQL: [],
    });
}

/**
 * Formats a field object into a frontmatter string for inserting into a file.
 *
 * @param {Object} field - An object containing "name" and "values" keys to format
 * @return {string} The field name and value formatted as a frontmatter string
 */
function asFrontmatterProp(field) {
    let values;
    // obsidian links
    if (field.values != undefined && !Array.isArray(field.values) && typeof field.values === "object")
        values = `"${field.values}"`;
    return `${field.name}: ${values || field.values || ""}`;
}

/**
 * Formats a field object into a dataview property for inserting into a file.
 *
 * @param {Object} field - An object containing "name" and "values" keys to format
 * @param {string} fmt - If "js", format values as inline Dataview JS. If "dql", format as DQL.
 * @return {string} The field name and value formatted as a dataview property
 */
function asDataviewProp(field, fmt) {
    let formatResult;
    switch (fmt) {
        case "js":
            formatResult = `${field.name}:: ${asInlineJS(field) || ""}`;
            break;
        case "dql":
            formatResult = `${asInlineDQL(field) || ""}`;
            break;
        default:
            let values;
            if (typeof field.values === "string" && field.values.startsWith("http"))
                values = `<${field.values}>`;
            formatResult = `${field.name}:: ${values || field.values || ""}`;
    }
    return formatResult;
}

/**
 * Formats a field object into a DQL for inserting into a file.
 *
 * Examples:
 *
 *   > asInlineDQL({name: "foo"})
 *   < '`=this.foo`'
 *
 *   > asInlineDQL({name: "foo"}, "dql:")
 *   < '`dql:this.foo`'
 * @param {Object} field - An object containing "name" key to format
 * @param {string} prefix - The configurable DQL prefix, `=` by default
 * @return {string} The field name formatted as a DQL
 */
function asInlineDQL(field, prefix) {
    const dqlPrefix = prefix ?? "=";
    const t = T.template`\`${"prefix"}this.${"name"}\``;
    return t({ prefix: dqlPrefix, name: field.name });
}

/**
 * Formats a field object into inline Dataview JS for inserting into a file.
 *
 * @param {Object} field - An object containing "name" and "values" keys to format
 * @param {string} prefix - The configurable inline JS prefix, `$=` by default
 * @return {string} The field formatted as inline JavaScript
 */
function asInlineJS(field, prefix) {
    prefix = prefix || "$=";
    // If no field values, return null
    const values = field.values ? `${prefix} ${field.values}` : null;
    const t = T.template`\`${"values"}\``;
    return values ? t({ values: values }) : null;
}

/**
 * Retrieves all the folder paths from a given vault.
 * Yoinked from https://github.com/chhoumann/quickadd/blob/master/src/engine/TemplateEngine.ts
 * @param {object} tp - The templater tp object.
 * @return {Array<string>} - An array of strings representing the folder paths.
*/
function getAllFolderPathsInVault(tp) {
    return app.vault
        .getAllLoadedFiles()
        .filter(f => f instanceof tp.obsidian.TFolder)
        .filter(f => !f.path.startsWith("_"))
        .filter(f => !f.path.startsWith("node_modules"))
        .map(folder => folder.path);
}

/**
* Checks if a folder exists in the vault and creates it if not.
* Yoinked from https://github.com/chhoumann/quickadd/blob/master/src/engine/TemplateEngine.ts
* @param {string} folder - The path of the folder to create.
*/
async function createFolderIfNotExists(folder) {
    const folderExists = await app.vault.adapter.exists(folder);

    if (!folderExists)
        // await app.vault.adapter.mkdir(folder)
        await app.vault.createFolder(folder);
}

/**
 * Prompts the user for subfolder input
 *
 * @param {Object} tp - Templater instance
 * @param {string} folder_path - The path of the containing folder
 * @param {string} title - New name for file
 * @return {str} string representing the folder path chained with subfolder path (if any)
 */
async function promptSubfolder(tp, folder_path, prompt_for_subfolder, title) {
    let subfolder = "";
    if (prompt_for_subfolder) {
        subfolder = await promptForInputField(tp, { name: "subfolder" }, title);
    }
    folder_path += subfolder ? `/${subfolder}` : "";
    return folder_path;
}

/**
 * Gets or creates a folder based on the given folders array.
 * Yoinked from https://github.com/chhoumann/quickadd/blob/master/src/engine/TemplateEngine.ts
 * @param {object} tp - The templater tp object.
 * @param {Array<string>} folders - An array of strings representing the folders.
 * @throws Will throw an error if no folder is selected from suggester.
 * @return {Promise<string>} A promise that resolves to the path of the selected or created folder.
 */
async function getOrCreateFolder(tp, folders, promptForSubfolder, title) {
    let folderPath;
    if (folders.length > 1) {
        folderPath = await tp.system.suggester(folders, folders, false, "Select (or create) folder");
        if (!folderPath) throw new Error("No folder selected.");
    } else {
        folderPath = folders[0];
    }
    folderPath = await promptSubfolder(tp, folderPath, promptForSubfolder, title);
    await createFolderIfNotExists(folderPath);
    return folderPath;
}

/**
 * Prompts the user for input for any fields of type "input".
 *
 * If the field is a "title", it will generate a default value using the
 * current date and file title. It will also rename the file if the value
 * changed.
 *
 * Example:
 *
 *   const title = await promptAndRename(tp, tp.file.title);
 *
 * @param {Object} tp - Templater instance
 * @param {string} title - New name for file
 * @param {string} prefix - Prefix to insert before filename
 * @return {Object} Object with key/value pairs for input field values
 */
async function promptAndRename(tp, title, prefix) {
    const value = await tp.system.prompt(
        "title?",
        prefix ? prefix + title : title,
        false,
        false,
    );
    if (value && title !== value)
        await tp.file.rename(value);
    return value;
}

/**
 * Moves and renames the current file based on user input.
 *
 * Prompts the user for a new title, prefilling it with the current date and title.
 * If the new title starts with "Untitled", it will prompt the user to select or create
 * a folder and move the file there.
 *
 * @param {Object} tp - Templater instance
 * @param {Array} folders - Folder options to prompt the user with
 * @param {string} suffix - Suggested title suffix for note
 * @param {string} prefix - Suggested title prefix for note
 */
async function promptMoveAndRename(tp, folders, promptOptions) {
    let title;
    let origTitle = "";
    const promptForSubfolder = promptOptions.prompt_for_subfolder;
    const prefix = promptOptions.title_prefix;
    const suffix = promptOptions.title_prefix ?
        promptOptions.title_sep + promptOptions.title_suffix :
        promptOptions.title_suffix;

    if (!promptOptions.prompt_for_title) {
        title = promptOptions.title;
        await tp.file.rename(title);
    }
    else {
        origTitle = tp.file.title;
        title = await promptAndRename(
            tp,
            suffix,
            prefix,
        );

    }
    let folder = tp.file.folder(true);
    if (promptOptions.prompt_for_title || origTitle.startsWith("Untitled")) {
        const folderOptions = folders ?? getAllFolderPathsInVault(tp);
        const folderPath = await getOrCreateFolder(tp, folderOptions, promptForSubfolder, title);
        if (folderPath !== folder) {
            await tp.file.move(folderPath + "/" + title);
        }
    }
    return title;
}

/**
 * Prompts the user for default values and initializes variables.
 * @param {object} tp Templater API.
 * @return {object} An object of key value pairs.
*/
async function newNoteData(tp) {
    // These fields are handled automatically and formatted directly in template
    const handledValueMap = new Map([]);
    // Suppress prompts for MM fields are handled automatically using this array
    const handledFields = [];

    // Get file class data for all file classes.
    const [type, fileClass] = await metadata.promptForFileClass(tp);

    // Options in addition to those provided by MM file classes
    const promptOptions = options.promptOptionFactory(type);

    // Should prompt for title prefix?
    const prefix = promptOptions.prompt_for_prefix ?
        await tp.system.prompt(`Prefix?`, moment().format(promptOptions.date_fmt)) :
        false;

    // Should prompt for title prefix?
    const suffix = promptOptions.prompt_for_suffix ?
        await tp.system.prompt(
            `Suffix?`,
            promptOptions.title_suffix ?
                moment().format(promptOptions.title_suffix) :
                moment().format(promptOptions.date_fmt)
        ) :
        false;

    if (prefix) {
        const prefixFields = filterFieldsByNameAndType(fileClass.fields, ["prefix"], "input");
        promptOptions.title_prefix = prefix;
        handledValueMap.set("prefix", prefix);
        handledFields.push(...prefixFields);
    }
    if (suffix) {
        const suffixFields = filterFieldsByNameAndType(fileClass.fields, ["suffix"], "input");
        promptOptions.title_suffix = suffix;
        handledValueMap.set("suffix", suffix);
        handledFields.push(...suffixFields);
    }

    let url;
    const urlFields = filterFieldsByNameAndType(fileClass.fields, ["url"], "input");
    for (const field of urlFields) {
        url = await tp.system.prompt(`${field.name}?`, await tp.system.clipboard());
        handledValueMap.set("url", url);
        handledFields.push(field);
    }

    const folders = promptOptions.files_paths.length ?
        promptOptions.files_paths :
        fileClass.filesPaths;

    // Special case for youtube urls
    if (url && ["yt-video"].includes(type)) {
        promptOptions.url = url;
        promptOptions.querySelector = await yt.fetchUrl(url);
        const titleContent = yt.getTitle(promptOptions.querySelector);
        // promptOptions.title_prefix = moment().format(promptOptions.date_fmt) + "-";
        promptOptions.title_suffix = textToFilename(titleContent, promptOptions.title_suffix_stringify);
    }

    const title = await promptMoveAndRename(tp, folders, promptOptions);

    // Options for view templates, e.g. overview and job-posts
    const viewTemplateOptions = promptOptions.getViewOptions(title)

    // Map field name with values for merging back into a master list
    const inputFields = filterFieldsByNameAndType(fileClass.fields, ["title"], "input");
    handledValueMap.set("title", title);
    handledFields.push(...inputFields);

    // Task progress enabled?
    const tasks = promptOptions.prompt_for_task ?
        await promptYesOrNo(tp, "Tasks?", promptOptions.task_assume_yes) :
        false;

    const taskProgress = tasks ?
        T.progressBarView({ progressView: promptOptions.progress_bar_view, title: title }) : null;
    if (taskProgress) {
        const progressBarFields = filterFieldsByNameAndType(fileClass.fields, ["bar"], "input");
        handledValueMap.set("bar", taskProgress);
        handledFields.push(...progressBarFields);
    }

    // Prompt for aliases
    let alias;
    if (!promptOptions.prompt_for_alias)
        alias = toMoment(title).format(promptOptions.date_fmt) + ` ${capitalizeWord(type)} Note`;
    const aliasFields = filterFieldsByNameAndType(fileClass.fields, ["alias"], "input");
    const aliasesFields = filterFieldsByNameAndType(fileClass.fields, ["aliases"], "yaml");
    for (const field of [...aliasFields, ...aliasesFields]) {
        if (!alias)
            alias = await tp.system.prompt(`alias?`, titleToAlias(tp, title, promptOptions.date_fmt, type));
        if (field.name === "aliases") {
            const aliases = alias ? alias.length ? `\n  - ${alias}` : "" : null;
            handledValueMap.set(field.name, aliases);
        } else {
            handledValueMap.set(field.name, alias);
        }
        handledFields.push(field);
    }

    // Alias is used as the first H1 and title in metadata
    if (alias)
        handledValueMap.set("title", alias);

    // Prompt for tags
    let tags = [];
    const multiFields = filterFieldsByNameAndType(fileClass.fields, ["tags"], "multi");
    if (promptOptions.ignore_fields.has("tags")) {
        tags = fileClass.tagNames;
    } else {
        const selectedTags = await multiTagSuggester(tp, fileClass.tagNames);
        const fileClassTagNames = fileClass.tagNames ?? [];
        tags = Array.from(new Set([...selectedTags, ...fileClassTagNames]));
    }
    handledValueMap.set("tags", tags);
    handledFields.push(...multiFields);

    // Get result values for handled fields
    const handledResultFields = metadata.getResultValuesForFields(handledFields, handledValueMap);
    // Remove fields that have been handled
    const unhandedFields = filterFieldsById(fileClass.fields, handledFields);
    // Prompt for values for fields not handled automatically
    const inputResultFields = await metadata.getValuesForFields(
        tp, unhandedFields, viewTemplateOptions, promptOptions,
    );

    // Combine and sort all result fields for formatting
    const sortedResultFields = sortFieldsByOrder(
        [...inputResultFields, ...handledResultFields], fileClass.fieldsOrder);

    // Prepend note type
    sortedResultFields.unshift({ name: "type", id: null, type: null, values: type });

    // Remove nav bar when series is false
    const navField = sortedResultFields.find(obj => obj.name === "nav")?.values;
    const seriesField = sortedResultFields.find(obj => obj.name === "series")?.values;
    const navIndex = sortedResultFields.findIndex(obj => obj.name === "nav");
    if (navField && seriesField != undefined && seriesField === false)
        sortedResultFields[navIndex].values = null;

    // File includes
    const promptTemplate = sortedResultFields.find(obj => obj.name === "template")?.values;
    if (promptTemplate)
        sortedResultFields.push({ name: "includeFile", id: null, type: null, values: `[[${promptTemplate.path.replace(".md", "")}]]` });
    const includeFile = promptOptions.getValueForField("includeFile");
    if (includeFile)
        sortedResultFields.push({ name: "includeFile", id: null, type: null, values: `${includeFile}` });
    const dayPlanner = promptOptions.getValueForField("day_planner");
    if (tasks && dayPlanner)
        sortedResultFields.push({ name: "dayPlanner", id: null, type: null, values: `${dayPlanner}` });

    if (tasks)
        sortedResultFields.push({ name: "actions", id: null, type: null, values: "## 📥 Action Items\n\n - [ ] " });

    const fields = splitAndFormatFields(sortedResultFields);

    return fields;
}


module.exports = {
    newNoteData,
    asFrontmatterProp,
    asDataviewProp,
    asInlineDQL,
    asInlineJS,
};
