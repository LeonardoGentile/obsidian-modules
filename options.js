const StringSet = self.require("_modules/stringSet.js");
const constants = self.require("_modules/constants.js");
const periodic = self.require("_modules/periodic.js");
const { parseTemplateString } = self.require("_modules/template.js");
const { INCLUDE_TEMPLATE_DIR } = self.require("_modules/constants.js");
const OPTIONS_CONFIG = self.require("_modules/options_config.js").config;

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
     * @param {object} optionsConfig - (Optional) Object initializer
     */
    constructor(type, prefix, suffix, optionsConfig) {
        this.type = type;
        this.date_fmt = constants.DATE_FMT;
        this.title_sep = constants.TITLE_SEP;
        this.title_prefix = prefix != undefined ? prefix : moment().format(this.date_fmt);
        this.title_suffix = suffix != undefined ? suffix : this.type;
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
        /**
         * Suppress prompts for these fields
         * - Any default values are applied without confirmation
         * - Explicit value setting is through `default_values` or `getValueForField` at runtime
         * - Implicit value for values not set explicitly is null
         */
        this.ignore_fields;
        this._ignore_fields = new StringSet([
            "cssClasses", // empty
            "created", // automatically generated at creation time
            "modified", // automatically generated at creation time
            "bar", // only created if tasks are enabled
        ]);
        this.files_paths = [];
        this.default_values = []; // [{name: field_name, value: default_value}]
        this.include_default_templates = false;
        this.initialize(optionsConfig);
    }

    /**
     * Override and extends the default values from a configuration object initializer
     * @param {object|null} optionsConfig - object initializer
     */
    initialize(optionsConfig) {
        if (optionsConfig) {
            for (let prop in optionsConfig) {
                // using `in` includes properties from the prototype chain
                // so also getters and setters
                if (prop in this) {
                    this[prop] = optionsConfig[prop];
                }
            }
        }
        if (optionsConfig.include_default_templates) {
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
}

/** Adds properties for managing periodic notes. */
class PeriodicOptions extends BaseOptions {
    /**
     * The constructor initializes the prompt options for periodic notes.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} prefix - (Optional) Preformatted title prefix, the default is an empty string.
     * @param {string} suffix - (Optional) Preformatted title suffix, the default is today's date.
     * @param {object} optionsConfig - (Optional) Object initializer
    */
    constructor(type, prefix, suffix, optionsConfig) {
        prefix = prefix || "";
        suffix = suffix || periodic.getFormatSettings(type) || moment().format(constants.DATE_FMT);
        super(type, prefix, suffix, optionsConfig);
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
        this.type = type;
        this.title = title;
        this.period = -1;  // -1: no period, 0: 1 day, 7: 1 week, etc...
        this.linked = false;
        this._tags = new StringSet([]);
        this.initialize(config)
    }

    /**
     * Override and extends the default values from a configuration object initializer
     * @param {object|null} config - object initializer
     */
    initialize(config) {
        if (config) {
            for (let prop in config) {
                if (this.hasOwnProperty(prop)) {
                    this[prop] = config[prop];
                }
            }
        }
    }

    /**
     * Setter for the field tags to hide its implementation details.
     * By assigning a string or array to the field they will be added to the underlying StringSet
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
        const periods = {
            "daily": () => 0,
            "weekly": () => 7,
            "monthly": () => moment(title).daysInMonth(),
            "quarterly": () => 90,
            "yearly": () => moment(title).isLeapYear() ? 366 : 365,
        }
        this.period = periods.hasOwnProperty(type) ? periods[type]() : -1
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


function _handle_fields_add(mergedConfig, parentConfig, currentConfig) {
    Object.keys(currentConfig).forEach((key) => {
        const { fullName, fieldName, operation } = _parseFieldName(key)
        if(operation == 'add') {
            const parentField = parentConfig[fieldName] || [];
            const currentField = currentConfig[fullName];
            // push all items from this current object to the parent array
            parentField.push(...currentField);
            mergedConfig[fullName] = parentField;
        }
    });
}

function _handle_fields_replace(currentConfig) {
    Object.entries(currentConfig).forEach(([oldValue, newValue]) => {
        if(typeof key === 'string' && typeof value === 'string'){
            const { fullName, fieldName, operation } = _parseFieldName(oldValue)
            if(operation == 'replace') {
                currentConfig[fieldName].replace(oldValue, newValue);
            }
        }
    });
}


// Inject / Compute values
function _computeTemplates(currentConfig, type) {
    // Inject Variables into templates literals
    if (currentConfig.default_values) {
        currentConfig.default_values.forEach((item, idx) => {
            const defaultValue = item.value;
            // Transform the plain string into a tagged template
            if (defaultValue.includes('${')) {
                const taggedTemplate = parseTemplateString(defaultValue);
                item.value = taggedTemplate({
                    INCLUDE_TEMPLATE_DIR: INCLUDE_TEMPLATE_DIR,
                    type: type,
                    constants: constants // TODO: chat
                });
            }
        });
    }
}


function parseConfig(configOject, type) {
    // Base case: if the object doesn't exist or if the type
    // doesn't exist in the object, return an empty object
    if (!configOject || !configOject[type]) {
        return {};
    }
    const currentConfig = configOject[type];
    _computeTemplates(currentConfig, type)

    // If the currentConfig doesn't have an 'extends' field, return it directly
    if (!currentConfig.extends) {
        return currentConfig;
    }

    // Recursively call parseConfig with the parent type
    const parentConfig = parseConfig(configOject, currentConfig.extends);

    // Merge the configs using the spread/rest operator
    const mergedConfig = { ...parentConfig, ...currentConfig };
    _handle_fields_add(mergedConfig, parentConfig, currentConfig);

    // WARNING: mergedConfig won't have the correct views
    const mergedViews = {...(parentConfig.view || {}), ...(currentConfig.view || {}) };
    _handle_fields_add(mergedViews, parentView, currentView)
    mergedConfig.view = mergedViews;

    return mergedConfig;
}

/**
 * Configurable object factory
 * @param {string} type - string identifying the MDM class name
 * @return {object|null} An object containing the config options for the specific MDM class type
 */
function generateConfig(type) {
    const config = parseConfig(OPTIONS_CONFIG, type);
    _handle_fields_replace(config);
    if(config.view) {
        _handle_fields_replace(config.view);
    }

    delete config.extends;
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
    let OptionsClass;
    const _type = config._type || type;
    switch (_type) {
        case "periodic":
            OptionsClass = PeriodicOptions;
        case "chat":
            OptionsClass = ChatOptions;
        default:
            // TODO: remove notice
            new Notice(`Unsupported parameter for type: ${type}`);
            OptionsClass = BaseOptions;
        return new OptionsClass(type, "", "", config);
    }
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
            ViewClass = PeriodicOptions
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
