/**
 * Original: https://zachyoung.dev/posts/templater-multi-select-suggester
 * JA - Added sorting and ability to append new tags
 */

/**
 * Spawns a multi-select suggester prompt and returns the user's chosen items.
 * @template T The type of items in the array.
 * @param {object} tp Templater tp object.
 * @param {string[]} textItems Array of strings or function
 * that maps an item to its text representation for each item in the suggester prompt.
 * @param {string[]} items Array containing values of each item in correct order.
 * @param {boolean} throwOnCancel If true, throws error if prompt is canceled instead
 * of returning null.
 * @param {string} placeholder Placeholder string for the prompt.
 * @param {number} limit Limit on number of items rendered at once (improves performance
 * when displaying large lists).
 * @param {string} sort Sorts list alphabetically ("alpha"), by occurrence descending
 * ("occurrence"), or by occurrence ascending ("occurrence|asc").
 * @param {string} newItemName Identifier for an item that triggers new item creation when selected
 * @return {Promise<T[]>} A list of selected 'items' based on user input from suggester prompt.
 */
async function multiSuggester(
    tp,
    textItems,
    items,
    throwOnCancel = false,
    placeholder = "",
    limit = undefined,
    sort = "",
    newItemName = "-- New --",
) {
    // List of items that are selected in the suggester
    const selectedItems = [];
    switch (sort) {
        // Sorted alphabetically
        case "alpha":
            items = items.sort( (a, b) => a[0].localeCompare(b[0]) );
            break;
        // Sorted by occurance
        case "occurance":
            items = items.sort( (a, b) => b[1] - a[1], "desc" );
            break;
        // Sorted by occurance ascending
        case "occurance|asc":
            items = items.sort( (a, b) => b[1] - a[1], "asc" );
            break;
    }
    // Looping to keep suggester modal open until escape is pressed
    while (true) {
        const selected = await tp.system.suggester(
            textItems,
            items,
            throwOnCancel,
            placeholder,
            limit,
        );
        // If escape is pressed, break out of loop to close suggester modal
        if (!selected)
            break;

        // Hack to create a new item
        const selectedItem = Array.isArray(selected) ? selected[0] : selected;
        if (selectedItem === newItemName) {
            const value = await tp.system.prompt("New item");
            selectedItems.push([`#${value}`, 0]);
            continue;
        }

        // Otherwise, add selected item to list of selected items, remove item from multi-
        // select, and keep looping
        selectedItems.push(selectedItem);
        const selectedItemIndex = items.findIndex(item => item === selectedItem);
        if (selectedItemIndex >= 0) {
            items.splice(selectedItemIndex, 1);
            if (Array.isArray(textItems))
                textItems.splice(selectedItemIndex, 1);
        }

        if (!textItems.length)
            break;
    }

    return selectedItems;
}

/**
 * Provides a tag suggester that allows creating new tags.
 *
 * @param {object} tp - Templater object
 * @return {Promise<string>} The selected tag name
 */
async function tagSuggester(tp) {
    const tags = Object.keys(app.metadataCache.getTags());
    let selection = await tp.system.suggester(["✨New✨", ...tags], ["✨New✨", ...tags]);
    if (selection === "✨New✨")
        selection = await tp.system.prompt("New tag");

    return selection;
}

/**
 * Prompts the user to select tags adding to any existing tags.
 *
 * @param {Object} tp - Templater instance
 * @param {Array<string>} exclude - (Optional) Array of tags to exclude
*/
async function multiTagSuggester(tp, exclude) {
    // Tags to suppress
    const tagNames = new Set(
        Object.keys(app.metadataCache.getTags())
            .map(t => t.replace("#", "")));
    if (exclude)
        exclude.forEach(t => tagNames.delete(t));

    // Item that enables the creation of new tags
    const newItem = "-- New --";
    const tags = Array.from(tagNames);
    tags.unshift(newItem);

    const selection = await multiSuggester(
        tp, tags, tags, false,
        "Choose tags (<Enter> to make new, ESC when finished)",
    );

    return selection;
}

/**
 * Prompts the user to select tags for the given field from a filtered list of
 * options, adding to any existing tags on the file class.
 *
 * @param {Object} tp - Templater instance
 * @param {string} path - Values list note path
 * @param {Object} fileClass - File class instance
 * @return {Array} Array of selected tag strings
*/
async function multiTagFieldSuggester(tp, path, fileClass) {
    const fieldOptions = await metadata.getOptionsFromValuesListNotePath(path);
    const fileClassTagList = fileClass.tagNames;
    const filteredTags = fieldOptions.filter(t => !fileClassTagList.includes(t));

    const selectedTags = await multiSuggester(
        tp,
        t => t.replace("#", ""),
        filteredTags,
        false,
        "Choose tags (ESC when finished)",
        undefined,
        "occurance",
    );

    return Array.from(new Set([...selectedTags, ...fileClassTagList]));
}

module.exports = {
    multiSuggester,
    multiTagSuggester,
    multiTagFieldSuggester,
    tagSuggester,
};
