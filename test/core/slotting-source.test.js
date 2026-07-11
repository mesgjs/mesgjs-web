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

Deno.test("Slotting Source Boundaries - Base MWIDocNode", async (t) => {
	await t.step("MWIDocNode - slotSrc, subSlotSrc are undefined by default", () => {
		const divNode = doc.createNode('h.div');
		assertEquals($c.sm(divNode, 'slotSrc'), undefined);
		assertEquals(divNode.slotSrc, undefined);
		assertStrictEquals($c.sm(divNode, 'subSlotSrc'), undefined);
		assertStrictEquals(divNode.subSlotSrc, undefined);
	});

	await t.step("MWIDocNode - slotSrc can be set during creation", () => {
		const parentNode = doc.createNode('h.div');
		const childNode = doc.createNode('h.span', { slotSrc: parentNode });
		assertStrictEquals($c.sm(childNode, 'slotSrc'), parentNode);
		assertStrictEquals(childNode.slotSrc, parentNode);
	});
});

Deno.test("Slotting Source Boundaries - HTML Elements (h.*)", async (t) => {
	await t.step("HTML element - subSlotSrc passes through parent's slotSrc", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('data-source', 'true');
		const htmlNode = doc.createNode('h.span', { slotSrc: sourceNode });

		// HTML elements pass through their slotSrc to subSlotSrc
		assertStrictEquals($c.sm(htmlNode, 'subSlotSrc'), sourceNode);
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode);
	});

	await t.step("HTML element - subSlotSrc returns undefined when no slotSrc set", () => {
		const htmlNode = doc.createNode('h.p');

		// When no slotSrc is set, subSlotSrc returns undefined (pass-through of slotSrc)
		assertEquals($c.sm(htmlNode, 'subSlotSrc'), undefined);
		assertEquals(htmlNode.subSlotSrc, undefined);
	});

	await t.step("Nested HTML elements - slotSrc passes through hierarchy", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('id', 'source');
		const outerNode = doc.createNode('h.section', { slotSrc: sourceNode });
		const innerNode = doc.createNode('h.p', { slotSrc: sourceNode });

		// Both outer and inner HTML elements see the same slotSrc
		assertStrictEquals(outerNode.subSlotSrc, sourceNode);
		assertStrictEquals(innerNode.subSlotSrc, sourceNode);
	});
});

Deno.test("Slotting Source Boundaries - Fragment (m.frg)", async (t) => {
	await t.step("Fragment - subSlotSrc passes through parent's slotSrc", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('data-source', 'fragment-test');
		const fragNode = doc.createNode('m.frg', { slotSrc: sourceNode });

		// Fragments pass through their slotSrc to subSlotSrc
		assertStrictEquals($c.sm(fragNode, 'subSlotSrc'), sourceNode);
		assertStrictEquals(fragNode.subSlotSrc, sourceNode);
	});

	await t.step("Fragment - subSlotSrc returns undefined when no slotSrc set", () => {
		const fragNode = doc.createNode('m.frg');

		// When no slotSrc is set, subSlotSrc returns undefined (pass-through of slotSrc)
		assertEquals($c.sm(fragNode, 'subSlotSrc'), undefined);
		assertEquals(fragNode.subSlotSrc, undefined);
	});

	await t.step("Fragment nested in HTML element - slotSrc passes through", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('id', 'nested-source');
		const htmlNode = doc.createNode('h.div', { slotSrc: sourceNode });
		const fragNode = doc.createNode('m.frg', { slotSrc: sourceNode });

		// Both HTML and fragment see the same slotSrc
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode);
		assertStrictEquals(fragNode.subSlotSrc, sourceNode);
	});
});

