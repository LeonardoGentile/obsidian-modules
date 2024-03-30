const constants = self.require("_modules/config/constants.js");
const { INCLUDE_TEMPLATE_DIR } = self.require("_modules/config/constants.js");
const OPTIONS_CONFIG = self.require("_modules/config/options_config.js").config;

const StringSet = self.require("_modules/utils/stringSet.js");
const periodic = self.require("_modules/utils/periodic.js");
const { parseTemplateString } = self.require("_modules/templater/template.js");


/**
 * Defines properties for Dataview progress bars.
 * This can be used by Dataview to display custom progress bar views.
 */
const progressView = {
    total: "total-progress-bar",
    page: "page-progress-bar",
};

/**
 * Defines common options for all note types.
 * It has properties to control prompting for tasks, attachments, and projects when creating a note.
*/
class BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} prefix - (Optional) Preformatted title prefix, the default is today's date.
     * @param {string} suffix - (Optional) Preformatted title suffix, the default is the note type as string.
     * @param {object} config - (Optional) Object initializer
     */
    constructor(type, prefix, suffix, config) {
        // Initialize default properties
        this._initDefaultOptions(type, prefix, suffix);
        this._initSetOptions(config);
        this._initComputedOptions()
    }

    // Initialize default properties
    _initDefaultOptions(type, prefix, suffix) {
        this.type = type;
        this.date_fmt = constants.DATE_FMT;
        this.title_sep = constants.TITLE_SEP;
        this.title_prefix = prefix != undefined ? prefix : moment().format(this.date_fmt);
        this.title_suffix = suffix != undefined ? suffix : this.type;
        this.title_suffix_stringify = false;
        // Prompt Options
        this.prompt_for_title = true; // If true, prompt for title before file creation
        this.prompt_for_suffix = false; // If true, prompt for title suffix before file creation
        this.prompt_for_prefix = false; // If true, prompt for title prefix before file creation
        this.prompt_for_alias = true;
        this.prompt_for_task = false;
        this.task_assume_yes = false; // If true, answer "yes" to prompts if asked
        this.prompt_for_attachment = false;
        this.prompt_for_project = false;
        this.prompt_for_goal = false;

        this.progress_bar_view = progressView.page;
        // Array-like fields
        this.files_paths = [];
        this.include_default_templates = false; // TODO
        this.default_values = []; // [{name: field_name, value: default_value}]
        /**
         * Suppress prompts for these fields
         * - Any default values are applied without confirmation
         * - Explicit value setting is through `default_values` or `getValueForField` at runtime
         * - Implicit value for values not set explicitly is null
         */
        this._ignore_fields = new StringSet([
            "cssClasses", // empty
            "created", // automatically generated at creation time
            "modified", // automatically generated at creation time
            "bar", // only created if tasks are enabled
        ]);
        // View Class
        this._viewClass = null;
    }

    /**
     * Set options from the config object (if properties defined in class)
     * @param {object|null} config - object initializer
     */
    _initSetOptions(config) {
        if (config) {
            for (let prop in config) {
                // using `in` includes properties from the prototype chain
                // so also getters and setters
                if (prop in this) {
                    this[prop] = config[prop];
                }
            }
        }
        this._viewConfig = config.view || {}
    }
    /**
     * Initializes computed values
     * If include_default_templates is true, it adds a default value for including a template file.
     * The template file path is constructed based on the type of the options object.
     */
    _initComputedOptions() {
        if (this.include_default_templates) {
            this.default_values.push({
                name: "includeFile",
                value: `[[${INCLUDE_TEMPLATE_DIR}/${this.type}]]`
            })
        }
    }

    /**
     * Generates the title string by concatenating the title prefix, title separator (if needed),
     * and title suffix.
     */
    get title() {
        return (
            this.title_prefix +
            (this.title_prefix ? this.title_sep + this.title_suffix : this.title_suffix)
        );
    }

    /**
     * Setter for the ignore_fields to hide its implementation details.
     * By assigning a string or array to the field they will be added to the underlying StringSet
     * @param {string|Array} val - A single or multiple fields to ignore
     */
    set ignore_fields(val) {
        this._ignore_fields.add(val);
    }

    /**
     * Get the underlying values stored in the StringSet
     */
    get ignore_fields() {
        return this._ignore_fields;
    }

    /**
     * Returns the value for the given field by looking it up in the default_values array.
     *
     * @param {string} field - The name of the field to get the value for.
     * @param {any} defaultValue - (Optional) A way of providing a default at the time of calling
     * @return {*} The value for the given field if found, null otherwise.
     */
    getValueForField(field, defaultValue) {
        return (
            this.default_values.find((obj) => obj.name === field)?.value ||
            defaultValue ||
            null
        );
    }

    setViewClass(classRef) {
        this._viewClass = classRef
    }

    getViewOptions(title){
        return new this._viewClass(this.type, title, this._viewConfig)
    }
}

