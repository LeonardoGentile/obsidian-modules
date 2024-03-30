/**
 * Filters an array of field objects by name and type.
 *
 * @param {Object[]} fieldsToFilter - Array of field objects to filter
 * @param {Array} names - Field name(s) to match
 * @param {string} type - Field type to match (case insensitive)
 * @return {Object[]} Filtered array containing only fields matching name and type
*/
function filterFieldsByNameAndType(fieldsToFilter, names, type) {
  const filteredFields = fieldsToFilter.filter(field => {
      const fieldType = field.type.toLowerCase();
      const fieldName = field.name.toLowerCase();
      return fieldType === type && names.map(n => n.toLowerCase()).includes(fieldName);
  });
  return filteredFields;
}

/**
 * Filters an array of fields by excluding fields whose IDs match the given array of field IDs to exclude.
 *
 * @param {Object[]} fieldsToFilter - Array of field objects to filter
 * @param {Object[]} fieldsToExclude - Array of field objects to exclude
 * @return {Object[]} Filtered array of field objects
*/
function filterFieldsById(fieldsToFilter, fieldsToExclude) {
  // Create a Set of ids from the fieldsToExclude array for efficient lookup
  const excludeFieldIds = new Set(fieldsToExclude.map(field => field.id));

  // Filter out fields whose ids are in the excludeFieldIds Set
  const filteredFields = fieldsToFilter.filter(field => !excludeFieldIds.has(field.id));

  return filteredFields;
}

module.exports = {
  filterFieldsByNameAndType,
  filterFieldsById
};