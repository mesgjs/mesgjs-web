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
    constructor(...sources) {
        super();

        for (const source of sources) {
            if (!source) {
                continue;
            }

            if (typeof source === 'string') {
                for (const item of source.split(/\s+/)) {
                    if (item) {
                        this.add(item);
                    }
                }
            } else if (typeof source[Symbol.iterator] === 'function') {
                for (const item of source) {
                    if (item) {
                        this.add(item);
                    }
                }
            }
        }
    }

    /**
     * Returns the contents of the set as an array.
     * @returns {string[]}
     */
    toArray() {
        return [...this];
    }

    /**
     * Returns the contents of the set as a space-separated string.
     * @returns {string}
     */
    toString() {
        return this.toArray().join(' ');
    }
}

export { StringSet };