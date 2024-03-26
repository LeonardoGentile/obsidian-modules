const jobPostView = template`dv.view("job-posts", {file: "${"title"}", tags: ${"tags"}})`;
const targetView = template`dv.view("target", {file: "${"title"}"})`;
const progressView = template`dv.view("progress", {file: "${"title"}"})`;
const projectListView = template`dv.view("section", {file: "${"title"}", searchTerm: "project", headerName: "Project", headerNamePlural: "Projects", icon: "🏗", list: true})`;
const projectTableView = template`dv.view("section", {file: "${"title"}", searchTerm: "project", headerName: "Project", headerNamePlural: "Projects", icon: "🏗"})`;
const overview = template`dv.view("overview", {file: "${"title"}", linked: ${"linked"}, interval: "${"interval"}", tags: ${"tags"}})`;
const progressBarView = template`dv.view("${"progressView"}", {file: "${"title"}"})`;
const navigationView = template`dv.view("navigation", {file: "${"title"}"})`;
const ytdlpCmd = template`\`\`\`sh\nyt-dlp ${"url"} -o videos/"%(title)s.mp4"\n\`\`\``;
const timestampUrlBlock = template`\`\`\`timestamp-url\n${"url"}\n\`\`\``;

/**
 * A function that parses template literals
 * Yoinked from:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
 * @param {Array<string>} strings array of strings which may contain ${…} substitutions
 * E.g. `${0}${1}${0}` or `${0} ${"foo"}` or `hey, ${0} ${"foo"} you!`
 * The substitutions are stripped from the array, so only the rest of the fragments are present
 * @param {Array<any>} keys keys are strings or numbers inside substitutions
 * E.g. `${0}` or `${"foo"}`
 * @return {function(): string}
 * @example
 *   const t1Closure = template`${0}${1}${0}!`;
 *   // const t1Closure = template(["","","","!"],0,1,0);
 *   t1Closure("Y", "A"); // "YAY!"
 *
 *   const t2Closure = template`${0} ${"foo"}!`;
 *   // const t2Closure = template([""," ","!"],0,"foo");
 *   t2Closure("Hello", { foo: "World" }); // "Hello World!"
 *
 *   const t3Closure = template`I'm ${"name"}. I'm almost ${"age"} years old.`;
 *   // const t3Closure = template(["I'm ", ". I'm almost ", " years old."], "name", "age");
 *   t3Closure("foo", { name: "MDN", age: 30 }); // "I'm MDN. I'm almost 30 years old."
 *   t3Closure({ name: "MDN", age: 30 }); // "I'm MDN. I'm almost 30 years old."
 */
function template(strings, ...keys) {
    return (...values) => {
        const dict = values[values.length - 1] || {};
        const result = [strings[0]];
        keys.forEach((key, i) => {
            const value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join("");
    };
}

/**
 * Parses a plain string containing placeholders and returns a tagged template function.
 * @param {string} plainString The plain string containing placeholders.
 * @returns {Function} A tagged template function that can be used with template literals.
 */
function parseTemplateString(plainString) {
    // Regular expression to match placeholders in the format ${...} or ${'...'}
    const regex = /\${(['"]?)(.*?)\1}/g;
    const fragments = [];
    const keys = [];
    let match;
    let lastIndex = 0;

    // Iterate over matches in the plainString
    while ((match = regex.exec(plainString)) !== null) {
        // Push the string fragment before the match
        fragments.push(plainString.substring(lastIndex, match.index));
        // Push the captured key (without quotes) to keys array
        keys.push(match[2]);
        // Update lastIndex to the end of the current match
        lastIndex = regex.lastIndex;
    }

    // Push the last string fragment after the last match
    fragments.push(plainString.substring(lastIndex));

    // Return a tagged template function using the template function
    return template(fragments, ...keys);
}



module.exports = {
    template,
    jobPostView,
    targetView,
    progressView,
    projectListView,
    projectTableView,
    overview,
    progressBarView,
    navigationView,
    ytdlpCmd,
    timestampUrlBlock,
};
