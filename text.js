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

module.exports = {
    capitalize,
    capitalizeWords,
    capitalizeWord,
};
