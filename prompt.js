/**
 * Prompts the user to input a date.
 *
 * Provides the current date formatted according to the dateFmt option as the default value.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} promptText - The text to display in the prompt
 * @param {string} dateFmt - (Optional) Moment.js date format string, default: YYYY-MM-DD HH:mm
 * @return {string} The user input date string
*/
async function promptForDate(tp, promptText, dateFmt) {
    dateFmt = dateFmt ?? "YYYY-MM-DD HH:mm";
    return await tp.system.prompt(promptText, tp.date.now(dateFmt), false, false);
}

/**
 * Prompts the user to input yes or no for the given prompt text.
 *
 * Displays the prompt text along with "Y/n" or "y/N" and a default "y" or "n" value
 * based on the yes parameter.
 *
 * @param {Object} tp - Templater instance
 * @param {string} promptText - The text to display in the prompt
 * @param {boolean} yes - (Optional) True if yes should be the default
 * @return {string} The user input string "y" or "n"
 */
async function promptYesOrNo(tp, promptText, yes) {
    const yesNoText = yes ? ("Y/n") : ("y/N");
    const yesNoValue = yes ? "y" : "n";
    const reply = await tp.system.prompt(`${promptText} ${yesNoText}`, yesNoValue);
    return reply && reply.toLowerCase() === "y" ? true : false;
}

module.exports = {
    promptForDate,
    promptYesOrNo,
};
