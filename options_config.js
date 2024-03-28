
/**
 * Defines properties for Dataview progress bars.
 * This can be used by Dataview to display custom progress bar views.
 */
const progressView = {
  total: "total-progress-bar",
  page: "page-progress-bar",
};

// NB: these fields are StringSet
// config['whatever'].ignore_fields
// config['whatever'].view.tags

// - Whenever an array is set it replace any value set in the parent
// - If there is a field like _fieldName_add then it means the values from
//   this array must extends the values from the parent array

const config = {
  // Basic
  "book": {},
  // Resources
  "resource": {
    files_paths: ["library"],
    ignore_fields: ["status"],
    include_default_templates: true,
  },
  "reference": { extends: "resource" },
  // Clippings / Articles
  "clipping": {},
  "article": {
    extends: "clipping",
    files_paths: ["clipping"],
  },
  // Docs
  "document": {
    files_paths: [], // bound to path in MDM
    ignore_fields: ["tags"]
  },
  // Video
  "video": {
    files_paths: [], // bound to path in metadata-men
    selector: null,
    url: null
  },
  "yt-video": { extends: "video" },
  // Meetings
  "meeting": {
    prompt_for_task: true,
    task_assume_yes: false,
    include_default_templates: true,
  },
  "interview": { extends: "meeting" },
  // Projects
  "project": {
    prompt_for_task: true,
    task_assume_yes: true,
    progress_bar_view: progressView.total,
    ignore_fields: ["tags"],
    include_default_templates: true,
    view: {
      linked: true,
      tags: [
        "journal", "reference", "resource", "yt", "chat"
      ]
    }
  },
  "goal": {
    prompt_for_task: true,
    task_assume_yes: true,
    prompt_for_attachment: true,
    progress_bar_view: progressView.total,
    ignore_fields: ["tags"],
    include_default_templates: true,
  },
  // Journal
  "journal": {
    period: 0,
    files_paths: ["journal"],
    ignore_fields: ["tags"],
    include_default_templates: true,
    view: {
      linked: true,
      tags: ["reference", "resource", "chat", "yt"]
    }
  },
  // Periodic
  "periodic": {
    _type: "periodic", // flag to compute period at runtime
    prompt_for_title: false,
    prompt_for_suffix: true,
    prompt_for_task: true,
    prompt_for_alias: false,
    task_assume_yes: true,
    ignore_fields: ["tags", "series"],
    include_default_templates: true,
    default_values: [
      { name: "series", value: true },
      { name: "day_planner", value: "[[${'INCLUDE_TEMPLATE_DIR'}/day-planner]]" },
      // { name: "includeFile", value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]" },
    ],
    view: {
      // Never explicitly instantiated
      tags: [
        "reference", "resource", "chat", "yt", "goal", "project",
      ]
    }
  },
  "daily": {
    extends: "periodic",
    view: {
      // period: 0, // every day
      _tags_add: ["journal"] // TODO: add to the parent, don't override
    }
  },
  "periodic-review": {
    extends: "periodic",
    prompt_for_task: false,
    default_values: [
      { name: "series", value: true },
      {
        name: "includeFile",
        value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]"
      }
    ]
  },
  "weekly": {
    extends: "periodic-review",
    include_default_templates: true,
    view: {
      // period: 7,
      tags: ["daily"]
    }
  },
  "monthly": {
    extends: "periodic-review",
    include_default_templates: true,
    view: {
      tags: ["weekly"]
    }
  },
  "quarterly": {
    extends: "periodic-review",
    include_default_templates: true,
    view: {
      // period: 90,
      tags: ["monthly"]
    }
  },
  "yearly": {
    extends: "periodic-review",
    include_default_templates: true,
    view: {
      tags: ["quarterly"]
    },
  },
  // Companies
  "company": {
    ignore_fields: ["location", "link"],
    files_paths: ["library"],
    view: {
      linked: true,
      tags: ["job-post", "meeting", "reference", "resource"]
    },
  },
  "game-company": {
    extends: "company",
    view: {
      _tags_replace: { "job-post": "games-job" }
    }
  },
  "vfx-company": {
    extends: "company",
    view: {
      _tags_replace: {
        "job-post": "vfx-job"
      }
    }
  },
  // Job Posts
  "job-post": {
    prompt_for_task: true,
    ignore_fields: ["directLink", "recruiterLink"],
    files_paths: ["library"],
    view: {
      linked: true,
      tags: ["journal", "meeting", "reference", "resource"]
    }
  },
  "games-job": { extends: "job-post" },
  "vfx-job": { extends: "job-post" },
  "chat": {
    _type: "chat"
  }
}

module.exports = {
  config
}