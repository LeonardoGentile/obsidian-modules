// Obsidian frontmatter yaml fields, e.g. prop: value
const FRONTMATTER_FIELD_NAMES = [
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
];

// Inline Dataview fields, e.g. prop:: value
const INLINE_DV_FIELD_NAMES = [
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
];

/**
 * Dataview inline JS fields
 * - Defined in a markdown comment `%%` block near the head of the file
 * - DQL is used for placement in the note body
 */
const INLINE_JS_FIELD_NAMES = [
    "nav",
    "bar",
    "overview",
    "projects",
    "projectDV",
    "projectTV",
    "progress",
    "target",
    "jobPosts",
];

/**
 * Dataview query language fields
 * - Placed near the head of the note
 */
const HEAD_DQL_FIELD_NAMES = [
    "nav",
    "bar",
];

// DQL fields that are sectioned off and placed near the foot of the note body
const LOWER_DQL_FIELD_NAMES = [
    "overview",
    "projectDV",
    "projectTV",
    "jobPosts",
];

/**
 * Fields that don't map to DV or fronmatter metadata
 * - Used to insert interstitial content
 * - Accessible from the `fields` object in the template file
 * - Can be used to insert values in multiple locations
 */
const EXTRA_FIELD_NAMES = [
    "alias",
    // Unmapped in MM
    "actions",
    "includeFile",
    "dayPlanner",
];

/**
 * Fields that can be used to insert blocks of content in the note body
 * - Also used to insert interstitial content
 * - Accessible from `fields.body` in the template file
 * - Used by few file classes
 * - Used to insert content once, and only in the note body
 */
const BODY_FIELD_NAMES = [
    "ytdlp",
    "timestampUrl",
];

// TP, QA, prompt templates, file includes etc.
const TEMPLATE_ROOT = "_templates";

// For file include templates, used with `tp.file.include`
const INCLUDE_TEMPLATE_DIR = `${TEMPLATE_ROOT}/include`;

// Root dir for modules such as this
const MODULES_ROOT = "_modules";

// File classes, lookup and configuration for MM
const METADATA_MENU_ROOT = "_mm";

// Root dir for DV complex views
const VIEWS_ROOT = "_views";

module.exports = {
    temperature: 0.1,
    top_p: 1,
    presence_penalty: 1,
    frequency_penalty: 1,
    stream: true,
    n: 1,
    system_prompts: `${TEMPLATE_ROOT}/chat/system`,
    prompt_templates: `${TEMPLATE_ROOT}/chat/prompt`,
    FRONTMATTER_FIELD_NAMES,
    INLINE_DV_FIELD_NAMES,
    INLINE_JS_FIELD_NAMES,
    HEAD_DQL_FIELD_NAMES,
    LOWER_DQL_FIELD_NAMES,
    EXTRA_FIELD_NAMES,
    BODY_FIELD_NAMES,
    TEMPLATE_ROOT,
    MODULES_ROOT,
    METADATA_MENU_ROOT,
    VIEWS_ROOT,
    INCLUDE_TEMPLATE_DIR,
    DATE_FMT: "YYYY-MM-DD",
    TITLE_SEP: "-",
};
