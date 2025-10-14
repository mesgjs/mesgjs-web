import { setupRuntime } from './harness.esm.js';

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
