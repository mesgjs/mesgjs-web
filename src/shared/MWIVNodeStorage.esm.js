/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 *
 * This file is part of the Mesgjs Web Interface (MWI).
 *
 * The MWI is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * @license MIT
 */

/**
 * Internal storage class for MWIVNode that implements copy-on-write protection.
 * Manages attributes, classes, and styles with efficient storage and mutation tracking.
 */
export class MWIVNodeStorage {
    #attributes;
    #classes;
    #styles;
    #copied;

    constructor () {
        this.#attributes = new Map();
        this.#classes = new Set();
        this.#styles = new Map();
        this.#copied = false;
    }

    /**
     * Ensures storage is mutable by creating copies if needed.
     * Called before any modification operation.
     * @private
     */
    ensureMutable () {
        if (!this.#copied) {
            this.#attributes = new Map(this.#attributes);
            this.#classes = new Set(this.#classes);
            this.#styles = new Map(this.#styles);
            this.#copied = true;
        }
    }

    // Attribute Methods

    /**
     * Get an attribute value
     * @param {string} name The attribute name
     * @returns {any} The attribute value or undefined
     */
    getAttr (name) {
        switch (name) {
        case 'class': this.getClassString(); break;
        case 'style': this.getStyleString(); break;
        }
        return this.#attributes.get(name);
    }

    /**
     * Set an attribute value
     * @param {string} name The attribute name
     * @param {any} value The attribute value
     */
    setAttr (name, value) {
        this.ensureMutable();
        this.#attributes.set(name, value);
    }

    /**
     * Delete an attribute
     * @param {string} name The attribute name
     */
    deleteAttr (name) {
        this.ensureMutable();
        this.#attributes.delete(name);
    }

    /**
     * Get all attributes as entries
     * @returns {IterableIterator<[string, any]>}
     */
    getAttributes () {
        this.getClassString();
        this.getStyleString();
        return this.#attributes.entries();
    }

    /**
     * Check if an attribute exists and its value is not undefined.
     * @param {string} name The attribute name
     * @returns {boolean}
     */
    has (name) {
        switch (name) {
        case 'class': this.getClassString(); break;
        case 'style': this.getStyleString(); break;
        }
        return this.#attributes.has(name) && this.#attributes.get(name) !== undefined;
    }

    // Class Methods

    /**
     * Add a class name
     * @param {string} name The class name
     */
    addClass (name) {
        this.ensureMutable();
        this.#classes.add(name);
    }

    /**
     * Remove a class name
     * @param {string} name The class name
     */
    removeClass (name) {
        this.ensureMutable();
        this.#classes.delete(name);
    }

    /**
     * Clear all classes
     */
    clearClasses () {
        this.ensureMutable();
        this.#classes.clear();
    }

    /**
     * Get class names as a space-separated string
     * Also updates the class attribute in the general collection
     * @returns {string}
     */
    getClassString () {
        const classString = Array.from(this.#classes).join(' ');
        if (classString) {
            this.setAttr('class', classString);
        } else {
            this.deleteAttr('class');
        }
        return classString;
    }

    /**
     * Check if a class exists
     * @param {string} name The class name
     * @returns {boolean}
     */
    hasClass (name) {
        return this.#classes.has(name);
    }

    // Style Methods

    /**
     * Set a style property
     * @param {string} property The style property
     * @param {string} value The style value
     */
    setStyle (property, value) {
        this.ensureMutable();
        if (value === null || value === '') {
            this.#styles.delete(property);
        } else {
            this.#styles.set(property, value);
        }
    }

    /**
     * Get a style property value
     * @param {string} property The style property
     * @returns {string|undefined}
     */
    getStyle (property) {
        return this.#styles.get(property);
    }

    /**
     * Clear all styles
     */
    clearStyles () {
        this.ensureMutable();
        this.#styles.clear();
    }

    /**
     * Get styles as a CSS string
     * Also updates the style attribute in the general collection
     * @returns {string}
     */
    getStyleString () {
        const styleString = Array.from(this.#styles.entries())
            .map(([key, value]) => {
                // Convert camelCase to kebab-case for output
                const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                return `${cssKey}: ${value};`
            })
            .join(' ');
        if (styleString) {
            this.setAttr('style', styleString);
        } else {
            this.deleteAttr('style');
        }
        return styleString;
    }
}