const illegalCharacterRegex = /[:\?!\|#‘’\'\"\.,+%&=\(\)\\/]/g;

/**
 * Transforms text into a consitent filename.
 * All characters are lowercased and words separated by dashes.
 * @param {string} text - Text to transform into a filename.
 * @return {string} - The text suitable for use as a filename.
 */
function textToFilename(text) {
    return sanitizeText(text)
        .replace(/ /g, "-").toLowerCase()
        .replace(/[--]+/g, "-");
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
    textToFilename,
    sanitizeText,
};
