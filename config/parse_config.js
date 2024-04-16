const {OPTIONS} = self.require("_modules/config/settings.js");
const { parseTemplateString } = self.require("_modules/templater/template.js");
const { deepCopy } = self.require("_modules/utils/helpers.js");

/**
 * Parses a key to extract the field name and operation.
 * @param {string} key - The key to parse.
 * @returns {Object} An object containing the full name, field name, and operation if the key matches the expected pattern,
 *                   or an object with field name and operation set to null if the key does not match the pattern.
 */
function _parseFieldName(key) {
    // Regular expression to match keys with the pattern _field_name_add
    const regex = /^_([^_]+(?:_[^_]+)*)_(add|replace|delete)$/;

    // Check if the key matches the expected pattern
    const match = regex.exec(key);
    if (match) {
        // Extract the field name and operation
        const [, fieldName, operation] = match;
        return { fullName: key, fieldName, operation };
    } else {
        // Key doesn't match the expected pattern, return an object with null values
        return { fullName: key, fieldName: null, operation: null };
    }
}

/**
 * Handles the addition of fields from the current configuration object to the merged configuration object.
 * @param {Object} mergedConfig - The merged configuration object.
 * @param {Object} currentConfig - The current configuration object.
 */
function _handleFieldsModifiers(mergedConfig, currentConfig) {
    Object.keys(currentConfig).forEach((key) => {
        // Because the merged arrays already contains the items from the parent
        const { fullName, fieldName, operation } = _parseFieldName(key);
        const parentField = mergedConfig[fieldName] || [];
        const currentField = currentConfig[fullName];
        let index = null;

        if (!Array.isArray(parentField))
            return
        if (operation === 'add' && Array.isArray(currentField)) {
            // Push all items from the current object to the merged array
            parentField.push(...currentField);
        }
        else if (operation === 'replace' && typeof currentField === 'object') {
            for (const [orig_value, new_value] of Object.entries(currentField)) {
                // Find the index of the value to be replaced
                index = parentField.indexOf(orig_value);
                // Check if the value exists in the array
                if (index !== -1) {
                    // Replace the value at the found index with the new value
                    parentField[index] = new_value;
                }
            }
        }
        else if (operation === 'delete' && Array.isArray(currentField)) {
            currentField.forEach((itemToRemove, index) => {
                // Find the index of the value to be removed
                index = parentField.indexOf(itemToRemove);
                // If the value exists in the array, remove it
                if (index !== -1) {
                    parentField.splice(index, 1);
                }
            })
        }
    });
}

/**
 * Merges two configuration objects, prioritizing the fields from the
 * current configuration over the parent configuration.
 * This is used for all type of options within the config object (prompts/views/etcr)
 * @param {Object} parentConfig - The parent configuration object.
 * @param {Object} currentConfig - The current configuration object.
 * @returns {Object} The merged configuration object.
 */
function _mergeObjects(parentConfig, currentConfig) {
    if (!parentConfig) parentConfig = {};
    if (!currentConfig) currentConfig = {};
    // Merge (deep) the configs using the spread/rest operator
    const mergedConfig = { ...deepCopy(parentConfig), ...deepCopy(currentConfig) };
    _handleFieldsModifiers(mergedConfig, currentConfig);

    return mergedConfig
}

/**
 * Compiles plain strings into tagged template literals and execute them by injecting values
 * @param {string} tplStr - The current plain string to process.
 * @param {string} type - The MDM class type of the configuration being processed.
 */
function _compileTemplate(tplStr, type) {
    // Transform the plain string into a tagged template
    const compiledTemplate = parseTemplateString(tplStr)({
        // TODO: inject other vars here
        type,
    });
    return compiledTemplate
}

/**
 * Recursively processes a configuration object, compiling string properties containing a dollar sign ($) into tagged templates
 * @param {Object|Array} configObj - The configuration object to process.
 * @param {string} type - The type parameter to pass along the recursion.
 */
function processTemplates(configObj, type) {
    // Exit early if configObj is null or undefined
    if (!configObj) {
        return;
    }

    if (Array.isArray(configObj)) {
        // Loop through each item in the array
        for (let i = 0; i < configObj.length; i++) {
            if (typeof configObj[i] === 'string' && configObj[i].includes('$')) {
                // Execute _compileTemplate and update the string in the array
                configObj[i] = _compileTemplate(configObj[i], type);
            }
            // If the item is an object or array, recursively process it
            else if (typeof configObj[i] === 'object' || Array.isArray(configObj[i])) {
                processTemplates(configObj[i], type);
            }
        }
    }
    // If configObj is an object
    else if (typeof configObj === 'object') {
        for (const [key, value] of Object.entries(configObj)) {
            // Skip null values
            if (value === null) {
                continue;
            }
            // If the value is a string containing '$', compile the template
            if (typeof value === 'string' && value.includes('$')) {
                configObj[key] = _compileTemplate(value, type);
            }
            // If the value is an object or array, recursively process it
            else if (typeof value === 'object' || Array.isArray(value)) {
                processTemplates(value, type);
            }
        }
    }
}

/**
 * Parses the configuration object for a specific type, handling inheritance
 * and merging of configurations using recursion
 * @param {Object} allConfig - The object containing all configurations for different types.
 * @param {string} type - The type of configuration to parse.
 * @returns {Object} The parsed configuration object for the specified type.
 */
function parseConfig(allConfig, type) {
    // Base case: if the object doesn't exist or if the type
    // doesn't exist in the object, return an empty object
    let currentConfig;
    if (!allConfig || !allConfig[type]) {
        currentConfig = {}
    } else {
        currentConfig = allConfig[type];
    }

    // This needs to execute before inheritance
    processTemplates(currentConfig, type)

    // If the currentConfig doesn't have an '_extends' field, return it directly
    if (!currentConfig._extends) {
        return currentConfig;
    }

    // Recursively call parseConfig with the parent type
    const parentConfig = parseConfig(allConfig, currentConfig._extends);

    const mergedConfig = {}
    for (const [configType, configObj] of Object.entries(currentConfig)) {
        if (configType != "_extends" && typeof configObj === 'object' && configObj !== null) {
            // Merge the configs using the spread/rest operator
            mergedConfig[configType] = _mergeObjects(parentConfig[configType], currentConfig[configType]);
        }
        // Update the _extends property to point to the top-most object
        mergedConfig._extends = parentConfig._extends || currentConfig._extends;
    }
    return mergedConfig;
}

/**
 * Configurable object factory
 * @return {object|null} An object containing the parsed and computed config options
 *                       for all the MDM classes types contained in OPTIONS_CONFIG
 */
function generateConfig(allConfig) {
    const parsed_config = {}
    for (const [type, configObj] of Object.entries(allConfig)) {
        if (type != "_defaultConfig" && typeof configObj === 'object' && configObj !== null) {
            parsed_config[type] = parseConfig(allConfig, type);
            parsed_config[type]._type = type;
        }
    }
    parsed_config["_defaultConfig"] = deepCopy(allConfig._defaultConfig)
    return parsed_config
}

const PARSED_CONFIG = generateConfig(OPTIONS)

module.exports = {
    PARSED_CONFIG
}