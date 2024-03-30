const { promptForDate, promptYesOrNo, promptForInputField, promptForYamlField } = self.require("_modules/templater/prompt.js");
const T = self.require("_modules/templater/template.js");
const yt = self.require("_modules/utils/youtube.js");

/**
 * Handles prompting for yaml input fields.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field definition object
 * @param {Object} promptOptions - Prompt options object
 * @return {string} value for yaml field
*/
async function handleYamlField(tp, field, promptOptions) {
  let value;
  const defaultValue = promptOptions.getValueForField(field.name);
  switch (field.name) {
    case "system_commands":
      const promptFiles = await app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith(promptOptions.system_prompts))
        .sort(p => p.stat.mtime, "desc");
      if (!promptFiles)
        new Notice("No system prompt files found");
      const selection = await tp.system.suggester(
        tfile => tfile.basename, promptFiles, false, `Choose ${field.name} <ESC to skip>`);
      if (!selection)
        new Notice("No system prompt selected.");
      let systemPrompt = selection ? await app.vault.cachedRead(selection) : null;
      if (!systemPrompt)
        new Notice("Empty system prompt.");
      else
        systemPrompt = systemPrompt.replace(/  +/g, " ").replace(/\n\n+/g, "\n").replace(/\n/g, " ");
      value = systemPrompt ? systemPrompt.length ? `\n  - ${systemPrompt}` : "" : null;
      break;
    default:
      value = await promptForYamlField(tp, field, defaultValue);
  }
  return value;
}

/**
* Handles prompting for boolean input fields.
*
* @param {Object} tp - Templater instance
* @param {Object} field - Field definition object
* @param {Object} promptOptions - Prompt options object
* @return {boolean} boolean value
*/
async function handleBooleanField(tp, field, promptOptions) {
  const defaultValue = promptOptions.getValueForField(field.name);
  return await promptYesOrNo(tp, `${field.name}?`, defaultValue || false);
}

/**
* Handles prompting for number input fields.
*
* @param {Object} tp - Templater instance
* @param {Object} field - Field definition object
* @param {Object} promptOptions - Prompt options object
* @return {number} number value
*/
async function handleNumberField(tp, field, promptOptions) {
  const defaultValue = promptOptions.getValueForField(field.name);
  const reply = await tp.system.prompt(`${field.name}?`, `${defaultValue}` || "");
  const value = parseFloat(reply);
  return value;
}

/**
* Handles prompting for date input fields.
*
* @param {Object} tp - Templater instance
* @param {Object} field - Field definition object
* @param {Object} promptOptions - Prompt options object
* @return {string} Formatted date string
*/
async function handleDateField(tp, field, promptOptions) {
  let value;
  switch (field.name) {
    case "published":
      value = yt.getDatePublished(promptOptions.querySelector).format(field.options.dateFormat || "YYYY-MM-DD");
      break;
    case "datePublished":
      value = yt.getDatePublished(promptOptions.querySelector).format(field.options.dateFormat || "YYYY-MM-DD");
      break;
    case "uploadDate":
      value = yt.getUploadDate(promptOptions.querySelector).format(field.options.dateFormat || "YYYY-MM-DD");
      break;
    default:
      value = await promptForDate(tp, `${field.name}?`, field.options.dateFormat);
  }
  return value;
}

/**
* An abstraction for getting values for different types of input field.
* @param {Object} tp - Templater instance
* @param {Object} field - Field object
* @param {Object} templateParams - Template parameters object
* @param {Object} promptOptions - Prompt options
* @return {string} value for input field
*/
async function handleInputField(tp, field, templateParams, promptOptions) {
  let value;
  switch (field.name) {
    case "prefix":
      value = moment().format(promptOptions.date_fmt);
      break;
    case "suffix":
      value = promptOptions.title_suffix;
      break;
    case "progress":
      value = T.progressView({ title: templateParams.title });
      break;
    case "target":
      value = T.targetView({ title: templateParams.title });
      break;
    case "projectDV":
      value = T.overview({
        title: templateParams.title,
        linked: true,
        interval: -1,
        tags: templateParams.tags.asString(),
      });
      break;
    case "projectTV":
      value = T.projectTableView({ title: templateParams.title });
      break;
    case "projects":
      value = T.projectListView({ title: templateParams.title });
      break;
    case "nav":
      value = T.navigationView({ title: templateParams.title });
      break;
    case "overview":
      value = T.overview({
        title: templateParams.title,
        linked: templateParams.linked,
        interval: templateParams.period,
        tags: templateParams.tags.asString(),
      });
      break;
    case "jobPosts":
      value = T.jobPostView({
        title: templateParams.title,
        tags: templateParams.tags.asString(),
      });
      break;
    case "timestampUrl":
      value = T.timestampUrlBlock({ url: promptOptions.url });
      break;
    case "ytdlp":
      value = T.ytdlpCmd({ url: promptOptions.url });
      break;
    case "duration":
      value = yt.getDuration(promptOptions.querySelector);
      break;
    case "canonical":
      value = `<${yt.getCanonical(promptOptions.querySelector)}>`;
      break;
    case "description":
      value = yt.getDescription(promptOptions.querySelector);
      break;
    case "keywords":
      value = yt.getKeywords(promptOptions.querySelector);
      break;
    case "shortlinkUrl":
      value = `<${yt.getShorlinkUrl(promptOptions.querySelector)}>`;
      break;
    case "imageSrc":
      value = `<${yt.getImageSrc(promptOptions.querySelector)}>`;
      break;
    case "authorUrl":
      value = `<${yt.getAuthorUrl(promptOptions.querySelector)}>`;
      break;
    case "authorName":
      value = yt.getAuthorName(promptOptions.querySelector);
      break;
    case "thumbnailUrl":
      value = `<${yt.getThumbnailUrl(promptOptions.querySelector)}>`;
      break;
    case "channel":
      value = yt.getChannel(promptOptions.querySelector);
      break;
    case "genre":
      value = yt.getGenre(promptOptions.querySelector);
      break;
    case "ogSiteName":
      value = yt.getOgSiteName(promptOptions.querySelector);
      break;
    case "ogUrl":
      value = `<${yt.getOgUrl(promptOptions.querySelector)}>`;
      break;
    case "ogTitle":
      value = yt.getOgTitle(promptOptions.querySelector);
      break;
    case "ogImage":
      value = `<${yt.getOgImage(promptOptions.querySelector)}>`;
      break;
    case "ogDescription":
      value = yt.getOgDescription(promptOptions.querySelector);
      break;
    default:
      value = await promptForInputField(tp, field);
  }
  return value;
}

module.exports = {
  handleYamlField,
  handleBooleanField,
  handleNumberField,
  handleDateField,
  handleInputField
}