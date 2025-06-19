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
        return this._substituteSlots(templateData, slotMap, instanceVNode.attributes);
    }

    _buildSlotMap(children) {
        const slotMap = { default: [] };
        for (const child of children) {
            const childVNode = (typeof child === 'object' && child !== null) ? VirtualNode.fromData(child) : null;
            if (childVNode && childVNode.type === 'm.attrs') {
                const slotName = childVNode.get(':name') || 'self';
                slotMap[slotName] = { ...slotMap[slotName], ...childVNode.attributes };
            } else if (childVNode && childVNode.get(':slot')) {
                const slotName = childVNode.get(':slot');
                if (!slotMap[slotName]) slotMap[slotName] = [];
                slotMap[slotName].push(child);
            } else {
                slotMap.default.push(child);
            }
        }
        return slotMap;
    }

    _substituteSlots(templateData, slotMap, instanceAttrs) {
        if (typeof templateData !== 'object' || templateData === null) {
            return templateData;
        }

        if (Array.isArray(templateData)) {
            const first = templateData[0];
            if (first === 'm.slot') {
                const slotName = templateData[1]?.name || 'default';
                return slotMap[slotName] || templateData.slice(1);
            }

            const newTemplate = [first];
            let attrs = {};
            let hasAttrs = false;

            for (let i = 1; i < templateData.length; i++) {
                const item = templateData[i];
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    attrs = { ...attrs, ...item };
                    hasAttrs = true;
                } else {
                    newTemplate.push(this._substituteSlots(item, slotMap, instanceAttrs));
                }
            }

            const attrSlotName = attrs[':slot'];
            if (attrSlotName && slotMap[attrSlotName]) {
                const slotAttrs = slotMap[attrSlotName];
                const allow = attrs[':allow'];
                const deny = attrs[':deny'];

                for (const [key, value] of Object.entries(slotAttrs)) {
                    let canOverride = true;
                    if (allow) canOverride = allow.includes(key);
                    else if (deny) canOverride = !deny.includes(key);

                    if (canOverride) {
                        attrs[key] = value;
                    }
                }
            } else if (attrSlotName === 'self' && instanceAttrs) {
                // Special case for merging the instance attributes
                for (const [key, value] of instanceAttrs.entries()) {
                    if (!attrs[key]) {
                        attrs[key] = value;
                    }
                }
            }


            if (Object.keys(attrs).length > 0) {
                newTemplate.splice(1, 0, attrs);
            }
            return newTemplate.flat();
        } else if (typeof templateData.map === 'function') { // NANOS
            const newNanos = new NANOS();
            for (const [key, value] of templateData.namedEntries()) {
                newNanos.set(key, value);
            }
            for (const value of templateData.values()) {
                const substituted = this._substituteSlots(value, slotMap, instanceAttrs);
                if (Array.isArray(substituted)) {
                    newNanos.push(...substituted);
                } else {
                    newNanos.push(substituted);
                }
            }
            return newNanos;
        }
        return templateData;
    }
}

export { SsrRenderer };
