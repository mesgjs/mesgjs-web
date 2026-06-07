import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const INTERFACE = 'if';
const FEATURE = 'ftr';
const COMP_ID_PRE = '_MO_';

const REG_IF = 'MWIRegistry';
const REG_OPEN_FT = 'mwi.compRegOpen';
const REG_READY_FT = 'mwi.compRegReady';
const BASE_IF = 'MWIDocNode';
const PRELOAD_FT = 'mwi.comp.preload';
const DEFER_TYPE = 'Deferred';
const DEFER_FT = DEFER_TYPE;

const preloadCode = 'preloaded();';
const preloadURL = `data:application/javascript;base64,${btoa(preloadCode)}`;
const deferCode = 'deferred();';
const deferURL = `data:application/javascript;base64,${btoa(deferCode)}`;
let deferLoaded = false;

// We need some "stuff" early...
await import('../runtime-loader.esm.js');

const { fcheck, fready, fwait, getInstance } = globalThis.$c;

// Preloaded component portion
globalThis.preloaded = async () => {
	// When the registry is open, register the deferred feature and signal ready
	await fwait(REG_OPEN_FT);
	const registry = getInstance(REG_IF);
	registry.register(DEFER_TYPE, ls([FEATURE, DEFER_FT]));
	fready(null, PRELOAD_FT);
};

// Deferred-load component portion
globalThis.deferred = async () => {
	deferLoaded = true;
	const registry = getInstance(REG_IF);
	// Merge (base) interface into registration
	registry.register(DEFER_TYPE, ls([INTERFACE, BASE_IF]));
	fready(null, DEFER_FT);
};

await setupRuntime({
	modules: {
		preload: {
			url: preloadURL,
			integrity: 'DISABLED',
			featpro: 'mwi.comp.preload',
		},
		defer: {
			url: deferURL,
			integrity: 'DISABLED',
			deferLoad: true,
			featpro: 'Deferred',
		}
	}
});

Deno.test('MWIRegistry - Deferred Module Loading', async (t) => {
	// Wait until ("pre-load") registrations have completed
	await fwait(REG_READY_FT);
	const registry = getInstance(REG_IF);

	await t.step('Module not loaded before access', () => {
		assertEquals(deferLoaded, false, 'Module should not be loaded before access');
		assertEquals(fcheck(DEFER_FT), false, 'Feature check should return false before access');
	});

	await t.step('.getWait() triggers module load and merges interface', async () => {
		// Request the registry entry - this should trigger deferred load
		const entry = await registry.getWait(DEFER_TYPE);
		
		assert(entry, 'Registry should return component entry');
		assertEquals(deferLoaded, true, 'Module should be loaded after access');
		assertEquals(fcheck(DEFER_FT), true, 'Feature check should return true after access');
		assertEquals(entry.at(INTERFACE), BASE_IF, 'Interface should be merged into component entry');
		assertEquals(entry.at(FEATURE), DEFER_FT, 'Feature should still be present');
		assert(entry.at('id')?.startsWith(COMP_ID_PRE), 'Component should have been assigned an ID');
	});
});
