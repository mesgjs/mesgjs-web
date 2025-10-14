/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 *
 * This file is part of the Mesgjs Web Interface (MWI).
 *
 * The MWI is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * @license MIT
 */

import { MWIMUM } from 'mesgjs-web/src/client/MWIMUM.esm.js';

/**
 * The MWIHydration class is responsible for reading the SSR-generated
 * hydration data from the page and initializing the client-side
 * Mount/Unmount Monitor (MWIMUM).
 */
export class MWIHydration {
    _mum;

    constructor (mum) {
        this._mum = mum;
    }

    /**
     * Initialize the hydration process.
     */
    init () {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.hydrate());
        } else {
            this.hydrate();
        }
    }

    /**
     * Read the hydration data and configure the MWIMUM.
     */
    hydrate () {
        const scriptTag = document.getElementById('mwi-hydration');
        if (!scriptTag) return;

        try {
            const hydrationData = JSON.parse(scriptTag.textContent);

            for (const [id, config] of Object.entries(hydrationData)) {
                this._mum.subscribe(id, config);
            }
        } catch (error) {
            console.error('MWI Hydration Error: Failed to parse hydration data.', error);
        }
    }
}