/** Adds properties for managing periodic notes. */
class PeriodicOptions extends BaseOptions {
    /**
     * The constructor initializes the prompt options for periodic notes.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} prefix - (Optional) Preformatted title prefix, the default is an empty string.
     * @param {string} suffix - (Optional) Preformatted title suffix, the default is today's date.
     * @param {object} config - (Optional) Object initializer
    */
    constructor(type, prefix, suffix, config) {
        prefix = prefix || "";
        suffix = suffix || periodic.getFormatSettings(type) || moment().format(constants.DATE_FMT);
        super(type, prefix, suffix, config);
        this.date_fmt = periodic.getFormatSettings(type) || this.date_fmt;
    }
}

/**
 * Sets default options for chat notes.
*/
class ChatOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.files_paths = []; // bound to path in metadata-menu
        this.ignore_fields = [
            "stop", // null default value
            "top_p",
            "presence_penalty",
            "frequency_penalty",
            "stream",
            "n",
        ];
        this.default_values = [
            { name: "temperature", value: constants.temperature },
            { name: "top_p", value: constants.top_p },
            { name: "presence_penalty", value: constants.presence_penalty },
            { name: "frequency_penalty", value: constants.frequency_penalty },
            { name: "stream", value: constants.stream },
            { name: "n", value: constants.n },
        ];
        this.system_prompts = constants.system_prompts;
        this.prompt_templates = constants.prompt_templates;
    }
}

/** Sets default view options for all notes. */
class BaseViewOptions {
    /** Initializes base view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title, config) {
        this._initDefaultOptions(type, title);
        this._initSetOptions(config);
    }

    // Initialize default properties
    _initDefaultOptions(type, title) {
        this.type = type;
        this.title = title;
        this.period = -1;  // -1: no period, 0: 1 day, 7: 1 week, etc...
        this.linked = false;
        this._tags = new StringSet([]);
    }

    /**
     * Override and extends the default values from a configuration object initializer
     * @param {object|null} config - object initializer
     */
    _initSetOptions(config) {
        if (config) {
            for (let prop in config) {
                // using `in` includes properties from the prototype chain
                // so also getters and setters
                if (prop in this) {
                    this[prop] = config[prop];
                }
            }
        }
    }

    /**
     * By setting a string or array to the field they will be added to the underlying StringSet
     * @param {string|Array} val - A single or multiple fields to ignore
     */
    set tags(val) {
        this._tags.add(val);
    }

    /**
     * Get the underlying values stored in the StringSet
     */
    get tags() {
        return this._tags;
    }
}


