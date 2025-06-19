import { NANOS } from '../shared/vendor.esm.js';
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

const componentHandlers = new Map([
    // "Smart" handler for the button component.
    ['button', async (vnode, renderer) => {
        const tag = vnode.get('href') ? 'a' : 'button';
        vnode.opts.tag = tag;
        if (tag === 'a') {
            vnode.editClass('button');
        }
        await vnode.renderChildren(renderer);
        return vnode;
    }],
    // "Low-code" handler for the card component.
    ['card', [
        'h.div', { class: 'card', ':slot': 'self' },
        ['div', { class: 'card-header' },
            ['m.slot', { name: 'header' },
                // Default content for the header slot
                ['h.h1', 'Default Card Title']
            ]
        ],
        ['div', { class: 'card-body' },
            ['m.slot'] // Default slot for the main content
        ]
    ]]
]);

class ComponentFactory {
    /**
     * Retrieves a component handler by its symbolic name.
     *
     * @param {string} symbolicName The name of the component to retrieve.
     * @returns {Promise<{handler: Function, resolvedName: string}|undefined>}
     */
    async get(symbolicName) {
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