
const JOB_POST_INFO = {
    icon: "📌",
    header: "Post",
    headerPlural: "Posts",
    view: "jobPostTV",
    statusType: "job",
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
    "games-job": JOB_POST_INFO,
    "vfx-job": JOB_POST_INFO,
    "job-granted": JOB_GRANTED,
    "job-denied": JOB_DENIED,
    "interview-accepted": INTERVIEW_ACCEPTED,
};
