import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { debugConfig, fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWICoreSlot (m.slot) - Default Content and Slotting", async (t) => {
	// A selection of potential slotSrc nodes for testing
	const brNode = await doc.createNode('h.br');
	const divNode0 = await doc.createNode('h.div');
	const divNode1 = await doc.createNode('h.div');
	divNode1('setAttr', ls([, 'c.present', , ps('[([h.p "Attr content"])]')]));
	divNode1('append', ls([, "Natural child"]));

	await t.step("(getHTML) - Renders default content in absence of slot source", async () => {
		const slotNode = await doc('createNode', ls([, 'm.slot']));
		assert(slotNode, 'm.slot node created');
		slotNode('append', ls([, 'Default']));
		const html = await slotNode('getHTML');
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step(".getHTML() - Renders default content in absence of slot source via JS", async () => {
		const slotNode = await doc.createNode('m.slot');
		assert(slotNode, 'm.slot node created');
		slotNode.append('Default');
		const html = await slotNode.getHTML();
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step("(getHTML) - Renders fall-back on default slot against void source", async () => {
		const slotNode = await doc('createNode', ls([, 'm.slot', 'slotSrc', brNode]));
		assertStrictEquals(slotNode('slotSrc'), brNode, 'correct slot source is assigned');
		slotNode('append', ls([, 'Default']));
		const html = await slotNode('getHTML');
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step(".getHTML() - Renders fall-back on default slot against void source via JS", async () => {
		const slotNode = await doc.createNode('m.slot', { slotSrc: brNode });
		assertStrictEquals(slotNode.slotSrc, brNode, 'correct slot source is assigned');
		slotNode.append('Default');
		const html = await slotNode.getHTML();
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step("(getHTML) - Renders fall-back on default slot against empty-container source", async () => {
		const slotNode = await doc('createNode', ls([, 'm.slot', 'slotSrc', divNode0]));
		assertStrictEquals(slotNode('slotSrc'), divNode0, 'correct slot source is assigned');
		slotNode('append', ls([, 'Default']));
		const html = await slotNode('getHTML');
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step(".getHTML() - Renders fall-back on default slot against empty-container source via JS", async () => {
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode0 });
		assertStrictEquals(slotNode.slotSrc, divNode0, 'correct slot source is assigned');
		slotNode.append('Default');
		const html = await slotNode.getHTML();
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step("(getHTML) - Renders fall-back on named slot against source without the named attribute", async () => {
		const slotNode = await doc('createNode', ls([, 'm.slot', 'slotSrc', divNode1]));
		assertStrictEquals(slotNode('slotSrc'), divNode1, 'correct slot source is assigned');
		slotNode('setAttr', ls([, 'name', , 'c.absent']));
		slotNode('append', ls([, 'Default']));
		const html = await slotNode('getHTML');
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step(".getHTML() - Renders fall-back on named slot against source without the named attribute via JS", async () => {
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode1 });
		assertStrictEquals(slotNode.slotSrc, divNode1, 'correct slot source is assigned');
		slotNode.setAttr('name', 'c.absent');
		slotNode.append('Default');
		const html = await slotNode.getHTML();
		assertEquals(html, 'Default', 'default content rendered');
	});

	await t.step("(getHTML) - Renders natural children on default slot against non-empty-container source", async () => {
		const slotNode = await doc('createNode', ls([, 'm.slot', 'slotSrc', divNode1]));
		assertStrictEquals(slotNode('slotSrc'), divNode1, 'correct slot source is assigned');
		slotNode('append', ls([, 'Default']));
		const html = await slotNode('getHTML');
		assertEquals(html, 'Natural child', 'source natural children rendered');
	});

	await t.step(".getHTML() - Renders natural children on default slot against non-empty-container source via JS", async () => {
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode1 });
		assertStrictEquals(slotNode.slotSrc, divNode1, 'correct slot source is assigned');
		slotNode.append('Default');
		const html = await slotNode.getHTML();
		assertEquals(html, 'Natural child', 'source natural children rendered');
	});

	await t.step("(getHTML) - Renders source attribute when named attribute is list-valued", async () => {
		const slotNode = await doc('createNode', ls([, 'm.slot', 'slotSrc', divNode1]));
		assertStrictEquals(slotNode('slotSrc'), divNode1, 'correct slot source is assigned');
		slotNode('setAttr', ls([, 'name', , 'c.present']));
		slotNode('append', ls([, 'Default']));
		const html = await slotNode('getHTML');
		assertEquals(html, '<p>Attr content</p>', 'source attribute content rendered');
	});

	await t.step(".getHTML() - Renders source attribute when named attribute is list-valued via JS", async () => {
		const slotNode = await doc.createNode('m.slot', { slotSrc: divNode1 });
		assertStrictEquals(slotNode.slotSrc, divNode1, 'correct slot source is assigned');
		slotNode.setAttr('name', 'c.present');
		slotNode.append('Default');
		const html = await slotNode.getHTML();
		assertEquals(html, '<p>Attr content</p>', 'source attribute content rendered');
	});
});
