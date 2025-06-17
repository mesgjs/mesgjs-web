/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * The proof-of-concept Server-Side Renderer (SSR) for the Mesgjs Web
 * Interface (MWI). This renderer implements the declarative, single-pass
 * rendering pipeline defined in the MWI architecture.
 *
 * @license MIT
 */

import { ComponentFactory } from './ComponentFactory.js';
import { PageTemplate as DefaultPageTemplate } from './DefaultPageTemplate.js';
import { NANOS } from '../shared/vendor.esm.js';
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
        if (typeof node === 'string') {
            // Escape HTML special characters in text nodes for security.
            return node.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // Normalize NANOS to a JS array for consistent processing.
        const componentDef = (node instanceof NANOS) ? node.toJs() : node;

        if (!Array.isArray(componentDef) || componentDef.length === 0) {
            return '';
        }

        // This is a component definition.
        return this._renderComponent(componentDef);
    }

    /**
     * Renders a component, processes its payload, and handles recursive
     * rendering of `content` payloads.
     *
     * @param {[string, object, ...any[]]} componentDef The component definition array.
     * @returns {Promise<string>} The rendered HTML for the component.
     * @private
     */
    async _renderComponent(componentDef) {
        const [componentName, props, ...children] = componentDef;

        const { handler, resolvedName } = await this._componentFactory.get(componentName) || {};

        if (!handler) {
            console.warn(`Component handler not found for "${componentName}"`);
            return '';
        }

        const renderedChildren = await Promise.all(children.map(child => this._renderNode(child)));
        const payload = await handler(props, ...renderedChildren);

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
        if (payload.content) {
            const contentToRender = scopeId
                ? this._substituteScope(payload.content, scopeId)
                : payload.content;

            return this._renderNode(contentToRender);
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
}

export { SsrRenderer };
