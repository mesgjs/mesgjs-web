/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * The proof-of-concept Server-Side Renderer (SSR) for the Mesgjs Web
 * Interface (MWI). This renderer implements the declarative, single-pass
 * rendering pipeline defined in the MWI architecture.
 *
 * @license MIT
 */

import { ComponentFactory } from './ComponentFactory.esm.js';
import { PageTemplate as DefaultPageTemplate } from './DefaultPageTemplate.esm.js';
import { NANOS } from '../shared/vendor.esm.js';
import { VirtualNode } from './VirtualNode.esm.js';
// import { ConfigurationService } from '../shared/ConfigurationService.js';

/**
 * Renders a structured page description into an HTML document.
 */
class SsrRenderer {
    /** @type {ComponentFactory} */
    _componentFactory;

    /** @type {Map<string, string>} */
    _scopedCss = new Map();

    /** @type {Map<string, string>} */
    _scopeIds = new Map();

    /** @type {number} */
    _nextScopeId = 0;

    /**
     * @param {ComponentFactory} componentFactory
     * // @param {ConfigurationService} configService
     */
    constructor(componentFactory, configService) {
        this._componentFactory = componentFactory;
        // this.config = configService;
    }

    /**
     * Renders the given page data into a complete HTML document.
     *
     * @param {Array|NANOS} pageData The structured data representing the page.
     * @param {object} [options={}]
     * @param {DefaultPageTemplate} [options.template] An optional page template
     *   instance. If not provided, a new DefaultPageTemplate will be used.
     * @returns {Promise<string>} A promise that resolves to the rendered HTML.
     */
    async render(pageData, { template = new DefaultPageTemplate() } = {}) {
        // Reset collections for this render pass
        this._scopedCss.clear();
        this._scopeIds.clear();
        this._nextScopeId = 0;

        const bodyVNode = await this._renderNode(pageData);

        template.addContent('body', bodyVNode.innerHTML);

        if (this._scopedCss.size > 0) {
            const styles = [...this._scopedCss.values()].join('\n');
            template.addContent('head', `<style>\n${styles}\n</style>`);
        }

        return template.render();
    }

    /**
     * Recursively renders a single node from the page data structure. This is the
     * main entry point for the recursive rendering process.
     *
     * @param {any} node The node to render.
     * @returns {Promise<VirtualNode>} A promise that resolves to the rendered node.
     * @private
     */
    async _renderNode(nodeData) {
        if (typeof nodeData === 'string') {
            return VirtualNode.textNode(nodeData);
        }

        const vnode = VirtualNode.fromData(nodeData);
        if (!vnode) {
            return VirtualNode.textNode(''); // Not renderable
        }

        // A component's final output is a VirtualNode
        return this._renderComponent(vnode);
    }

    /**
     * Renders a component, processes its payload, and handles recursive
     * rendering of `content` payloads.
     *
     * @param {VirtualNode} vnode The virtual node to render.
     * @returns {Promise<VirtualNode>} The rendered virtual node.
     * @private
     */
    async _renderComponent(vnode) {
        const { handler, resolvedName } = await this._componentFactory.get(vnode.type) || {};

        if (!handler) {
            console.warn(`Component handler not found for "${vnode.type}"`);
            return VirtualNode.textNode('');
        }

        // Children must be rendered before the handler is called.
        const renderedChildren = await Promise.all(vnode.rawChildren.map(child => this._renderNode(child)));
        vnode.append(...renderedChildren);

        const payload = await handler(vnode);

        // If the handler returns nothing, it's a simple pass-through.
        if (!payload) {
            return vnode;
        }

        // If the handler returns a VirtualNode, it's a primitive component
        // that has finished its configuration. Return it directly.
        if (payload instanceof VirtualNode) {
            return payload;
        }

        // If the handler returns a `content` payload, it's a semantic
        // component acting as a macro. Render the content and return the result.
        if (payload.content) {
            let scopeId;
            if (payload.scopedCss) {
                if (!this._scopeIds.has(resolvedName)) {
                    scopeId = `mwi-${this._nextScopeId++}`;
                    this._scopeIds.set(resolvedName, scopeId);
                    const css = payload.scopedCss.replace(/^\s+/g, '').replace(/@@/g, scopeId);
                    this._scopedCss.set(resolvedName, css);
                } else {
                    scopeId = this._scopeIds.get(resolvedName);
                }
            }

            const resolvedContent = await this._resolveContent(payload.content, vnode);
            const contentVNode = await this._renderNode(resolvedContent);

            // The original node's children have already been rendered.
            // Append them to the new content node.
            contentVNode.append(...vnode.children);

            // Apply the scope to the new node generated from the content.
            if (scopeId && contentVNode.type) {
                contentVNode.scope = scopeId;
            }

            return contentVNode;
        }

        // If the payload has other properties (like scopedCss) but no content,
        // apply them to the original vnode.
        if (payload.scopedCss) {
            let scopeId;
            if (!this._scopeIds.has(resolvedName)) {
                scopeId = `mwi-${this._nextScopeId++}`;
                this._scopeIds.set(resolvedName, scopeId);
                const css = payload.scopedCss.replace(/^\s+/g, '').replace(/@@/g, scopeId);
                this._scopedCss.set(resolvedName, css);
            } else {
                scopeId = this._scopeIds.get(resolvedName);
            }
            vnode.scope = scopeId;
        }

        return vnode;
    }

    /**
     * Recursively traverses a data structure (JS or NANOS) and replaces
     * all occurrences of the '@@' scope marker.
     *
     * @param {any} data The data structure to process.
     * @param {string} scopeId The ID to substitute for the '@@' marker.
     * @returns {any} The transformed data structure.
     * @private
     */
    _substituteScope(data, scopeId) {
        if (typeof data === 'string') {
            return data.replace(/@@/g, scopeId);
        }

        if (data instanceof NANOS) {
            const newNanos = new NANOS();
            for (const [key, value] of data.entries()) {
                newNanos.set(key, this._substituteScope(value, scopeId));
            }
            return newNanos;
        }

        if (Array.isArray(data)) {
            return data.map(item => this._substituteScope(item, scopeId));
        }

        if (typeof data === 'object' && data !== null) {
            const newObj = {};
            for (const [key, value] of Object.entries(data)) {
                newObj[key] = this._substituteScope(value, scopeId);
            }
            return newObj;
        }

        return data;
    }

    /**
     * Resolves the content of a payload, handling cases where the content is
     * a function (JS or Mesgjs) that needs to be executed.
     *
     * @param {any} content The content to resolve.
     * @param {VirtualNode} vnode The component's virtual node.
     * @returns {Promise<any>} The resolved content.
     * @private
     */
    async _resolveContent(content, vnode) {
        if (typeof content === 'function') {
            if (content.msjsType === '@function') {
                // Mesgjs @function: send a `(call)` message.
                const mesgParams = new NANOS(vnode.attributes, ...vnode.children);
                return await content('call', mesgParams);
            } else {
                // Standard JavaScript function
                return await content(vnode);
            }
        }

        // Content is a static data structure
        return content;
    }
}

export { SsrRenderer };
