/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * The proof-of-concept Server-Side Renderer (SSR) for the Mesgjs Web
 * Interface (MWI). This renderer implements the declarative, single-pass
 * rendering pipeline defined in the MWI architecture.
 *
 * @license MIT
 */

import { MWIDefaultPageTemplate } from 'mesgjs-web/src/server/MWIDefaultPageTemplate.esm.js';
import { MWISSRVNode } from 'mesgjs-web/src/server/MWISSRVNode.esm.js';
import { NANOS } from 'mesgjs-web/src/shared/vendor.esm.js';
import { StringSet } from 'mesgjs-web/src/shared/StringSet.esm.js';
import { MWIResourceCollectorService } from 'mesgjs-web/src/server/services/MWIResourceCollectorService.esm.js';
import { MWIScopeManagerService } from 'mesgjs-web/src/server/services/MWIScopeManagerService.esm.js';
import { MWICssProcessorService } from 'mesgjs-web/src/server/services/MWICssProcessorService.esm.js';
import { MWIUrlValidatorService } from 'mesgjs-web/src/server/services/MWIUrlValidatorService.esm.js';

class MWISSR {
    _componentFactory;
    _idCounter = 0;
    _resourceCollector;
    _scopeManager;
    _cssProcessor;
    _urlValidator;

    constructor (componentFactory) {
        this._componentFactory = componentFactory;
        this._resourceCollector = new MWIResourceCollectorService();
        this._scopeManager = new MWIScopeManagerService();
        this._cssProcessor = new MWICssProcessorService();
        this._urlValidator = new MWIUrlValidatorService();
    }

    async render (pageData, { template = new MWIDefaultPageTemplate() } = {}) {
        const bodyVNode = await this._renderNode(pageData);

        if (bodyVNode) {
            template.addContent('body', bodyVNode.outerHTML);
        }

        const modMeta = this._componentFactory.getModMeta();
        const clientMeta = modMeta?.at('client');
        if (clientMeta) {
            template.injectModMeta(clientMeta);
        }

        const { mountPoints, css } = this._resourceCollector.getCollectedResources();
        template.injectHydrationPoints(mountPoints);

        const scopedCss = this._cssProcessor.generateScopedCss(css);
        if (scopedCss) {
            template.addContent('head', `<style>${scopedCss}</style>`);
        }

        return template.render();
    }

    generateElementId () {
        return 'MWS$' + (this._idCounter++);
    }

    async _renderNode (nodeData) {
        if (nodeData instanceof MWISSRVNode) {
            return nodeData; // It's already rendered.
        }
        if (typeof nodeData !== 'object' || nodeData === null) {
            return MWISSRVNode.textNode(String(nodeData));
        }

        const vnode = MWISSRVNode.fromData(nodeData);
        if (!vnode) {
            return MWISSRVNode.textNode('');
        }

        if (!vnode.get('id') && vnode.type.startsWith('h.')) {
            vnode.set('id', this.generateElementId());
        }

        const { handler, specifier } = await this._componentFactory.get(vnode.type) || {};

        if (!handler) {
            await vnode.renderChildren(this);
            return vnode;
        }

        if (typeof handler === 'function') {
            const result = await handler(vnode, this);

            let scopeId;
            if (result?.scopedCss && specifier) {
                scopeId = this._scopeManager.getScopeId(specifier);
                vnode.setScopeId(scopeId);
            }

            this._resourceCollector.processPayload(result, scopeId);

            if (result && typeof result === 'object' && !(result instanceof MWISSRVNode)) {
                if (Reflect.has(result, 'content')) {
                    // Macro component: render its content and return.
                    return this._renderNode(result.content);
                } else {
                    // Modifier component: render the original node's children.
                    await vnode.renderChildren(this);
                    return vnode;
                }
            } else {
                // Handler returned a new renderable value.
                return this._renderNode(result);
            }
        } else {
            const newVNodeData = this._transformDeclarativeTemplate(handler, vnode);
            return this._renderNode(newVNodeData);
        }
    }


    _transformDeclarativeTemplate (templateData, instanceVNode) {
        const slotMap = this._buildSlotMap(instanceVNode.children);
        const templateNode = MWISSRVNode.fromData(templateData);
        if (!templateNode) {
            return templateData; // Return unchanged if not a valid node structure
        }
        return this._substituteSlots(templateNode, slotMap, instanceVNode.attributes);
    }

    _buildSlotMap (children) {
        const slotMap = {
            nodes: { default: [] },
            attrs: { default: {} }
        };
        for (const child of children) {
            const childVNode = (typeof child === 'object' && child !== null) ? MWISSRVNode.fromData(child) : null;
            if (childVNode && childVNode.type === 'm.attrs') {
                const slotName = childVNode.get(':name') || 'default';
                slotMap.attrs[slotName] = { ...slotMap.attrs[slotName], ...childVNode.attributes };
            } else if (childVNode && childVNode.get(':slot')) {
                const slotName = childVNode.get(':slot');
                if (!slotMap.nodes[slotName]) slotMap.nodes[slotName] = [];
                slotMap.nodes[slotName].push(child);
            } else {
                slotMap.nodes.default.push(child);
            }
        }
        return slotMap;
    }

    _mergeAttributes (targetNode, sourceAttrs, allow, deny) {
        if (!sourceAttrs) return;

        // Convert allow/deny to StringSet if they exist
        const allowSet = allow ? new StringSet(allow) : null;
        const denySet = deny ? new StringSet(deny) : null;

        for (const [key, value] of sourceAttrs.entries()) {
            let canOverride = true;
            if (allowSet) canOverride = allowSet.has(key);
            else if (denySet) canOverride = !denySet.has(key);

            if (!canOverride) continue;

            // Special handling for class and style
            switch (key) {
            case 'class':
                targetNode.editClass(value);
                break;
            case 'style':
                targetNode.editStyle(value);
                break;
            default:
                targetNode.set(key, value);
                break;
            }
        }
    }

    _substituteSlots (vnode, slotMap, instanceAttrs) {
        if (!(vnode instanceof MWISSRVNode)) {
            return vnode; // Return unchanged if not a VirtualNode
        }

        // Handle slot nodes
        if (vnode.type === 'm.slot') {
            const slotName = vnode.get('name') || 'default';
            return slotMap.nodes[slotName] || vnode.children;
        }

        // Handle attribute slots from the template node
        const templateSlotName = vnode.get(':slot');
        if (templateSlotName && slotMap.attrs[templateSlotName]) {
            this._mergeAttributes(
                vnode,
                slotMap.attrs[templateSlotName],
                vnode.get(':allow'),
                vnode.get(':deny')
            );
        }

        // Handle attribute slots from instance attributes
        if (instanceAttrs) {
            const instanceSlotName = instanceAttrs.get(':slot');
            if (instanceSlotName && slotMap.attrs[instanceSlotName]) {
                this._mergeAttributes(
                    vnode,
                    slotMap.attrs[instanceSlotName],
                    instanceAttrs.get(':allow'),
                    instanceAttrs.get(':deny')
                );
            }
        }

        // Process children recursively
        const newChildren = [];
        for (const child of vnode.children) {
            const processedChild = this._substituteSlots(
                child instanceof MWISSRVNode ? child : MWISSRVNode.fromData(child),
                slotMap,
                instanceAttrs
            );
            if (Array.isArray(processedChild)) {
                newChildren.push(...processedChild);
            } else {
                newChildren.push(processedChild);
            }
        }
        vnode.children = newChildren;

        return vnode;
    }
}

export { MWISSR };
