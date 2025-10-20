import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from './harness.esm.js';

const REG_OPEN_FT = 'mwi.compRegOpen';
const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;

Deno.test('MWIRegistry - Initialization', async (t) => {
	// Wait for registry to be open
	await fwait(REG_OPEN_FT);
	const registry = getInstance('MWIRegistry');
	assert(registry, 'MWIRegistry instance exists');
});

Deno.test('MWIRegistry - Ready signal', async (t) => {
	// Wait for full registry readiness
	await fwait(REG_READY_FT);
	const registry = getInstance('MWIRegistry');
	assert(registry, 'MWIRegistry instance exists after ready signal');
});
