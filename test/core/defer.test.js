import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.component', 'test.deferred3.component'],
});

const { fwait, fready, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = doc.registry();
const ls = globalThis.ls;
const ps = globalThis.ps;

// Register a test component with only a feature promise (no interface/template)
// This simulates a component that hasn't been loaded yet
const deferredEntry = ls([
	'allowLate', true,
	'ftr', 'test.deferred.component'
]);
registry.register('test.deferred', deferredEntry);

Deno.test("MWICoreDefer (m.defer) - Basic Interface Tests", async (t) => {
	const deferNode = doc.createNode('m.defer');

	await t.step("(type) - Get node type (should be h.slot after init)", () => {
		// After @init, type changes from m.defer to h.slot
		assertEquals(deferNode('type'), 'h.slot');
	});

	await t.step(".type - Get node type via JS (should be h.slot after init)", () => {
		assertEquals(deferNode.type, 'h.slot');
	});

	await t.step(".msjsType - Get Mesgjs type", () => {
		assertEquals(deferNode.msjsType, 'MWICoreDefer');
	});

	await t.step(".jsv - Should return instance", () => {
		assertStrictEquals(deferNode.jsv, deferNode);
	});

	await t.step(".valueOf() - Should return instance", () => {
		assertStrictEquals(deferNode.valueOf(), deferNode);
	});

	await t.step("(document) - Get document reference", () => {
		const docRef = deferNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(deferNode.document, doc);
	});
});

Deno.test("MWICoreDefer (m.defer) - Defer Type Capture", async (t) => {
	await t.step("Captures original type in m.deferType attribute", () => {
		const deferNode = doc.createNode('m.defer');
		// The original type 'm.defer' should be captured in m.deferType
		assertEquals(deferNode('getAttr', ls([, 'm.deferType'])), 'm.defer');
	});

	await t.step("Captures original type in data-mwi-defer attribute", () => {
		const deferNode = doc.createNode('m.defer');
		assertEquals(deferNode('getAttr', ls([, 'data-mwi-defer'])), 'm.defer');
	});

	await t.step("Type changes to h.slot after init", () => {
		const deferNode = doc.createNode('m.defer');
		// After @init, the type should be h.slot for rendering
		assertEquals(deferNode('type'), 'h.slot');
	});
});

Deno.test("MWICoreDefer (m.defer) - Auto-ID Assignment", async (t) => {
	await t.step("Auto-assigns ID if not present", () => {
		const deferNode = doc.createNode('m.defer');
		const id = deferNode('getAttr', ls([, 'm.id']));
		assert(id, "ID should be auto-assigned");
		assert(typeof id === 'string', "ID should be a string");
		assert(id.length > 0, "ID should not be empty");
	});

	await t.step("Preserves explicit ID if provided", () => {
		const spec = ps('[(m.defer id=custom-defer-id)]');
		const deferNode = doc.from({ item: spec });
		assertEquals(deferNode('getAttr', ls([, 'm.id'])), 'custom-defer-id');
	});

	await t.step("Auto-assigned IDs are unique", () => {
		const defer1 = doc.createNode('m.defer');
		const defer2 = doc.createNode('m.defer');
		const id1 = defer1('getAttr', ls([, 'm.id']));
		const id2 = defer2('getAttr', ls([, 'm.id']));
		assert(id1 !== id2, "Auto-assigned IDs should be unique");
	});
});

Deno.test("MWICoreDefer (m.defer) - Inherited MWIDocNode Operations", async (t) => {
	const deferNode = doc.createNode('m.defer');

	await t.step("(setAttr) - Set basic attribute", () => {
		deferNode('setAttr', ls([, 'data-test', , 'value123']));
		assertEquals(deferNode('getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set basic attribute via JS", () => {
		deferNode.setAttr('data-custom', 'custom-value');
		assertEquals(deferNode.getAttr('data-custom'), 'custom-value');
	});

	await t.step("(getAttr) - Get attribute", () => {
		deferNode('setAttr', ls([, 'title', , 'Defer Title']));
		assertEquals(deferNode('getAttr', ls([, 'title'])), 'Defer Title');
	});

	await t.step(".getAttr() - Get attribute via JS", () => {
		deferNode.setAttr('aria-label', 'Test Defer');
		assertEquals(deferNode.getAttr('aria-label'), 'Test Defer');
	});

	await t.step("(hasAttr) - Check attribute existence", () => {
		deferNode('setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals(deferNode('hasAttr', ls([, 'test-attr'])), true);
		assertEquals(deferNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", () => {
		deferNode.setAttr('another-attr', 'value');
		assertEquals(deferNode.hasAttr('another-attr'), true);
		assertEquals(deferNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete attribute", () => {
		deferNode('setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals(deferNode('hasAttr', ls([, 'temp-attr'])), true);
		deferNode('delAttr', ls([, 'temp-attr']));
		assertEquals(deferNode('hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete attribute via JS", () => {
		deferNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(deferNode.hasAttr('temp-js-attr'), true);
		deferNode.delAttr('temp-js-attr');
		assertEquals(deferNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(hasClass) - Basic class check", () => {
		deferNode('setAttr', ls([, 'class', , 'test-class']));
		assertEquals(deferNode('hasClass', ls([, 'test-class'])), true);
		assertEquals(deferNode('hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Basic class check via JS", () => {
		deferNode.setAttr('class', 'js-class another-class');
		assertEquals(deferNode.hasClass('js-class'), true);
		assertEquals(deferNode.hasClass('another-class'), true);
		assertEquals(deferNode.hasClass('not-there'), false);
	});
});

Deno.test("MWICoreDefer (m.defer) - Spec Management", async (t) => {
	await t.step("(getSpec) - Get spec with defer attributes", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode('getAttr', ['m.id']);
		const spec = deferNode('getSpec');
		// Type should be h.slot after init
		assertEquals(spec.at(0), 'h.slot');
		// Should have m.deferType attribute
		assertEquals(spec.at('m.deferType'), 'm.defer');
		assertEquals(spec.at('data-mwi-defer'), 'm.defer');
		// Should have auto-assigned ID
		assert(spec.at('id'), "Should have auto-assigned ID");
	});

	await t.step(".getSpec() - Get spec with defer attributes via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.getAttr('m.id');
		const spec = deferNode.getSpec();
		assertEquals(spec.at(0), 'h.slot');
		assertEquals(spec.at('m.deferType'), 'm.defer');
		assertEquals(spec.at('data-mwi-defer'), 'm.defer');
		assert(spec.at('id'), "Should have auto-assigned ID");
	});

	await t.step("(setSpec) - Set attributes from spec", () => {
		const deferNode = doc.createNode('m.defer');
		const spec = ps('[(h.slot data-test=value class=defer-class)]');
		deferNode('setSpec', ls([, spec]));
		assertEquals(deferNode('getAttr', ls([, 'data-test'])), 'value');
		assert(deferNode('getAttr', ls([, 'class'])).includes('defer-class'));
	});

	await t.step(".setSpec() - Set attributes from spec via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const spec = ps('[(h.slot data-custom=custom-value)]');
		deferNode.setSpec(spec);
		assertEquals(deferNode.getAttr('data-custom'), 'custom-value');
	});
});

Deno.test("MWICoreDefer (m.defer) - Sub-Spec Behavior", async (t) => {
	await t.step("(getSubSpec) - Should return empty NANOS", () => {
		const deferNode = doc.createNode('m.defer');
		const subSpec = deferNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Should return empty NANOS via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const subSpec = deferNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(append) - Append content (getSubSpec still empty)", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode('append', ls([, 'ignored content']));
		const subSpec = deferNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Append content via JS (getSubSpec still empty)", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.append('ignored content');
		const subSpec = deferNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(setSubSpec) - Set sub-spec (getSubSpec still empty)", () => {
		const deferNode = doc.createNode('m.defer');
		const subSpec = ls([, 'child1', , 'child2']);
		deferNode('setSubSpec', ls(['subSpec', subSpec]));
		const resultSubSpec = deferNode('getSubSpec');
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".setSubSpec() - Set sub-spec via JS (getSubSpec still empty)", () => {
		const deferNode = doc.createNode('m.defer');
		const subSpec = ls([, 'child1', , 'child2']);
		deferNode.setSubSpec({ subSpec });
		const resultSubSpec = deferNode.getSubSpec();
		assertEquals(resultSubSpec.size, 0);
	});
});

Deno.test("MWICoreDefer (m.defer) - Schema Properties", async (t) => {
	await t.step("Schema has autoDoc=false", () => {
		const entry = registry.get('m.defer');
		const schema = entry.at('schema');
		assertEquals(schema.at('autoDoc'), false);
	});

	await t.step("Schema has htmlAllowAttr filter", () => {
		const entry = registry.get('m.defer');
		const schema = entry.at('schema');
		const allowAttr = schema.at('htmlAllowAttr');
		assert(allowAttr, "Should have htmlAllowAttr");
		// Check if it's a Set (JS) or has .jsv accessor (Mesgjs @set)
		const attrSet = allowAttr instanceof Set ? allowAttr : allowAttr.jsv;
		assert(attrSet.has('id'), "Should allow 'id' attribute");
		assert(attrSet.has('data-mwi-defer'), "Should allow 'data-mwi-defer' attribute");
		// Should NOT allow other attributes
		assertEquals(attrSet.size, 2, "Should only allow 2 attributes");
	});
});

Deno.test("MWICoreDefer (m.defer) - Redispatch to MWIHTML", async (t) => {
	await t.step("Chains to MWIHTML interface", () => {
		const deferNode = doc.createNode('m.defer');
		// After init, type is h.slot, which should be handled by MWIHTML
		assertEquals(deferNode('type'), 'h.slot');
		// The node should respond to MWIHTML operations
		// (Detailed rendering behavior is tested in SSR/CSR tests)
	});
});

Deno.test("MWICoreDefer (m.defer) - Real-World Creation via Document", async (t) => {
	await t.step("Document creates defer node for unloaded component", () => {
		const node = doc.createNode('test.deferred');
		assertEquals(node.msjsType, 'MWICoreDefer', 'Should be MWICoreDefer');
		assertEquals(node('getAttr', ls([, 'm.deferType'])), 'test.deferred');
	});

	await t.step("Document.from() creates defer nodes from specs", () => {
		const nodes = doc('from', ls(['list', '[([test.deferred] [test.deferred])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0].msjsType, 'MWICoreDefer', 'First should be defer');
		assertEquals(nodes[1].msjsType, 'MWICoreDefer', 'Second should be defer');
	});

	await t.step("Mixed content with defer and loaded components", () => {
		const nodes = doc('from', ls(['list', '[([m.t t=Text] [test.deferred] [h.div])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 3, 'Should create three nodes');
		assertEquals(nodes[0]('type'), 'm.t', 'First should be text node');
		assertEquals(nodes[1].msjsType, 'MWICoreDefer', 'Second should be defer');
		assertEquals(nodes[2]('type'), 'h.div', 'Third should be div');
	});

	await t.step("Defer nodes can be appended to document", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', ls(['list', '[([test.deferred])]']));
		const root = testDoc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});
});

Deno.test("MWICoreDefer (m.defer) - Complex Scenarios", async (t) => {
	await t.step("Defer node with multiple attributes", () => {
		const spec = ps('[(m.defer class="defer-placeholder loading" data-priority=high id=defer-123)]');
		const deferNode = doc.from({ item: spec });
		
		// Check defer-specific attributes
		assertEquals(deferNode('getAttr', ls([, 'm.deferType'])), 'm.defer');
		assertEquals(deferNode('getAttr', ls([, 'data-mwi-defer'])), 'm.defer');
		assertEquals(deferNode('getAttr', ls([, 'id'])), 'defer-123');
		
		// Check other attributes
		assert(deferNode('getAttr', ls([, 'class'])).includes('defer-placeholder'));
		assert(deferNode('getAttr', ls([, 'class'])).includes('loading'));
		assertEquals(deferNode('getAttr', ls([, 'data-priority'])), 'high');
	});

	await t.step("Multiple defer nodes with unique IDs", () => {
		const defer1 = doc.createNode('m.defer');
		const defer2 = doc.createNode('m.defer');
		const defer3 = doc.createNode('m.defer');
		
		const id1 = defer1('getAttr', ls([, 'm.id']));
		const id2 = defer2('getAttr', ls([, 'm.id']));
		const id3 = defer3('getAttr', ls([, 'm.id']));
		
		// All IDs should be unique
		assert(id1 !== id2, "ID1 and ID2 should be different");
		assert(id2 !== id3, "ID2 and ID3 should be different");
		assert(id1 !== id3, "ID1 and ID3 should be different");
	});

	await t.step("Defer node attribute modifications", () => {
		const deferNode = doc.createNode('m.defer');
		
		// Modify attributes after creation
		deferNode('setAttr', ls([, 'class', , 'updated-class']));
		deferNode('setAttr', ls([, 'data-status', , 'loading']));
		
		// Verify modifications
		assertEquals(deferNode('getAttr', ls([, 'class'])), 'updated-class');
		assertEquals(deferNode('getAttr', ls([, 'data-status'])), 'loading');
		
		// Defer-specific attributes should remain unchanged
		assertEquals(deferNode('getAttr', ls([, 'm.deferType'])), 'm.defer');
		assertEquals(deferNode('getAttr', ls([, 'data-mwi-defer'])), 'm.defer');
	});
});
