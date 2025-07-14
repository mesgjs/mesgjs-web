/**
 * mwi.html.script
 *
 * This module securely registers the <script> tag as a component
 * with the MWI component registry.
 *
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @license MIT
 */

import hScript from "mesgjs-web/src/server/component-handlers/h.script.esm.js";
import { FEAT_REGISTRY_READY, IF_COMPONENT_REGISTRY } from 'mesgjs-web/src/shared/constants.esm.js';

const { getInstance, fwait, fready } = globalThis.$c;

const FEATURE_PROMISE = "mwi.components.mwi.html.script";

function loadMsjs (mid) {
    fwait(FEAT_REGISTRY_READY).then(() => {
        const registry = getInstance(IF_COMPONENT_REGISTRY);
        const payload = { handler: hScript };
        registry("registerComponent", ["h.script", payload]);
        fready(mid, FEATURE_PROMISE);
    });
}

export { loadMsjs };