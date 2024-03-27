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
                if (this.hasOwnProperty(prop)) {
                    this[prop] = optionsConfig[prop];
                }
            }
        }
        if (optionsConfig.include_default_templates) {
            this.default_values.push({
                name: "includeFile",
                value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`
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
     * Setter for the field to hide its implementation details.
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
    constructor(type, title) {
        this.type = type;
        this.title = title;
        this.period = -1;  // -1: no period, 0: 1 day, 7: 1 week, etc...
        this.linked = false;
        this.tags = new StringSet([]);
    }
}

/** Sets default view options for project notes. */
class ProjectViewOptions extends BaseViewOptions {
    /** Initializes project view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add([
            "journal", "reference", "resource", "yt", "chat",
        ]);
    }
}

/** Sets default view options for journals. */
class JournalViewOptions extends BaseViewOptions {
    /** Initializes journal view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add(["reference", "resource", "chat", "yt"]);
    }
}

/** Sets default view options for periodic notes. */
class PeriodicViewOptions extends BaseViewOptions {
    /** Initializes periodic view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.period = 0; // every day
        this.tags.add([
            "reference", "resource", "chat", "yt", "goal", "project",
        ]);
    }
}

/** Sets default view options for daily notes. */
class DailyViewOptions extends PeriodicViewOptions {
    /** Initializes daily view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.tags.add("journal");
    }
}

/** Sets default view options for weekly notes. */
class WeeklyViewOptions extends BaseViewOptions {
    /** Initializes weekly view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.period = 7;
        this.tags.add("daily");
    }
}

/** Sets default view options for monthly notes. */
class MonthlyViewOptions extends BaseViewOptions {
    /** Initializes monthly view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.period = moment(title).daysInMonth();
        this.tags.add("weekly");
    }
}

/** Sets default view options for quarterly notes. */
class QuarterlyViewOptions extends BaseViewOptions {
    /** Initializes quarterly view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.period = 90;
        this.tags.add("monthly");
    }
}

/** Sets default view options for yearly notes. */
class YearlyViewOptions extends BaseViewOptions {
    /** Initializes yearly view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.period = moment(title).isLeapYear() ? 366 : 365;
        this.tags.add("quarterly");
    }
}

/** Sets default view options for company notes. */
class CompanyViewOptions extends BaseViewOptions {
    /** Initializes job post view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add(["job-post", "meeting", "reference", "resource"]);
    }
}

/** Sets default view options for Game company notes. */
class GameCompanyViewOptions extends CompanyViewOptions {
    /** Initializes job post view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.tags.replace("job-post", "games-job");
    }
}

/** Sets default view options for VFX company notes. */
class VFXCompanyViewOptions extends CompanyViewOptions {
    /** Initializes job post view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.tags.replace("job-post", "vfx-job");
    }
}

/** Sets default view options for job post notes. */
class JobPostViewOptions extends BaseViewOptions {
    /** Initializes job post view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add(["journal", "meeting", "reference", "resource"]);
    }
}


// Inject / Compute values
function computeConfigValues(config, type) {

    // Special Cases for periodic
    if (type == 'periodic') {
        config.prefix = "";
        config.suffix = periodic.getFormatSettings(type) || moment().format(constants.DATE_FMT);
        config.date_fmt = periodic.getFormatSettings(type) || this.date_fmt;
    }

    // Inject Variables into templates literals
    if (config.default_values) {
        config.default_values.forEach((defaultValueObj, idx) => {
            const defaultValue = defaultValueObj.value;
            if (defaultValue.includes('${')) {
                // Transform the plain string into a tagged template
                const taggedTemplate = parseTemplateString(defaultValue);
                defaultValueObj.value = taggedTemplate({
                    INCLUDE_TEMPLATE_DIR: INCLUDE_TEMPLATE_DIR,
                    type: type,
                    constants: constants
                });
            }
        });
    }
}

function parseConfig(optionsConfig, type) {
    // Base case: if the object doesn't exist or if the type
    // doesn't exist in the object, return an empty object
    if (!optionsConfig || !optionsConfig[type]) {
        return {};
    }
    const currentConfig = optionsConfig[type];
    computeConfigValues(currentConfig, type)

    // If the currentConfig doesn't have an 'extends' field, return it directly
    if (!currentConfig.extends) {
        return currentConfig;
    }

    // Recursively call parseConfig with the parent type
    const parentConfig = parseConfig(optionsConfig, currentConfig.extends);

    // Merge the configs using the spread/rest operator
    const mergedConfig = { ...parentConfig, ...currentConfig };
    return mergedConfig;
}

/**
 * Configurable object factory
 * @param {string} type - string identifying the MDM class name
 * @return {object|null} An object containing the config options for the specific MDM class type
 */
function generateOptionsConfig(type) {
    const config = parseConfig(OPTIONS_CONFIG, type);
    delete config.extends;
    return config
}

/**
 * Factory function that returns a an options instance based on the provided string.
 * @param {string} type - Determines which instance to return
 * @return {any} The options instance
 */
function promptOptionFactory(type) {
    const optionsConfig = generateOptionsConfig(type);
    if (optionsConfig)
        return new BaseOptions(type, "", "", optionsConfig);

    switch (type) {
        case "chat":
            return new ChatOptions(type);
        default:
            // TODO: remove notice
            new Notice(`Unsupported parameter for type: ${type}`);
            return new BaseOptions(type);
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
    switch (type) {
        case "journal":
            return new JournalViewOptions(type, title);
        case "daily":
            return new DailyViewOptions(type, title);
        case "weekly":
            return new WeeklyViewOptions(type, title);
        case "monthly":
            return new MonthlyViewOptions(type, title);
        case "quarterly":
            return new QuarterlyViewOptions(type, title);
        case "yearly":
            return new YearlyViewOptions(type, title);
        case "company":
            return new CompanyViewOptions(type, title);
        case "game-company":
            return new GameCompanyViewOptions(type, title);
        case "vfx-company":
            return new VFXCompanyViewOptions(type, title);
        case "job-post":
            return new JobPostViewOptions(type, title);
        case "games-job":
            return new JobPostViewOptions(type, title);
        case "vfx-job":
            return new JobPostViewOptions(type, title);
        case "project":
            return new ProjectViewOptions(type, title);
        default:
            return new BaseViewOptions(type, title);
    }
}

module.exports = {
    ProjectViewOptions,
    PeriodicViewOptions,
    JournalViewOptions,
    DailyViewOptions,
    WeeklyViewOptions,
    MonthlyViewOptions,
    QuarterlyViewOptions,
    YearlyViewOptions,
    CompanyViewOptions,
    GameCompanyViewOptions,
    VFXCompanyViewOptions,
    JobPostViewOptions,
    ChatOptions,
    promptOptionFactory,
    viewOptionFactory,
};
