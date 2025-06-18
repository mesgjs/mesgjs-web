// src/client/components/h.esm.js

import { NANOS } from '../../shared/vendor.esm.js';
import { StringSet } from '../../shared/StringSet.esm.js';

/**
 * A map of lower-cased HTML tag names to their corresponding handler functions.
 * This is a cache to avoid recreating functions for the same tag.
 * @type {Map<string, Function>}
 */
const handlerCache = new Map();

/**
 * Creates a component handler for a given HTML tag.
 * @param {string} tag The HTML tag name (e.g., 'div', 'p').
 * @returns {Function} A component handler function.
 */
function createTagHandler (tag) {
    // Return from cache if it exists
    if (handlerCache.has(tag)) {
        return handlerCache.get(tag);
    }

    /**
     * The actual component handler.
     * @param {NANOS} def The component definition.
     * @param {object} renderer The CsrRenderer instance.
     * @returns {{dom: HTMLElement}} The payload with the created DOM element.
     */
    const handler = (def, renderer) => {
        const el = document.createElement(tag);
        const classSet = new StringSet();

        // Process attributes
        for (const [key, value] of def.namedEntries()) {
            switch (key) {
            case ':class':
                if (Array.isArray(value) || value instanceof NANOS) {
                    classSet.add(...value.values());
                    continue;
                }
                // Fall through...
            case 'class':
                if (typeof value === 'string') {
                    classSet.add(value);
                }
                continue;
            }
            if (typeof key === 'string' && !key.startsWith(':')) {
                // Standard attributes
                el.setAttribute(key, String(value));
            }
        }

        const classes = classSet.toArray().filter(c => typeof c === 'string' && /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(c));
        if (classes.length) {
            el.className = classes.join(' ');
        }

        // Process children. Children are all indexed values after the component name.
        const [ , ...children ] = def.values();
        if (children && children.length > 0) {
            // The children are often wrapped in a single array from the source
            // data, so we handle that common case.
            const childrenToRender = (children.length === 1 && Array.isArray(children[0]))
                ? children[0]
                : children;

            const childNodes = renderer.render(childrenToRender, true);
            if (childNodes?.length) {
                el.append(...childNodes);
            }
        }

        return { dom: el };
    };

    handlerCache.set(tag, handler);
    return handler;
}

/**
 * A proxy that dynamically creates and returns component handlers for `h.*` components.
 * This avoids having to define a handler for every single HTML tag.
 */
const h = new Proxy({}, {
    get (target, prop, receiver) {
        if (typeof prop !== 'string') {
            return Reflect.get(target, prop, receiver);
        }

        // prop will be 'div' for 'h.div'
        const tag = prop.toLowerCase();
        return createTagHandler(tag);
    }
});

export default h;