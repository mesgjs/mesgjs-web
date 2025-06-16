/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * A placeholder ComponentFactory for the server-side renderer. This mock
 * implementation is designed to be replaced by the full, dynamic factory
 * later. It provides handlers for the `h.<tagname>` primitive components
 * according to the finalized MWI architecture.
 *
 * @license MIT
 */

/**
 * A generic handler for creating basic HTML elements. It returns a payload
 * object with the final HTML string.
 * @param {string} tag The HTML tag to create.
 * @returns {function(object, ...any): {html: string}} A function that renders the element.
 */
const basicElementHandler = (tag) => (props, ...children) => {
    const attributes = [];
    const classes = [];

    for (const [key, value] of Object.entries(props || {})) {
        if (key === ':class' && Array.isArray(value)) {
            classes.push(...value.filter(c => typeof c === 'string' && /^[a-zA-Z0-9_-]+$/.test(c)));
        } else if (key.startsWith(':')) {
            // Ignore other special attributes for now
        }
        else {
            attributes.push(`${key}="${String(value)}"`);
        }
    }

    if (classes.length > 0) {
        attributes.push(`class="${classes.join(' ')}"`);
    }

    const attrs = attributes.join(' ');
    const innerHTML = children.flat().join('');

    return {
        html: `<${tag}${attrs ? ' ' + attrs : ''}>${innerHTML}</${tag}>`
    };
};

// A map of primitive component handlers.
const componentHandlers = new Map([
    ['h.div', basicElementHandler('div')],
    ['h.p', basicElementHandler('p')],
    ['h.h1', basicElementHandler('h1')],
    ['h.a', basicElementHandler('a')],
    ['h.img', basicElementHandler('img')],
    ['h.span', basicElementHandler('span')],
    ['h.title', basicElementHandler('title')],
    ['h.head', basicElementHandler('head')],
    ['h.body', basicElementHandler('body')],
    ['h.html', basicElementHandler('html')],
]);

class ComponentFactory {
    /**
     * Retrieves a component handler by its symbolic name.
     * For this mock implementation, it only resolves `h.<tagname>` components.
     *
     * @param {string} symbolicName The name of the component to retrieve.
     * @returns {Promise<Function|undefined>} A promise that resolves to the
     *   component handler function or undefined if not found.
     */
    async get(symbolicName) {
        // In the future, this will query the module resolution system.
        if (componentHandlers.has(symbolicName)) {
            return Promise.resolve(componentHandlers.get(symbolicName));
        }
        return Promise.resolve(undefined);
    }
}

export { ComponentFactory };