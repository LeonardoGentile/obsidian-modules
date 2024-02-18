
const JOB_POST_INFO = {
    icon: "📌",
    header: "Post",
    headerPlural: "Posts",
    view: "jobPostTV",
};

const JOB_DENIED = {
    icon: "👎",
    header: "Denied",
    headerPlural: "Denied",
    view: "jobPostTV",
};

const JOB_GRANTED = {
    icon: "👍",
    header: "Accepted",
    headerPlural: "Accepted",
    view: "jobPostTV",
};

const INTERVIEW_ACCEPTED = {
    icon: "📞",
    header: "Interview",
    headerPlural: "Interviews",
    view: "jobPostTV",
};

const COMPANY = {
    icon: "🏢",
    header: "Company",
    headerPlural: "Companies",
    view: "companyTV",
};

module.exports = {
    "goal": {
        icon: "🎯",
        header: "Goal",
        headerPlural: "Goals",
        view: "progressImageTV",
    },
    "project": {
        icon: "🚧",
        header: "Project",
        headerPlural: "Projects",
        view: "projectTV",
    },
    "daily": {
        icon: "📆",
        header: "Daily",
        headerPlural: "Dailies",
        view: "progressButtonTV",
    },
    "weekly": {
        icon: "⏪",
        header: "Weekly",
        headerPlural: "Weeklies",
        view: "progressButtonTV",
    },
    "monthly": {
        icon: "⏪",
        header: "Monthly",
        headerPlural: "Monthlies",
        view: "progressButtonTV",
    },
    "quarterly": {
        icon: "⏪",
        header: "Quarterly",
        headerPlural: "Quarterlies",
        view: "progressButtonTV",
    },
    "yearly": {
        icon: "⏪",
        header: "Yearly",
        headerPlural: "Yearly",
        view: "progressButtonTV",
    },
    "journal": {
        icon: "📓",
        header: "Journal",
        headerPlural: "Journals",
        view: "progressButtonTV",
    },
    "resource": {
        icon: "🔗",
        header: "Resource",
        headerPlural: "Resources",
        view: "progressButtonTV",
    },
    "reference": {
        icon: "📚",
        header: "Reference",
        headerPlural: "Reference",
        view: "progressButtonTV",
    },
    "meeting": {
        icon: "👨‍🎤👩‍🎤",
        header: "Meeting",
        headerPlural: "Meetings",
        view: "progressButtonTV",
    },
    "yt": {
        icon: "📼",
        header: "Video",
        headerPlural: "Videos",
        view: "youTubeTV",
    },
    "chat": {
        icon: "🤖💬",
        header: "Chat",
        headerPlural: "Chats",
        view: "progressButtonTV",
    },
    "game-company": {...COMPANY, ...{
        icon: "🎮",
        header: "Game Company",
        headerPlural: "Game Companies",
    }},
    "vfx-company": {...COMPANY, ...{
        icon: "🎥",
        header: "VFX Studio",
        headerPlural: "VFX Studios",
    }},
    "games-job": JOB_POST_INFO,
    "vfx-job": JOB_POST_INFO,
    "job-granted": JOB_GRANTED,
    "job-denied": JOB_DENIED,
    "interview-accepted": INTERVIEW_ACCEPTED,
    "action-items" : {
        icon: "📥",
        header: "Action Item",
        headerPlural: "Action Items"
    }
};
