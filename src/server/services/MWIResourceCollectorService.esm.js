/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @license MIT
 */

import { NANOS } from 'mesgjs-web/src/shared/vendor.esm.js';

/**
 * Service to collect resources like stylesheets, modules, and scoped CSS
 * from component payloads during the rendering process.
 */
class MWIResourceCollectorService {
    constructor () {
        this.css = new Map();
        this.modules = new Map();
        this.styles = new Map();
        this.mountPoints = new Map();
    }

    /**
     * Process a component payload and collect its resources.
     * @param {object} payload - The component payload.
     * @param {string} [scopeId] - The unique scope ID for the component.
     */
    processPayload (payload, scopeId) {
        if (!payload || typeof payload !== 'object') return;

        // Collect mount/unmount points
        this._collectMountPoints(payload);

        if (payload.scopedCss && scopeId) {
            this.css.set(scopeId, payload.scopedCss);
        }

        // TODO: Collect other resources like modules and global styles
    }

    _collectMountPoints (payload) {
        const isDefaultMessage = (msg, type) => {
            if (!msg) return true;
            const values = Array.isArray(msg) ? msg
                : (typeof msg?.values === 'function' ? [...msg.values()] : null);
            return values ? (values.length === 1 && values[0] === type) : false;
        };

        const process = (handlers, handlerType) => {
            if (!handlers) return;
            const messageKey = `${handlerType}Message`;
            const entries = (handlers instanceof NANOS)
                ? handlers.namedEntries() : Object.entries(handlers);

            for (const [id, config] of entries) {
                const subscription = this.mountPoints.get(id) || {};
                const configObj = (typeof config === 'string')
                    ? { interface: config } : { ...config };

                if (configObj.interface) {
                    subscription.interface = configObj.interface;
                }

                const message = configObj[messageKey];
                if (message && !isDefaultMessage(message, handlerType)) {
                    subscription[messageKey] = message;
                }

                this.mountPoints.set(id, subscription);
            }
        };

        process(payload.mount, 'mount');
        process(payload.unmount, 'unmount');
    }

    getCollectedResources () {
        return {
            css: this.css,
            modules: this.modules,
            styles: this.styles,
            mountPoints: this.mountPoints
        };
    }
}

export { MWIResourceCollectorService };