/*
 * mwi-html-script
 *
 * This module securely registers the <script> tag as a component
 * with the MWI component registry.
 */

import hScript from "../../server/component-handlers/h.script.esm.js";

const { getInstance, fwait, fready } = globalThis.$c;

const FEATURE_PROMISE = "mwi-components:mwi-html-script";
const REGISTRY_READY_PROMISE = "mwi-registry:ready";
const REGISTRY_INTERFACE_NAME = "mwi-registry";

function loadMsjs (mid) {
    fwait(REGISTRY_READY_PROMISE).then(() => {
        const registry = getInstance(REGISTRY_INTERFACE_NAME);
        const payload = { handler: hScript };
        registry("register-component", ["h.script", payload]);
        fready(mid, FEATURE_PROMISE);
    });
}

export { loadMsjs };