const { template } = self.require("_modules/template.js");

/**
 * Defines properties for Dataview progress bars.
 * This can be used by Dataview to display custom progress bar views.
 */
const progressView = {
  total: "total-progress-bar",
  page: "page-progress-bar",
};

const config = {
  // Basic
  "book": {},

  // Resources
  "resource": {
    "files_paths": ["library"],
    "ignore_fields": ["status"],
    "default_values": [{
      "name": "includeFile",
      "value": "[[${'INCLUDE_TEMPLATE_DIR'}/${'type'}]]"
    }]
  },
  "reference": { "extends": "resource" },

  // Clippings / Articles
  "clipping": {},
  "article": {
    "extends": "clipping",
    "files_paths": ["clipping"],
  },

  // Docs
  "document": {
    "files_paths": [], // bound to path in MDM
    "ignore_fields": ["tags"]
  },

  // Meetings
  "meeting": {
    prompt_for_task: true,
    task_assume_yes: false,
    default_values: [{
      name: "includeFile",
      value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]"
    }]
  },
  "interview": { extends: "meeting" },

  // Projects
  "project": {
    prompt_for_task: true,
    task_assume_yes: true,
    progress_bar_view: progressView.total,
    ignore_fields: ["tags"],
    default_values: [{
      name: "includeFile",
      value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]"
    }]
  },
  "goal": {
    prompt_for_task: true,
    task_assume_yes: true,
    prompt_for_attachment: true,
    progress_bar_view: progressView.total,
    ignore_fields: ["tags"],
    default_values: [{
      name: "includeFile",
      value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]"
    }]
  },

  // Job Posts
  "job-post": {
    prompt_for_task: true,
    ignore_fields: ["directLink", "recruiterLink"],
    files_paths: ["library"]
  },
  "games-job": { extends: "job-post" },
  "vfx-job": { extends: "job-post" },

  // Companies
  "company": {
    ignore_fields: ["location", "link"],
    files_paths: ["library"]
  },
  "game-company": { extends: "company" },
  "vfx-company": { extends: "company" },

  // Video
  "video": {
    files_paths: [], // bound to path in metadata-men
    selector: null,
    url: null
  },
  "yt-video": { extends: "video" },

  // Periodic
  "periodic": {
    prompt_for_title: false,
    prompt_for_suffix: true,
    prompt_for_task: true,
    prompt_for_alias: false,
    task_assume_yes: true,
    ignore_fields: ["tags", "series"],
    default_values: [
      { name: "series", value: true },
      { name: "day_planner", value: "[[${INCLUDE_TEMPLATE_DIR}/day-planner]]" },
      { name: "includeFile", value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]" },
    ]
  },
  "daily": {extends: "periodic" },
  "periodic-review": {
    extends: "periodic",
    prompt_for_task: false,
    default_values: [{
      name: "series",
      value: true
    },
    {
      name: "includeFile",
      value: "[[${INCLUDE_TEMPLATE_DIR}/${type}]]"
    }]
  },
  "weekly": {extends: "periodic-review"},
  "monthly": {extends: "periodic-review"},
  "quarterly": {extends: "periodic-review"},
  "yearly": {extends: "periodic-review"},

  // Journal
  "journal": {
    "period": 0,
    "files_paths": ["journal"],
    "ignore_fields": ["tags"],
    "default_values": [{
      "name": "includeFile",
      "value": "[[${'INCLUDE_TEMPLATE_DIR'}/${'type'}]]"
    }]
  }
}

module.exports = {
  config
}

"_templates/include/resource"