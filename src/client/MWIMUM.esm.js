/*
 * Copyright (c) 2025 Brian Katzung and Kappa Computer Solutions, LLC
 *
 * @license MIT
 */

import { getInstance } from 'mesgjs-web/src/shared/vendor.esm.js';

/**
 * @module MWIMUM
 *
 * @description
 * The Mount/Unmount Monitor (MWIMUM), or "MUM", is a client-side service
 * responsible for managing component lifecycle events based on the architecture
 * defined in architectural-plan/mwi-mum-plan.md.
 */
class MWIMUM {
    #subscriptions = new Map(); // For declarative, ID-based subscriptions
    #vnodes = new WeakMap(); // For programmatic, element-based registrations
    #observer;

    constructor () {
        this.#observer = new MutationObserver(
            (mutations) => this.#handleMutations(mutations)
        );
    }

    async #handleMutations (mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    await this.#checkAndMount(node);
                }
                for (const node of mutation.removedNodes) {
                    await this.#checkAndUnmount(node);
                }
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'id') {
                await this.#handleIdChange(mutation.target, mutation.oldValue);
            }
        }
    }

    async #handleIdChange (element, oldId) {
        if (oldId && this.#subscriptions.has(oldId)) {
            await this.#processDeclarativeHandlers(element, 'unmount', oldId);
        }
        if (element.id && this.#subscriptions.has(element.id)) {
            await this.#processDeclarativeHandlers(element, 'mount', element.id);
        }
    }

    async #checkAndMount (node) {
        if (!(node instanceof Element)) { return; }

        if (node.id && this.#subscriptions.has(node.id)) {
            await this.#processDeclarativeHandlers(node, 'mount', node.id);
        }

        const childrenWithIds = node.querySelectorAll('[id]');
        for (const child of childrenWithIds) {
            if (this.#subscriptions.has(child.id)) {
                await this.#processDeclarativeHandlers(child, 'mount', child.id);
            }
        }
    }

    async #checkAndUnmount (node) {
        if (!(node instanceof Element)) { return; }

        // Programmatic CSR VNodes
        if (this.#vnodes.has(node)) {
            const vnodeReceiver = this.#vnodes.get(node);
            vnodeReceiver('unmount');
            this.#vnodes.delete(node);
        }

        // Declarative SSR subscriptions
        if (node.id && this.#subscriptions.has(node.id)) {
            await this.#processDeclarativeHandlers(node, 'unmount', node.id);
        }

        // Recursively check children
        if (node.childNodes?.length > 0) {
            for (const child of node.childNodes) {
                await this.#checkAndUnmount(child);
            }
        }
    }

    async #processDeclarativeHandlers (element, type, elementId) {
        const subscription = this.#subscriptions.get(elementId);
        if (!subscription) return;

        let interfaceName, message;

        if (typeof subscription === 'string') {
            interfaceName = subscription;
            message = [type]; // Convention: ['mount'] or ['unmount']
        } else {
            interfaceName = subscription.interface;
            const messageKey = `${type}Message`; // mountMessage or unmountMessage
            message = subscription[messageKey] || [type];
        }

        if (!interfaceName) {
            console.error(`MWIMUM: No interface defined for #${elementId}`);
            return;
        }

        const componentHandler = getInstance(interfaceName);
        if (!componentHandler) {
            console.error(`MWIMUM: Could not get instance for interface "${interfaceName}"`);
            return;
        }

        const [operation, params] = Array.isArray(message)
            ? message
            : [message, {}];
        
        const finalParams = { ...params, element };

        try {
            await componentHandler(operation, finalParams);
        } catch (error) {
            console.error(`MWIMUM: Error during ${type} for #${elementId}:`, error);
        }
    }

    subscribe (elementId, subscriptionData) {
        this.#subscriptions.set(elementId, subscriptionData);
    }

    register (element, vnodeReceiver) {
        this.#vnodes.set(element, vnodeReceiver);
    }

    async init () {
        const mountPromises = [];
        for (const id of this.#subscriptions.keys()) {
            const element = id ? document.getElementById(id) : document.documentElement;
            if (element) {
                const promise = this.#processDeclarativeHandlers(element, 'mount', id)
                    .catch(error => {
                        console.error(`MWIMUM: Error during initial mount for #${id}:`, error);
                        return null; // Don't halt Promise.all
                    });
                mountPromises.push(promise);
            }
        }

        await Promise.all(mountPromises);

        this.#observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id']
        });
    }

    stop () {
        this.#observer.disconnect();
    }
}

export const mum = new MWIMUM();