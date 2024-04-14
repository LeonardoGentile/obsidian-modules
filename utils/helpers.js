function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = Array.isArray(source[key]) ? [] : {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }

  return deepMerge(target, ...sources);
}


/**
 * Recursively merges properties of multiple source objects into a single target object.
 * @param {object} target - The target object to merge into.
 * @param {...object} sources - The source objects to merge.
 * @returns {object} The merged object.
 */
function deepMergeExt(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key] || typeof target[key] !== 'object') {
          // Create a new object or array in the target if it doesn't exist or is not an object
          target[key] = Array.isArray(source[key]) ? [] : {};
        }
        // Recursively merge nested objects or arrays
        deepMerge(target[key], source[key]);
      } else {
        // Copy non-object properties directly
        target[key] = source[key];
      }
    }
  }

  // Recursively merge remaining sources into the target
  return deepMerge(target, ...sources);
}


/**
 * Creates a deep copy of an object.
 * @param {object} obj - The object to copy.
 * @returns {object} The deep copy of the object.
 */
function deepCopy(obj) {
  if (typeof obj !== 'object' || obj === null) {
    // Base case: return primitive values directly
    return obj;
  }

  // Create a new object or array based on the type of the original object
  const copy = Array.isArray(obj) ? [] : {};

  // Iterate over the properties of the original object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Recursively copy nested objects or arrays
      copy[key] = deepCopy(obj[key]);
    }
  }

  return copy;
}


// Assuming parentConfig and currentConfig are objects
// const mergedConfig = { ...deepCopy(parentConfig), ...deepCopy(currentConfig) };

module.exports = {
  deepCopy
}