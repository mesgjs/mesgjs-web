/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * The proof-of-concept Server-Side Renderer (SSR) for the Mesgjs Web
 * Interface (MWI). This renderer implements the declarative, single-pass
 * rendering pipeline defined in the MWI architecture.
 *
 * @license MIT
 */

import { PageTemplate as DefaultPageTemplate } from './DefaultPageTemplate.esm.js';
import { VirtualNode } from './VirtualNode.esm.js';
import { StringSet } from '../shared/StringSet.esm.js';

class SsrRenderer {
    _componentFactory;

    constructor(componentFactory) {
        this._componentFactory = componentFactory;
    }

    async render(pageData, { template = new DefaultPageTemplate() } = {}) {
        const bodyVNode = await this._renderNode(pageData);
        if (bodyVNode) {
            template.addContent('body', bodyVNode.outerHTML);
        }
        return template.render();
    }

    async _renderNode(nodeData) {
        if (nodeData instanceof VirtualNode) {
            return nodeData; // It's already rendered.
        }
        if (typeof nodeData !== 'object' || nodeData === null) {
            return VirtualNode.textNode(String(nodeData));
        }

        const vnode = VirtualNode.fromData(nodeData);
        if (!vnode) {
            return VirtualNode.textNode('');
        }

        const { handler } = await this._componentFactory.get(vnode.type) || {};

        if (!handler) {
            await vnode.renderChildren(this);
            return vnode;
        }

        if (typeof handler === 'function') {
            const result = await handler(vnode, this);
            return this._renderNode(result);
        } else {
            const newVNodeData = this._transformDeclarativeTemplate(handler, vnode);
            return this._renderNode(newVNodeData);
        }
    }

    _transformDeclarativeTemplate(templateData, instanceVNode) {
        const slotMap = this._buildSlotMap(instanceVNode.children);
        const templateNode = VirtualNode.fromData(templateData);
        if (!templateNode) {
            return templateData; // Return unchanged if not a valid node structure
        }
        return this._substituteSlots(templateNode, slotMap, instanceVNode.attributes);
    }

    _buildSlotMap(children) {
        const slotMap = {
            nodes: { default: [] },
            attrs: { default: {} }
        };
        for (const child of children) {
            const childVNode = (typeof child === 'object' && child !== null) ? VirtualNode.fromData(child) : null;
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

    _mergeAttributes(targetNode, sourceAttrs, allow, deny) {
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

    _substituteSlots(vnode, slotMap, instanceAttrs) {
        if (!(vnode instanceof VirtualNode)) {
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
                child instanceof VirtualNode ? child : VirtualNode.fromData(child),
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

export { SsrRenderer };
