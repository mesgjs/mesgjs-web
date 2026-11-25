import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertExists,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { reactive } = globalThis;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

describe("MWICoreSlot (m.slot) - CSR-DOM Default Content", () => {
	it("(getDOM) - Renders default content in absence of slot source", () => {
		const slotNode = $c.sm(doc, 'createNode', ['m.slot']);
		$c.sm(slotNode, 'setSubSpec', ['Default']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		// Should have one text node from the text node
		assertEquals(domNodes.size, 1);
		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'Default');
	});

	it(".getDOM() - Renders default content in absence of slot source via JS", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec('JS Default');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 1);
		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'JS Default');
	});

	it("(getDOM) - Multiple default content items", () => {
		const slotNode = $c.sm(doc, 'createNode', ['m.slot']);
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', 'First']);
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Second']);
		$c.sm(slotNode, 'append', [text1, text2]);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	it(".getDOM() - Multiple default content items via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		slotNode.append(text1, text2);
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});
});

describe("MWICoreSlot (m.slot) - CSR-DOM Slot Source Integration", () => {
	it("(getDOM) - Renders fallback on default slot against void source", () => {
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', brNode]));
		assertStrictEquals($c.sm(slotNode, 'slotSrc'), brNode);
		$c.sm(slotNode, 'setSubSpec', ['Default']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Default');
	});

	it(".getDOM() - Renders fallback on default slot against void source via JS", () => {
		const brNode = doc.createNode('h.br');
		const slotNode = doc.createNode('m.slot', { slotSrc: brNode });
		assertStrictEquals(slotNode.slotSrc, brNode);
		slotNode.setSubSpec('JS Default');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Default');
	});

	it("(getDOM) - Renders fallback on default slot against empty container", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setSubSpec', ['Fallback']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Fallback');
	});

	it(".getDOM() - Renders fallback on default slot against empty container via JS", () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('JS Fallback');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Fallback');
	});

	it("(getDOM) - Renders natural children on default slot against non-empty container", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setSubSpec', ['Natural child']);
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setSubSpec', ['Fallback']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Natural child');
	});

	it(".getDOM() - Renders natural children on default slot against non-empty container via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setSubSpec('JS Natural child');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('JS Fallback');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Natural child');
	});
});

describe("MWICoreSlot (m.slot) - CSR-DOM Named Slots", () => {
	it("(getDOM) - Named slot with matching attribute renders attribute content", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['header-slot', ps('[([m.t t="Header from attr"])]')]);
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setAttr', ['name', 'header-slot']);
		$c.sm(slotNode, 'setSubSpec', ['Fallback header']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Header from attr');
	});

	it(".getDOM() - Named slot with matching attribute renders attribute content via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('footer-slot', ps('[([m.t t="Footer from attr"])]'));
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'footer-slot');
		slotNode.setSubSpec('Fallback footer');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Footer from attr');
	});

	it("(getDOM) - Named slot without matching attribute renders fallback", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['other-attr', 'value']);
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setAttr', ['name', 'missing-slot']);
		$c.sm(slotNode, 'setSubSpec', ['Fallback for missing']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Fallback for missing');
	});

	it(".getDOM() - Named slot without matching attribute renders fallback via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('other-attr', 'value');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'absent-slot');
		slotNode.setSubSpec('JS Fallback');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Fallback');
	});
});

describe("MWICoreSlot (m.slot) - CSR-DOM Reactive Updates", () => {
	it("(getDOM) - Reactive update to default content", async () => {
		const slotNode = $c.sm(doc, 'createNode', ['m.slot']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial']);
		$c.sm(slotNode, 'append', [textNode]);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.at(0).textContent, 'Initial');

		// Update the text
		$c.sm(textNode, 'setAttr', ['t', 'Updated']);
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	it(".getDOM() - Reactive update to default content via JS", async () => {
		const slotNode = doc.createNode('m.slot');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		slotNode.append(textNode);
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.at(0).textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS Updated');
		assertEquals(domNodes.size, 1);
	});

	it("(getDOM) - Reactive update to slotSrc natural children", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial child']);
		$c.sm(divNode, 'append', [textNode]);

		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setSubSpec', ['Fallback']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		assertEquals(domNodes.at(0).textContent, 'Initial child');

		// Update the source's child
		$c.sm(textNode, 'setAttr', ['t', 'Updated child']);
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'Updated child');
		assertEquals(domNodes.size, 1);
	});

	it(".getDOM() - Reactive update to slotSrc natural children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial child');
		divNode.append(textNode);

		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('JS Fallback');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.at(0).textContent, 'JS Initial child');

		textNode.setAttr('t', 'JS Updated child');
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS Updated child');
		assertEquals(domNodes.size, 1);
	});

	it("(getDOM) - Reactive switch from fallback to natural children", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setSubSpec', ['Fallback']);
		const domNodes = $c.sm(slotNode, 'getDOM');

		// Initially empty source - should show fallback
		assertEquals(domNodes.at(0).textContent, 'Fallback');

		// Add child to source
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'New child']);
		$c.sm(divNode, 'append', [textNode]);
		await reactive.wait();

		// Should now show source's child
		assertEquals(domNodes.at(0).textContent, 'New child');
		assertEquals(domNodes.size, 1);
	});

	it(".getDOM() - Reactive switch from fallback to natural children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('JS Fallback');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.at(0).textContent, 'JS Fallback');

		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS New child');
		divNode.append(textNode);
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS New child');
		assertEquals(domNodes.size, 1);
	});
});

describe("MWICoreSlot (m.slot) - CSR-DOM Named Slot Reactivity", () => {
	it("(getDOM) - Reactive update to named slot attribute content", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial attr']);
		$c.sm(divNode, 'setAttr', ['header', ps('[([m.t])]')]);
		// Get the attribute's list and update its first child
		const headerList = $c.sm(divNode, 'getAttr', ['header']);
		$toMsjs(headerList)('rxt');
		headerList.at(0).set('t', 'Initial attr');

		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		$c.sm(slotNode, 'setAttr', ['name', 'header']);
		$c.sm(slotNode, 'setSubSpec', ['Fallback']);

		const domNodes = $c.sm(slotNode, 'getDOM');
		assertEquals(domNodes.at(0).textContent, 'Initial attr');

		// Update the attribute content
		headerList.at(0).set('t', 'Updated attr');
		await reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Updated attr');
		assertEquals(domNodes.size, 1);
	});

	it(".getDOM() - Reactive update to named slot attribute content via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial attr');
		divNode.setAttr('footer', ps('[([m.t])]'));
		const footerList = divNode.getAttr('footer');
		$toMsjs(footerList)('rxt');
		footerList.at(0).set('t', 'JS Initial attr');

		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'footer');
		slotNode.setSubSpec('JS Fallback');
		const domNodes = slotNode.getDOM();

		assertEquals(domNodes.at(0).textContent, 'JS Initial attr');

		footerList.at(0).set('t', 'JS Updated attr');
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'JS Updated attr');
		assertEquals(domNodes.size, 1);
	});
});
