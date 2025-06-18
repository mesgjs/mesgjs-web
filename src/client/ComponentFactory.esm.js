// src/client/ComponentFactory.esm.js

import h from './components/h.esm.js';

/**
 * A simple component factory for the client-side.
 * It resolves component names to their corresponding handler functions.
 */
class ComponentFactory {
    /**
     * Gets the handler for a given component definition.
     * @param {string | symbol} name The name of the component (e.g., 'h.div').
     * @returns {Function | undefined} The component handler, or undefined if not found.
     */
    get (name) {
        if (typeof name !== 'string') {
            return undefined;
        }

        const parts = name.split('.');
        const namespace = parts[0];

        if (namespace === 'h') {
            const tag = parts[1];
            if (tag && h[tag]) {
                return h[tag];
            }
        }

        // In the future, this will support other namespaces and dynamic loading.
        console.warn(`Component handler not found for "${name}"`);
        return undefined;
    }
}

export { ComponentFactory };