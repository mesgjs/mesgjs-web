// src/client/MWICSRactory.esm.js

import h from 'mesgjs-web/src/client/components/mwi-html-core-handler.esm.js';

/**
 * A simple component factory for the client-side.
 * It resolves component names to their corresponding handler functions.
 */
class MWICSRFactory {
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

        const [pfx, ...rest] = name.split('.');
        const tag = rest.join('.');

        if (pfx === 'h') {
            return this._components.h[tag];
        }

        return this._components[name];
    }
}

export { MWICSRFactory };