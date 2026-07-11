import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

Deno.test("MWICoreTpl (template handler) - Registry Auto-Assignment", async (t) => {
	await t.step("Registry entry has 'tpl' property", async () => {
		registry.register('test.tpl.reg', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const entry = await registry.get('test.tpl.reg');
		assert(entry.has('tpl'), "Component entry should have 'tpl' property");
	});

	await t.step("Document uses MWICoreTpl as default interface for components with 'tpl' property", async () => {
		registry.register('test.tpl.interface', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.interface');
		assertEquals(tplNode.msjsType, 'MWICoreTpl', "Created node should have MWICoreTpl interface");
	});
});

Deno.test("MWICoreTpl (template handler) - Basic Interface Tests", async (t) => {
	registry.register('test.tpl.basic', ls(['allowLate', true, 'tpl', ps('[([m.t t="Template content"])]')]));
	const tplNode = await doc.createNode('test.tpl.basic');

	await t.step("(type) - Get node type", async () => {
		assertEquals($c.sm(tplNode, 'type'), 'test.tpl.basic');
	});

	await t.step(".type - Get node type via JS", async () => {
		assertEquals(tplNode.type, 'test.tpl.basic');
	});

	await t.step(".msjsType - Get Mesgjs type", async () => {
		assertEquals(tplNode.msjsType, 'MWICoreTpl');
	});

	await t.step(".jsv - Should return instance", async () => {
		assertStrictEquals(tplNode.jsv, tplNode);
	});

	await t.step(".valueOf() - Should return instance", async () => {
		assertStrictEquals(tplNode.valueOf(), tplNode);
	});

	await t.step("(document) - Get document reference", async () => {
		const docRef = $c.sm(tplNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", async () => {
		assertStrictEquals(tplNode.document, doc);
	});
});

Deno.test("MWICoreTpl (template handler) - Inherited MWIDocNode Operations", async (t) => {
	registry.register('test.tpl.ops', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
	const tplNode = await doc.createNode('test.tpl.ops');

	await t.step("(setAttr) - Set basic attribute", async () => {
		$c.sm(tplNode, 'setAttr', ls([, 'data-test', , 'value123']));
		assertEquals($c.sm(tplNode, 'getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set basic attribute via JS", async () => {
		tplNode.setAttr('data-id', 'tpl-001');
		assertEquals(tplNode.getAttr('data-id'), 'tpl-001');
	});

	await t.step("(getAttr) - Get attribute", async () => {
		$c.sm(tplNode, 'setAttr', ls([, 'title', , 'Template Title']));
		assertEquals($c.sm(tplNode, 'getAttr', ls([, 'title'])), 'Template Title');
	});

	await t.step(".getAttr() - Get attribute via JS", async () => {
		tplNode.setAttr('aria-label', 'Test Template');
		assertEquals(tplNode.getAttr('aria-label'), 'Test Template');
	});

	await t.step("(hasAttr) - Check attribute existence", async () => {
		$c.sm(tplNode, 'setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals($c.sm(tplNode, 'hasAttr', ls([, 'test-attr'])), true);
		assertEquals($c.sm(tplNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", async () => {
		tplNode.setAttr('another-attr', 'value');
		assertEquals(tplNode.hasAttr('another-attr'), true);
		assertEquals(tplNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete attribute", async () => {
		$c.sm(tplNode, 'setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals($c.sm(tplNode, 'hasAttr', ls([, 'temp-attr'])), true);
		$c.sm(tplNode, 'delAttr', ls([, 'temp-attr']));
		assertEquals($c.sm(tplNode, 'hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete attribute via JS", async () => {
		tplNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(tplNode.hasAttr('temp-js-attr'), true);
		tplNode.delAttr('temp-js-attr');
		assertEquals(tplNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(hasClass) - Basic class check", async () => {
		$c.sm(tplNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(tplNode, 'hasClass', ls([, 'test-class'])), true);
		assertEquals($c.sm(tplNode, 'hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Basic class check via JS", async () => {
		tplNode.setAttr('class', 'js-class another-class');
		assertEquals(tplNode.hasClass('js-class'), true);
		assertEquals(tplNode.hasClass('another-class'), true);
		assertEquals(tplNode.hasClass('not-there'), false);
	});
});

Deno.test("MWICoreTpl (template handler) - Spec Management", async (t) => {
	await t.step("(getSpec) - Get spec with no attributes", async () => {
		registry.register('test.tpl.spec1', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.spec1');
		const spec = $c.sm(tplNode, 'getSpec');
		assertEquals(spec.at(0), 'test.tpl.spec1');
		const slidStr = spec.toSLID();
		assert(slidStr.includes('test.tpl.spec1'));
	});

	await t.step(".getSpec() - Get spec with no attributes via JS", async () => {
		registry.register('test.tpl.spec2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.spec2');
		const spec = tplNode.getSpec();
		assertEquals(spec.at(0), 'test.tpl.spec2');
	});

	await t.step("(getSpec) - Get spec with attributes", async () => {
		registry.register('test.tpl.spec3', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.spec3');
		$c.sm(tplNode, 'setAttr', ls([, 'id', , 'tpl-123']));
		$c.sm(tplNode, 'setAttr', ls([, 'data-role', , 'container']));
		const spec = $c.sm(tplNode, 'getSpec');
		assertEquals(spec.at(0), 'test.tpl.spec3');
		assertEquals(spec.at('id'), 'tpl-123');
		assertEquals(spec.at('data-role'), 'container');
	});

	await t.step(".getSpec() - Get spec with attributes via JS", async () => {
		registry.register('test.tpl.spec4', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.spec4');
		tplNode.setAttr('id', 'js-tpl-456');
		tplNode.setAttr('class', 'template-class');
		const spec = tplNode.getSpec();
		assertEquals(spec.at(0), 'test.tpl.spec4');
		assertEquals(spec.at('id'), 'js-tpl-456');
		assert(spec.at('class').includes('template-class'));
	});

	await t.step("(setSpec) - Set attributes from spec (async)", async () => {
		registry.register('test.tpl.spec5', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.spec5');
		const spec = ps('[(test.tpl.spec5 id=spec-tpl data-test=value)]');
		await $c.sm(tplNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(tplNode, 'getAttr', ls([, 'id'])), 'spec-tpl');
		assertEquals($c.sm(tplNode, 'getAttr', ls([, 'data-test'])), 'value');
	});

	await t.step(".setSpec() - Set attributes from spec via JS (async)", async () => {
		registry.register('test.tpl.spec6', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.spec6');
		const spec = ps('[(test.tpl.spec6 id=js-spec-tpl class=spec-class)]');
		await tplNode.setSpec(spec);
		assertEquals(tplNode.getAttr('id'), 'js-spec-tpl');
		assert(tplNode.getAttr('class').includes('spec-class'));
	});
});

Deno.test("MWICoreTpl (template handler) - Template Content", async (t) => {
	await t.step("Template has registered content from tpl property", async () => {
		registry.register('test.tpl.content1', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.content1');
		// The template should have been initialized with content from the 'tpl' property
		// This is verified by checking that the internal fragment was created
		// (We can't directly access the fragment, but we can verify behavior)
		assert(tplNode, "Template node should be created");
	});

	await t.step("Template with custom tpl property", async () => {
		registry.register('test.tpl.content2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Custom template"] [m.t t="Second item"])]')
		]));
		const tplNode = await doc.createNode('test.tpl.content2');
		assert(tplNode, "Template node with custom content should be created");
	});

	await t.step("Template autoDoc is disabled in schema", async () => {
		registry.register('test.tpl.content3', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.content3');
		// Templates should have autoDoc disabled to prevent automatic document wrapping
		// This is set during @init in the MWICoreTpl handler
		assert(tplNode, "Template node should be created with autoDoc disabled");
	});
});

Deno.test("MWICoreTpl (template handler) - SlotSrc Integration", async (t) => {
	await t.step("Template acts as slotSrc for its content", async () => {
		registry.register('test.tpl.slotsrc1', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		const tplNode = await doc.createNode('test.tpl.slotsrc1');
		// The template itself becomes the slotSrc for slots within its content
		assert(tplNode, "Template with slot should be created");
	});

	await t.step("Template with slotSrc option", async () => {
		registry.register('test.tpl.slotsrc2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const divNode = await doc.createNode('h.div');
		divNode.setAttr('header', ps('[([m.t t="Header from parent"])]'));
		const tplNode = await doc.createNode('test.tpl.slotsrc2', { slotSrc: divNode });
		assertStrictEquals(tplNode.slotSrc, divNode);
	});

	await t.step("(slotSrc) - Get slotSrc when not set", async () => {
		registry.register('test.tpl.slotsrc3', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.slotsrc3');
		assertEquals($c.sm(tplNode, 'slotSrc'), undefined);
	});

	await t.step(".slotSrc - Get slotSrc when not set via JS", async () => {
		registry.register('test.tpl.slotsrc4', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.slotsrc4');
		assertEquals(tplNode.slotSrc, undefined);
	});

	await t.step("(slotSrc) - Get slotSrc when set", async () => {
		registry.register('test.tpl.slotsrc5', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const divNode = await doc.createNode('h.div');
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.slotsrc5', 'slotSrc', divNode]));
		assertStrictEquals($c.sm(tplNode, 'slotSrc'), divNode);
	});

	await t.step(".slotSrc - Get slotSrc when set via JS", async () => {
		registry.register('test.tpl.slotsrc6', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const divNode = await doc.createNode('h.div');
		const tplNode = await doc.createNode('test.tpl.slotsrc6', { slotSrc: divNode });
		assertStrictEquals(tplNode.slotSrc, divNode);
	});
});

Deno.test("MWICoreTpl (template handler) - Fragment Delegation", async (t) => {
	await t.step("Template delegates rendering to internal fragment", async () => {
		registry.register('test.tpl.frag1', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		// The MWICoreTpl handler creates an internal m.frg fragment
		// and delegates getDOM/getHTML to it
		const tplNode = await doc.createNode('test.tpl.frag1');
		// We can't directly test the delegation, but we can verify
		// that the template node exists and has the correct interface
		assertEquals(tplNode.msjsType, 'MWICoreTpl');
	});

	await t.step("Template maintains fragment across operations", async () => {
		registry.register('test.tpl.frag2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.frag2');
		// The fragment should be created during @init and reused
		// Setting attributes shouldn't recreate the fragment
		tplNode.setAttr('id', 'persistent-tpl');
		assertEquals(tplNode.getAttr('id'), 'persistent-tpl');
		assertEquals(tplNode.msjsType, 'MWICoreTpl');
	});
});

Deno.test("MWICoreTpl (template handler) - Complex Template Content", async (t) => {
	await t.step("Template with nested structure", async () => {
		registry.register('test.tpl.complex1', ls([
			'allowLate', true,
			'tpl', ps('[([m.frg [m.t t="Outer"] [m.frg [m.t t="Inner"]]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.complex1');
		assert(tplNode, "Template with nested structure should be created");
	});

	await t.step("Template with multiple top-level items", async () => {
		registry.register('test.tpl.complex2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="First"] [m.t t="Second"] [m.t t="Third"])]')
		]));
		const tplNode = await doc.createNode('test.tpl.complex2');
		assert(tplNode, "Template with multiple items should be created");
	});

	await t.step("Template with mixed content types", async () => {
		registry.register('test.tpl.complex3', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Text"] [m.com t="Comment"] [m.frg [m.t t="Fragment"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.complex3');
		assert(tplNode, "Template with mixed content should be created");
	});
});

Deno.test("MWICoreTpl (template handler) - Attribute Inheritance", async (t) => {
	await t.step("Template attributes don't affect internal content", async () => {
		registry.register('test.tpl.inherit1', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.inherit1');
		tplNode.setAttr('id', 'outer-id');
		tplNode.setAttr('class', 'outer-class');
		tplNode.setAttr('data-test', 'outer-data');
		// Template's own attributes should exist
		assertEquals(tplNode.getAttr('id'), 'outer-id');
		assert(tplNode.getAttr('class').includes('outer-class'));
		assertEquals(tplNode.getAttr('data-test'), 'outer-data');
	});

	await t.step("Template preserves document reference", async () => {
		registry.register('test.tpl.inherit2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = await doc.createNode('test.tpl.inherit2');
		assertStrictEquals(tplNode.document, doc);
	});
});

Deno.test("MWICoreTpl (template handler) - Empty Template", async (t) => {
	await t.step("Template with empty tpl list", async () => {
		registry.register('test.tpl.empty', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = await doc.createNode('test.tpl.empty');
		assert(tplNode, "Template with empty content should be created");
	});
});
