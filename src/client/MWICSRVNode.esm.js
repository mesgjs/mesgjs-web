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
import { reactive, getInterface, setRO } from 'mesgjs-web/src/shared/vendor.esm.js';


/**
 * Client-side VNode implementation that extends the base MWIVNode.
 * It manages a live DOM element and handles event listeners and reactivity.
 */
export class MWICSRVNode extends MWIVNode {
    /** @type {Element} The live DOM element */
    element;

    /** @type {Array<object>} A list of reactive subscriptions to clean up on unmount */
    subscriptions;

    /**
     * Create a new client-side VNode
     * @param {object} d The Mesgjs dispatch object from the @init handler
     */
    constructor (d) {
        // The node type is the first positional parameter
        const type = String(d.mp.at(0, 'h.div'));
        // All other named parameters are options
        const opts = Object.fromEntries(d.mp.namedEntries());

        super(type, opts);

        this.element = document.createElement(this.opts.tag || type.split('.').pop());
        this.subscriptions = [];
        this.listeners = new Map();
    }

    /**
     * Get the HTML of the node's content.
     * @returns {string}
     */
    get innerHTML () {
        return this.element.innerHTML;
    }

    /**
     * Get the HTML of the node and its content.
     * @returns {string}
     */
    get outerHTML () {
        return this.element.outerHTML;
    }

    /**
     * Set an attribute, synchronizing with the DOM element and handling reactivity.
     * @param {string} name The attribute name
     * @param {any} value The attribute value
     * @returns {this}
     */
    setAttr (name, value) {
        // Check for reactivity *before* calling super, which might alter the value
        if (value && value.msjsType === '@reactive') {
            const sub = reactive({
                eager: true,
                def: () => {
                    const reactiveValue = value('rv');
                    // Get the final, non-reactive value for the attribute
                    const finalValue = reactive.fv(reactiveValue);

                    if (finalValue === false || finalValue === null || finalValue === undefined) {
                        this.element.removeAttribute(name);
                    } else {
                        this.element.setAttribute(name, finalValue);
                    }
                }
            });
            this.subscriptions.push(sub);
        } else {
             // Let the base class handle storage
            super.setAttr(name, value);
            const attrValue = this.getAttr(name); // Get the processed value

            if (attrValue === false || attrValue === null || attrValue === undefined) {
                this.element.removeAttribute(name);
            } else {
                this.element.setAttribute(name, attrValue);
            }
        }

        return this;
    }

    /**
     * Append children, synchronizing with the DOM element and handling reactivity.
     * @param {...(MWICSRVNode|string|object)} children Children to append
     * @returns {this}
     */
    append (...children) {
        super.append(...children); // Let base class manage children array

        for (const child of children) {
            if (typeof child === 'string') {
                this.element.appendChild(document.createTextNode(child));
            } else if (child instanceof MWICSRVNode) {
                this.element.appendChild(child.element);
            } else if (child && child.msjsType === '@reactive') {
                const startGuard = document.createComment('{');
                const placeholder = document.createTextNode('');
                const endGuard = document.createComment('}');

                this.element.append(startGuard, placeholder, endGuard);

                const sub = reactive({
                    eager: true,
                    def: () => {
                        const reactiveValue = child('rv');
                        const finalValue = reactive.fv(reactiveValue);
                        placeholder.textContent = (finalValue === null || finalValue === undefined) ? '' : String(finalValue);
                    }
                });
                this.subscriptions.push(sub);
            }
        }
        return this;
    }

    /**
     * Clean up all reactive subscriptions to prevent memory leaks.
     */
    unmount () {
        // Clear definitions to allow GC
        for (const sub of this.subscriptions) {
            sub.def = undefined;
        }
        this.subscriptions.length = 0;

        // Remove all event listeners by calling the 'off' message handler logic
        this.off();

        // Future: Dispatch (unmount) to Mesgjs components
    }

    /**
     * Remove event listeners from the DOM element.
     * @param {string} [eventName] The name of the event to remove.
     * @param {function} [handler] The specific handler to remove.
     */
    off (eventName, handler) {
        if (!eventName) {
            // Remove all listeners for all events
            for (const name of this.listeners.keys()) {
                this.off(name);
            }
            return;
        }

        const handlers = this.listeners.get(eventName);
        if (!handlers) { return; }

        if (!handler) {
            // Remove all listeners for a specific event
            for (const domListener of handlers.values()) {
                this.element.removeEventListener(eventName, domListener);
            }
            handlers.clear();
        } else if (handlers.has(handler)) {
            // Remove a specific listener
            const domListener = handlers.get(handler);
            this.element.removeEventListener(eventName, domListener);
            handlers.delete(handler);
        }
    }
}

// Define the Mesgjs interface for the VNode.
// This follows the "JavaScript-Managed State" pattern, where the Mesgjs object
// is a wrapper around a JavaScript class instance.

function opInit (d) {
    const vnode = new MWICSRVNode(d);
    setRO(d.octx, 'js', vnode);
    setRO(d.rr, 'jsv', vnode);
}

function opOn (d) {
    const vnode = d.js;
    const eventName = String(d.mp.at(0, ''));
    if (!eventName) { return; }

    const handler = d.mp.get('handler') || d.sr;
    const bubbles = d.mp.get('bubbles');
    const preventDefault = d.mp.get('preventDefault');

    const domListener = event => {
        if (preventDefault) { event.preventDefault(); }
        if (!bubbles) { event.stopPropagation(); }
        handler(d.context, event, d.lookup);
    };

    if (!vnode.listeners.has(eventName)) {
        vnode.listeners.set(eventName, new Map());
    }
    vnode.listeners.get(eventName).set(handler, domListener);

    vnode.element.addEventListener(eventName, domListener);
}

function opOff (d) {
    const vnode = d.js;
    const eventName = String(d.mp.at(0, ''));
    const handler = d.mp.get('handler') || d.sr;
    vnode.off(eventName, handler);
}

getInterface('MWICSRVNode').set({
    handlers: {
        '@init': opInit,
        on: opOn,
        off: opOff,
        unmount: d => d.js.unmount()
    }
});