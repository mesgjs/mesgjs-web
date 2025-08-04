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
        const vnode = MWISSRVNode.fromData(nodeData);
        if (!vnode) return MWISSRVNode.textNode('');

        // Get the spec and apply any options to the newly created VNode.
        const spec = await this._componentRegistry.getComponent(vnode.type);
        if (spec) {
            // Note: `setOptions` is idempotent and handles merging.
            vnode.setOptions(spec.options);
        }

        const { consumerVNode } = context || {};

        // --- Attribute Slot (m.attr) Resolution ---
        const attrPolicy = vnode.getAttr('m.attr');
        if (attrPolicy && consumerVNode) {
            const [slotName, policy] = attrPolicy.split(';', 2);
            const sourceAttrs = consumerVNode.getAttr(slotName.trim());
            if (sourceAttrs) {
                MWISSRVNode.mergeAttributes(sourceAttrs, policy || '', vnode);
            }
        }

        const handler = spec?.handler;
        if (!handler) {
            await vnode.renderChildren(this, context);
            return vnode;
        }

        const newContext = { ...context, consumerVNode: vnode, renderer: this };

        // Handle declarative components (where the handler is the template data).
        if (typeof handler !== 'function') {
            return this._renderNode(handler, newContext);
        }

        const result = await handler(vnode, newContext) || {};
        const scope = spec?.scope;

        // Process the handler's payload for resources.
        let scopeId;
        if (result.scopedCss && scope) {
            scopeId = this._scopeManager.getScopeId(scope);
            vnode.setScopeId(scopeId);
        }
        this._resourceCollector.processPayload(result, scopeId);

        // Decide whether to render the original vnode's children.
        const shouldRenderChildren = result.renderChildren ?? vnode.opts.renderChildren ?? !vnode.opts.noClose;

        if (shouldRenderChildren) {
            await vnode.renderChildren(this, context);
        }

        // If the handler returned a `content` property, it supersedes the
        // original vnode. Render it and return the result.
        if (Reflect.has(result, 'content')) {
            if (typeof result.content === 'string') {
                return MWISSRVNode.textNode(result.content);
            }
            return this._renderNode(result.content, newContext);
        }

        // Otherwise, return the original vnode (potentially modified by the handler).
        return vnode;
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
