import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from './harness.esm.js';

const INTERFACE = 'if';
const FEATURE = 'ftr';
const COMP_ID_PRE = '_MO_';

const REG_IF = 'MWIRegistry';
const REG_OPEN_FT = 'mwi.compRegOpen';
const REG_READY_FT = 'mwi.compRegReady';
const BASE_IF = 'MWIDocNode';
const BASE_FT = BASE_IF;
const PRELOAD_FT = 'mwi.comp.preload';
const DEFER_IF = BASE_IF;
const DEFER_TYPE = 'Deferred';
const DEFER_FT = DEFER_TYPE;

const preloadCode = 'preloaded();';
const preloadURL = `data:application/javascript;base64,${btoa(preloadCode)}`;
const deferCode = 'deferred();';
const deferURL = `data:application/javascript;base64,${btoa(deferCode)}`;
let deferLoaded = false;

// We need some "stuff" early...
await import('./runtime-loader.esm.js');

const { fcheck, fready, fwait, getInterface, getInstance } = globalThis.$c;
const ls = (pairs) => (new NANOS()).fromPairs(pairs);

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
		'mwi/mwi-registry': {
			url: './src/mwi-registry.msjs',
			featpro: 'mwi.compRegOpen mwi.compRegReady',
		},
		'mwi/mwi-document': {
			url: './src/mwi-document.msjs',
			featpro: 'MWIDocument',
		},
		'mwi/mwi-doc-node': {
			url: './src/mwi-doc-node.msjs',
			featpro: 'MWIDocNode',
		},
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

Deno.test('Deferred components in MWI auto-load upon registry access', async (t) => {
	// Wait until ("pre-load") registrations have completed
	await fwait(REG_READY_FT);
	const registry = getInstance(REG_IF);
	assertEquals(deferLoaded, false, 'module *is not* loaded *before* access');
	assertEquals(fcheck(DEFER_FT), false, 'fcheck returns *false* *before* access');

	// Request the registry entry
	const entry = await registry.get(DEFER_TYPE);
	assert(entry, 'registry returned component entry');
	assertEquals(deferLoaded, true, 'module *is* loaded *after* access');
	assertEquals(fcheck(DEFER_FT), true, 'fcheck returns *true* *after* access');
	try { console.log('entry', entry.toSLID()); }
	catch (e) { console.warn('Note: SLID display of returned entry failed'); }
	assertEquals(entry.at(INTERFACE), DEFER_IF, 'interface merged into component entry');
	assertEquals(entry.at(FEATURE), DEFER_FT, 'feature still present into component entry');
	assert(entry.at('id')?.startsWith(COMP_ID_PRE), 'component has been assigned an id');
});
