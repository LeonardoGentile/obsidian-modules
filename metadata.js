
/**
 * Gets all unique metadata values for the given key across all markdown files in the vault.
 *
 * Iterates through all markdown files, gets the frontmatter data,
 * checks if the data contains the given key, and adds any values to a Set to get the unique values.
 *
 * @param {string} key - The metadata key to get values for
 * @return {Array} An array of the unique metadata values for the given key.
*/
function getAllMetadataValues(key) {
    const values = new Set();
    app.vault.getMarkdownFiles().forEach(file => {
        const cache = app.metadataCache.getFileCache(file);
        const data = cache.frontmatter;
        if (data && data[key])
            values.add(data[key]);
    });
    console.log(values);
    return Array.from(values);
}

module.exports = {
    "frontmatter": {
        "work from": {
            type: "string",
            values: [
                "remote", "on-site", "hybrid",
            ],
        },
        "job type": {
            type: "string",
            values: [
                "full-time", "part-time", "contract", "freelance",
            ],
        },
        "hiring": {
            type: "boolean",
            values: [],
        },
        "active": {
            type: "boolean",
            values: [],
        },
        "applied": {
            type: "datetime",
            values: [],
        },
        "last contact": {
            type: "date",
            values: [],
        },
        "application sent": {
            type: "boolean",
            values: [],
        },
        "locations": {
            type: "multi",
            values: [],
        },
        "link": {
            type: "url-bare",
            values: [],
        },
    },
    "inline": {
        "company": {
            type: "tag",
            values: [
                "#company",
            ],
        },
        "recruiter link": {
            type: "url",
            values: [],
        },
        "direct link": {
            type: "url",
            values: [],
        },
    },
    getAllMetadataValues,
};
