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
import { NANOS, isIndex } from '../shared/vendor.esm.js';
// import { ConfigurationService } from '../shared/ConfigurationService.js';

/**
 * A wrapper for strings that should not be HTML-escaped.
 * @extends String
 */
class UnescapedString extends String {}

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

        const bodyContent = await this._renderNode(pageData);

        template.addContent('body', bodyContent);

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
     * @returns {Promise<string>} A promise that resolves to the rendered HTML string.
     * @private
     */
    async _renderNode(node) {
        // Pass through UnescapedStrings without modification.
        if (node instanceof UnescapedString) {
            return node;
        }

        if (typeof node === 'string') {
            // Escape HTML special characters in text nodes for security.
            return node.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
        }

        // Normalize Array to NANOS for consistent processing.
        if (Array.isArray(node)) {
            // The NANOS constructor correctly handles flattening the array.
            node = new NANOS(...node.map(v => Array.isArray(v) ? [v] : v));
        }

        if (!(node instanceof NANOS) || node.size === 0) {
            // Do not render other non-string, non-NANOS types.
            return '';
        }

        // A component's final output is HTML, so it should not be escaped later.
        const html = await this._renderComponent(node);
        return new UnescapedString(html);
    }

    /**
     * Renders a component, processes its payload, and handles recursive
     * rendering of `content` payloads.
     *
     * @param {NANOS} componentDef The component definition.
     * @returns {Promise<string>} The rendered HTML for the component.
     * @private
     */
    async _renderComponent(componentDef) {
        const [componentName, ...children] = componentDef.values();
        const props = new NANOS().fromEntries(componentDef.namedEntries());

        const { handler, resolvedName } = await this._componentFactory.get(componentName) || {};

        if (!handler) {
            console.warn(`Component handler not found for "${componentName}"`);
            return '';
        }

        const renderedChildren = await Promise.all(children.map(child => this._renderNode(child)));
        const childStrings = renderedChildren.map(c => c.toString());
        const payload = await handler(props, ...childStrings);

        if (!payload) {
            return '';
        }

        let html = payload.html || '';
        let scopeId;

        // Process scoped CSS if provided.
        if (payload.scopedCss) {
            if (!this._scopeIds.has(resolvedName)) {
                // First time seeing this component type, generate a new scope ID.
                scopeId = `mwi-${this._nextScopeId++}`;
                this._scopeIds.set(resolvedName, scopeId);

                // Substitute '@@' in the CSS and store it.
                const css = payload.scopedCss.replace(/@@/g, scopeId);
                this._scopedCss.set(resolvedName, css);
            } else {
                scopeId = this._scopeIds.get(resolvedName);
            }

            // Substitute '@@' in the HTML as well.
            if (html) {
                html = html.replace(/@@/g, scopeId);
            }
        }

        // Process a `content` payload by recursively rendering it.
        // Process a `content` payload by recursively rendering it.
        if (payload.content) {
            const resolvedContent = await this._resolveContent(
                payload.content, props, childStrings
            );

            const contentToRender = scopeId
                ? this._substituteScope(resolvedContent, scopeId)
                : resolvedContent;

            // The recursive call to _renderNode will return an UnescapedString.
            // We need to get its primitive value before returning.
            const result = await this._renderNode(contentToRender);
            return result.toString();
        }

        return html;
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
     * @param {NANOS} props The component's properties.
     * @param {string[]} children The component's rendered children.
     * @returns {Promise<any>} The resolved content.
     * @private
     */
    async _resolveContent(content, props, children) {
        if (typeof content === 'function') {
            if (content.msjsType === '@function') {
                // Mesgjs @function: send a `(call)` message.
                // The NANOS constructor will correctly destructure the props
                // object and index the children, preserving order.
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

export { SsrRenderer };
