import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from './harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

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
		'mwi/mwi-core-comp': {
			url: './src/mwi-core-comp.msjs',
			featpro: 'mwi.comp.MWICore',
		},
		'mwi/mwi-html-comp': {
			url: './src/mwi-html-comp.msjs',
			featpro: 'mwi.comp.MWIHTML',
		},
		/* */
	}
});
const { fwait, getInterface, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

Deno.test("MWIRegistry", async (t) => {
	const registry = getInstance('MWIRegistry');
	assert(registry);
	// registry('dump');
});
