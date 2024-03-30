const {TFile} = self.require("obsidian");
const dv = app.plugins.plugins["dataview"].api;

const IMAGE_FILE_EXTS = ["png", "jpg", "svg", "webp"];

/**
 * Prompts the user to select an image file from the given path(s).
 * Filters files to those with image extensions and sorts by creation time descending.
 *
 * @param {Object} tp - Templater instance
 * @param {string|Array} paths - Path(s) to filter image files from
 * @param {string} customSorting - (Optional) Custom sort method
 * @param {string} placeholder - (Optional) Placeholder string for suggester
 * @param {Array<string>} extensions - (Optional) File extensions
 * @param {boolean} inlineEmbed - (Optional) Render as an inline embed, default: false
 * @return {string} The selected image file as a markdown [[link]]
*/
async function fileSuggester(tp, paths, customSorting, placeholder, extensions, inlineEmbed) {
    // Ensure args are arrays and filter out any null or falsy values
    extensions = Array.isArray(extensions) ? extensions.filter(Boolean) : [extensions].filter(Boolean);
    paths = Array.isArray(paths) ? paths.filter(Boolean) : [paths].filter(Boolean);
    inlineEmbed = inlineEmbed ?? false;

    let files = [];
    if (extensions.length) {
        files = app.vault.getFiles()
            .filter(f => paths.some(path => f.path.includes(path)) &&
                extensions.includes(f.extension));
    } else {
        files = app.vault.getFiles()
            .filter(f => paths.some(path => f.path.includes(path)));
    }

    if (!files.length) {
        console.warn(`No files found for paths: ${JSON.stringify(paths)}`);
        return;
    }

    // Apply custom sort method
    if (typeof customSorting === "string") {
        const func = new Function("a", "b", `return ${customSorting};`);
        files = files.sort(func);
    } else {
        files = files.sort((a, b) => a.stat.ctime - b.stat.ctime);
    }

    const tfile = await tp.system.suggester(file => file.basename, files, false, placeholder);
    let fileLink = markdownLinkFromFile(tfile);
    if (!inlineEmbed && fileLink)
        fileLink = fileLink.replace("!", "");
    return fileLink;
}

/**
 * Prompts the user to select a file from the given Dataview query.
 *
 * @requires Dataview
 * @param {Object} tp - Templater instance
 * @param {string} dvQuery - Dataview query string, e.g. dv.pages("#project")
 * @param {string} customSorting - Custom sort method
 * @param {string} customRendering - Custom render method for items in suggester
 * @param {string} placeholder - Placeholder string for suggester
 * @return {Link} The selected file as a Dataview markdown link object
*/
async function dvQuerySuggester(tp, dvQuery, customSorting, customRendering, placeholder) {
    let pages = eval(dvQuery);
    if (!pages) {
        const msg = `Query '${dvQuery}' failed`;
        new Notice(msg);
        console.error(msg);
        return;
    } else if (!pages.values.length) {
        return;
    }

    // Apply custom sort method
    if (typeof customSorting === "string") {
        const func = new Function("a", "b", `return ${customSorting};`);
        pages = pages.sort(func);
    } else {
        pages = pages.sort((a, b) => a.created - b.created);
    }

    let dvPage;
    if (typeof customRendering === "string") {
        const func = new Function("page", `return ${customRendering};`);
        dvPage = await tp.system.suggester(func, pages, false, placeholder);
    } else {
        dvPage = await tp.system.suggester(
            p => p.file.aliases.length ? p.file.aliases[0] : p.file.name,
            pages,
            false,
            placeholder);
    }

    return markdownLinkFromPage(dvPage);
}

/**
 * Gets a markdown link for the file at the given file path.
 *
 * Retrieves the file's Dataview page and returns a markdown link using the file's
 * first alias if available, otherwise returns the file's path.
 *
 * @param {string} filePath - The path to the file to get a markdown link for
 * @return {string} The markdown [[link]] for the file
*/
function markdownLinkFromPath(filePath) {
    const tfile = app.vault.getAbstractFileByPath(filePath);
    if (!tfile || !tfile instanceof TFile) {
        const msg = `Invalid path: '${filePath}'`;
        new Notice(msg);
        console.error(msg);
        return;
    }

    return markdownLinkFromFile(tfile);
}

/**
 * Gets a markdown link for the Dataview page object.
 *
 * Returns a markdown link using the file's first alias if available, otherwise
 * returns the file's path.
 *
 * @param {Object} page - The path to the file to get a markdown link for
 * @return {Link} A Dataview markdown link object for the page
*/
function markdownLinkFromPage(page) {
    if (!page)
        return;

    return page.file.aliases?.length ?
        dv.func.link(page.file.path, page.file.aliases[0]) :
        page.file.link;
}

/**
 * Gets a markdown link for the file object.
 *
 * Returns a markdown link using the file's first alias if available, otherwise
 * returns the file's path.
 *
 * @param {TFile} tfile - The file object to get a markdown link for
 * @return {string} A markdown [[link]] for the file
*/
function markdownLinkFromFile(tfile) {
    if (!tfile || !tfile instanceof TFile)
        return;

    if (tfile.extension === "md") {
        const page = dv.page(tfile.path);
        return page.file.aliases?.length ?
            app.fileManager.generateMarkdownLink(tfile, "", "", page.file.aliases[0]) :
            page.file.link;
    } else {
        return app.fileManager.generateMarkdownLink(tfile, "");
    }
}

module.exports = {
    IMAGE_FILE_EXTS,
    markdownLinkFromPath,
    markdownLinkFromPage,
    markdownLinkFromFile,
    fileSuggester,
    dvQuerySuggester,
};
