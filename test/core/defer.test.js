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
const registry = doc.registry;
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

	await t.step("(type) - Get node type (should be m.defer)", () => {
		// Type is m.defer (placeholder node)
		assertEquals($c.sm(deferNode, 'type'), 'm.defer');
	});

	await t.step(".type - Get node type via JS (should be m.defer)", () => {
		assertEquals(deferNode.type, 'm.defer');
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
		const docRef = $c.sm(deferNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(deferNode.document, doc);
	});
});

Deno.test("MWICoreDefer (m.defer) - Placeholder Behavior", async (t) => {
	await t.step("Type remains m.defer (placeholder node)", () => {
		const deferNode = doc.createNode('m.defer');
		assertEquals($c.sm(deferNode, 'type'), 'm.defer');
	});

	// "Placeholder node doesn't render HTML" removed - covered in test/ssr-html/defer.test.js

	await t.step("Schema has autoDoc=false", () => {
		const entry = registry.get('m.defer');
		const schema = entry.at('schema');
		assertEquals(schema.at('autoDoc'), false);
	});
});

Deno.test("MWICoreDefer (m.defer) - Inherited MWIDocNode Operations", async (t) => {
	const deferNode = doc.createNode('m.defer');

	await t.step("(setAttr) - Set basic attribute", () => {
		$c.sm(deferNode, 'setAttr', ls([, 'data-test', , 'value123']));
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set basic attribute via JS", () => {
		deferNode.setAttr('data-custom', 'custom-value');
		assertEquals(deferNode.getAttr('data-custom'), 'custom-value');
	});

	await t.step("(getAttr) - Get attribute", () => {
		$c.sm(deferNode, 'setAttr', ls([, 'title', , 'Defer Title']));
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'title'])), 'Defer Title');
	});

	await t.step(".getAttr() - Get attribute via JS", () => {
		deferNode.setAttr('aria-label', 'Test Defer');
		assertEquals(deferNode.getAttr('aria-label'), 'Test Defer');
	});

	await t.step("(hasAttr) - Check attribute existence", () => {
		$c.sm(deferNode, 'setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals($c.sm(deferNode, 'hasAttr', ls([, 'test-attr'])), true);
		assertEquals($c.sm(deferNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", () => {
		deferNode.setAttr('another-attr', 'value');
		assertEquals(deferNode.hasAttr('another-attr'), true);
		assertEquals(deferNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete attribute", () => {
		$c.sm(deferNode, 'setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals($c.sm(deferNode, 'hasAttr', ls([, 'temp-attr'])), true);
		$c.sm(deferNode, 'delAttr', ls([, 'temp-attr']));
		assertEquals($c.sm(deferNode, 'hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete attribute via JS", () => {
		deferNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(deferNode.hasAttr('temp-js-attr'), true);
		deferNode.delAttr('temp-js-attr');
		assertEquals(deferNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(hasClass) - Basic class check", () => {
		$c.sm(deferNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(deferNode, 'hasClass', ls([, 'test-class'])), true);
		assertEquals($c.sm(deferNode, 'hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Basic class check via JS", () => {
		deferNode.setAttr('class', 'js-class another-class');
		assertEquals(deferNode.hasClass('js-class'), true);
		assertEquals(deferNode.hasClass('another-class'), true);
		assertEquals(deferNode.hasClass('not-there'), false);
	});
});

Deno.test("MWICoreDefer (m.defer) - Spec Management", async (t) => {
	await t.step("(getSpec) - Get spec", () => {
		const deferNode = doc.createNode('m.defer');
		const spec = $c.sm(deferNode, 'getSpec');
		// Type should be m.defer (placeholder node)
		assertEquals(spec.at(0), 'm.defer');
	});

	await t.step(".getSpec() - Get spec via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const spec = deferNode.getSpec();
		assertEquals(spec.at(0), 'm.defer');
	});

	await t.step("(setSpec) - Set attributes from spec", () => {
		const deferNode = doc.createNode('m.defer');
		const spec = ps('[(m.defer data-test=value class=defer-class)]');
		$c.sm(deferNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'data-test'])), 'value');
		assert($c.sm(deferNode, 'getAttr', ls([, 'class'])).includes('defer-class'));
	});

	await t.step(".setSpec() - Set attributes from spec via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const spec = ps('[(m.defer data-custom=custom-value)]');
		deferNode.setSpec(spec);
		assertEquals(deferNode.getAttr('data-custom'), 'custom-value');
	});
});

Deno.test("MWICoreDefer (m.defer) - Sub-Spec Behavior (new: children accepted)", async (t) => {
	await t.step("(getSubSpec) - Returns empty NANOS when no children", () => {
		const deferNode = doc.createNode('m.defer');
		const subSpec = $c.sm(deferNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Returns empty NANOS when no children via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const subSpec = deferNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(setSubSpec) - Children are stored in sub-spec", () => {
		const deferNode = doc.createNode('m.defer');
		const childSpec = ps('[(hello)]');
		$c.sm(deferNode, 'setSubSpec', { subSpec: childSpec });
		const subSpec = $c.sm(deferNode, 'getSubSpec');
		assertEquals(subSpec.size, 1);
	});

	await t.step(".setSubSpec() - Children are stored in sub-spec via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const childSpec = ps('[(world)]');
		deferNode.setSubSpec({ subSpec: childSpec });
		const subSpec = deferNode.getSubSpec();
		assertEquals(subSpec.size, 1);
	});

	// "(getHTML) - Returns empty string even with children" removed - covered in test/ssr-html/defer.test.js
	// ".getHTML() - Returns empty string even with children via JS" removed - covered in test/ssr-html/defer.test.js
});

Deno.test("MWICoreDefer (m.defer) - Schema Properties", async (t) => {
	await t.step("Schema has autoDoc=false", () => {
		const entry = registry.get('m.defer');
		const schema = entry.at('schema');
		assertEquals(schema.at('autoDoc'), false);
	});
});

Deno.test("MWICoreDefer (m.defer) - Real-World Creation via Document", async (t) => {
	await t.step("Document creates defer node for unloaded component", () => {
		const node = doc.createNode('test.deferred');
		assertEquals(node.msjsType, 'MWICoreDefer', 'Should be MWICoreDefer');
		assertEquals($c.sm(node, 'type'), 'm.defer');
	});

	await t.step("Document.from() creates defer nodes from specs with sub-spec", () => {
		const nodes = $c.sm(doc, 'from', ls(['list', '[([test.deferred] [test.deferred])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals($c.sm(nodes[0], 'type'), 'm.defer', 'First should be defer');
		assertEquals(nodes[0].msjsType, 'MWICoreDefer', 'First should be defer');
		assertEquals(nodes[1].type, 'm.defer', 'Second should be defer');
		assertEquals(nodes[1].msjsType, 'MWICoreDefer', 'Second should be defer');
		// Each defer node should have the original spec as its sub-spec
		assertEquals(nodes[0].getSubSpec().size, 1, 'First defer should have sub-spec');
		assertEquals(nodes[1].getSubSpec().size, 1, 'Second defer should have sub-spec');
	});

	await t.step("from() defer node sub-spec contains original component spec", () => {
		const nodes = $c.sm(doc, 'from', ls(['list', '[([test.deferred class=widget data-value=42])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 1, 'Should create one node');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		// Sub-spec item 0 should be the original spec
		const subSpec = deferNode.getSubSpec();
		assertEquals(subSpec.size, 1, 'Sub-spec should have one item');
		const origSpec = subSpec.at(0);
		assertEquals(origSpec.at(0), 'test.deferred', 'Sub-spec item 0 should be original type');
	});

	await t.step("Mixed content with defer and loaded components", () => {
		const nodes = $c.sm(doc, 'from', ls(['list', '[([m.t t=Text] [test.deferred] [h.div])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 3, 'Should create three nodes');
		assertEquals($c.sm(nodes[0], 'type'), 'm.t', 'First should be text node');
		assertEquals(nodes[1].msjsType, 'MWICoreDefer', 'Second should be defer');
		assertEquals($c.sm(nodes[2], 'type'), 'h.div', 'Third should be div');
	});

	await t.step("Defer nodes can be appended to document", async () => {
		const testDoc = getInstance('MWIDocument');
		$c.sm(testDoc, 'append', ls(['list', '[([test.deferred])]']));
		const root = $c.sm(testDoc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});
});

Deno.test("MWICoreDefer (m.defer) - Complex Scenarios", async (t) => {
	await t.step("Defer node with multiple attributes", () => {
		const spec = ps('[(m.defer class="defer-placeholder loading" data-priority=high id=defer-123)]');
		const deferNode = doc.from({ item: spec });

		// Check that attributes can be set
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'id'])), 'defer-123');
		assert($c.sm(deferNode, 'getAttr', ls([, 'class'])).includes('defer-placeholder'));
		assert($c.sm(deferNode, 'getAttr', ls([, 'class'])).includes('loading'));
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'data-priority'])), 'high');
	});

	await t.step("Defer node attribute modifications", () => {
		const deferNode = doc.createNode('m.defer');

		// Modify attributes after creation
		$c.sm(deferNode, 'setAttr', ls([, 'class', , 'updated-class']));
		$c.sm(deferNode, 'setAttr', ls([, 'data-status', , 'loading']));

		// Verify modifications
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'class'])), 'updated-class');
		assertEquals($c.sm(deferNode, 'getAttr', ls([, 'data-status'])), 'loading');
	});

	// "Defer node doesn't render HTML (placeholder only)" removed - covered in test/ssr-html/defer.test.js
});
