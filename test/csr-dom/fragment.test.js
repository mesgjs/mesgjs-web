import {
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { debugConfig, fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');

Deno.test("MWICoreFrag (m.frg) - CSR-DOM Tests", async (t) => {
	await t.step("(getDOM) - Empty fragment", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const domNodes = await fragNode('getDOM');

		// Empty fragment should return empty reactive NANOS
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);
	});

	await t.step(".getDOM() - Empty fragment via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const domNodes = await fragNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);
	});

	await t.step("(getDOM) - Fragment with single text child", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const textNode = await doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Hello World']);
		fragNode('append', [textNode]);
		const domNodes = await fragNode('getDOM');

		// Should have one <output> element from the text node
		const outputElem = domNodes.at(0);
		assertExists(outputElem);
		assertEquals(outputElem.tagName, 'OUTPUT');
		assertEquals(outputElem.textContent, 'Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Fragment with single text child via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS Hello World');
		fragNode.append(textNode);
		const domNodes = await fragNode.getDOM();

		const outputElem = domNodes.at(0);
		assertEquals(outputElem.tagName, 'OUTPUT');
		assertEquals(outputElem.textContent, 'JS Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Fragment with multiple text children", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const text1 = await doc('createNode', ['m.t']);
		text1('setAttr', ['t', 'First']);
		const text2 = await doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Second']);
		const text3 = await doc('createNode', ['m.t']);
		text3('setAttr', ['t', 'Third']);
		fragNode('append', [text1, text2, text3]);
		const domNodes = await fragNode('getDOM');

		// Should have three <output> elements
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
		assertEquals(domNodes.at(2).textContent, 'Third');
	});

	await t.step(".getDOM() - Fragment with multiple text children via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		const text3 = await doc.createNode('m.t');
		text3.setAttr('t', 'JS Third');
		fragNode.append(text1, text2, text3);
		const domNodes = await fragNode.getDOM();

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
		assertEquals(domNodes.at(2).textContent, 'JS Third');
	});

	await t.step("(getDOM) - Fragment with mixed content (text and comment)", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const textNode = await doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Text content']);
		const commentNode = await doc('createNode', ['m.com']);
		commentNode('setAttr', ['t', 'Comment content']);
		fragNode('append', [textNode, commentNode]);
		const domNodes = await fragNode('getDOM');

		// Should have two nodes: output and comment
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Text content');
		assertEquals(domNodes.at(1).nodeType, 8); // Comment node
		assertEquals(domNodes.at(1).nodeValue, 'Comment content');
	});

	await t.step(".getDOM() - Fragment with mixed content via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS Text');
		const commentNode = await doc.createNode('m.com');
		commentNode.setAttr('t', 'JS Comment');
		fragNode.append(textNode, commentNode);
		const domNodes = await fragNode.getDOM();

		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS Text');
		assertEquals(domNodes.at(1).nodeValue, 'JS Comment');
	});

	await t.step("(getDOM) - Nested fragments flatten transparently", async () => {
		const outerFrag = await doc('createNode', ['m.frg']);
		const innerFrag = await doc('createNode', ['m.frg']);
		const textNode = await doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Inner content']);
		innerFrag('append', [textNode]);
		outerFrag('append', [innerFrag]);
		const domNodes = await outerFrag('getDOM');

		// Should have one output element (fragments are transparent)
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Inner content');
	});

	await t.step(".getDOM() - Nested fragments via JS", async () => {
		const outerFrag = await doc.createNode('m.frg');
		const innerFrag = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS Inner');
		innerFrag.append(textNode);
		outerFrag.append(innerFrag);
		const domNodes = await outerFrag.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Inner');
	});

	await t.step("(getDOM) - Reactive child update", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const textNode = await doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial']);
		fragNode('append', [textNode]);
		const domNodes = await fragNode('getDOM');

		const outputElem = domNodes.at(0);
		assertEquals(outputElem.textContent, 'Initial');
		assertEquals(domNodes.size, 1);

		// Update child text
		textNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();

		// Same element, updated content
		assertEquals(outputElem.textContent, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive child update via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'Initial');
		fragNode.append(textNode);
		const domNodes = await fragNode.getDOM();

		const outputElem = domNodes.at(0);
		assertEquals(outputElem.textContent, 'Initial');

		textNode.setAttr('t', 'Updated');
		await globalThis.reactive.wait();

		assertEquals(outputElem.textContent, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive child empty to non-empty", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const textNode = await doc('createNode', ['m.t']);
		textNode('setAttr', ['t', '']);
		fragNode('append', [textNode]);
		const domNodes = await fragNode('getDOM');

		// Initially empty - no nodes from text child
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);

		// Update to non-empty
		textNode('setAttr', ['t', 'Now has text']);
		await globalThis.reactive.wait();
		assertEquals(await fragNode('getDOM'), domNodes, 'always same DOM-node list');

		// Should now have one output element
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0)?.textContent, 'Now has text');
	});

	await t.step(".getDOM() - Reactive child empty to non-empty via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', '');
		fragNode.append(textNode);
		const domNodes = await fragNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);

		textNode.setAttr('t', 'Now has text');
		await globalThis.reactive.wait();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0)?.textContent, 'Now has text');
	});

	await t.step("(getDOM) - Fragment with empty text nodes", async () => {
		const fragNode = await doc('createNode', ['m.frg']);
		const text1 = await doc('createNode', ['m.t']);
		text1('setAttr', ['t', '']);
		const text2 = await doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Content']);
		const text3 = await doc('createNode', ['m.t']);
		text3('setAttr', ['t', '']);
		fragNode('append', [text1, text2, text3]);
		const domNodes = await fragNode('getDOM');

		// Only the non-empty text node should contribute a DOM node
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Content');
	});

	await t.step(".getDOM() - Fragment with empty text nodes via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', '');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'Content');
		const text3 = await doc.createNode('m.t');
		text3.setAttr('t', '');
		fragNode.append(text1, text2, text3);
		const domNodes = await fragNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Content');
	});
});
