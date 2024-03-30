const illegalCharacterRegex = /[:\?!\|#‘’\'\"\.,+%&=\(\)\\/]/g;

/**
 * Capitalize all words in a string delimited by spaces
 * @param {string} text
 * @return {string} text with all words capitalized
 */
function capitalize(text) {
    return capitalizeWords(text.split(" ")).join(" ");
}

/**
 * Capitalize each word in an array
 * @param {Array<string>} arr
 * @return {Array<string>}
 */
function capitalizeWords(arr) {
    return arr.map(word => capitalizeWord(word));
}

/**
 * Capitalize the first letter in a word
 * @param {string} word
 * @return {string}
 */
function capitalizeWord(word) {
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
}

/**
 * Transforms text into a consitent filename.
 * All characters are lowercased and words separated by dashes.
 * @param {string} text - Text to transform into a filename.
 * @return {string} - The text suitable for use as a filename.
 */
function textToFilename(text, stringify) {
    if(stringify)
        return sanitizeText(text)
            .replace(/ /g, "-").toLowerCase()
            .replace(/[--]+/g, "-");
    return sanitizeText(text)
}

/**
 * Sanitizes the given text, removing unwanted characters.
 * @param {string} text - The text to sanitize.
 * @return {string} - The sanitized text, lowercased.
 */
function sanitizeText(text) {
    return text.replace(illegalCharacterRegex, "")
        .toLowerCase()
        .replace(/[  ]+/g, " ");
}

module.exports = {
    capitalize,
    capitalizeWords,
    capitalizeWord,
    textToFilename,
    sanitizeText,
};
