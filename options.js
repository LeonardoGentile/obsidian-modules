const StringSet = self.require("_modules/stringSet.js");
const constants = self.require("_modules/constants.js");
const periodic = self.require("_modules/periodic.js");
const {INCLUDE_TEMPLATE_DIR} = self.require("_modules/constants.js");

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
     */
    constructor(type, prefix, suffix) {
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
         * - Implicit value for values not set explicitely is null
         */
        this.ignore_fields = new StringSet([
            "cssClasses", // empty
            "created", // automatically generated at creation time
            "modified", // automatically generated at creation time
            "bar", // only created if tasks are enabled
        ]);
        this.files_paths = [];
        this.default_values = []; // [{name: field_name, value: default_value}]
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
 * Sets default options for resource notes.
*/
class ResourceOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} prefix - (Optional) Preformatted title prefix
     * @param {string} suffix - (Optional) Preformatted title suffix
    */
    constructor(type, prefix, suffix) {
        super(type, prefix, suffix);
        this.files_paths = ["library"];
        this.ignore_fields.add("status");
        this.default_values = [
            {name: "includeFile", value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`},
        ];
    }
}

/**
 * Sets default options for documents.
*/
class DocumentOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.files_paths = []; // bound to path in metadata-menu
        this.ignore_fields.add("tags");
    }
}

/**
 * Adds properties for managing meeting notes.
*/
class MeetingOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.prompt_for_task = true;
        this.task_assume_yes = false;
        this.default_values = [
            {name: "includeFile", value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`},
        ];
    }
}

/**
 * Sets default options for goal notes.
 * It enables prompting for tasks and attachments when creating a new goal note. It also
 * sets the progress bar view to show total progress for goals.
 */
class GoalOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.prompt_for_task = true;
        this.task_assume_yes = true;
        this.prompt_for_attachment = true;
        this.progress_bar_view = progressView.total;
        this.ignore_fields.add("tags");
        this.default_values = [
            {name: "includeFile", value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`},
        ];
    }
}

/**
 * Sets default options for project notes.
 * It enables prompting for tasks when creating a new project note.
 * It also sets the progress bar view to show total progress for projects.
*/
class ProjectOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.prompt_for_task = true;
        this.task_assume_yes = true;
        this.progress_bar_view = progressView.total;
        this.ignore_fields.add("tags");
        this.default_values = [
            {name: "includeFile", value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`},
        ];
    }
}

/**
 * Adds properties for managing job post notes.
*/
class JobPostOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.prompt_for_task = true;
        this.ignore_fields.addMultiple(["directLink", "recruiterLink"]);
        this.files_paths = ["library"];
    }
}

/**
 * Adds properties for managing company notes.
*/
class CompanyOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.ignore_fields.addMultiple(["location", "link"]);
        this.files_paths = ["library"];
    }
}

