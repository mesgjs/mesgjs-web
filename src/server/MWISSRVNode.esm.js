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

import { MWIVNode } from 'mesgjs-web/src/shared/MWIVNode.esm.js';

const ehMap = { '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' };

/**
 * Escape special HTML characters in a string
 * @param {string} str String to escape
 * @returns {string} Escaped string
 */
function escapeHtml (str) {
    return String(str).replace(/[&"'<>]/g, (match) => ehMap[match]);
}

/**
 * Server-side VNode implementation that extends the base MWIVNode.
 * Adds HTML rendering capabilities while inheriting core VNode functionality.
 */
export class MWISSRVNode extends MWIVNode {
    /**
     * Return the HTML encoding of all child content
     * @returns {string} HTML string
     */
    get innerHTML () {
        const { noClose, renderChildren } = this.opts;
        const renderInner = renderChildren ?? !noClose;
        if (!renderInner) return '';
        if (this.opts.rawContent) {
            return this.children.join('');
        }
        return this.children.map(child =>
            (typeof child === 'string') ? escapeHtml(child) : child.outerHTML
        ).join('');
    }

    /**
     * Return the HTML encoding of the current node and all child content
     * @returns {string} HTML string
     */
    get outerHTML () {
        const { close, noClose, noTag, open } = this.opts;
        const tag = this.opts.tag || this.type;
        const prefix = open || (noTag ? '' : ('<' + tag));
        const infix = (!open && !noTag) ? '>' : '';
        const suffix = close || ((noTag || noClose) ? '' : `</${tag}>`);
        const attrs = [];

        if (!open && !noTag) {
            // Access class and style to trigger attribute updates
            this.getAttr('class');
            this.getAttr('style');

            // Process all attributes
            for (const [key, value] of this.attributes.entries()) {
                if (value === true) {
                    attrs.push(' ', escapeHtml(key));
                } else if (value !== false && value != null) {
                    attrs.push(` ${escapeHtml(key)}="${escapeHtml(value)}"`);
                }
            }
        }

        const html = `${prefix}${attrs.join('')}${infix}${this.innerHTML}${suffix}`;
        return (this.scope ? html.replace(/@@/g, this.scope) : html);
    }

    /**
     * Render children using the provided renderer
     * @param {object} renderer The renderer instance
     * @param {object} context The rendering context
     * @returns {Promise<this>}
     */
    async renderChildren (renderer, context) {
        this.children = await Promise.all(
            this.children.map(c => renderer._renderNode(c, context))
        );
        return this;
    }

    /**
     * Create a text node
     * @param {string} text The text content
     * @returns {MWISSRVNode}
     */
    static textNode (text) {
        const node = new MWISSRVNode('h.TEXT', { noTag: true });
        node.children = [text];
        return node;
    }

    /**
     * Create a document fragment
     * @param {...(MWISSRVNode|string)} children Child nodes
     * @returns {MWISSRVNode}
     */
    static fragment (...children) {
        const node = new MWISSRVNode('h.FRAG', { noTag: true });
        node.append(...children);
        return node;
    }

}