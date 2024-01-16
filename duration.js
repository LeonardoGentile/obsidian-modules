
/**
 * Converts a number of seconds to a human-readable string containing years,
 * months, weeks, days, hours, minutes and seconds.
 *
 * Breaks down the total seconds into appropriate units, displaying the
 * largest units first and progressively smaller units, separated by colons.
 * Units with a value of 0 are omitted. Singular/plural unit names used
 * correctly (e.g. 1 day vs 2 days).
*
 * @param {number} seconds - Total number of seconds to convert
 * @return {string} Human-readable string representation of the duration
 * @example
 *   display(
 *       // 10 years
 *       eval(result.get("time-span"))
 *       // 5 seconds
 *       - 5)
 *   '9 years : 11 months : 3 weeks : 6 days : 23 hours : 59 minutes : 55 seconds'
 *
 *   display(
 *       // 10 years
 *        eval(result.get("time-span"))
 *        // 9 years
 *        - (3600 * 24 * 7 * 4 * 12 * 9)
 *        // 11 months
 *        - (3600 * 24 * 7 * 4 * 11)
 *        // 3 weeks
 *        - (3600 * 24 * 7 * 3)
 *        // 6 days
 *        - (3600 * 24 * 6)
 *        // 23 hours
 *        - (3600 * 23)
 *        // 59 minutes
 *        - (59 * 60)
 *        // 59 seconds
 *        - 59)
 *   '1 second'
*/
function display(seconds) {
    seconds = Number(seconds);

    const Y = Math.floor(seconds / (3600 * 24 * 7 * 4 * 12));
    const M = Math.floor(seconds % (3600 * 24 * 7 * 4 * 12) / (3600 * 24 * 7 * 4));
    const W = Math.floor(seconds % (3600 * 24 * 7 * 4) / (3600 * 24 * 7));
    const d = Math.floor(seconds % (3600 * 24 * 7) / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const yearDisplay = Y > 0 ? Y + (Y == 1 ? " year" : " years") + ([M, W, d, h, m, s].some(i => i > 0) ? " :" : "") : "";
    const monthDisplay = M > 0 ? ([Y].some(i => i > 0) ? (" " + M) : M) + (M == 1 ? " month" : " months") + ([W, d, h, m, s].some(i => i > 0) ? " :" : "") : "";
    const weekDisplay = W > 0 ? ([Y, M].some(i => i > 0) ? (" " + W) : W) + (W == 1 ? " week" : " weeks") + ([d, h, m, s].some(i => i > 0) ? " :" : "") : "";
    const dDisplay = d > 0 ? ([Y, M, W].some(i => i > 0) ? (" " + d) : d) + (d == 1 ? " day" : " days") + ([h, m, s].some(i => i > 0) ? " :" : "") : "";
    const hDisplay = h > 0 ? ([Y, M, W, d].some(i => i > 0) ? (" " + h) : h) + (h == 1 ? " hour" : " hours") + ([m, s].some(i => i > 0) ? " :" : "") : "";
    const mDisplay = m > 0 ? ([Y, M, W, d, h].some(i => i > 0) ? (" " + m) : m) + (m == 1 ? " minute" : " minutes") + ([s].some(i => i > 0) ? " :" : "") : "";
    const sDisplay = s > 0 ? ([Y, M, W, d, h, m].some(i => i > 0) ? (" " + s) : s) + (s == 1 ? " second" : " seconds") : "";

    return (
        yearDisplay +
        monthDisplay +
        weekDisplay +
        dDisplay +
        hDisplay +
        mDisplay +
        sDisplay
    );
}

module.exports = {
    display,
};
