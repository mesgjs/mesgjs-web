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
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWICoreSlot (m.slot) - Basic Interface Tests", async (t) => {
	const slotNode = await doc.createNode('m.slot');

	await t.step("(type) - Get node type", async () => {
		assertEquals(slotNode('type'), 'm.slot');
	});

	await t.step(".type - Get node type via JS", async () => {
		assertEquals(slotNode.type, 'm.slot');
	});

	await t.step(".msjsType - Get Mesgjs type", async () => {
		assertEquals(slotNode.msjsType, 'MWICoreSlot');
	});

	await t.step(".jsv - Should return instance", async () => {
		assertStrictEquals(slotNode.jsv, slotNode);
	});

	await t.step(".valueOf() - Should return instance", async () => {
		assertStrictEquals(slotNode.valueOf(), slotNode);
	});

	await t.step("(document) - Get document reference", async () => {
		const docRef = slotNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", async () => {
		assertStrictEquals(slotNode.document, doc);
	});
});

Deno.test("MWICoreSlot (m.slot) - Inherited MWIDocNode Operations", async (t) => {
	const slotNode = await doc.createNode('m.slot');

	await t.step("(setAttr) - Set basic attribute", async () => {
		slotNode('setAttr', ls([, 'data-test', , 'value123']));
		assertEquals(slotNode('getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set basic attribute via JS", async () => {
		slotNode.setAttr('data-id', 'slot-001');
		assertEquals(slotNode.getAttr('data-id'), 'slot-001');
	});

	await t.step("(getAttr) - Get attribute", async () => {
		slotNode('setAttr', ls([, 'title', , 'Slot Title']));
		assertEquals(slotNode('getAttr', ls([, 'title'])), 'Slot Title');
	});

	await t.step(".getAttr() - Get attribute via JS", async () => {
		slotNode.setAttr('aria-label', 'Test Slot');
		assertEquals(slotNode.getAttr('aria-label'), 'Test Slot');
	});

	await t.step("(hasAttr) - Check attribute existence", async () => {
		slotNode('setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals(slotNode('hasAttr', ls([, 'test-attr'])), true);
		assertEquals(slotNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", async () => {
		slotNode.setAttr('another-attr', 'value');
		assertEquals(slotNode.hasAttr('another-attr'), true);
		assertEquals(slotNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete attribute", async () => {
		slotNode('setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals(slotNode('hasAttr', ls([, 'temp-attr'])), true);
		slotNode('delAttr', ls([, 'temp-attr']));
		assertEquals(slotNode('hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete attribute via JS", async () => {
		slotNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(slotNode.hasAttr('temp-js-attr'), true);
		slotNode.delAttr('temp-js-attr');
		assertEquals(slotNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(hasClass) - Basic class check", async () => {
		slotNode('setAttr', ls([, 'class', , 'test-class']));
		assertEquals(slotNode('hasClass', ls([, 'test-class'])), true);
		assertEquals(slotNode('hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Basic class check via JS", async () => {
		slotNode.setAttr('class', 'js-class another-class');
		assertEquals(slotNode.hasClass('js-class'), true);
		assertEquals(slotNode.hasClass('another-class'), true);
		assertEquals(slotNode.hasClass('not-there'), false);
	});
});

Deno.test("MWICoreSlot (m.slot) - Spec Management", async (t) => {
	await t.step("(getSpec) - Get spec with no attributes", async () => {
		const slotNode = await doc.createNode('m.slot');
		const spec = slotNode('getSpec');
		assertEquals(spec.at(0), 'm.slot');
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.slot'));
	});

	await t.step(".getSpec() - Get spec with no attributes via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		const spec = slotNode.getSpec();
		assertEquals(spec.at(0), 'm.slot');
	});

	await t.step("(getSpec) - Get spec with name attribute", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode('setAttr', ls([, 'name', , 'header']));
		const spec = slotNode('getSpec');
		assertEquals(spec.at(0), 'm.slot');
		assertEquals(spec.at('name'), 'header');
	});

	await t.step(".getSpec() - Get spec with name attribute via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode.setAttr('name', 'footer');
		const spec = slotNode.getSpec();
		assertEquals(spec.at(0), 'm.slot');
		assertEquals(spec.at('name'), 'footer');
	});

	await t.step("(setSpec) - Set attributes from spec (async)", async () => {
		const slotNode = await doc.createNode('m.slot');
		const spec = ps('[(m.slot name=content data-test=value)]');
		await slotNode('setSpec', ls([, spec]));
		assertEquals(slotNode('getAttr', ls([, 'name'])), 'content');
		assertEquals(slotNode('getAttr', ls([, 'data-test'])), 'value');
	});

	await t.step(".setSpec() - Set attributes from spec via JS (async)", async () => {
		const slotNode = await doc.createNode('m.slot');
		const spec = ps('[(m.slot name=sidebar class=slot-class)]');
		await slotNode.setSpec(spec);
		assertEquals(slotNode.getAttr('name'), 'sidebar');
		assert(slotNode.getAttr('class').includes('slot-class'));
	});

	await t.step("(setSpec) - Set default content from spec (async)", async () => {
		const slotNode = await doc.createNode('m.slot');
		const spec = ps('[(m.slot [m.t t="Default content"])]');
		await slotNode('setSpec', ls([, spec]));
		const subSpec = slotNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Default content');
	});

	await t.step(".setSpec() - Set default content from spec via JS (async)", async () => {
		const slotNode = await doc.createNode('m.slot');
		const spec = ps('[(m.slot [m.t t="JS Default content"])]');
		await slotNode.setSpec(spec);
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'JS Default content');
	});
});

Deno.test("MWICoreSlot (m.slot) - Default Content Management", async (t) => {
	await t.step("(append) - Append text string (auto-converts to m.t)", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode('append', ls([, 'Default text']));
		const subSpec = slotNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
		assertEquals(subSpec.at([0, 't']), 'Default text');
	});

	await t.step(".append() - Append text string via JS (auto-converts to m.t)", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode.append('JS default text');
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
		assertEquals(subSpec.at([0, 't']), 'JS default text');
	});

	await t.step("(append) - Append doc-node", async () => {
		const slotNode = await doc.createNode('m.slot');
		const textNode = await doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Appended node']));
		slotNode('append', ls([, textNode]));
		const subSpec = slotNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Appended node');
	});

	await t.step(".append() - Append doc-node via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS appended node');
		slotNode.append(textNode);
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'JS appended node');
	});

	await t.step("(append) - Append multiple default content items", async () => {
		const slotNode = await doc.createNode('m.slot');
		const text1 = await doc.createNode('m.t');
		text1('setAttr', ls([, 't', , 'First']));
		const text2 = await doc.createNode('m.t');
		text2('setAttr', ls([, 't', , 'Second']));
		slotNode('append', ls([, text1, , text2]));
		const subSpec = slotNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'First');
		assertEquals(subSpec.at([1, 't']), 'Second');
	});

	await t.step(".append() - Append multiple default content items via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		slotNode.append(text1, text2);
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS First');
		assertEquals(subSpec.at([1, 't']), 'JS Second');
	});

	await t.step("(setSubSpec) - Set default content with NANOS list (async)", async () => {
		const slotNode = await doc.createNode('m.slot');
		const subList = ps('[([m.t t="Sub 1"] [m.t t="Sub 2"])]');
		await slotNode('setSubSpec', ls([, subList]));
		const subSpec = slotNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'Sub 1');
		assertEquals(subSpec.at([1, 't']), 'Sub 2');
	});

	await t.step(".setSubSpec() - Set default content with NANOS list via JS (async)", async () => {
		const slotNode = await doc.createNode('m.slot');
		const subList = ps('[([m.t t="JS Sub 1"] [m.t t="JS Sub 2"])]');
		await slotNode.setSubSpec([subList]);
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS Sub 1');
		assertEquals(subSpec.at([1, 't']), 'JS Sub 2');
	});
});

