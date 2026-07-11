import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("m.rns attribute - MWICoreSlot (m.slot)", async (t) => {
	await t.step("(hasAttr m.rns) - Not set when no slotSrc", async () => {
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot']));
		$c.sm(slotNode, 'setSubSpec', ls([, 'Default content']));
		$c.sm(slotNode, 'getHTML');
		// m.rns is only set during getHTML() when alternate children are rendered
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'm.rns'])), false);
	});

	await t.step(".hasAttr('m.rns') - Not set when no slotSrc via JS", async () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec('Default content');
		slotNode.getHTML();
		assertEquals(slotNode.hasAttr('m.rns'), false);
	});

	await t.step("(hasAttr m.rns) - Not set after getHTML() when rendering natural children (no slotSrc)", () => {
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot']));
		$c.sm(slotNode, 'setSubSpec', ls([, 'Natural content']));
		$c.sm(slotNode, 'getHTML');
		// m.rns is only set when alternate (non-natural) children are rendered
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'm.rns'])), false, 'm.rns should not be set when rendering natural children');
	});

	await t.step(".hasAttr('m.rns') - Not set after getHTML() when rendering natural children (no slotSrc) via JS", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec('Natural content JS');
		slotNode.getHTML();
		// m.rns is only set when alternate (non-natural) children are rendered
		assertEquals(slotNode.hasAttr('m.rns'), false, 'm.rns should not be set when rendering natural children');
	});

	await t.step("(getAttr m.rns) - Set to rendered sub-spec when rendering from slotSrc natural children", async () => {
		const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
		$c.sm(divNode, 'setSubSpec', ls([, 'Source content']));
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setSubSpec', ls([, 'Fallback']));
		$c.sm(slotNode, 'getHTML');
		const rns =  $c.sm(slotNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Source content', 'rendered child should be simplified text spec from slotSrc');
	});

	await t.step(".getAttr('m.rns') - Set to rendered sub-spec when rendering from slotSrc natural children via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setSubSpec('Source JS');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('Fallback');
		slotNode.getHTML();
		const rns = slotNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Source JS', 'rendered child should be simplified text spec from slotSrc');
	});

	await t.step("(getAttr m.rns) - Set to rendered sub-spec when rendering from named slot attribute", () => {
		const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
		$c.sm(divNode, 'setAttr', ls([, 'c.header', , ps('[([m.t t="Header from attr"])]')]));
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setAttr', ls([, 'name', , 'c.header']));
		$c.sm(slotNode, 'setSubSpec', ls([, 'Fallback']));
		$c.sm(slotNode, 'getHTML');
		const rns =  $c.sm(slotNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Header from attr', 'rendered child should be simplified text spec from named slot');
	});

	await t.step(".getAttr('m.rns') - Set to rendered sub-spec when rendering from named slot attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('c.footer', ps('[([m.t t="Footer from attr"])]'));
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'c.footer');
		slotNode.setSubSpec('Fallback');
		slotNode.getHTML();
		const rns = slotNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Footer from attr', 'rendered child should be simplified text spec from named slot');
	});

	await t.step("(hasAttr m.rns) - Not set when rendering fallback (no alternate children)", () => {
		const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
		// No children in divNode
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setSubSpec', ls([, 'Fallback']));
		$c.sm(slotNode, 'getHTML');
		// When rendering fallback (no alternate children), m.rns should not be set
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'm.rns'])), false, 'm.rns should not be set for fallback');
	});

	await t.step(".hasAttr('m.rns') - Not set when rendering fallback (no alternate children) via JS", () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('Fallback');
		slotNode.getHTML();
		assertEquals(slotNode.hasAttr('m.rns'), false, 'm.rns should not be set for fallback');
	});

	await t.step("(getAttr m.rns) - Multiple rendered child specs from named slot", () => {
		const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
		$c.sm(divNode, 'setAttr', ls([, 'c.items', , ps('[([m.t t="Item 1"] [m.t t="Item 2"] [m.t t="Item 3"])]')]));
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setAttr', ls([, 'name', , 'c.items']));
		slotNode.getHTML();
		const rns =  $c.sm(slotNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three rendered child specs');
		assertEquals(rns.at(0), 'Item 1'); // Simplified text specs
		assertEquals(rns.at(1), 'Item 2');
		assertEquals(rns.at(2), 'Item 3');
	});

	await t.step(".getAttr('m.rns') - Multiple rendered child specs from named slot via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('c.list', ps('[([m.t t="A"] [m.t t="B"] [m.t t="C"])]'));
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'c.list');
		slotNode.getHTML();
		const rns = slotNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three rendered child specs');
		assertEquals(rns.at(0), 'A'); // Simplified text specs
		assertEquals(rns.at(1), 'B');
		assertEquals(rns.at(2), 'C');
	});

	await t.step("(getSpec) - m.rns appears in slot node spec after rendering alternate children", async () => {
		const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
		$c.sm(divNode, 'setSubSpec', ls([, 'Slotted text']));
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'getHTML');
		const spec =  $c.sm(slotNode, 'getSpec');
		assert(spec.has('m.rns'), 'm.rns should appear in spec after rendering alternate children');
		const rns = spec.at('m.rns');
		assert(rns instanceof NANOS, 'm.rns in spec should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Slotted text'); // Simplified text spec
	});

	await t.step(".getSpec() - m.rns appears in slot node spec after rendering alternate children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setSubSpec('Slotted JS text');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.getHTML();
		const spec = slotNode.getSpec();
		assert(spec.has('m.rns'), 'm.rns should appear in spec after rendering alternate children');
		const rns = spec.at('m.rns');
		assert(rns instanceof NANOS, 'm.rns in spec should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Slotted JS text'); // Simplified text spec
	});

	await t.step("(getSpec) - m.rns absent from slot node spec when rendering natural children", () => {
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot']));
		$c.sm(slotNode, 'setSubSpec', ls([, 'Natural text']));
		$c.sm(slotNode, 'getHTML');
		const spec =  $c.sm(slotNode, 'getSpec');
		assertEquals(spec.has('m.rns'), false, 'm.rns should not appear in spec when rendering natural children');
	});

	await t.step(".getSpec() - m.rns absent from slot node spec when rendering natural children via JS", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec('Natural JS text');
		slotNode.getHTML();
		const spec = slotNode.getSpec();
		assertEquals(spec.has('m.rns'), false, 'm.rns should not appear in spec when rendering natural children');
	});
});

