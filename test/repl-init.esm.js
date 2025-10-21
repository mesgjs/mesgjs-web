import { setupRuntime } from './harness.esm.js';

// Note: this REPL setup file is currently unnecessary, as setupRuntime
// now includes standard MWI modules by default

await setupRuntime({
	modules: {
		'mwi/mwi-registry': {
			url: '../src/mwi-registry.msjs',
			featpro: 'mwi.compRegOpen mwi.compRegReady',
		},
		'mwi/mwi-document': {
			url: '../src/mwi-document.msjs',
			featpro: 'MWIDocument',
		},
		'mwi/mwi-doc-node': {
			url: '../src/mwi-doc-node.msjs',
			featpro: 'MWIDocNode',
		},
	}
});
