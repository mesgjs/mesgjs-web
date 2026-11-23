import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertExists,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const registry = getInstance('MWIRegistry');

// Note: Rendering tests (getHTML, getDOM) have been migrated to:
//   - test/ssr-html/scoped-css.test.js (getHTML tests)
//   - test/csr-dom/scoped-css.test.js (getDOM tests, already covered)

describe("MWICoreScpCSS Core - Basic Interface Behavior", () => {
	it("Create m.scpcss node", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		assertExists(scpNode, "Node creation should succeed");
		assertEquals(scpNode.type, 'm.scpcss', "Node should have correct type");

		// Verify void behavior - setSubSpec should be no-op
		$c.sm(scpNode, 'setSubSpec', ps('[( [m.t t="test"] )]'));
		assertEquals($c.sm(scpNode, 'hasChildren'), false, "Void node should not accept children");
	});
});

describe("MWICoreScpCSS Core - m.ci Virtual Attribute", () => {
	it("Read m.ci from node itself", () => {
		registry.register('test.core.scpcss.ci1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = getInstance('MWIDocument');
		const node = doc.createNode('test.core.scpcss.ci1');

		const ci = $c.sm(node, 'getAttr', ls([, 'm.ci']));
		assertExists(ci, "m.ci should be defined for node");
		assert(ci.startsWith('_MO_'), "Component ID should start with _MO_");
	});

	it("m.ci is read-only", () => {
		registry.register('test.core.scpcss.ci3', ls([
			'allowLate', true,
			'if', 'MWIHTML'
		]));

		const doc = getInstance('MWIDocument');
		const node = doc.createNode('test.core.scpcss.ci3');

		const originalCi = $c.sm(node, 'getAttr', ls([, 'm.ci']));

		// Attempt to set m.ci
		$c.sm(node, 'setAttr', ls([, 'm.ci', , 'fake-id']));

		const afterCi = $c.sm(node, 'getAttr', ls([, 'm.ci']));
		assertEquals(afterCi, originalCi, "m.ci should remain unchanged (read-only)");
	});
});
