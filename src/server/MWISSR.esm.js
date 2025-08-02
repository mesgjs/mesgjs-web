/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * The proof-of-concept Server-Side Renderer (SSR) for the Mesgjs Web
 * Interface (MWI). This renderer implements the declarative, single-pass
 * rendering pipeline defined in the MWI architecture.
 *
 * @license MIT
 */

import { MWIPageContextService } from 'mesgjs-web/src/server/services/MWIPageContextService.esm.js';
import { MWISSRVNode } from 'mesgjs-web/src/server/MWISSRVNode.esm.js';
import { MWIResourceCollectorService } from 'mesgjs-web/src/server/services/MWIResourceCollectorService.esm.js';
import { MWIScopeManagerService } from 'mesgjs-web/src/server/services/MWIScopeManagerService.esm.js';
import { MWICssProcessorService } from 'mesgjs-web/src/server/services/MWICssProcessorService.esm.js';
import { MWIUrlValidatorService } from 'mesgjs-web/src/server/services/MWIUrlValidatorService.esm.js';

class MWIBaseSSR {
    _componentRegistry;
    _idCounter = 0;
    _resourceCollector;
    _scopeManager;
    _cssProcessor;
    _urlValidator;

    constructor ({ componentRegistry, resourceCollector, scopeManager, cssProcessor, urlValidator }) {
        this._componentRegistry = componentRegistry;
        this._resourceCollector = resourceCollector;
        this._scopeManager = scopeManager;
        this._cssProcessor = cssProcessor;
        this._urlValidator = urlValidator;
    }

    async render (pageData, { pageTemplate = 'mwi.html.core.basicPage' } = {}) {
        const pageContext = new MWIPageContextService();
        const renderContext = {
            pageContext,
            componentRegistry: this._componentRegistry,
            resourceCollector: this._resourceCollector,
            scopeManager: this._scopeManager,
            cssProcessor: this._cssProcessor,
            urlValidator: this._urlValidator,
            renderer: this
        };

        // Pass 1: Render main content and collect resources
        const bodyVNode = await this._renderNode(pageData, renderContext);
        if (bodyVNode) {
            pageContext.addBodyContent(bodyVNode);
        }

        // --- Assemble Page ---

        // Collect standard resources
        const { mountPoints, css } = this._resourceCollector.getCollectedResources();
        if (mountPoints) {
            pageContext.addHeadContent(MWISSRVNode.fromData([
                'h.script', { type: 'application/json', id: 'mwi-hydration-points' },
                JSON.stringify(mountPoints, null, 2)
            ]));
        }

        const scopedCss = this._cssProcessor.generateScopedCss(css);
        if (scopedCss) {
            pageContext.addHeadContent(MWISSRVNode.fromData([
                'h.style', { id: 'mwi-scoped-css' }, scopedCss
            ]));
        }

        const modMeta = globalThis.$c.getModMeta();
        const clientMeta = modMeta?.at('client');
        if (clientMeta) {
            pageContext.addHeadContent(MWISSRVNode.fromData([
                'h.script', { id: 'mwi-mod-meta' },
                `window.msjs.setModMeta(${JSON.stringify(clientMeta, null, 2)});`
            ]));
        }

        // Pass 2: Render the final page template
        const templateSpec = await this._componentRegistry.getComponent(pageTemplate);

        if (!templateSpec || templateSpec?.type !== 'page') {
            const reason = !templateSpec ? 'not found' : `type is ${templateSpec?.type || 'not page'}`;
            throw new Error(`Page template component is not valid: ${pageTemplate} (${reason})`);
        }

        // The page template is a declarative component. We need a "consumer"
        // VNode to provide the context attributes (e.g. title, head content)
        // to the template's slots.
        const pageConsumerVNode = MWISSRVNode.fromData([
            'h.FRAG', { // A transient, tagless fragment is perfect for this.
                'as.pageTitle': pageContext.getTitle(),
                'as.html': pageContext.getHtmlAttrs(),
                'as.body': pageContext.getBodyAttrs(),
                'cs.head': MWISSRVNode.fragment(...pageContext.getHeadContent()),
                'cs.default': MWISSRVNode.fragment(...pageContext.getBodyContent())
            }
        ]);

        const finalRenderContext = { ...renderContext, consumerVNode: pageConsumerVNode };
        const finalVNode = await this._renderNode(templateSpec.content, finalRenderContext);

        return finalVNode.outerHTML;
    }

    generateElementId () {
        return 'MWS$' + (this._idCounter++);
    }

