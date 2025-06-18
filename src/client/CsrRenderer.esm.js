/*
 * Copyright (c) 2024 Kappa Computer Solutions, LLC and Brian Katzung
 *
 * This file is part of the Mesgjs Web Interface (MWI) project.
 * The MWI project is licensed under the terms of the MIT license.
 * See LICENSE.txt for more information.
 */
import { NANOS } from "../shared/vendor.esm.js";
import { ComponentFactory } from "./ComponentFactory.esm.js";

/**
 * @class CsrRenderer
 * @description Renders a component tree on the client-side.
 */
class CsrRenderer {
    /** @type {ComponentFactory} */
    _componentFactory;

    /**
     * @param {object} [options]
     * @param {ComponentFactory} [options.componentFactory]
     * // @param {ConfigurationService} [options.configService]
     */
    constructor(options = {}) {
        this._componentFactory = options.componentFactory || new ComponentFactory();
        // this.config = options.configService;
    }

    /**
     * Renders content into an array of DOM nodes.
     *
     * @param {any} content The content to render.
     * @param {boolean} [childMode=false] If true, renders children directly without
     *   checking the first item type.
     * @returns {Node[]} The rendered DOM node(s).
     */
    async render (content, childMode = false) {
        if (typeof content === 'string') {
            // Return a text node for plain text
            return [document.createTextNode(content)];
        }

        if (!content) {
            return [];
        }

        if (Array.isArray(content)) {
            // Normalize Array content to NANOS structure
            content = new NANOS(...content.map(v => (Array.isArray(v) || v instanceof NANOS) ? [v] : v));
        }

        if (!(content instanceof NANOS) || !content.size) {
            return [];
        }
        const first = content.at(0);

        if (childMode || typeof first !== 'string') {
            // If the first item is not a string, or in child mode, render all items.
            const rendered = await Promise.all(
                [...content.values()].map(item => this.render(item))
            );
            return rendered.flat();
        }

        const handler = this._componentFactory.get(first);

        if (!handler) {
            console.warn(`Component handler not found for "${first}"`);
            return [];
        }

        // The handler is responsible for rendering children by calling this.render()
        const props = new NANOS().fromEntries(content.namedEntries());
        const [, ...children] = content.values();
        const payload = await handler(props, children, this);

        if (!payload) {
            return [];
        }

        // The primary payload type for CSR is `dom`.
        if (payload.dom) {
            return [payload.dom].flat();
        }

        // Support for `content` payloads allows for component macros.
        if (payload.content) {
            const resolvedContent = await this._resolveContent(payload.content, props, children);
            return this.render(resolvedContent);
        }

        return []
    }

    /**
     * Resolves the content of a payload, handling cases where the content is
     * a function (JS or Mesgjs) that needs to be executed.
     *
     * @param {any} content The content to resolve.
     * @param {NANOS} props The component's properties.
     * @param {any[]} children The component's children definitions.
     * @returns {Promise<any>} The resolved content.
     * @private
     */
    async _resolveContent(content, props, children) {
        if (typeof content === 'function') {
            if (content.msjsType === '@function') {
                // Mesgjs @function: send a `(call)` message.
                const mesgParams = new NANOS(props, ...children);
                return await content('call', mesgParams);
            } else {
                // Standard JavaScript function
                return await content(props, ...children);
            }
        }

        // Content is a static data structure
        return content;
    }
}

export { CsrRenderer };
export default CsrRenderer;