Deno.test("MWICoreSlot (m.slot) - SlotSrc Property", async (t) => {
	await t.step("(slotSrc) - Get slotSrc when not set", async () => {
		const slotNode = await doc.createNode('m.slot');
		assertEquals(slotNode('slotSrc'), undefined);
	});

	await t.step(".slotSrc - Get slotSrc when not set via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		assertEquals(slotNode.slotSrc, undefined);
	});

	await t.step("Create slot with slotSrc option", async () => {
		const divNode = await doc.createNode('h.div');
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode });
		assertStrictEquals(slotNode.slotSrc, divNode);
	});

	await t.step("(slotSrc) - Get slotSrc when set", async () => {
		const divNode = await doc.createNode('h.div');
		const slotNode = await doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		assertStrictEquals(slotNode('slotSrc'), divNode);
	});

	await t.step(".slotSrc - Get slotSrc when set via JS", async () => {
		const divNode = await doc.createNode('h.div');
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode });
		assertStrictEquals(slotNode.slotSrc, divNode);
	});
});

Deno.test("MWICoreSlot (m.slot) - Name Attribute Behavior", async (t) => {
	await t.step("(setAttr) - Set name attribute for named slot", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode('setAttr', ls([, 'name', , 'header']));
		assertEquals(slotNode('getAttr', ls([, 'name'])), 'header');
	});

	await t.step(".setAttr() - Set name attribute for named slot via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode.setAttr('name', 'footer');
		assertEquals(slotNode.getAttr('name'), 'footer');
	});

	await t.step("Named slot without slotSrc has default content", async () => {
		const slotNode = await doc.createNode('m.slot');
		slotNode.setAttr('name', 'sidebar');
		slotNode.append('Default sidebar');
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Default sidebar');
	});

	await t.step("Unnamed slot (default slot) behavior", async () => {
		const slotNode = await doc.createNode('m.slot');
		// No name attribute set - this is the default slot
		assertEquals(slotNode.hasAttr('name'), false);
		slotNode.append('Default slot content');
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Default slot content');
	});
});

