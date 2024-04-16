const PATHS = {
  // TP, QA, prompt templates, file includes etc.
  template_root: "_templates",
  // Root dir for modules such as this
  modules_root: "_modules",
  // File classes, lookup and configuration for MM
  metadata_menu_root: "_mm",
  // Root dir for DV complex views
  views_root: "_views"
}

// For file include templates, used with `tp.file.include`
PATHS["template_include_dir"] = `${PATHS.template_root}/include`;

const DATE_FMT =  "YYYY-MM-DD";
const TITLE_SEP =  "-";

/**
 * Defines properties for Dataview progress bars.
 * This can be used by Dataview to display custom progress bar views.
 */
const PROGRESS_VIEW = {
  total: "total-progress-bar",
  page: "page-progress-bar",
};

// NB: these fields are StringSet
// config['typeA'].ignore_fields
// config['typeB'].view.tags

// - Whenever an array is set it replace any value set in the parent
// - If there is a field like _fieldName_add then it means the values from
//   this array must _extends the values from the parent array

const OPTIONS = {
  // All others will inherit from this one
  "_defaultConfig": {
    prompt: {
      date_fmt: DATE_FMT,
      title_sep: TITLE_SEP,
      // Prompt Options
      prompt_for_title: true, // If true, prompt for title before file creation
      prompt_for_prefix: false, // If true, prompt for title prefix before file creation
      prompt_for_suffix: false, // If true, prompt for title suffix before file creation
      title_suffix_stringify: false, // if true, in case of auto computed titles -> all words will be chained with dashes
      prompt_for_alias: true,
      prompt_for_task: false,
      task_assume_yes: false, // If true, answer "yes" to prompts if asked
      prompt_for_attachment: false,
      prompt_for_project: false,
      prompt_for_goal: false,
      prompt_for_subfolder: false, // If true, prompt the name of subfolder
      // Views
      progress_bar_view: PROGRESS_VIEW.page,
      // Array-like fields
      files_paths: [],
      include_default_templates: true, /** If true, and file exists
                                         * push an object into default_values with
                                         * name `includeFile` and value `[[_templates/include/${type}]]`
                                         * */
      default_values: [], // [{name: field_name, value: default_value}]
      ignore_fields: [
        "cssClasses", // empty
        "created", // automatically generated at creation time
        "modified", // automatically generated at creation time
        "bar", // only created if tasks are enabled
      ]
    }
  },
  // Basic
  "book": {
    prompt: {}
  },
  // Resources
  "resource": {
    prompt: {
      files_paths: ["library"],
      ignore_fields: ["status"],
      include_default_templates: true
    }
  },
  "reference": {
    _extends: "resource",
    prompt: {}
  },
  // Clippings / Articles
  "clipping": {
    prompt: {}
  },
  "article": {
    _extends: "clipping",
    prompt: {
      files_paths: ["clipping"],
    }
  },
  // Docs
  "document": {
    prompt: {
      files_paths: [], // bound to path in MDM
      ignore_fields: ["tags"]
    }
  },
  // Video
  "video": {
    prompt: {
      files_paths: [], // bound to path in metadata-menu
      selector: null,
      url: null,
    }
  },
  "yt-video": {
    _extends: "video",
    prompt: {
      title_prefix: "YT",
      prompt_for_suffix: false,
      title_suffix_stringify: false
    }
  },
  // Meetings
  "meeting": {
    prompt: {
      prompt_for_task: true,
      task_assume_yes: false,
      include_default_templates: true
    }
  },
  "interview": {
    _extends: "meeting",
    prompt: {}
  },
  // Projects
  "project": {
    prompt: {
      prompt_for_subfolder: true,
      prompt_for_task: true,
      task_assume_yes: true,
      progress_bar_view: PROGRESS_VIEW.total,
      ignore_fields: ["tags"],
      include_default_templates: true,
    },
    view: {
      linked: true,
      tags: [
        "journal", "reference", "resource", "yt", "chat"
      ]
    }
  },
  "goal": {
    prompt: {
      prompt_for_task: true,
      task_assume_yes: true,
      prompt_for_attachment: true,
      progress_bar_view: PROGRESS_VIEW.total,
      ignore_fields: ["tags"], // in this case it won't prompt for tags and use the MDM class tags
      include_default_templates: true,
    }
  },
  // Journal
  "journal": {
    prompt: {
      period: 0,
      files_paths: ["journal"],
      ignore_fields: ["tags"],
      include_default_templates: true,
    },
    view: {
      linked: true,
      tags: ["reference", "resource", "chat", "yt"]
    }
  },
  // Periodic
  "periodic": {
    prompt: {
      prompt_for_title: false,
      prompt_for_suffix: true,
      prompt_for_task: true,
      prompt_for_alias: false,
      task_assume_yes: true,
      ignore_fields: ["tags", "series"],
      // include_default_templates: true, // TODO:
      default_values: [
        { name: "series", value: true },
        { name: "day_planner", value: `[[${PATHS.template_include_dir}/day-planner]]` },
        // { name: "includeFile", value: `[[${PATHS.template_include_dir}/${type}]]` },
      ]
    },
    view: {
      // Never explicitly instantiated
      tags: [
        "reference", "resource", "chat", "yt", "goal", "project",
      ]
    }
  },
  "daily": {
    _extends: "periodic",
    prompt: {
      include_default_templates: true,
    },
    view: {
      // period: 0, // every day
      _tags_add: ["journal"] // It's added to the parent, not overridden
    }
  },
  "periodic-review": {
    _extends: "periodic",
    prompt: {
      prompt_for_task: false,
      default_values: [
        { name: "series", value: true },
        // {
        //   name: "includeFile",
        //   value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]"
        // }
      ]
    }
  },
  "weekly": {
    _extends: "periodic-review",
    prompt: {
      include_default_templates: true,
    },
    view: {
      // period: 7,
      tags: ["daily"]
    }
  },
  "monthly": {
    _extends: "periodic-review",
    prompt: {
      include_default_templates: true,
    },
    view: {
      tags: ["weekly"]
    }
  },
  "quarterly": {
    _extends: "periodic-review",
    prompt: {
      include_default_templates: true,
    },
    view: {
      // period: 90,
      tags: ["monthly"]
    }
  },
  "yearly": {
    _extends: "periodic-review",
    prompt: {
      include_default_templates: true,
    },
    view: {
      tags: ["quarterly"]
    },
  },
  // Companies
  "company": {
    prompt: {
      ignore_fields: ["location", "link"],
      files_paths: ["library"],
    },
    view: {
      linked: true,
      tags: ["job-post", "meeting", "reference", "resource"]
    },
  },
  "game-company": {
    _extends: "company",
    prompt: {},
    view: {
      _tags_replace: { "job-post": "games-job" }
    }
  },
  "vfx-company": {
    _extends: "company",
    prompt: {},
    view: {
      _tags_replace: {
        "job-post": "vfx-job"
      },
      _tag_delete: []
    }
  },
  // Job Posts
  "job-post": {
    prompt: {
      prompt_for_task: true,
      ignore_fields: ["directLink", "recruiterLink"],
      files_paths: ["library"],
    },
    view: {
      linked: true,
      tags: ["journal", "meeting", "reference", "resource"]
    }
  },
  "games-job": {
    _extends: "job-post",
    prompt: {}
  },
  "vfx-job": {
    _extends: "job-post",
    prompt: {}
  },
  "chat": {
    options: {
      temperature: 0.1,
      top_p: 1,
      presence_penalty: 1,
      frequency_penalty: 1,
      stream: true,
      n: 1,
      system_prompts: `${PATHS.template_root}/chat/system`,
      prompt_templates: `${PATHS.template_root}/chat/prompt`,
    }
  }
}

