// src/client/ComponentFactory.esm.js

import h from './components/h.esm.js';

/**
 * A simple component factory for the client-side.
 * It resolves component names to their corresponding handler functions.
 */
class ComponentFactory {
    _components = {};

    constructor(components = {}) {
        this._components = { ...components, h };
    }

    /**
     * Gets the handler for a given component definition.
     * @param {string | symbol} name The name of the component (e.g., 'h.div').
     * @returns {Function | undefined} The component handler, or undefined if not found.
     */
    get (name) {
        if (typeof name !== 'string') {
            return undefined;
        }

        if (this._components[name]) {
            return this._components[name];
        }

        if (name.startsWith('h.')) {
            const tag = name.substring(2);
            return this._components.h[tag];
        }

        return this._components[name];
    }
}

export { ComponentFactory };