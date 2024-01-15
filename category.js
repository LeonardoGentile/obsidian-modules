const {template} = self.require("_modules/template.js");
const metadata = self.require("_modules/metadata.js");

const JOB_POST_INFO = {
    icon: "📌",
    header: "Post",
    headerPlural: "Posts",
    view: "jobPostTV",
    statusType: "job",
    frontMatter: {
        "active": metadata.frontmatter["active"],
        "job type": metadata.frontmatter["job type"],
        "work from": metadata.frontmatter["work from"],
        "applied": metadata.frontmatter["applied"],
        "last contact": metadata.frontmatter["last contact"],
        "application sent": metadata.frontmatter["application sent"],
    },
    inlineData: {
        "company": metadata.inline["company"],
        "recruiter link": metadata.inline["recruiter link"],
        "direct link": metadata.inline["direct link"],
    },
};

const JOB_DENIED = {
    icon: "👎",
    header: "Denied",
    headerPlural: "Denied",
    view: "jobPostTV",
    statusType: "job",
};

const JOB_GRANTED = {
    icon: "👍",
    header: "Accepted",
    headerPlural: "Accepted",
    view: "jobPostTV",
    statusType: "job",
};

const INTERVIEW_ACCEPTED = {
    icon: "📞",
    header: "Interview",
    headerPlural: "Interviews",
    view: "jobPostTV",
    statusType: "job",
};

const COMPANY = {
    icon: "🏢",
    header: "Company",
    headerPlural: "Companies",
    view: "companyTV",
    statusType: "main",
    frontMatter: {
        locations: metadata.frontmatter["locations"],
        hiring: metadata.frontmatter["hiring"],
        link: metadata.frontmatter["link"],
    },
    postsView: null,
};

module.exports = {
    "goal": {
        icon: "🎯",
        header: "Goal",
        headerPlural: "Goals",
        view: "progressImageTV",
        statusType: "main",
    },
    "project": {
        icon: "🏗",
        header: "Project",
        headerPlural: "Projects",
        view: "projectTV",
        statusType: "main",
    },
    "daily": {
        icon: "📆",
        header: "Daily",
        headerPlural: "Dailies",
        view: "progressButtonTV",
        statusType: "main",
    },
    "weekly": {
        icon: "⏪",
        header: "Weekly",
        headerPlural: "Weeklies",
        view: "progressButtonTV",
        statusType: "main",
    },
    "monthly": {
        icon: "⏪",
        header: "Monthly",
        headerPlural: "Monthlies",
        view: "progressButtonTV",
        statusType: "main",
    },
    "quarterly": {
        icon: "⏪",
        header: "Quarterly",
        headerPlural: "Quarterlies",
        view: "progressButtonTV",
        statusType: "main",
    },
    "yearly": {
        icon: "⏪",
        header: "Yearly",
        headerPlural: "Yearly",
        view: "progressButtonTV",
        statusType: "main",
    },
    "journal": {
        icon: "📓",
        header: "Journal",
        headerPlural: "Journals",
        view: "progressButtonTV",
        statusType: "main",
    },
    "reference": {
        icon: "📚",
        header: "Reference",
        headerPlural: "Reference",
        view: "progressButtonTV",
        statusType: "main",
    },
    "meeting": {
        icon: "🧛‍♂🧛‍♀",
        header: "Meeting",
        headerPlural: "Meetings",
        view: "progressButtonTV",
        statusType: "main",
    },
    "yt": {
        icon: "📼",
        header: "Video",
        headerPlural: "Videos",
        view: "youTubeTV",
        statusType: "video",
    },
    "chat": {
        icon: "🤖💬",
        header: "Chat",
        headerPlural: "Chats",
        view: "progressButtonTV",
        statusType: "main",
    },
    "game-company": {...COMPANY, ...{
        icon: "🕹",
        header: "Game Company",
        headerPlural: "Game Companies",
        postViewTemplate: template`posts::\`$= dv.view("job-posts", {file: "${"title"}", tags: ["games-job"]})\``,
    }},
    "games-job": {...JOB_POST_INFO, ...{
        niceName: "Games",
        inlineData: {
            "company": {
                type: "tag",
                values: [
                    "#game-company",
                ],
            },
            "recruiter link": metadata.inline["recruiter link"],
            "direct link": metadata.inline["direct link"],
        },
    }},
    "vfx-company": {...COMPANY, ...{
        icon: "🎥",
        header: "VFX Studio",
        headerPlural: "VFX Studios",
        postViewTemplate: template`posts::\`$= dv.view("job-posts", {file: "${"title"}", tags: ["vfx-job"]})\``,
    }},
    "vfx-job": {...JOB_POST_INFO, ...{
        niceName: "VFX",
        inlineData: {
            "company": {
                type: "tag",
                values: [
                    "#vfx-company",
                ],
            },
            "recruiter link": metadata.inline["recruiter link"],
            "direct link": metadata.inline["direct link"],
        },
    }},
    "job-granted": JOB_GRANTED,
    "job-denied": JOB_DENIED,
    "interview-accepted": INTERVIEW_ACCEPTED,
};