const FIELD_NAMES = {
  // Obsidian frontmatter yaml fields, e.g. prop: value
  frontmatter: [
    "title",
    "subtitle",
    "reason",
    "type",
    "status",
    "tags",
    "series",
    "created",
    "modified",
    "aliases",
    "cssClasses",
    "project",
    // chat
    "model",
    "temperature",
    "top_p",
    "max_tokens",
    "presence_penalty",
    "frequency_penalty",
    "stream",
    "stop",
    "n",
    "system_commands",
    "template",
    // company
    "location",
  ],
  // Inline Dataview fields, e.g. prop:: value
  inline_dv: [
    "goal",
    "timespan",
    "project",
    // company
    "img",
    "company",
    "link",
    // job-post
    "active",
    "applied",
    "jobType",
    "workFrom",
    "lastContact",
    "appSent",
    // interview
    "job-post",
    // yt-video
    "url",
    "published",
    "description",
    "directLink",
    "recruiterLink",
    "author",
    "rating",
    "reviewed",
    "finished",
    "canonical",
    "shorlinkUrl",
    "imageSrc",
    "thumbnailUrl",
    "keywords",
    "genre",
    "duration",
    "datePublished",
    "uploadDate",
    "authorUrl",
    "authorName",
    "ogSitename",
    "ogUrl",
    "ogTitle",
    "ogDescription",
    "ogImage",
  ],
  /**
  * Dataview inline JS fields
  * - Defined in a markdown comment `%%` block near the head of the file
  * - DQL is used for placement in the note body
  */
  inline_js: [
    "nav",
    "bar",
    "overview",
    "projects",
    "projectDV",
    "projectTV",
    "progress",
    "target",
    "jobPosts",
  ],
  /**
  * Dataview query language fields
  * - Placed near the head of the note
  */
  head_dql: [
    "nav",
    "bar",
  ],
  // DQL fields that are sectioned off and placed near the foot of the note body
  lower_dql: [
    "overview",
    "projectDV",
    "projectTV",
    "jobPosts",
  ],
  /**
  * Fields that can be used to insert blocks of content in the note body
  * - Also used to insert interstitial content
  * - Accessible from `fields.body` in the template file
  * - Used by few file classes
  * - Used to insert content once, and only in the note body
  */
  body: [
    "ytdlp",
    "timestampUrl",
  ],
  /**
  * Fields that don't map to DV or frontmatter metadata
  * - Used to insert interstitial content
  * - Accessible from the `fields` object in the template file
  * - Can be used to insert values in multiple locations
  */
  extra: [
    "alias",
    "aliases",
    "title",
    // Unmapped in MM
    "actions",
    "includeFile",
    "dayPlanner",
  ]
}


module.exports = {
  PATHS,
  OPTIONS,
  FIELD_NAMES,
  DATE_FMT,
  TITLE_SEP,
  PROGRESS_VIEW
}