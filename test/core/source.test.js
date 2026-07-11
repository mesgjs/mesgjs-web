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

Deno.test("MWICoreSource - Basic Interface", async (t) => {
	await t.step("m.src node can be created", () => {
		const srcNode = doc.createNode('m.src');
		assertEquals($c.sm(srcNode, 'type'), 'm.src');
		assertEquals(srcNode.type, 'm.src');
	});

	await t.step("m.src accepts children like m.frg", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec(ps('[( "text" [h.div] )]'));

		const subSpec = $c.sm(srcNode, 'getSubSpec');
		assertEquals(subSpec.next, 2);
	});

	await t.step("m.src can be created with slotSrc", () => {
		const parentNode = doc.createNode('h.div');
		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });

		assertStrictEquals($c.sm(srcNode, 'slotSrc'), parentNode);
		assertStrictEquals(srcNode.slotSrc, parentNode);
	});
});

Deno.test("MWICoreSource - Slot Source Boundary", async (t) => {
	await t.step("m.src creates new slotting boundary (becomes slotSrc)", () => {
		const srcNode = doc.createNode('m.src');

		// m.src becomes the slot source for its content (like m.slot and m.tpl)
		assertStrictEquals($c.sm(srcNode, 'subSlotSrc'), srcNode);
		assertStrictEquals(srcNode.subSlotSrc, srcNode);
	});

	await t.step("m.src with parent slotSrc - still becomes new boundary", () => {
		const parentSource = doc.createNode('h.div');
		parentSource.setAttr('id', 'parent-source');
		const srcNode = doc.createNode('m.src', { slotSrc: parentSource });

		// m.src's slotSrc is set to parent
		assertStrictEquals($c.sm(srcNode, 'slotSrc'), parentSource);
		// But m.src's subSlotSrc is still itself (new boundary)
		assertStrictEquals($c.sm(srcNode, 'subSlotSrc'), srcNode);
		assertStrictEquals(srcNode.subSlotSrc, srcNode);
	});

	await t.step("m.src with children - children see m.src as slotSrc", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec(ps('[( [h.div] )]'));

		// m.src becomes the slot source for its children
		assertStrictEquals(srcNode.subSlotSrc, srcNode);
	});
});

Deno.test("MWICoreSource - m.ci Pass-Through Behavior", async (t) => {
	await t.step("m.src without slotSrc - returns its own m.ci", () => {
		const srcNode = doc.createNode('m.src');
		const ci = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// Top-level m.src has no slot source, returns its own CI
		assert(typeof ci === 'string');
		assert(ci.length > 0);

		// CI should match the registry entry for m.src
		const regEntry = registry.get('m.src');
		const expectedCI = regEntry.at('id');
		assertEquals(ci, expectedCI);
	});

	await t.step("m.src with slotSrc - returns slotSrc's m.ci", () => {
		const parentNode = doc.createNode('h.div');
		const parentCI = $c.sm(parentNode, 'getAttr', ['m.ci']);

		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });
		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// m.src prefers to return its slot source's m.ci
		assertStrictEquals(srcCI, parentCI);
	});

	await t.step("m.src inside template - returns template's m.ci", async () => {
		registry.register('test.tpl.withsrc', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.withsrc');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		// Get the m.src child
		const subDoc = $c.sm(tplNode, 'getSubDoc');
		const srcNode = subDoc.at(0);
		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// m.src inside template should return template's CI
		assertStrictEquals(srcCI, tplCI);
	});

	await t.step("Nested m.src - all return outermost slotSrc's m.ci", () => {
		const parentNode = doc.createNode('h.div');
		const parentCI = $c.sm(parentNode, 'getAttr', ['m.ci']);

		const src1 = doc.createNode('m.src', { slotSrc: parentNode });
		const src2 = doc.createNode('m.src', { slotSrc: src1 });
		const src3 = doc.createNode('m.src', { slotSrc: src2 });

		const ci1 = $c.sm(src1, 'getAttr', ['m.ci']);
		const ci2 = $c.sm(src2, 'getAttr', ['m.ci']);
		const ci3 = $c.sm(src3, 'getAttr', ['m.ci']);

		// All nested m.src nodes should return the parent's CI
		assertStrictEquals(ci1, parentCI);
		assertStrictEquals(ci2, parentCI);
		assertStrictEquals(ci3, parentCI);
	});

	await t.step("m.src with template slotSrc - returns template's m.ci", async () => {
		registry.register('test.tpl.assrc', ls([
			'allowLate', true,
			'tpl', ps('[( [m.t t="Template"] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.assrc');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const srcNode = doc.createNode('m.src', { slotSrc: tplNode });
		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// m.src with template as slotSrc returns template's CI
		assertStrictEquals(srcCI, tplCI);
	});
});



Deno.test("MWICoreSource - Attribute Access", async (t) => {
	await t.step("m.src can have regular attributes", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setAttr('data-test', 'value');

		assertEquals($c.sm(srcNode, 'getAttr', ['data-test']), 'value');
		assertEquals(srcNode.getAttr('data-test'), 'value');
	});

	await t.step("m.ci is special - uses pass-through logic", () => {
		const parentNode = doc.createNode('h.div');
		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });

		const parentCI = $c.sm(parentNode, 'getAttr', ['m.ci']);
		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// m.ci uses special pass-through logic
		assertStrictEquals(srcCI, parentCI);
	});
});

