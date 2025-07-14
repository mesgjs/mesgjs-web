/*
 * Copyright (c) 2024 Kappa Computer Solutions, LLC.
 *
 * This file is part of the Mesgjs Web Interface project.
 * It is subject to the license terms in the LICENSE file found in the top-level
 * directory of this distribution and at https://www.mesgjs.com/mwi-license.txt.
 * No part of the Mesgjs Web Interface project, including this file, may be
 * copied, modified, propagated, or distributed except according to the terms
 * contained in the MWI License agreement.
 */

import { FEAT_REGISTRY_READY, IF_COMPONENT_REGISTRY } from 'mesgjs-web/src/shared/constants.esm.js';

const { getInstance, fwait, fready } = globalThis.$c;

const FEATURE_PROMISE = 'mwi.components.mwi.semantic.core';

function loadMsjs(mid) {
    'use strict';
    fwait(FEAT_REGISTRY_READY).then(() => {
        const registry = getInstance(IF_COMPONENT_REGISTRY);

        // Register semantic components here

        fready(mid, FEATURE_PROMISE);
    });
}

export { loadMsjs };