Deno.test("m.rns attribute - MWICoreTpl (template handler)", async (t) => {
	await t.step("(hasAttr m.rns) - Not set before rendering", () => {
		registry.register('test.tpl.rnd1', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd1']));
		assertEquals($c.sm(tplNode, 'hasAttr', ls([, 'm.rns'])), false, 'm.rns not set before rendering');
	});

	await t.step(".hasAttr('m.rns') - Not set before rendering via JS", () => {
		registry.register('test.tpl.rnd2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Content"])]')]));
		const tplNode = doc.createNode('test.tpl.rnd2');
		assertEquals(tplNode.hasAttr('m.rns'), false, 'm.rns not set before rendering');
	});

	await t.step("(getAttr m.rns) - Set to rendered sub-spec after getHTML()", () => {
		registry.register('test.tpl.rnd3', ls(['allowLate', true, 'tpl', ps('[([m.t t="Template content"])]')]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd3']));
		const html =  $c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Template content', 'rendered child should be simplified text spec matching template');
	});

	await t.step(".getAttr('m.rns') - Set to rendered sub-spec after getHTML() via JS", () => {
		registry.register('test.tpl.rnd4', ls(['allowLate', true, 'tpl', ps('[([m.t t="JS Template"])]')]));
		const tplNode = doc.createNode('test.tpl.rnd4');
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'JS Template', 'rendered child should be simplified text spec matching template');
	});

	await t.step("(getAttr m.rns) - Multiple rendered child specs", () => {
		registry.register('test.tpl.rnd5', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="First"] [m.t t="Second"] [m.t t="Third"])]')
		]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd5']));
		$c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three rendered child specs');
		assertEquals(rns.at(0), 'First'); // Simplified text specs
		assertEquals(rns.at(1), 'Second');
		assertEquals(rns.at(2), 'Third');
	});

	await t.step(".getAttr('m.rns') - Multiple rendered child specs via JS", () => {
		registry.register('test.tpl.rnd6', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="A"] [m.t t="B"] [m.t t="C"])]')
		]));
		const tplNode = doc.createNode('test.tpl.rnd6');
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three rendered child specs');
		assertEquals(rns.at(0), 'A'); // Simplified text specs
		assertEquals(rns.at(1), 'B');
		assertEquals(rns.at(2), 'C');
	});

	await t.step("(getAttr m.rns) - Empty template has empty m.rns", () => {
		registry.register('test.tpl.rnd7', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd7']));
		$c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 0, 'empty template should have empty m.rns');
	});

	await t.step(".getAttr('m.rns') - Empty template has empty m.rns via JS", () => {
		registry.register('test.tpl.rnd8', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = doc.createNode('test.tpl.rnd8');
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 0, 'empty template should have empty m.rns');
	});

	await t.step("(getAttr m.rns) - Template with slot shows slot node in rendered spec", () => {
		registry.register('test.tpl.rnd9', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content [m.t t="Default"]])]')
		]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd9']));
		// No content attribute set, so slot will use default
		$c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		// The m.rns should reflect the internal fragment's sub-spec (the slot node's spec)
		assertEquals(rns.size, 1, 'should have one child spec (the slot)');
		assertEquals(rns.at([0, 0]), 'm.slot', 'child spec should be m.slot');
	});

	await t.step(".getAttr('m.rns') - Template with slot shows slot node in rendered spec via JS", () => {
		registry.register('test.tpl.rnd10', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=data [m.t t="Fallback"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.rnd10');
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one child spec (the slot)');
		assertEquals(rns.at([0, 0]), 'm.slot', 'child spec should be m.slot');
	});

	await t.step("(getAttr m.rns) - Template with unnamed slot filled by natural children", () => {
		// Template: `[m.t t="before"] [m.slot] [m.t t="after"]`
		// Template call has natural child "middle" to fill the unnamed slot
		registry.register('test.tpl.rnd10b', ls([
			'allowLate', true,
			'tpl', ps('[(before [m.slot] after)]')
		]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd10b']));
		$c.sm(tplNode, 'setSubSpec', ls([, 'middle'])); // Natural child fills unnamed slot
		$c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three child specs (text, slot, text)');
		assertEquals(rns.at(0), 'before', 'first child spec should be simplified "before" text');
		assertEquals(rns.at([1, 0]), 'm.slot', 'second child spec should be m.slot');
		assertEquals(rns.at(2), 'after', 'third child spec should be simplified "after" text');
		// The slot itself should have m.rns set to the natural children it rendered
		// Yes - that's correct, it should - so I wonder why it doesn't!
		// Here's the spec being returned:
		// spec [(test.tpl.rnd10b m.rns=[[m.t t=before] [m.slot] [m.t t=after]] [m.t t=middle])]
		const slotSpec = rns.at(1);
		assert(slotSpec instanceof NANOS, 'slot spec should be a NANOS');
		const slotRns = slotSpec.at('m.rns');
		assert(slotRns instanceof NANOS, 'slot m.rns should be a NANOS list');
		assertEquals(slotRns.size, 1, 'slot should have rendered one child');
		assertEquals(slotRns.at(0), 'middle', 'slot rendered child should be simplified "middle" text');
	});

	await t.step(".getAttr('m.rns') - Template with unnamed slot filled by natural children via JS", () => {
		// Template: `[m.t t="before"] [m.slot] [m.t t="after"]`
		// Template call has natural child "middle" to fill the unnamed slot
		registry.register('test.tpl.rnd10c', ls([
			'allowLate', true,
			'tpl', ps('[(before [m.slot] after)]')
		]));
		const tplNode = doc.createNode('test.tpl.rnd10c');
		tplNode.setSubSpec('middle'); // Natural child fills unnamed slot
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three child specs (text, slot, text)');
		assertEquals(rns.at(0), 'before', 'first child spec should be simplified "before" text');
		assertEquals(rns.at([1, 0]), 'm.slot', 'second child spec should be m.slot');
		assertEquals(rns.at(2), 'after', 'third child spec should be simplified "after" text');
		// The slot itself should have m.rns set to the natural children it rendered
		const slotSpec = rns.at(1);
		assert(slotSpec instanceof NANOS, 'slot spec should be a NANOS');
		const slotRns = slotSpec.at('m.rns');
		assert(slotRns instanceof NANOS, 'slot m.rns should be a NANOS list');
		assertEquals(slotRns.size, 1, 'slot should have rendered one child');
		assertEquals(slotRns.at(0), 'middle', 'slot rendered child should be simplified "middle" text');
	});

	await t.step("(getAttr m.rns) - Template with slotted content", () => {
		registry.register('test.tpl.rnd11', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=header] [m.t t="Body"] [m.slot name=footer])]')
		]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd11']));
		$c.sm(tplNode, 'setAttr', ls([, 'header', , ps('[([m.t t="Header"])]')]));
		$c.sm(tplNode, 'setAttr', ls([, 'footer', , ps('[([m.t t="Footer"])]')]));
		$c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three child specs (two slots and one text)');
		assertEquals(rns.at([0, 0]), 'm.slot', 'first child spec should be m.slot');
		assertEquals(rns.at(1), 'Body', 'second child spec should be simplified text');
		assertEquals(rns.at([2, 0]), 'm.slot', 'third child spec should be m.slot');
	});

	await t.step(".getAttr('m.rns') - Template with slotted content via JS", () => {
		registry.register('test.tpl.rnd12', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=top] [m.t t="Middle"] [m.slot name=bottom])]')
		]));
		const tplNode = doc.createNode('test.tpl.rnd12');
		tplNode.setAttr('top', ps('[([m.t t="Top"])]'));
		tplNode.setAttr('bottom', ps('[([m.t t="Bottom"])]'));
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 3, 'should have three child specs');
		assertEquals(rns.at([0, 0]), 'm.slot', 'first child spec should be m.slot');
		assertEquals(rns.at(1), 'Middle', 'second child spec should be simplified text');
		assertEquals(rns.at([2, 0]), 'm.slot', 'third child spec should be m.slot');
	});

	await t.step("(getAttr m.rns) - Template with HTML elements", () => {
		registry.register('test.tpl.rnd13', ls([
			'allowLate', true,
			'tpl', ps('[([h.div [m.t t="Content"]])]')
		]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd13']));
		$c.sm(tplNode, 'getHTML');
		const rns =  $c.sm(tplNode, 'getAttr', ls([, 'm.rns']));
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at([0, 0]), 'h.div', 'child spec should be h.div');
	});

	await t.step(".getAttr('m.rns') - Template with HTML elements via JS", () => {
		registry.register('test.tpl.rnd14', ls([
			'allowLate', true,
			'tpl', ps('[([h.span [m.t t="Text"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.rnd14');
		tplNode.getHTML();
		const rns = tplNode.getAttr('m.rns');
		assert(rns instanceof NANOS, 'm.rns should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at([0, 0]), 'h.span', 'child spec should be h.span');
	});

	await t.step("(getSpec) - m.rns appears in template node spec after rendering", () => {
		registry.register('test.tpl.rnd15', ls(['allowLate', true, 'tpl', ps('[([m.t t="Spec test"])]')]));
		const tplNode = $c.sm(doc, 'createNode', ls([, 'test.tpl.rnd15']));
		$c.sm(tplNode, 'getHTML');
		const spec =  $c.sm(tplNode, 'getSpec');
		assert(spec.has('m.rns'), 'm.rns should appear in template spec after rendering');
		const rns = spec.at('m.rns');
		assert(rns instanceof NANOS, 'm.rns in spec should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'Spec test'); // Simplified text spec
	});

	await t.step(".getSpec() - m.rns appears in template node spec after rendering via JS", () => {
		registry.register('test.tpl.rnd16', ls(['allowLate', true, 'tpl', ps('[([m.t t="JS Spec test"])]')]));
		const tplNode = doc.createNode('test.tpl.rnd16');
		tplNode.getHTML();
		const spec = tplNode.getSpec();
		assert(spec.has('m.rns'), 'm.rns should appear in template spec after rendering');
		const rns = spec.at('m.rns');
		assert(rns instanceof NANOS, 'm.rns in spec should be a NANOS list');
		assertEquals(rns.size, 1, 'should have one rendered child spec');
		assertEquals(rns.at(0), 'JS Spec test'); // Simplified text spec
	});
});