Deno.test("Slotting Source Boundaries - Template (m.tpl)", async (t) => {
	await t.step("Template - creates new slotting boundary (becomes slotSrc)", async () => {
		registry.register('test.tpl.boundary1', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Template content"])]')
		]));
		const tplNode = await doc.createNode('test.tpl.boundary1');

		// Template becomes the slot source for its content
		// subSlotSrc returns the template itself (not its parent's slotSrc)
		assertStrictEquals($c.sm(tplNode, 'subSlotSrc'), tplNode);
		assertStrictEquals(tplNode.subSlotSrc, tplNode);
	});

	await t.step("Template with parent slotSrc - still becomes new boundary", async () => {
		registry.register('test.tpl.boundary2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Template content"])]')
		]));
		const parentSource = doc.createNode('h.div');
		parentSource.setAttr('id', 'parent-source');
		const tplNode = await doc.createNode('test.tpl.boundary2', { slotSrc: parentSource });

		// Template's slotSrc is set to parent
		assertStrictEquals($c.sm(tplNode, 'slotSrc'), parentSource);
		// But template's subSlotSrc is still itself (new boundary)
		assertStrictEquals($c.sm(tplNode, 'subSlotSrc'), tplNode);
		assertStrictEquals(tplNode.subSlotSrc, tplNode);
	});

	await t.step("Template internal content - sees template as slotSrc", async () => {
		registry.register('test.tpl.boundary3', ls([
			'allowLate', true,
			'tpl', ps('[([h.div id="inner" [m.t t="Content"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.boundary3');

		// Template becomes the slot source for its internal content
		assertStrictEquals(tplNode.subSlotSrc, tplNode);
	});
});

Deno.test("Slotting Source Boundaries - Slot (m.slot)", async (t) => {
	await t.step("Slot - creates new slotting boundary (becomes slotSrc)", () => {
		const slotNode = doc.createNode('m.slot');

		// Slot becomes the slot source for its content
		assertStrictEquals($c.sm(slotNode, 'subSlotSrc'), slotNode);
		assertStrictEquals(slotNode.subSlotSrc, slotNode);
	});

	await t.step("Slot with parent slotSrc - still becomes new boundary", () => {
		const parentSource = doc.createNode('h.div');
		parentSource.setAttr('id', 'slot-parent');
		const slotNode = doc.createNode('m.slot', { slotSrc: parentSource });

		// Slot's slotSrc is set to parent
		assertStrictEquals($c.sm(slotNode, 'slotSrc'), parentSource);
		// But slot's subSlotSrc is still itself (new boundary)
		assertStrictEquals($c.sm(slotNode, 'subSlotSrc'), slotNode);
		assertStrictEquals(slotNode.subSlotSrc, slotNode);
	});

	await t.step("Slot with default content - content sees slot as slotSrc", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec('Default content');

		// Slot becomes the slot source for its default content
		assertStrictEquals(slotNode.subSlotSrc, slotNode);
	});

	await t.step("Slot within template - slot still creates boundary", async () => {
		registry.register('test.tpl.withslot', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		const tplNode = await doc.createNode('test.tpl.withslot');

		// Template is a boundary
		assertStrictEquals(tplNode.subSlotSrc, tplNode);
		// The slot within the template will also be a boundary (tested via integration)
	});
});

Deno.test("Slotting Source Boundaries - Transparency Chain", async (t) => {
	await t.step("HTML element chain - all transparent to source", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('id', 'chain-source');
		const level1 = doc.createNode('h.div', { slotSrc: sourceNode });
		const level2 = doc.createNode('h.span', { slotSrc: sourceNode });
		const level3 = doc.createNode('h.p', { slotSrc: sourceNode });

		// All levels pass through to the same source
		assertStrictEquals(level1.subSlotSrc, sourceNode);
		assertStrictEquals(level2.subSlotSrc, sourceNode);
		assertStrictEquals(level3.subSlotSrc, sourceNode);
	});

	await t.step("Mixed transparent nodes - HTML and fragment", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('id', 'mixed-source');
		const htmlNode = doc.createNode('h.div', { slotSrc: sourceNode });
		const fragNode = doc.createNode('m.frg', { slotSrc: sourceNode });

		// Both transparent types see the same source
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode);
		assertStrictEquals(fragNode.subSlotSrc, sourceNode);
	});

	await t.step("Template breaks transparency chain", async () => {
		registry.register('test.tpl.chainbreak', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Content"])]')
		]));
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('id', 'chain-break-source');
		const htmlNode = doc.createNode('h.div', { slotSrc: sourceNode });
		const tplNode = await doc.createNode('test.tpl.chainbreak', { slotSrc: sourceNode });

		// HTML element passes through
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode);
		// Template creates new boundary
		assertStrictEquals(tplNode.slotSrc, sourceNode); // Can see parent
		assertStrictEquals(tplNode.subSlotSrc, tplNode); // But becomes new boundary
	});

	await t.step("Slot breaks transparency chain", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('id', 'slot-chain-break');
		const htmlNode = doc.createNode('h.div', { slotSrc: sourceNode });
		const slotNode = doc.createNode('m.slot', { slotSrc: sourceNode });

		// HTML element passes through
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode);
		// Slot creates new boundary
		assertStrictEquals(slotNode.slotSrc, sourceNode); // Can see parent
		assertStrictEquals(slotNode.subSlotSrc, slotNode); // But becomes new boundary
	});
});

