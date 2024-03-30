/**
* Gets the inheritance chain for a given file class.
*
* Traverses up the inheritance chain for the provided fileClassName,
* adding each class to an array. Reverses the array before returning
* so the chain starts with the topmost parent class.
*
* @param {string} fileClassName - The name of the file class to get the inheritance chain for
* @param {Object} fileClassData - Data container of file class data objects
* @return {Object[]} An array representing the inheritance chain, starting with the topmost parent class
*/
function getInheritanceChain(fileClassName, fileClassData) {
    const chain = [];
    let currentClassName = fileClassName;

    // Traverse up the inheritance chain
    while (currentClassName && fileClassData[currentClassName]) {
        const currentClass = fileClassData[currentClassName];
        chain.push({ [currentClassName]: currentClass }); // Add the current class to the chain
        currentClassName = currentClass.extends; // Move up the chain
    }

    // Reverse the chain to start with the topmost parent
    return chain.reverse();
}

/**
* Merges arrays from chained objects into a single array.
*
* Loops through each object in the chain, gets the array value for the specified property name,
* and adds each item to the merged array using the uniqueKey as the key if provided.
*
* @param {Array} chain - The array of chained objects
* @param {string} propertyName - The property name to get the array from each object
* @param {string} uniqueKey - Optional unique key to use as the key when merging items
* @return {Array} The merged array
*/
function mergeArrayFromChain(chain, propertyName, uniqueKey) {
    const excludes = new Set();
    // Build up the map of excluded field names
    for (let i = chain.length - 1; i >= 0; i--) {
        const classObj = chain[i];
        const className = Object.keys(classObj)[0];
        const classData = classObj[className];
        if (classData.excludes)
            classData.excludes.forEach(p => excludes.add(p));
    }

    const mergedObject = {};
    for (let i = chain.length - 1; i >= 0; i--) {
        const classObj = chain[i];
        const className = Object.keys(classObj)[0];
        const classData = classObj[className];
        const propertyValues = classData[propertyName];
        const filteredProps = propertyValues?.filter(p => !excludes.has(p.name));
        if (Array.isArray(filteredProps)) {
            for (const item of filteredProps) {
                // Take the first item if 2+ items being merged have the same name
                // to prevent duplicates
                let duplicateItem;
                for (const mergedItem of Object.values(mergedObject)) {
                    if (mergedItem.name && item.name && mergedItem.name === item.name) {
                        duplicateItem = true;
                        break;
                    }
                }
                if (duplicateItem)
                    continue;
                const key = item[uniqueKey] || className;
                mergedObject[key] = item;
            }
        }
    }
    return Object.values(mergedObject);
}

/**
 * Merges arrays from chained objects into a single array.
 *
 * Loops through each object in the chain, gets the array value for the specified property name,
 * and adds each item to the merged array.
 *
 * @param {Array} chain - The array of chained objects
 * @param {string} propertyName - The property name to get the array from each object
 * @return {Array} The merged array
*/
function mergeOrderFromChain(chain, propertyName) {
    const mergedArray = [];
    for (const classObj of chain) {
        const className = Object.keys(classObj)[0];
        const classData = classObj[className];
        const propertyValues = classData[propertyName];
        if (Array.isArray(propertyValues)) {
            for (const item of propertyValues)
                mergedArray.push(item);
        }
    }
    return mergedArray;
}

/**
 * Sorts an array of field objects based on their order defined in a separate array.
 *
 * Creates a map for quick lookup of each field's sort order index.
 * Sorts the fields array, comparing the index for each field.
 * Fields not found in the order array will be placed at the end.
 *
 * @param {Object[]} fields - Array of field objects to sort
 * @param {string[]} fieldsOrder - Array of field IDs in desired order
 * @return {Object[]} New array containing sorted fields
*/
function sortFieldsByOrder(fields, fieldsOrder) {
    // Create a map for quick lookup of field index by id
    const orderMap = new Map(fieldsOrder.map((id, index) => [id, index]));

    // Sort the fields based on the index defined in fieldsOrder
    // If a field's id is not found in fieldsOrder, it will be placed at the end
    const sortedFields = fields.sort((a, b) => {
        const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : fieldsOrder.length;
        const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : fieldsOrder.length;
        return indexA - indexB;
    });

    return sortedFields;
}

/**
 * Merges metadata fields from a file class inheritance chain.
 *
 * Traverses the inheritance chain for a given file class, merges metadata
 * fields and field order arrays from all classes in the chain, giving priority
 * to bottom-most classes.
 *
 * @param {Object} fileClassData - Data container of file class data objects
 * @return {Object} An object with the merged fields and metadata
 */
function mergeFieldsWithInheritance(fileClassData) {
    const mergedItems = [];
    for (const fileClassName of Object.keys(fileClassData)) {
        // Chain together the hierarchy of file class objects
        const chain = getInheritanceChain(fileClassName, fileClassData);

        const mergedItem = {};

        // Merge fields using 'id' as the unique key
        mergedItem.fields = mergeArrayFromChain(chain, "fields", "id");

        // Merge fieldsOrder directly since it's an array of strings (identifiers)
        mergedItem.fieldsOrder = mergeOrderFromChain(chain, "fieldsOrder");

        // Sort the fields
        sortFieldsByOrder(mergedItem.fields, mergedItem.fieldsOrder);

        // The bottom-most item is the last in the chain
        const bottomMostClassName = Object.keys(chain[chain.length - 1])[0];
        const bottomMostClassData = chain[chain.length - 1][bottomMostClassName];

        // Copy the bottom-most item's data to the merged item
        // Avoiding direct copy of fields and fieldsOrder as they are already merged
        for (const key in bottomMostClassData) {
            if (key !== "fields" && key !== "fieldsOrder")
                mergedItem[key] = bottomMostClassData[key];
        }

        // Add the class name to the merged item
        mergedItem.className = bottomMostClassName;

        // Add the items to the return value
        mergedItems.push(mergedItem);
    }

    return mergedItems;
}


module.exports = {
    sortFieldsByOrder,
    getInheritanceChain,
    mergeArrayFromChain,
    mergeOrderFromChain,
    mergeFieldsWithInheritance
};
