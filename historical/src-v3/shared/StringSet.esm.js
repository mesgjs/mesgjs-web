/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * A Set-like utility for managing unique strings, particularly CSS classes.
 *
 * @license MIT
 */

/**
 * A Set that can be constructed from strings, arrays, and other iterables,
 * automatically splitting whitespace-separated strings.
 * @extends Set
 */
class StringSet extends Set {
    /**
     * @param {...(string|Array|Set|undefined|null)} sources A variable list
     *   of sources to populate the set. Strings will be split by whitespace.
     */
    constructor (...sources) {
        super();

        this.add(...sources);
    }

    add (...items) {
        for (const item of items) {
            if (typeof item === 'string') {
                // Split whitespace-separated strings into individual items
                for (const part of item.split(/\s+/)) {
                    if (part) {
                        super.add(part);
                    }
                }
            } else if (item instanceof StringSet || item instanceof Set) {
                // Add all items from another StringSet or Set
                for (const part of item) {
                    super.add(part);
                }
            } else if (item) {
                // Add single non-empty items directly
                super.add(item);
            }
        }
        return this;
    }

    /**
     * Returns the contents of the set as an array.
     * @returns {string[]}
     */
    toArray () {
        return [...this];
    }

    /**
     * Returns the contents of the set as a space-separated string.
     * @returns {string}
     */
    toString () {
        return this.toArray().join(' ');
    }
}

export { StringSet };