Deno.test("MWICoreSlot (m.slot) - Slot Source Integration", async (t) => {
	await t.step("Slot with void element as slotSrc", async () => {
		const brNode = await doc.createNode('h.br');
		const slotNode = await doc.createNode('m.slot', { slotSrc: brNode });
		slotNode.append('Fallback content');
		assertStrictEquals(slotNode.slotSrc, brNode);
		// Void elements have no children, so slot should use fallback
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Fallback content');
	});

	await t.step("Slot with empty container as slotSrc", async () => {
		const divNode = await doc.createNode('h.div');
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('Fallback for empty');
		assertStrictEquals(slotNode.slotSrc, divNode);
		// Empty container has no children, so slot should use fallback
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Fallback for empty');
	});

	await t.step("Slot with non-empty container as slotSrc", async () => {
		const divNode = await doc.createNode('h.div');
		divNode.append('Source content');
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('Fallback content');
		assertStrictEquals(slotNode.slotSrc, divNode);
		// Non-empty container has children, so default slot should use them
		// (This is verified in rendering tests, not spec tests)
	});

	await t.step("Named slot with matching attribute in slotSrc", async () => {
		const divNode = await doc.createNode('h.div');
		divNode.setAttr('header-slot', ps('[([m.t t="Header from attr"])]'));
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'header-slot');
		slotNode.append('Fallback header');
		assertStrictEquals(slotNode.slotSrc, divNode);
		assertEquals(slotNode.getAttr('name'), 'header-slot');
		// Attribute-based slotting is verified in rendering tests
	});

	await t.step("Named slot without matching attribute in slotSrc", async () => {
		const divNode = await doc.createNode('h.div');
		divNode.setAttr('other-attr', 'value');
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'missing-slot');
		slotNode.append('Fallback for missing');
		assertStrictEquals(slotNode.slotSrc, divNode);
		// No matching attribute, so slot should use fallback
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Fallback for missing');
	});
});
