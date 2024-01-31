const PROP_NAME = "status";

const UNKNOWN = "unknown";

const ACTIVE_MAIN = {
    "todo": "todo",
    "waiting": "waiting",
    "in-progress": "in-progress",
    "hold": "hold",
    "blocked": "blocked",
};

const INACTIVE_MAIN = {
    "finished": "finished",
    "n/a": "na",
    "empty": null,
};

const ACTIVE_VIDEO = {
    "watch-later": "watch-later",
};

const INACTIVE_VIDEO = {"watched": "watched"};

const ACTIVE_JOB = {
    "interviewing": "interviewing",
    "application-sent": "application-sent",
    "offer-received": "received",
    "offer-sent": "sent",
    "waiting": "waiting",
};

const INACTIVE_JOB = {
    "job-denied": "rejected",
    "job-granted": "accepted",
};

const ACTIVE_ALL = {...ACTIVE_MAIN, ...ACTIVE_VIDEO, ...ACTIVE_JOB};

const INACTIVE_ALL = {...INACTIVE_MAIN, ...INACTIVE_VIDEO, ...INACTIVE_JOB};

const ALL = {...ACTIVE_ALL, ...INACTIVE_ALL};

const ACTIVE_VALUES = Object.values(ACTIVE_MAIN);

const INACTIVE_VALUES = Object.values(INACTIVE_MAIN);

const ACTIVE_VIDEO_VALUES = Object.values(ACTIVE_VIDEO);

const INACTIVE_VIDEO_VALUES = Object.values(INACTIVE_VIDEO);

const ACTIVE_JOB_VALUES = Object.values(ACTIVE_JOB);

const INACTIVE_JOB_VALUES = Object.values(INACTIVE_JOB);

const ACTIVE_JOB_KEYS = Object.keys(ACTIVE_JOB);

const INACTIVE_JOB_KEYS = Object.keys(INACTIVE_JOB);

const ALL_ACTIVE_VALUES = Object.values(ACTIVE_ALL);

const ALL_INACTIVE_VALUES = Object.values(INACTIVE_ALL);

const ANTI_STATUSES = {
    "fin": ACTIVE_VALUES,
    "watched": ACTIVE_VIDEO_VALUES,
};

/**
 * Determines the inactive status of a page based on its current status value.
 * @param {Object} page - Page object with a 'status' property.
 * @return {string} Status string (E.g. 'fin', 'watched', or 'unknown').
 */
function determineInactiveStatus(page) {
    for (const key in ANTI_STATUSES) {
        if (Object.hasOwn(ANTI_STATUSES, key)) {
            if (ANTI_STATUSES[key].includes(page.status))
                return key;
        }
    }
    return UNKNOWN;
}

module.exports = {
    propName: PROP_NAME,
    active: ACTIVE_MAIN,
    inactive: INACTIVE_MAIN,
    main: {...ACTIVE_MAIN, ...INACTIVE_MAIN},
    videoActive: ACTIVE_VIDEO,
    videoInactive: INACTIVE_VIDEO,
    video: {...ACTIVE_VIDEO, ...INACTIVE_VIDEO},
    jobActive: ACTIVE_JOB,
    jobInactive: INACTIVE_JOB,
    job: {...ACTIVE_JOB, ...INACTIVE_JOB},
    all: ALL,
    allActive: ACTIVE_ALL,
    allInactive: INACTIVE_ALL,
    activeValues: ACTIVE_VALUES,
    inactiveValues: INACTIVE_VALUES,
    activeVideoValues: ACTIVE_VIDEO_VALUES,
    inactiveVideoValues: INACTIVE_VIDEO_VALUES,
    activeJobValues: ACTIVE_JOB_VALUES,
    inactiveJobValues: INACTIVE_JOB_VALUES,
    activeJobKeys: ACTIVE_JOB_KEYS,
    inactiveJobKeys: INACTIVE_JOB_KEYS,
    allJobValues: {...ACTIVE_JOB_VALUES, ...INACTIVE_JOB_VALUES},
    allActiveValues: ALL_ACTIVE_VALUES,
    allInactiveValues: ALL_INACTIVE_VALUES,
    determineInactiveStatus,
};
