/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @author Brian Katzung <briank@kappacs.com>
 * @license MIT
 *
 * This module provides MWI system constants via a Mesgjs singleton interface.
 */
const { getInterface, setRO, fready } = globalThis.$c;

const FEATURE_PROMISE = 'mwi.constantsReady';
const IF_CONSTANTS = 'MWIConstants';

const constants = {
    // Feature Promises (for fwait/fready)
    FEAT_REGISTRY_READY: 'mwi.componentRegistryReady',
    FEAT_COMPONENTS_READY: 'mwi.componentsReady',
    FEAT_COMPONENTS_PREFIX: 'mwi.components.',

    // HTML Element IDs
    ID_HYDRATION_SCRIPT: 'mwiHydration',
    ID_MODULES_SCRIPT: 'mwiModules'
};
Object.freeze(constants);

function opInit(d) {
    // Expose all constants as read-only properties on the interface function
    setRO(d.rr, constants);
}

function loadMsjs(mid) {
    const constantsInterface = getInterface(IF_CONSTANTS);
    constantsInterface.set({
        singleton: true,
        pristine: true,
        lock: true,
        handlers: {
            '@init': opInit,
            // Expose the raw object via @jsv as well for convenience
            '@jsv': () => constants
        }
    });

    fready(mid, FEATURE_PROMISE);
}

export { loadMsjs };