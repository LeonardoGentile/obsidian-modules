// eslint-disable-next-line require-jsdoc
function StringSet(iterable) {
    if (iterable !== undefined)
        this.checkType(iterable);
    this.set = new Set(iterable);
}

// Ensures all items are strings
StringSet.prototype.checkType = function(items) {
    if (!Array.isArray(items))
        throw new TypeError("Items must be an array of strings.");

    items.forEach(item => {
        if (typeof item !== "string")
            throw new TypeError("All items must be strings.");
    });
};

// Adds a single/multiple item with type checking
StringSet.prototype.add = function(items) {
    let itemsArray = [];
    if (!Array.isArray(items)) {
        itemsArray.push(items)
    }
    else {
        itemsArray = items
    }
    this.checkType(itemsArray);
    itemsArray.forEach(item => {
        this.set.add(item);
    });
};

// Deletes a single item without needing type checking
StringSet.prototype.delete = function(item) {
    return this.set.delete(item);
};

// Checks for existence of an item in the set
StringSet.prototype.has = function(item) {
    return this.set.has(item);
};

// Clears all items from the set
StringSet.prototype.clear = function() {
    return this.set.clear();
};


// Removes multiple items
StringSet.prototype.deleteMultiple = function(items) {
    items.forEach(item => {
        this.set.delete(item);
    });
};

// Replace an element with the provided one
StringSet.prototype.replace = function(oldItem, newItem) {
    this.checkType([newItem]);
    this.set.delete(oldItem);
    this.set.add(newItem);
};

// Replace all current set elements with the provided ones
StringSet.prototype.replaceWith = function(items) {
    this.checkType(items);
    this.set.clear();
    this.add(items);
};

// String representation
StringSet.prototype.asString = function() {
    return JSON.stringify(Array.from(this.set));
};

// Array representation
StringSet.prototype.toArray = function() {
    return Array.from(this.set);
};

module.exports = StringSet;
