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

import { MWIVNode } from '../shared/MWIVNode.esm.js';

const ehMap = { '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' };

/**
 * Escape special HTML characters in a string
 * @param {string} str String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
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
        if (this.opts.noTag) {
            return this.innerHTML;
        }

        // Access class and style to trigger attribute updates
        this.getAttr('class');
        this.getAttr('style');

        const tag = this.opts.tag || this.type;
        const attrs = [];

        // Process all attributes
        for (const [key, value] of this.attributes.entries()) {
            if (value === true) {
                attrs.push(' ', escapeHtml(key));
            } else if (value !== false && value != null) {
                attrs.push(` ${escapeHtml(key)}="${escapeHtml(value)}"`);
            }
        }

        const html = `<${tag}${attrs.join('')}>${this.innerHTML}${this.opts.noClose ? '' : `</${tag}>`}`;
        return (this.scope ? html.replace(/@@/g, this.scope) : html);
    }

    /**
     * Render children using the provided renderer
     * @param {object} renderer The renderer instance
     * @returns {Promise<this>}
     */
    async renderChildren (renderer) {
        this.children = await Promise.all(
            this.children.map(c => renderer._renderNode(c))
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

    /**
     * Create a VNode from structured data
     * @param {Array|object} data Input data
     * @param {object} [opts={}] Node options
     * @returns {MWISSRVNode|undefined}
     */
    static fromData (data, opts = {}) {
        if (Array.isArray(data)) {
            const [type, ...rest] = data;
            const node = new MWISSRVNode(type, opts);
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
            const node = new MWISSRVNode(type, opts);
            node.children.push(...children);
            for (const [key, value] of data.namedEntries()) {
                node.setAttr(key, value);
            }
            return node;
        }
        return undefined;
    }
}