/** Sets default view options for periodic notes. */
class PeriodicViewOptions extends BaseViewOptions {
    /** Initializes periodic view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title, config) {
        super(type, title, config);
        this._setPeriod()
    }

    _setPeriod() {
        const periods = {
            "daily": () => 0,
            "weekly": () => 7,
            "monthly": () => moment(this.title).daysInMonth(),
            "quarterly": () => 90,
            "yearly": () => moment(this.title).isLeapYear() ? 366 : 365,
        }
        this.period = periods.hasOwnProperty(this.type) ? periods[this.type]() : -1
    }
}


/**
 * Parses a key to extract the field name and operation.
 * @param {string} key - The key to parse.
 * @returns {Object} An object containing the full name, field name, and operation if the key matches the expected pattern,
 *                   or an object with field name and operation set to null if the key does not match the pattern.
 */
function _parseFieldName(key) {
    // Regular expression to match keys with the pattern _field_name_add
    const regex = /^_([^_]+)_(add|replace|delete)$/;

    // Check if the key matches the expected pattern
    const match = regex.exec(key);
    if (match) {
        // Extract the field name and operation
        const [, fieldName, operation] = match;
        return { fullName: key, fieldName, operation };
    } else {
        // Key doesn't match the expected pattern, return an object with null values
        return { fullName: key, fieldName: null, operation: null };
    }
}

/**
 * Handles the addition of fields from the current configuration object to the merged configuration object.
 * @param {Object} mergedConfig - The merged configuration object.
 * @param {Object} parentConfig - The parent configuration object.
 * @param {Object} currentConfig - The current configuration object.
 */
function _handleFields_add(mergedConfig, parentConfig, currentConfig) {
    Object.keys(currentConfig).forEach((key) => {
        const { fullName, fieldName, operation } = _parseFieldName(key);
        if (operation === 'add') {
            const parentField = parentConfig[fieldName] || [];
            const currentField = currentConfig[fullName];
            // Push all items from the current object to the parent array
            parentField.push(...currentField);
        }
    });
}

/**
 * Handles the replacement of fields within the provided configuration object.
 * @param {Object} configObj - The configuration object to process.
 */
function _handleFields_replace(configObj) {
    Object.entries(configObj).forEach(([key, value]) => {
        if (typeof key === 'string' && typeof value === 'string') {
            const { fullName, fieldName, operation } = _parseFieldName(key);
            if (operation === 'replace') {
                configObj[fieldName].replace(fullName, value);
            }
        }
    });
    if (configObj.view) {
        _handleFields_replace(configObj.view);
    }
}

/**
 * Injects and compiles values into template literals within the provided configuration object.
 * @param {Object} currentConfig - The current configuration object to process.
 * @param {string} type - The type of configuration being processed.
 */
function _compileTemplates(currentConfig, type) {
    // Inject Variables into template literals
    if (currentConfig.default_values) {
        currentConfig.default_values.forEach(defaultObjItem => {
            const { value } = defaultObjItem;
            if (typeof value === 'string' && value.includes('${')) {
                // Transform the plain string into a tagged template
                const compiledTemplate = parseTemplateString(value)({ INCLUDE_TEMPLATE_DIR, type, constants });
                // Replace the object property with the compiled string
                defaultObjItem.value = compiledTemplate;
            }
        });
    }
}

/**
 * Merges two configuration objects, prioritizing the fields from the
 * current configuration over the parent configuration.
 * This can be used for both prompt and view options.
 * @param {Object} parentConfig - The parent configuration object.
 * @param {Object} currentConfig - The current configuration object.
 * @returns {Object} The merged configuration object.
 */
function _mergeObjects(parentConfig, currentConfig) {
    if(!parentConfig) parentConfig = {};
    if(!currentConfig) currentConfig = {};
    // Merge the configs using the spread/rest operator
    const mergedConfig = { ...parentConfig, ...currentConfig };
    _handleFields_add(mergedConfig, parentConfig, currentConfig);
    return mergedConfig
}

/**
 * Parses the configuration object for a specific type, handling inheritance
 * and merging of configurations using recursion
 * @param {Object} allConfig - The object containing all configurations for different types.
 * @param {string} type - The type of configuration to parse.
 * @returns {Object} The parsed configuration object for the specified type.
 */
function parseConfig(allConfig, type) {
    // Base case: if the object doesn't exist or if the type
    // doesn't exist in the object, return an empty object
    let currentConfig;
    if (!allConfig || !allConfig[type]) {
        currentConfig = {}
    }
    currentConfig = allConfig[type];
    _compileTemplates(currentConfig, type)

    // If the currentConfig doesn't have an '_extends' field, return it directly
    if (!currentConfig._extends) {
        return currentConfig;
    }

    // Recursively call parseConfig with the parent type
    const parentConfig = parseConfig(allConfig, currentConfig._extends);

    // Merge the configs using the spread/rest operator
    const mergedConfig = _mergeObjects(parentConfig, currentConfig);
    // Update the _extends property to point to the top-most object
    mergedConfig._extends = parentConfig._extends || currentConfig._extends;
    // WARNING: mergedConfig won't have the correct views
    const mergedViews = _mergeObjects(parentConfig.view, currentConfig.view);
    mergedConfig.view = mergedViews;
    return mergedConfig;
}

/**
 * Configurable object factory
 * @param {string} type - string identifying the MDM class name
 * @return {object|null} An object containing the config options
 *                       for the specified (MDM class) type
 */
function generateConfig(type) {
    const config = parseConfig(OPTIONS_CONFIG, type);
    config._type = type;
    _handleFields_replace(config);

    // TODO remove special fields
    // delete config.view._tags_replace;
    // delete config.view._tags_add;
    return config
}

/**
 * Factory function that returns a an options instance based on the provided string.
 * @param {string} type - Determines which instance to return
 * @return {any} The options instance
 */
function promptOptionFactory(type) {
    const config = generateConfig(type);
    if (!config) {
        new Notice(`Invalid config type: ${type}`);
    }

    console.log(JSON.stringify(config, null, 2));

    // config._extends identifies the topmost type in the inheritance
    // as at this point all children have been recursively merged from bottom to top
    const _type = config._extends || config._type
    let OptionsClass = BaseOptions
    let ViewClass = BaseViewOptions;
    switch (_type) {
        case "periodic":
            OptionsClass = PeriodicOptions;
            ViewClass = PeriodicViewOptions;
            break;
        case "chat":
            OptionsClass = ChatOptions;
            break;
        default:
            // TODO: remove notice
            new Notice(`Unsupported parameter for type: ${type}`);
            // OptionsClass = BaseOptions;

    }
    // config.viewClass = ViewClass;
    const promptOptions = new OptionsClass(type, "", "", config);
    promptOptions.setViewClass(ViewClass);
    return promptOptions
}

/**
 * Factory function that returns a an options instance based on the provided string.
 *
 * @param {string} type - Determines which instance to return
 * @param {string} title - Note title
 * @return {any} The options instance
 */
function viewOptionFactory(type, title) {
    const config = generateConfig(type);
    const viewConfig = config.view || {};

    let ViewClass;
    switch (config._type) {
        case "periodic":
            ViewClass = PeriodicViewOptions

        default:
            ViewClass = BaseViewOptions

            return new ViewClass(type, title, config);
    }
}

module.exports = {
    ChatOptions,
    promptOptionFactory,
    viewOptionFactory,
};
