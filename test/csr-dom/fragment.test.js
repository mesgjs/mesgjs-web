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
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		// Empty fragment should return empty reactive NANOS
		assertEquals(domNodes.size, 0);
	});

	await t.step(".getDOM() - Empty fragment via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const domNodes = await fragNode.getDOM();

		assertEquals(domNodes.size, 0);
	});

	await t.step("(getDOM) - Fragment with single text child", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Hello World']);
		$c.sm(fragNode, 'append', [textNode]);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		// Should have one text node from the text node
		const textDomNode = domNodes.at(0);
		assertExists(textDomNode);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Fragment with single text child via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS Hello World');
		fragNode.append(textNode);
		const domNodes = await fragNode.getDOM();

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'JS Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Fragment with multiple text children", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', 'First']);
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Second']);
		const text3 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text3, 'setAttr', ['t', 'Third']);
		$c.sm(fragNode, 'append', [text1, text2, text3]);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		// Should have three text nodes
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).nodeValue, 'First');
		assertEquals(domNodes.at(1).nodeValue, 'Second');
		assertEquals(domNodes.at(2).nodeValue, 'Third');
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
		assertEquals(domNodes.at(0).nodeValue, 'JS First');
		assertEquals(domNodes.at(1).nodeValue, 'JS Second');
		assertEquals(domNodes.at(2).nodeValue, 'JS Third');
	});

	await t.step("(getDOM) - Fragment with mixed content (text and comment)", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text content']);
		const commentNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(commentNode, 'setAttr', ['t', 'Comment content']);
		$c.sm(fragNode, 'append', [textNode, commentNode]);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		// Should have two nodes: text node and comment
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'Text content');
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
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'JS Text');
		assertEquals(domNodes.at(1).nodeValue, 'JS Comment');
	});

	await t.step("(getDOM) - Nested fragments flatten transparently", async () => {
		const outerFrag = $c.sm(doc, 'createNode', ['m.frg']);
		const innerFrag = $c.sm(doc, 'createNode', ['m.frg']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Inner content']);
		$c.sm(innerFrag, 'append', [textNode]);
		$c.sm(outerFrag, 'append', [innerFrag]);
		const domNodes = await $c.sm(outerFrag, 'getDOM');

		// Should have one text node (fragments are transparent)
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).nodeValue, 'Inner content');
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
		assertEquals(domNodes.at(0).nodeValue, 'JS Inner');
	});

	await t.step("(getDOM) - Reactive child update", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial']);
		$c.sm(fragNode, 'append', [textNode]);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeValue, 'Initial');
		assertEquals(domNodes.size, 1);

		// Update child text
		$c.sm(textNode, 'setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();

		// Same node, updated content
		assertEquals(textDomNode.nodeValue, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive child update via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'Initial');
		fragNode.append(textNode);
		const domNodes = await fragNode.getDOM();

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeValue, 'Initial');

		textNode.setAttr('t', 'Updated');
		await globalThis.reactive.wait();

		assertEquals(textDomNode.nodeValue, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive child empty to non-empty", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '']);
		$c.sm(fragNode, 'append', [textNode]);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		// Initially empty - no nodes from text child
		assertEquals(domNodes.size, 0);

		// Update to non-empty
		$c.sm(textNode, 'setAttr', ['t', 'Now has text']);
		await globalThis.reactive.wait();
		assertEquals(await $c.sm(fragNode, 'getDOM'), domNodes, 'always same DOM-node list');

		// Should now have one text node
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0)?.nodeValue, 'Now has text');
	});

	await t.step(".getDOM() - Reactive child empty to non-empty via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', '');
		fragNode.append(textNode);
		const domNodes = await fragNode.getDOM();

		assertEquals(domNodes.size, 0);

		textNode.setAttr('t', 'Now has text');
		await globalThis.reactive.wait();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0)?.nodeValue, 'Now has text');
	});

	await t.step("(getDOM) - Fragment with empty text nodes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', '']);
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Content']);
		const text3 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text3, 'setAttr', ['t', '']);
		$c.sm(fragNode, 'append', [text1, text2, text3]);
		const domNodes = await $c.sm(fragNode, 'getDOM');

		// Only the non-empty text node should contribute a DOM node
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).nodeValue, 'Content');
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

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).nodeValue, 'Content');
	});
});