    async _renderNode (nodeData, context) {
        // This is the core of the single-pass, declarative rendering pipeline.
        // It recursively transforms raw page data (NANOS or JSON) into a tree
        // of VNodes, resolving components and handling slots along the way.

        // If the node is already a VNode, it has been processed. Return it.
        if (nodeData instanceof MWISSRVNode) {
            return nodeData;
        }

        // If the node is not an object (e.g., string, number), treat it as
        // text content and wrap it in a text node.
        if (typeof nodeData !== 'object' || nodeData === null) {
            return MWISSRVNode.textNode(String(nodeData));
        }

        // Create a VNode from the raw data. This normalizes the structure
        // for further processing.
        let vnode = MWISSRVNode.fromData(nodeData);
        if (!vnode) {
            // If the data can't be turned into a VNode, render an empty string.
            return MWISSRVNode.textNode('');
        }

        // The 'context' object carries rendering state through the recursion.
        // Its most important property is 'consumerVNode', which is the VNode
        // of the component *using* the current node. This is the key to the
        // "pull" model for slotting.
        const { consumerVNode } = context || {};

        // --- Attribute Slot (m.attr) Resolution ---
        // Check if the current VNode is a target for slotted attributes.
        const attrPolicy = vnode.getAttr('m.attr');
        if (attrPolicy && consumerVNode) {
            // The `m.attr` value is "slotName;policy".
            const [slotName, policy] = attrPolicy.split(';', 2);
            // Get the attribute data from the consuming component's VNode.
            const sourceAttrs = consumerVNode.getAttr(slotName.trim());
            if (sourceAttrs) {
                // If the consumer provided attributes, merge them onto the
                // current VNode according to the defined policy.
                MWISSRVNode.mergeAttributes(sourceAttrs, policy || '', vnode);
            }
        }

        // --- Content Slot (m.slot) Resolution ---
        // Check if the current VNode is a content slot.
        if (vnode.type === 'm.slot' && consumerVNode) {
            const slotName = vnode.getAttr('name') || 'cs.default';
            // Get the content for this slot from the consumer VNode.
            let slotContent = consumerVNode.getAttr(slotName);

            // For the default slot, if no named attribute is found, check for
            // positional children on the consumer.
            if (slotName === 'cs.default' && !slotContent) {
                if (consumerVNode.children.length > 0) {
                    slotContent = MWISSRVNode.fragment(...consumerVNode.children);
                }
            }

            if (slotContent) {
                // If the consumer provided content, render it instead of the
                // slot's default content, passing the context through.
                return this._renderNode(slotContent, context);
            }
            // If no content, fall through to render the slot's default children.
        }

        // Look up the component handler for this VNode's type.
        const spec = await this._componentRegistry.getComponent(vnode.type);
        let handler, specifier;

        if (spec) {
            vnode = MWISSRVNode.fromData(nodeData, spec.options);
            handler = spec.handler;
            specifier = spec.specifier;
        }

        // --- No Handler Path (Primitives) ---
        // If there is no handler, this is a primitive element (like `h.div`)
        // that does not have a dedicated component handler. This is the
        // safe "default" behavior.
        //
        // SECURITY: This path is safe because dangerous tags like `<script>`
        // or `<style>` are required to have their own dedicated handlers
        // which perform validation and resource management. The component
        // factory routes them to their handler, preventing them from ever
        // reaching this default logic block. For all other tags, the
        // `MWISSRVNode.outerHTML` getter provides HTML-escaping of all
        // attributes and text content as a final security guarantee.
        if (!handler) {
            // Process children recursively and return the resulting VNode.
            await vnode.renderChildren(this, context);
            return vnode;
        }

        // --- Declarative Component Handling ---
        // If the handler is not a function, it's a declarative component's
        // template data.
        if (typeof handler !== 'function') {
            // The current vnode becomes the consumer for the template's content.
            const newContext = { ...context, consumerVNode: vnode };
            // Render the template data in the new context.
            return this._renderNode(handler, newContext);
        }

        // --- Smart Component Handling ---
        // If the handler is a function, it's a "smart" component.
        const newContext = { ...context, consumerVNode: vnode, renderer: this };
        const result = await handler(vnode, newContext);

        // Process the handler's payload for resources like scoped CSS.
        let scopeId;
        if (result?.scopedCss && specifier) {
            scopeId = this._scopeManager.getScopeId(specifier);
            vnode.setScopeId(scopeId);
        }
        this._resourceCollector.processPayload(result, scopeId);

        // Check the type of result returned by the smart component.
        if (result && typeof result === 'object' && !(result instanceof MWISSRVNode)) {
            // If the result is a "macro" with a `content` property, render
            // that content. The current vnode is the consumer.
            if (Reflect.has(result, 'content')) {
                return this._renderNode(result.content, newContext);
            } else {
                // If it's a "modifier" (no content), it has modified the
                // original vnode. Render the vnode's children and return it.
                await vnode.renderChildren(this, context);
                return vnode;
            }
        } else {
            // The handler returned a direct replacement (another VNode or raw
            // data). Render it in the original context.
            return this._renderNode(result, context);
        }
    }
}

// Standard production configuration of base SSR
class MWISSR extends MWIBaseSSR {
    constructor ({ componentRegistry }) {
        const resourceCollector = new MWIResourceCollectorService();
        const scopeManager = new MWIScopeManagerService();
        const urlValidator = new MWIUrlValidatorService();
        const cssProcessor = new MWICssProcessorService({ scopeManager, urlValidator });

        super({
            componentRegistry, resourceCollector, scopeManager, cssProcessor, urlValidator
        });
    }
}

export { MWIBaseSSR, MWISSR };
