import {
	assert,
	assertEquals,
	assertExists,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWICoreSlot (m.slot) - CSR-DOM Default Content", async (t) => {
	await t.step("(getDOM) - Renders default content in absence of slot source", async () => {
		const slotNode = doc('createNode', ['m.slot']);
		slotNode('append', ['Default']);
		const domNodes = slotNode('getDOM');

		// Should have one <output> element from the text node
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const outputElem = domNodes.at(0);
		assertEquals(outputElem.tagName, 'OUTPUT');
		assertEquals(outputElem.textContent, 'Default');
	});

	await t.step(".getDOM() - Renders default content in absence of slot source via JS", async () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.append('JS Default');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const outputElem = domNodes.at(0);
		assertEquals(outputElem.textContent, 'JS Default');
	});

	await t.step("(getDOM) - Multiple default content items", async () => {
		const slotNode = doc('createNode', ['m.slot']);
		const text1 = doc('createNode', ['m.t']);
		text1('setAttr', ['t', 'First']);
		const text2 = doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Second']);
		slotNode('append', [text1, text2]);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	await t.step(".getDOM() - Multiple default content items via JS", async () => {
		const slotNode = doc.createNode('m.slot');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		slotNode.append(text1, text2);
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});
});

Deno.test("MWICoreSlot (m.slot) - CSR-DOM Slot Source Integration", async (t) => {
	await t.step("(getDOM) - Renders fallback on default slot against void source", async () => {
		const brNode = doc('createNode', ['h.br']);
		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', brNode]));
		assertStrictEquals(slotNode('slotSrc'), brNode);
		slotNode('append', ['Default']);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Default');
	});

	await t.step(".getDOM() - Renders fallback on default slot against void source via JS", async () => {
		const brNode = doc.createNode('h.br');
		const slotNode = doc.createNode('m.slot', { slotSrc: brNode });
		assertStrictEquals(slotNode.slotSrc, brNode);
		slotNode.append('JS Default');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Default');
	});

	await t.step("(getDOM) - Renders fallback on default slot against empty container", async () => {
		const divNode = doc('createNode', ['h.div']);
		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('append', ['Fallback']);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Fallback');
	});

	await t.step(".getDOM() - Renders fallback on default slot against empty container via JS", async () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('JS Fallback');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Fallback');
	});

	await t.step("(getDOM) - Renders natural children on default slot against non-empty container", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('append', ['Natural child']);
		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('append', ['Fallback']);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Natural child');
	});

	await t.step(".getDOM() - Renders natural children on default slot against non-empty container via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('JS Natural child');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('JS Fallback');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Natural child');
	});
});

Deno.test("MWICoreSlot (m.slot) - CSR-DOM Named Slots", async (t) => {
	await t.step("(getDOM) - Named slot with matching attribute renders attribute content", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['header-slot', ps('[([m.t t="Header from attr"])]')]);
		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('setAttr', ['name', 'header-slot']);
		slotNode('append', ['Fallback header']);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Header from attr');
	});

	await t.step(".getDOM() - Named slot with matching attribute renders attribute content via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('footer-slot', ps('[([m.t t="Footer from attr"])]'));
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'footer-slot');
		slotNode.append('Fallback footer');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Footer from attr');
	});

	await t.step("(getDOM) - Named slot without matching attribute renders fallback", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['other-attr', 'value']);
		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('setAttr', ['name', 'missing-slot']);
		slotNode('append', ['Fallback for missing']);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Fallback for missing');
	});

	await t.step(".getDOM() - Named slot without matching attribute renders fallback via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('other-attr', 'value');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'absent-slot');
		slotNode.append('JS Fallback');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Fallback');
	});
});

Deno.test("MWICoreSlot (m.slot) - CSR-DOM Reactive Updates", async (t) => {
	await t.step("(getDOM) - Reactive update to default content", async () => {
		const slotNode = doc('createNode', ['m.slot']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial']);
		slotNode('append', [textNode]);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Initial');

		// Update the text
		textNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive update to default content via JS", async () => {
		const slotNode = doc.createNode('m.slot');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		slotNode.append(textNode);
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS Updated');
		assertEquals(domNodes.size, 1);
	});

	// HANGING HERE (in REQ3)
	await t.step("(getDOM) - Reactive update to slotSrc natural children", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial child']);
		divNode('append', [textNode]);

		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('append', ['Fallback']);
		const domNodes = slotNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Initial child');

		// Update the source's child
		textNode('setAttr', ['t', 'Updated child']);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'Updated child');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive update to slotSrc natural children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial child');
		divNode.append(textNode);

		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('JS Fallback');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Initial child');

		textNode.setAttr('t', 'JS Updated child');
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS Updated child');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive switch from fallback to natural children", async () => {
		const divNode = doc('createNode', ['h.div']);
		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('append', ['Fallback']);
		const domNodes = slotNode('getDOM');

		// Initially empty source - should show fallback
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Fallback');

		// Add child to source
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'New child']);
		divNode('append', [textNode]);
		await globalThis.reactive.wait();

		// Should now show source's child
		assertEquals(domNodes.at(0).textContent, 'New child');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive switch from fallback to natural children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('JS Fallback');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Fallback');

		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS New child');
		divNode.append(textNode);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS New child');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWICoreSlot (m.slot) - CSR-DOM Named Slot Reactivity", async (t) => {
	await t.step("(getDOM) - Reactive update to named slot attribute content", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial attr']);
		divNode('setAttr', ['header', ps('[([m.t])]')]);
		// Get the attribute's list and update its first child
		const headerList = divNode('getAttr', ['header']);
		$toMsjs(headerList)('rxt');
		headerList.at(0).set('t', 'Initial attr');

		const slotNode = doc('createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		slotNode('setAttr', ['name', 'header']);
		slotNode('append', ['Fallback']);

		await globalThis.reactive.wait();
		const domNodes = slotNode('getDOM');
		assertEquals(domNodes.at(0).textContent, 'Initial attr');

		// Update the attribute content
		headerList.at(0).set('t', 'Updated attr');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Updated attr');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive update to named slot attribute content via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial attr');
		divNode.setAttr('footer', ps('[([m.t])]'));
		const footerList = divNode.getAttr('footer');
		$toMsjs(footerList)('rxt');
		footerList.at(0).set('t', 'JS Initial attr');

		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'footer');
		slotNode.append('JS Fallback');
		const domNodes = slotNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Initial attr');

		footerList.at(0).set('t', 'JS Updated attr');
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS Updated attr');
		assertEquals(domNodes.size, 1);
	});
});
