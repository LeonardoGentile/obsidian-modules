const StringSet = self.require("_modules/utils/stringSet.js");
const periodic = self.require("_modules/utils/periodic.js");
const {PARSED_CONFIG} = self.require("_modules/config/parse_config.js");
const {PATHS, DATE_FMT, PROGRESS_VIEW} = self.require("_modules/config/settings.js");

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
        this._initDefaultOptions(type, prefix, suffix, PARSED_CONFIG._defaultConfig);
        this._setUserOptions(config);
    }

    // Initialize default properties
    _initDefaultOptions(type, prefix, suffix, defaultConfig) {
        this.type = type;
        this.date_fmt = "";
        this.title_sep = "";
        this.title_prefix = prefix != undefined ? prefix : moment().format(this.date_fmt); // usually a date
        this.title_suffix = suffix != undefined ? suffix : this.type; // usually the class type
        this.title_suffix_stringify = false; // if true, incase of auto computed titles -> all words will be chained with dashes
        // Prompt Options
        this.prompt_for_title = true; // If true, prompt for title before file creation
        this.prompt_for_prefix = false; // If true, prompt for title prefix before file creation
        this.prompt_for_suffix = false; // If true, prompt for title suffix before file creation
        this.prompt_for_alias = true;
        this.prompt_for_task = false;
        this.task_assume_yes = false; // If true, answer "yes" to prompts if asked
        this.prompt_for_attachment = false;
        this.prompt_for_project = false;
        this.prompt_for_goal = false;
        this.prompt_for_subfolder = false; // If true, prompt the name of subfolder

        this.progress_bar_view = PROGRESS_VIEW.page;
        // Array-like fields
        this.files_paths = [];
        this.include_default_templates = false; /** If true, push an object into default_values with
                                                 // * name `includeFile` and value `[[_templates/include/${type}]]` */
        this.default_values = []; // [{name: field_name, value: default_value}]
        /**
         * Suppress prompts for these fields
         * - Any default values are applied without confirmation
         * - Explicit value setting is through `default_values` or `getValueForField` at runtime
         * - Implicit value for values not set explicitly is null
         */
        this._ignore_fields = new StringSet([]);

        // View Class
        this._viewClass = null;
        this._setUserOptions(defaultConfig.prompt)
    }

    /**
     * Set options from the config object (if properties defined in class)
     * @param {object|null} config - object initializer
     */
    _setUserOptions(config) {
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
    async initComputedOptions(tp) {
        if (this.include_default_templates) {
            const includeTplPath = `${PATHS.template_include_dir}/${this.type}` + '.md';
            const fileExist = await tp.file.exists(includeTplPath);
            if (fileExist) {
                this.default_values.push({
                    name: "includeFile",
                    value: `[[${includeTplPath}]]`
                })
            }
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

    getViewOptions(title) {
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
        suffix = suffix || periodic.getFormatSettings(type) || moment().format(DATE_FMT);
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
    constructor(type, prefix, suffix, config) {
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
        const options = config.options;
        this.default_values = [
            { name: "temperature", value: options.temperature },
            { name: "top_p", value: options.top_p },
            { name: "presence_penalty", value: options.presence_penalty },
            { name: "frequency_penalty", value: options.frequency_penalty },
            { name: "stream", value: options.stream },
            { name: "n", value: options.n },
        ];
        this.system_prompts = options.system_prompts;
        this.prompt_templates = options.prompt_templates;
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
 * Factory function that returns a an options instance based on the provided string.
 * @param {string} type - Determines which instance to return
 * @return {any} The options instance
 */
async function promptOptionFactory(type, tp) {
    // const config = generateConfig(type);
    const config = PARSED_CONFIG[type];

    if (!config) {
        new Notice(`Invalid config type: ${type}`);
    }

    // config._extends identifies the topmost type in the inheritance
    // as at this point all children have been recursively merged from bottom to top
    const _type = config._extends || config._type
    let OptionsClass;
    let ViewClass;
    switch (_type) {
        case "periodic":
            OptionsClass = PeriodicOptions;
            ViewClass = PeriodicViewOptions;
            break;
        case "chat":
            OptionsClass = ChatOptions;
            ViewClass = {};
            break;
        default:
            new Notice(`Using generic options config for type '${type}', using Base Options`);
            OptionsClass = BaseOptions;
            ViewClass = BaseViewOptions;

    }
    const promptOptions = new OptionsClass(type, "", "", config.prompt || {});
    await promptOptions.initComputedOptions(tp)
    promptOptions.setViewClass(ViewClass);
    return promptOptions
}


module.exports = {
    ChatOptions,
    promptOptionFactory
};
