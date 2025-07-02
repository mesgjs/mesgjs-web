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

import { MWISSRVNode } from '../MWISSRVNode.esm.js';

/**
 * Handler for HTML primitive elements (h.*)
 * Provides direct HTML element creation for developers
 * who need low-level control over the rendered HTML
 */
export class HTMLPrimitiveHandler {
    /**
     * Creates a new HTML primitive handler
     * @param {string} type - The component type (e.g., 'h.div', 'h.span')
     */
    constructor(type) {
        this.type = type;
    }

    /**
     * Renders an HTML primitive element
     * @param {Object} data Component input data
     * @param {Object} context Rendering context
     * @returns {Promise<MWISSRVNode>} The rendered node
     */
    async render(data, context) {
        // Set the tag option to the actual HTML tag name
        const opts = {
            ...data.opts,
            tag: this.type.replace(/^h\./, '')
        };

        // For h.* primitives, we pass through the data structure
        // letting components control what gets rendered
        const renderData = [
            this.type,
            data.attrs || {},
            ...(data.children || [])
        ];

        // Let VNode handle the data parsing and initial setup
        return MWISSRVNode.fromData(renderData, opts);
    }
}

/**
 * Factory function to create HTML primitive handlers
 * @param {string} type - The component type (e.g., 'h.div')
 * @returns {HTMLPrimitiveHandler} A new handler instance
 */
export function createHTMLPrimitiveHandler(type) {
    return new HTMLPrimitiveHandler(type);
}