Deno.test("Slotting Source Boundaries - Attribute Access", async (t) => {
	await t.step("Template can access its own attributes via slotting", async () => {
		registry.register('test.tpl.selfattr', ls([
			'allowLate', true,
			'tpl', ps('[([h.div m.coat=[data-computed="<myattr>"] [m.t t="Content"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.selfattr');
		tplNode.setAttr('myattr', 'value123');

		// Template becomes slotSrc for its content, so content can access template's attributes
		assertStrictEquals(tplNode.subSlotSrc, tplNode);
		assertEquals(tplNode.getAttr('myattr'), 'value123');
	});

	await t.step("Slot with slotSrc can access source attributes", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('source-attr', 'from-source');
		const slotNode = doc.createNode('m.slot', { slotSrc: sourceNode });

		// Slot has access to source's attributes
		assertStrictEquals(slotNode.slotSrc, sourceNode);
		assertEquals(sourceNode.getAttr('source-attr'), 'from-source');
	});

	await t.step("HTML element with slotSrc - content sees original source", () => {
		const sourceNode = doc.createNode('h.div');
		sourceNode.setAttr('original-attr', 'original-value');
		const htmlNode = doc.createNode('h.div', { slotSrc: sourceNode });
		htmlNode.setAttr('html-attr', 'html-value');

		// HTML element passes through slotSrc
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode);
		// Content would see source's attributes, not html element's
		assertEquals(sourceNode.getAttr('original-attr'), 'original-value');
	});
});

Deno.test("Slotting Source Boundaries - Boundary Behavior Summary", async (t) => {
	await t.step("Summary: Components that create boundaries", async () => {
		// Templates create boundaries
		registry.register('test.summary.tpl', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Tpl"])]')
		]));
		const tplNode = await doc.createNode('test.summary.tpl');
		assertStrictEquals(tplNode.subSlotSrc, tplNode, "Template should create boundary");

		// Slots create boundaries
		const slotNode = doc.createNode('m.slot');
		assertStrictEquals(slotNode.subSlotSrc, slotNode, "Slot should create boundary");
	});

	await t.step("Summary: Components that are transparent", () => {
		const sourceNode = doc.createNode('h.div');

		// HTML elements are transparent
		const htmlNode = doc.createNode('h.span', { slotSrc: sourceNode });
		assertStrictEquals(htmlNode.subSlotSrc, sourceNode, "HTML element should be transparent");

		// Fragments are transparent
		const fragNode = doc.createNode('m.frg', { slotSrc: sourceNode });
		assertStrictEquals(fragNode.subSlotSrc, sourceNode, "Fragment should be transparent");
	});

	await t.step("Summary: Default behavior without slotSrc", () => {
		// HTML and Fragment are transparent and return undefined when no slotSrc
		const htmlNode = doc.createNode('h.div');
		assertEquals(htmlNode.subSlotSrc, undefined, "HTML without slotSrc returns undefined");

		const fragNode = doc.createNode('m.frg');
		assertEquals(fragNode.subSlotSrc, undefined, "Fragment without slotSrc returns undefined");

		// Boundaries always return themselves
		const slotNode = doc.createNode('m.slot');
		assertStrictEquals(slotNode.subSlotSrc, slotNode, "Slot always returns itself");
	});
});

Deno.test("Slotting Source Boundaries - Edge Cases", async (t) => {
	await t.step("Nested template boundaries", async () => {
		registry.register('test.nested.outer', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Outer"])]')
		]));
		registry.register('test.nested.inner', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Inner"])]')
		]));

		const outerTpl = await doc.createNode('test.nested.outer');
		const innerTpl = await doc.createNode('test.nested.inner', { slotSrc: outerTpl });

		// Each template is its own boundary
		assertStrictEquals(outerTpl.subSlotSrc, outerTpl, "Outer template boundary");
		assertStrictEquals(innerTpl.slotSrc, outerTpl, "Inner can see outer");
		assertStrictEquals(innerTpl.subSlotSrc, innerTpl, "Inner creates new boundary");
	});

	await t.step("Slot within slot - nested boundaries", () => {
		const outerSlot = doc.createNode('m.slot');
		const innerSlot = doc.createNode('m.slot', { slotSrc: outerSlot });

		// Each slot is its own boundary
		assertStrictEquals(outerSlot.subSlotSrc, outerSlot, "Outer slot boundary");
		assertStrictEquals(innerSlot.slotSrc, outerSlot, "Inner can see outer");
		assertStrictEquals(innerSlot.subSlotSrc, innerSlot, "Inner creates new boundary");
	});
});
