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

import { MWIVNodeStorage } from 'mesgjs-web/src/shared/MWIVNodeStorage.esm.js';

/**
 * Base VNode class that provides the core virtual node functionality.
 * Handles attribute management, class manipulation, and style handling
 * with copy-on-write protection.
 */
export class MWIVNode {
    /** @type {string} Node type - immutable after construction */
    #type;
    /** @type {object} Node options - immutable after construction */
    #opts;
    /** @type {MWIVNodeStorage} Internal storage with copy-on-write */
    #storage;
    /** @type {Array<MWIVNode|string>} Child nodes */
    children;
    /** @type {string|undefined} Optional scope prefix for @@ replacements */
    scope;

    /**
     * Create a new VNode
     * @param {string} type Node type (e.g., 'h.div', 'h.span')
     * @param {object} opts Additional options
     */
    constructor (type, opts = {}) {
        if (typeof type !== 'string' || !/^[a-zA-Z0-9@:.+-]+$/.test(type)) {
            throw new TypeError(`Invalid virtual node name: ${type}`);
        }
        this.#type = type;
        this.#opts = Object.freeze({...opts});
        this.#storage = new MWIVNodeStorage();
        this.children = [];
        this.scope = undefined;
    }

    /**
     * Get the node type
     * @returns {string}
     */
    get type () {
        return this.#type;
    }

    /**
     * Get the node options
     * @returns {object}
     */
    get opts () {
        return this.#opts;
    }

    /**
     * Get the attributes Map
     * @returns {Map}
     */
    get attributes () {
        return {
            entries: () => this.#storage.getAttributes()
        };
    }

    // Attribute Methods

    /**
     * Get an attribute value
     * @param {string} name The attribute name
     * @returns {any} The attribute value
     */
    getAttr (name) {
        switch (name) {
        case 'class':
            return this.#storage.getClassString() || undefined;
        case 'style':
            return this.#storage.getStyleString() || undefined;
        default:
            return this.#storage.getAttr(name);
        }
    }

    /**
     * Set an attribute value
     * @param {string} name The attribute name
     * @param {any} value The attribute value
     * @returns {this}
     */
    setAttr (name, value) {
        switch (name) {
        case 'class':
            this.clearClass();
            if (value) this.editClass(value);
            break;
        case 'style':
            this.clearStyle();
            if (value) this.editStyle(value);
            break;
        default:
            if (value === false || value === null) {
                this.#storage.deleteAttr(name);
            } else if (/^[a-zA-Z0-9_-]+$/.test(name)) {
                this.#storage.setAttr(name, value);
            }
        }
        return this;
    }

    // Class Methods

    /**
     * Add/edit classes based on Arrays or space-separated strings
     * @param {...(string|string[])} namesList Class names to add
     * @returns {this}
     */
    editClass (...namesList) {
        for (let names of namesList.flat(Infinity)) {
            if (typeof names === 'string') {
                names = names.split(/\s+/).filter(Boolean);
            }
            if (Array.isArray(names)) {
                for (const name of names) {
                    if (name.startsWith('!')) {
                        this.#storage.removeClass(name.slice(1));
                    } else if (/^[a-zA-Z0-9@_-]+$/.test(name)) {
                        this.#storage.addClass(name);
                    }
                }
            }
        }
        return this;
    }

    /**
     * Remove classes
     * @param {...(string|string[])} namesList Class names to remove
     * @returns {this}
     */
    removeClass (...namesList) {
        for (let names of namesList.flat(Infinity)) {
            if (typeof names === 'string') {
                names = names.split(/\s+/).filter(Boolean);
            }
            if (Array.isArray(names)) {
                for (const name of names) {
                    this.#storage.removeClass(name);
                }
            }
        }
        return this;
    }

    /**
     * Clear all classes
     * @returns {this}
     */
    clearClass () {
        this.#storage.clearClasses();
        return this;
    }

    // Style Methods

