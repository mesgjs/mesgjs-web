/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @license MIT
 */

/**
 * Manages the mapping of component names to unique scope IDs for CSS scoping.
 */
class MWIScopeManagerService {
    constructor (initialState = {}) {
        this.rehydrate(initialState);
    }

    /**
     * Get or create a scope ID for a given component specifier.
     * @param {string} specifier - The component's unique specifier.
     * @returns {string} The unique scope ID.
     */
    getScopeId (specifier) {
        if (!this.scopeIds.has(specifier)) {
            this.scopeIds.set(specifier, 'mwi-' + (this.nextId++).toString(36) + '-');
        }
        return this.scopeIds.get(specifier);
    }

    /**
     * Rehydrates the service's state.
     * @param {object} state - The state object for rehydration.
     * @param {Array<[string, string]>} [state.scopeIds] - Initial scope IDs.
     * @param {number} [state.nextId] - The next available ID.
     */
    rehydrate ({ scopeIds = [], nextId = 0 } = {}) {
        this.scopeIds = new Map(scopeIds);
        this.nextId = nextId;
    }

    /**
     * Gets the current state of the service for serialization.
     * @returns {object} The current state.
     */
    getState () {
        return {
            scopeIds: [...this.scopeIds.entries()],
            nextId: this.nextId
        };
    }
}

export { MWIScopeManagerService };