import { NANOS } from '../shared/vendor.esm.js';
import { StringSet } from '../shared/StringSet.esm.js';
import h from './components/h.esm.js';

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

// A map of primitive component handlers.
const componentHandlers = new Map([
    ['button', (vnode) => {
        // If an href is provided, render a link styled as a button.
        // Otherwise, render a standard button.
        const tag = vnode.getAttribute('href') ? 'h.a' : 'h.button';

        // Combine all class sources into a single set.
        const classSet = new StringSet(
            'button', // Default class
            vnode.getAttribute('class') // from a `class` attribute string
        );

        // Create the final props, ensuring `class` is a string
        const finalProps = new NANOS(vnode.attributes);
        finalProps.set('class', classSet.toString());

        return {
            content: [tag, finalProps, ...vnode.children]
        };
    }],
    ['card', (vnode) => {
        const title = vnode.getAttribute('title') || 'Default Title';

        return {
            scopedCss: `
                .@@-card { border: 1px solid #ccc; border-radius: 8px; padding: 16px; }
                .@@-title { font-size: 1.5em; margin-bottom: 8px; }
            `,
            content: ['h.div', { class: '@@-card' },
                ['h.h1', { class: '@@-title' }, title],
                ...vnode.children
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
        if (symbolicName.startsWith('h.')) {
            return { handler: h, resolvedName: symbolicName };
        }

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