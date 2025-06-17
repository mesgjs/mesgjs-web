import { NANOS } from '../shared/vendor.esm.js';
import { StringSet } from '../shared/StringSet.esm.js';

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
 * Escapes a string for use in an HTML attribute value.
 * @param {any} str The value to escape.
 * @returns {string} The escaped string.
 */
const escapeAttr = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');

/**
 * A generic handler for creating basic HTML elements. It implements security
 * policies for attribute and class rendering and supports bilingual data sources.
 * @param {string} tag The HTML tag to create.
 * @returns {function(object, ...any): {html: string}} A function that renders the element.
 */
const basicElementHandler = (tag) => (props, ...children) => {
    const attributes = [];
    const classes = [];
    // Normalize properties from either a JS object or a NANOS instance.
    const propsSource = (props instanceof NANOS) ? props.storage : (props || {});

    for (const [key, value] of Object.entries(propsSource)) {
        if (key === ':class') {
            // Normalize the class list from either a JS array or a NANOS list.
            const classList = (value instanceof NANOS) ? [...value.values()] : value;

            // Security: Process only indexed values from a list.
            if (Array.isArray(classList)) {
                const validClasses = classList
                    // Security: Validate each class name against a strict regex.
                    .filter(c => typeof c === 'string' && /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(c));
                classes.push(...validClasses);
            }
        } else if (String(key).startsWith(':')) {
            // Security: Ignore unknown special attributes to prevent injection.
        } else {
            // Security: Escape both attribute name and value to prevent XSS.
            attributes.push(`${escapeAttr(key)}="${escapeAttr(value)}"`);
        }
    }

    if (classes.length > 0) {
        // Security: The final class string is also escaped as a defense-in-depth measure.
        attributes.push(`class="${escapeAttr(classes.join(' '))}"`);
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
    ['h.button', basicElementHandler('button')],
    ['h.img', basicElementHandler('img')],
    ['h.span', basicElementHandler('span')],
    ['h.title', basicElementHandler('title')],
    ['h.head', basicElementHandler('head')],
    ['h.body', basicElementHandler('body')],
    ['h.html', basicElementHandler('html')],
    ['button', (props, ...children) => {
        // If an href is provided, render a link styled as a button.
        // Otherwise, render a standard button.
        const propsSource = (props instanceof NANOS) ? props.storage : (props || {});
        const tag = propsSource.href ? 'h.a' : 'h.button';

        // Combine all class sources into a single set.
        const classSet = new StringSet(
            'button', // Default class
            propsSource.class, // from a `class` attribute string
            propsSource[':class'] // from a `:class` list/array
        );

        // Create the final props, ensuring `:class` is a NANOS list
        // and removing the original `class` attribute.
        const finalProps = new NANOS(props);
        finalProps.set(':class', new NANOS(...classSet.toArray()));
        finalProps.delete('class');

        return {
            content: [tag, finalProps, ...children]
        };
    }],
    ['card', (props, ...children) => {
        // Normalize properties from either a JS object or a NANOS instance.
        const propsSource = (props instanceof NANOS) ? props.storage : (props || {});
        const title = propsSource.title || 'Default Title';

        return {
            scopedCss: `
                .@@-card { border: 1px solid #ccc; border-radius: 8px; padding: 16px; }
                .@@-title { font-size: 1.5em; margin-bottom: 8px; }
            `,
            content: ['h.div', { ':class': ['@@-card'] },
                ['h.h1', { ':class': ['@@-title'] }, title],
                ...children
            ]
        };
    }]
]);

class ComponentFactory {
    /**
     * Retrieves a component handler by its symbolic name.
     * For this mock implementation, it resolves `h.<tagname>` components and
     * a sample 'card' component.
     *
     * @param {string} symbolicName The name of the component to retrieve.
     * @returns {Promise<{handler: Function, resolvedName: string}|undefined>}
     *   A promise that resolves to an object containing the handler and its
     *   resolved name, or undefined if not found.
     */
    async get(symbolicName) {
        // In the future, this will query the module resolution system.
        if (componentHandlers.has(symbolicName)) {
            return {
                handler: componentHandlers.get(symbolicName),
                resolvedName: symbolicName
            };
        }
        return undefined;
    }
}

export { ComponentFactory };