    /**
     * Add/edit styles
     * @param {...any} styleSpec Style specifications
     * @returns {this}
     */
    editStyle (...styleSpec) {
        if (styleSpec.length === 2 && typeof styleSpec[0] === 'string') {
            const [key, value] = styleSpec;
            // Normalize key to camelCase
            const camelKey = MWIVNode.toCamelCase(key);
            styleSpec = [{ [camelKey]: value }];
        }
        if (styleSpec.length === 1) {
            if (typeof styleSpec[0] === 'string') {
                const [styles] = styleSpec;
                styleSpec = [MWIVNode.parseStyles(styles)];
            }
            if (typeof styleSpec[0] === 'object') {
                const [styleObj] = styleSpec;
                const entries = (typeof styleObj?.entries === 'function')
                    ? styleObj.entries()
                    : Object.entries(styleObj);
                for (const [key, value] of entries) {
                    if (/^[a-zA-Z0-9_-]+$/.test(key)) {
                        // Convert to camelCase for storage
                        const camelKey = MWIVNode.toCamelCase(key);
                        this.#storage.setStyle(camelKey, value || null);
                    }
                }
            }
        }
        return this;
    }

    /**
     * Clear all styles
     * @returns {this}
     */
    clearStyle () {
        this.#storage.clearStyles();
        return this;
    }

    // Child Management

    /**
     * Append children to this node
     * @param {...(MWIVNode|string)} children Children to append
     * @returns {this}
     */
    append (...children) {
        this.children.push(...children);
        return this;
    }

    // Static Methods

    /**
     * Create a VNode from structured data
     * @param {Array|object} data Input data
     * @param {object} [opts={}] Node options
     * @returns {MWIVNode|undefined}
     */
    static fromData (data, opts = {}) {
        if (Array.isArray(data)) {
            const [type, ...rest] = data;
            if (typeof type !== 'string') return undefined;

            const node = new this(type, opts);
            for (const item of rest) {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const entries = (typeof item.entries === 'function')
                        ? item.entries()
                        : Object.entries(item);
                    for (const [key, value] of entries) {
                        node.setAttr(key, value);
                    }
                } else {
                    node.children.push(item);
                }
            }
            return node;
        }
        // Handle NANOS format
        if (typeof data?.values === 'function' && typeof data?.namedEntries === 'function') {
            const [type, ...children] = data.values();
            if (typeof type !== 'string') return undefined;

            const node = new this(type, opts);
            node.children.push(...children);
            for (const [key, value] of data.namedEntries()) {
                node.setAttr(key, value);
            }
            return node;
        }
        return undefined;
    }

    /**
     * Parse a style string into a Map
     * @param {string} styleString CSS style string
     * @returns {Map<string, string>}
     */
    static parseStyles (styleString) {
        const result = new Map();
        const regex = /(?:^|;)\s*([^\s:;]+)\s*:\s*((?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^;])*)/g;
        for (const m of styleString.matchAll(regex)) {
            const key = m[1];
            if (key) {
                let value = m[2].trim();
                if (value.endsWith(';')) {
                    value = value.slice(0, -1).trim();
                }
                // Normalize kebab-case to camelCase
                const camelKey = MWIVNode.toCamelCase(key);
                result.set(camelKey, value);
            }
        }
        return result;
    }

    /**
     * Convert kebab-case to camelCase, *inline*-flagging vendor prefixes (e.g. -webkit-animation => -webkitAnimation)
     * https://developer.mozilla.org/en-US/docs/Glossary/Vendor_Prefix
     * @param {string} str The input string
     * @returns {string} The camelCase version
     */
    static toCamelCase (str) {
        const [, flag, kebab] = str.match(/^(-?)(.*)/);
        return flag + kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }

    /**
     * Convert camelCase to kebab-case
     * @param {string} str The input string
     * @returns {string} The kebab-case version
     */
    static toKebabCase (str) {
        return str.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    }

    /**
     * Merge attributes from a source to a target VNode based on a policy.
     * @param {object|Map} sourceAttrs The attributes to merge from.
     * @param {string} policyString The policy for merging (e.g., "id,class", "@not:style").
     * @param {MWIVNode} targetVNode The VNode to merge attributes onto.
     */
    static mergeAttributes (sourceAttrs, policyString, targetVNode) {
        const deny = policyString.startsWith('@not:');
        const policySet = new Set((deny ? policyString.slice(5) : policyString).split(',').map(s => s.trim()).filter(Boolean));
        const entries = (typeof sourceAttrs?.entries === 'function')
            ? sourceAttrs.entries()
            : Object.entries(sourceAttrs);

        for (const [key, value] of entries) {
            const isAllowed = deny ? !policySet.has(key) : policySet.has(key);
            if (!isAllowed) continue;

            if (key === 'class') {
                targetVNode.editClass(value);
            } else if (key === 'style') {
                targetVNode.editStyle(value);
            } else {
                targetVNode.setAttr(key, value);
            }
        }
    }
}