Deno.test("MWICoreSource - Comparison with m.frg", async (t) => {
	await t.step("m.src creates boundary, m.frg does not", () => {
		const parentNode = doc.createNode('h.div');

		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });
		const fragNode = doc.createNode('m.frg', { slotSrc: parentNode });

		// m.src creates new boundary (returns itself)
		assertStrictEquals($c.sm(srcNode, 'subSlotSrc'), srcNode);

		// m.frg passes through (returns parent)
		assertStrictEquals($c.sm(fragNode, 'subSlotSrc'), parentNode);
	});

	await t.step("m.src has special m.ci behavior, m.frg does not", () => {
		const parentNode = doc.createNode('h.div');
		const parentCI = $c.sm(parentNode, 'getAttr', ['m.ci']);

		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });
		const fragNode = doc.createNode('m.frg', { slotSrc: parentNode });

		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);
		const fragCI = $c.sm(fragNode, 'getAttr', ['m.ci']);

		// m.src returns parent's CI
		assertStrictEquals(srcCI, parentCI);

		// m.frg has its own CI
		assert(fragCI !== parentCI);
	});
});

Deno.test("MWICoreSource - Integration with Templates", async (t) => {
	await t.step("m.src creates slotting boundary - children can't see template directly", async () => {
		registry.register('test.tpl.srcboundary', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src myattr="src-value" [h.div m.coat=[data-from="<myattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcboundary');
		tplNode.setAttr('myattr', 'template-value');

		// Get the m.src child
		const subDoc = $c.sm(tplNode, 'getSubDoc');
		const srcNode = subDoc.at(0);

		// m.src can see template's attributes (it has template as slotSrc)
		assertEquals($c.sm(srcNode, 'slotSrc'), tplNode);

		// But m.src's children see m.src as their slotSrc (not the template)
		const srcSubDoc = $c.sm(srcNode, 'getSubDoc');
		const divNode = srcSubDoc.at(0);
		assertEquals($c.sm(divNode, 'slotSrc'), srcNode);

		// Rendering assertions are covered in test/ssr-html/source.test.js
		// ("m.src creates boundary - children can't see template attributes directly")
	});

	await t.step("Multiple m.src in template - all see template as source", async () => {
		registry.register('test.tpl.multisrc', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div]] [m.src [h.span]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.multisrc');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const subDoc = $c.sm(tplNode, 'getSubDoc');
		const src1 = subDoc.at(0);
		const src2 = subDoc.at(1);

		const ci1 = $c.sm(src1, 'getAttr', ['m.ci']);
		const ci2 = $c.sm(src2, 'getAttr', ['m.ci']);

		// Both m.src nodes should return template's CI
		assertStrictEquals(ci1, tplCI);
		assertStrictEquals(ci2, tplCI);
	});

	await t.step("Nested m.src in template - all return template's m.ci", async () => {
		registry.register('test.tpl.nestedsrc', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [m.src [m.src [h.div]]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.nestedsrc');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		// Navigate to nested m.src nodes
		const subDoc = $c.sm(tplNode, 'getSubDoc');
		const src1 = subDoc.at(0);
		const src1SubDoc = $c.sm(src1, 'getSubDoc');
		const src2 = src1SubDoc.at(0);
		const src2SubDoc = $c.sm(src2, 'getSubDoc');
		const src3 = src2SubDoc.at(0);

		const ci1 = $c.sm(src1, 'getAttr', ['m.ci']);
		const ci2 = $c.sm(src2, 'getAttr', ['m.ci']);
		const ci3 = $c.sm(src3, 'getAttr', ['m.ci']);

		// All nested m.src nodes should return template's CI
		assertStrictEquals(ci1, tplCI);
		assertStrictEquals(ci2, tplCI);
		assertStrictEquals(ci3, tplCI);
	});
});

Deno.test("MWICoreSource - Integration with Slots", async (t) => {
	await t.step("m.src inside slot - slot is the boundary", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec(ps('[( [m.src [h.div]] )]'));

		const slotCI = $c.sm(slotNode, 'getAttr', ['m.ci']);

		// Get the m.src child
		const subDoc = $c.sm(slotNode, 'getSubDoc');
		const srcNode = subDoc.at(0);
		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// m.src inside slot should return slot's CI
		assertStrictEquals(srcCI, slotCI);
	});

	await t.step("m.src with slot as slotSrc - returns slot's m.ci", () => {
		const slotNode = doc.createNode('m.slot');
		const slotCI = $c.sm(slotNode, 'getAttr', ['m.ci']);

		const srcNode = doc.createNode('m.src', { slotSrc: slotNode });
		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);

		// m.src with slot as slotSrc returns slot's CI
		assertStrictEquals(srcCI, slotCI);
	});
});

Deno.test("MWICoreSource - Edge Cases", async (t) => {
	await t.step("m.src with no slotSrc and no children", () => {
		const srcNode = doc.createNode('m.src');

		// Should have its own CI
		const ci = $c.sm(srcNode, 'getAttr', ['m.ci']);
		assert(typeof ci === 'string');

		// Should be its own boundary
		assertStrictEquals($c.sm(srcNode, 'subSlotSrc'), srcNode);
	});

	await t.step("m.src with undefined slotSrc", () => {
		const srcNode = doc.createNode('m.src', { slotSrc: undefined });

		// Should behave like no slotSrc
		assertEquals($c.sm(srcNode, 'slotSrc'), undefined);
		assertStrictEquals($c.sm(srcNode, 'subSlotSrc'), srcNode);

		// Should have its own CI
		const ci = $c.sm(srcNode, 'getAttr', ['m.ci']);
		assert(typeof ci === 'string');
	});

	await t.step("m.src accessing non-existent attribute on slotSrc", () => {
		const parentNode = doc.createNode('h.div');
		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });

		// Should return undefined for non-existent attributes
		assertEquals($c.sm(srcNode, 'getAttr', ['nonexistent']), undefined);
	});
});

Deno.test("MWICoreSource - Spec Operations", async (t) => {
	await t.step("getSpec returns correct spec", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setAttr('data-test', 'value');

		const spec = $c.sm(srcNode, 'getSpec');

		assertEquals(spec.at(0), 'm.src');
		assertEquals(spec.at('data-test'), 'value');
	});

	await t.step("setSpec updates m.src node", () => {
		const srcNode = doc.createNode('m.src');

		$c.sm(srcNode, 'setSpec', ps('[( [m.src data-test="value" [h.div]] )]'));

		assertEquals($c.sm(srcNode, 'getAttr', ['data-test']), 'value');
		assertEquals($c.sm(srcNode, 'getSubSpec').next, 1);
	});

	await t.step("getSubSpec returns children spec", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec(ps('[( [h.div] [h.span] )]'));

		const subSpec = $c.sm(srcNode, 'getSubSpec');

		assertEquals(subSpec.next, 2);
		assertEquals(subSpec.at([0, 0]), 'h.div');
		assertEquals(subSpec.at([1, 0]), 'h.span');
	});

	await t.step("setSubSpec updates children", () => {
		const srcNode = doc.createNode('m.src');

		$c.sm(srcNode, 'setSubSpec', ps('[( "text" [h.div] )]'));

		const subSpec = $c.sm(srcNode, 'getSubSpec');
		assertEquals(subSpec.next, 2);
	});
});
