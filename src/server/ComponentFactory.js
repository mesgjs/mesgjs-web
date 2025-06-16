/**
 * @copyright 2025 Mesgjs Project.
 *
 * A placeholder ComponentFactory for the server-side renderer. This mock
 * implementation is designed to be replaced by the full, dynamic factory
 * later. It provides handlers for the `h.<tagname>` primitive components.
 *
 * @license MIT
 */

/**
 * A generic handler for creating basic HTML elements.
 * @param {string} tag The HTML tag to create.
 * @returns {function(object, ...any): string} A function that renders the element to a string.
 */
const basicElementHandler = (tag) => (props, ...children) => {
    const attrs = Object.entries(props || {})
        .map(([key, value]) => `${key}="${String(value)}"`)
        .join(' ');
    const innerHTML = children.flat().join('');
    return `<${tag}${attrs ? ' ' + attrs : ''}>${innerHTML}</${tag}>`;
};

// A map of primitive component handlers.
const componentHandlers = new Map([
    ['h.div', basicElementHandler('div')],
    ['h.p', basicElementHandler('p')],
    ['h.h1', basicElementHandler('h1')],
    ['h.a', basicElementHandler('a')],
    ['h.img', basicElementHandler('img')],
    ['h.span', basicElementHandler('span')],
]);

class ComponentFactory {
    /**
     * Retrieves a component handler by its symbolic name.
     * For this mock implementation, it only resolves `h.<tagname>` components.
     *
     * @param {string} symbolicName The name of the component to retrieve.
     * @returns {Function} The component handler function.
     * @throws {Error} If the component is not found.
     */
    get(symbolicName) {
        if (!componentHandlers.has(symbolicName)) {
            // In the future, this will query the module resolution system.
            throw new Error(`Component "${symbolicName}" not found.`);
        }
        return componentHandlers.get(symbolicName);
    }
}

export { ComponentFactory };