/**
 * Adds properties for managing video notes.
*/
class VideoOptions extends BaseOptions {
    /**
     * Sets the default prompt options
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.files_paths = []; // bound to path in metadata-menu
        this.selector = null;
        this.url = null;
    }
}

/**
 * Adds properties for managing video notes.
*/
class YouTubeVideoOptions extends VideoOptions {}

/** Adds properties for managing periodic notes. */
class JournalOptions extends BaseOptions {
    /**
     * The constructor initializes the prompt options for periodic notes.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} prefix - (Optional) Preformatted title prefix, the default is an empty string.
     * @param {string} suffix - (Optional) Preformatted title suffix, the default is today's date.
    */
    constructor(type, prefix, suffix) {
        super(type, prefix, suffix);
        this.period = 0;
        this.files_paths = []; // bound to path in metadata-menu
        this.ignore_fields.add("tags");
        this.default_values = [
            {name: "includeFile", value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`},
        ];
    }
}

/** Adds properties for managing periodic notes. */
class PeriodicOptions extends BaseOptions {
    /**
     * The constructor initializes the prompt options for periodic notes.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} prefix - (Optional) Preformatted title prefix, the default is an empty string.
     * @param {string} suffix - (Optional) Preformatted title suffix, the default is today's date.
    */
    constructor(type, prefix, suffix) {
        prefix = prefix || "";
        suffix = suffix || periodic.getFormatSettings(type) || moment().format(constants.DATE_FMT);
        super(type, prefix, suffix);
        this.prompt_for_title = false;
        this.prompt_for_suffix = true;
        this.prompt_for_task = true;
        this.prompt_for_alias = false;
        this.task_assume_yes = true;
        this.ignore_fields.add("series");
        this.default_values.push(
            {name: "series", value: true},
            {name: "day_planner", value: `[[${INCLUDE_TEMPLATE_DIR}/day-planner]]`},
            {name: "includeFile", value: `[[${INCLUDE_TEMPLATE_DIR}/${type}]]`},
        );
    }
}

/** Adds properties for managing periodic review notes. */
class PeriodicReviewOptions extends PeriodicOptions {
    /**
     * The constructor initializes the prompt options for periodic review notes.
     * @param {string} type - Type of note the options instance is associated with
    */
    constructor(type) {
        super(type);
        this.prompt_for_task = false;
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
        this.ignore_fields.addMultiple([
            "stop", // null default value
            "top_p",
            "presence_penalty",
            "frequency_penalty",
            "stream",
            "n",
        ]);
        this.default_values = [
            {name: "temperature", value: constants.temperature},
            {name: "top_p", value: constants.top_p},
            {name: "presence_penalty", value: constants.presence_penalty},
            {name: "frequency_penalty", value: constants.frequency_penalty},
            {name: "stream", value: constants.stream},
            {name: "n", value: constants.n},
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
        this.period = -1;
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
        this.tags.addMultiple([
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
        this.tags.addMultiple(["reference", "chat", "yt"]);
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
        this.tags.addMultiple([
            "reference", "chat", "yt", "goal", "project",
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

/** Sets default view options for job post notes. */
class JobPostViewOptions extends BaseViewOptions {
    /** Initializes job post view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add("job-post");
    }
}

/** Sets default view options for games job posts. */
class GamesJobViewOptions extends BaseViewOptions {
    /** Initializes games job post view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add("games-job");
    }
}

/** Sets default view options for vfx job posts. */
class VfxJobViewOptions extends BaseViewOptions {
    /** Initializes vfx job view options with default tags.
     * @param {string} type - Type of note the options instance is associated with
     * @param {string} title - Title of note
    */
    constructor(type, title) {
        super(type, title);
        this.linked = true;
        this.tags.add("vfx-job");
    }
}

/**
 * Factory function that returns a an options instance based on the provided string.
 *
 * @param {string} type - Determines which instance to return
 * @return {any} The options instance
 */
function promptOptionFactory(type) {
    switch (type) {
        case "journal":
            return new JournalOptions(type);
        case "periodic":
            return new PeriodicOptions(type);
        case "daily":
            return new PeriodicOptions(type);
        case "weekly":
            return new PeriodicReviewOptions(type);
        case "monthly":
            return new PeriodicReviewOptions(type);
        case "quarterly":
            return new PeriodicReviewOptions(type);
        case "yearly":
            return new PeriodicReviewOptions(type);
        case "document":
            return new DocumentOptions(type);
        case "book":
            return new BaseOptions(type);
        case "video":
            return new VideoOptions(type);
        case "yt-video":
            return new YouTubeVideoOptions(type);
        case "chat":
            return new ChatOptions(type);
        case "goal":
            return new GoalOptions(type);
        case "project":
            return new ProjectOptions(type);
        case "resource":
            return new ResourceOptions(type);
        case "reference":
            return new ResourceOptions(type);
        case "company":
            return new CompanyOptions(type);
        case "game-company":
            return new CompanyOptions(type);
        case "vfx-company":
            return new CompanyOptions(type);
        case "job-post":
            return new JobPostOptions(type);
        case "games-job":
            return new JobPostOptions(type);
        case "vfx-job":
            return new JobPostOptions(type);
        case "clipping":
            return new ResourceOptions(type);
        case "article":
            return new ResourceOptions(type);
        case "meeting":
            return new MeetingOptions(type);
        case "interview":
            return new MeetingOptions(type);
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
            return new JobPostViewOptions(type, title);
        case "game-company":
            return new GamesJobViewOptions(type, title);
        case "vfx-company":
            return new VfxJobViewOptions(type, title);
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
    JobPostViewOptions,
    GamesJobViewOptions,
    VfxJobViewOptions,
    ResourceOptions,
    DocumentOptions,
    MeetingOptions,
    GoalOptions,
    ProjectOptions,
    JobPostOptions,
    CompanyOptions,
    VideoOptions,
    YouTubeVideoOptions,
    JournalOptions,
    PeriodicOptions,
    PeriodicReviewOptions,
    ChatOptions,
    promptOptionFactory,
    viewOptionFactory,
};
