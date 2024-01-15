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
            type: "url",
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
};
