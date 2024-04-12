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
 * @param {boolean} assumeYes - (Optional) True if yes should be the default
 * @return {string} The user input string "y" or "n"
 */
async function promptYesOrNo(tp, promptText, assumeYes) {
    const yesNoText = assumeYes ? ("Y/n") : ("y/N");
    const yesNoValue = assumeYes ? "y" : "n";
    const reply = await tp.system.prompt(`${promptText} ${yesNoText}`, yesNoValue);
    return reply ? reply.toLowerCase() === "y" : false;
}

/**
 * Prompts the user for input for any fields of type "input".
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - Field object
 * @param {string} defaultValue - Default placeholder value
 * @return {Object} Object with key/value pairs for input field values
*/
async function promptForInputField(tp, field, defaultValue) {
    const result = await tp.system.prompt(`${field.name}?`, defaultValue || "");
    return result;
}

/**
 * Gets user input values for a YAML field.
 *
 * @param {Object} tp - Templater instance
 * @param {Object} field - The YAML field object
 * @param {string} defaultValue - Default placeholder value
 * @return {Object} Object with key/value pairs for field values
*/
async function promptForYamlField(tp, field, defaultValue) {
    const result = await tp.system.prompt(`${field.name}?`, defaultValue || "");
    return result;
}

module.exports = {
    promptForDate,
    promptYesOrNo,
    promptForInputField,
    promptForYamlField,
};
