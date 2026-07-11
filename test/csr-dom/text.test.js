import {
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');

Deno.test("MWICoreText (m.t) - CSR-DOM Tests", async (t) => {
	await t.step("(getDOM) - Simple text as text node", async () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Hello World']);
		const domNodes = $c.sm(textNode, 'getDOM');

		// Should return a reactive NANOS with one text node
		const textDomNode = domNodes.at(0);
		assertExists(textDomNode);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Simple text via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Simple text content');
		const domNodes = textNode.getDOM();

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'Simple text content');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Empty text removes node", async () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '']);
		const domNodes = $c.sm(textNode, 'getDOM');

		// Empty text should result in no DOM nodes
		assertEquals(domNodes.size, 0);
	});

	await t.step(".getDOM() - Empty text via JS", async () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '');
		const domNodes = textNode.getDOM();

		// Empty text should result in no DOM nodes
		assertEquals(domNodes.size, 0);
	});

	await t.step("(getDOM) - Text with special characters", async () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '<tag> & "quotes"']);
		const domNodes = $c.sm(textNode, 'getDOM');

		// DOM text content doesn't need escaping
		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, '<tag> & "quotes"');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Text with special characters via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '<tag> & "quotes"');
		const domNodes = textNode.getDOM();

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, '<tag> & "quotes"');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive text update", async () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial text']);
		const domNodes = $c.sm(textNode, 'getDOM');

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeValue, 'Initial text');
		assertEquals(domNodes.size, 1);

		// Update the text attribute
		$c.sm(textNode, 'setAttr', ['t', 'Updated text']);
		await reactive.wait();

		// The same DOM node should be updated reactively
		assertEquals(textDomNode.nodeValue, 'Updated text');
		assertEquals(domNodes.size, 1); // Still just one node
	});

	await t.step(".getDOM() - Reactive text update via JS", async () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Initial text');
		const domNodes = textNode.getDOM();

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeValue, 'Initial text');
		assertEquals(domNodes.size, 1);

		// Update the text attribute
		textNode.setAttr('t', 'Updated text');
		await reactive.wait();

		// The same DOM node should be updated reactively
		assertEquals(textDomNode.nodeValue, 'Updated text');
		assertEquals(domNodes.size, 1); // Still just one node
	});

	await t.step("(getDOM) - Reactive empty to non-empty", async () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '']);
		const domNodes = $c.sm(textNode, 'getDOM');

		// Initially empty - no nodes
		assertEquals(domNodes.size, 0);

		// Update to non-empty text
		$c.sm(textNode, 'setAttr', ['t', 'Now has text']);
		await reactive.wait();

		// Should now have one text node
		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeType, 3); // Text node
		assertEquals(textDomNode.nodeValue, 'Now has text');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive empty to non-empty via JS", async () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '');
		const domNodes = textNode.getDOM();

		assertEquals(domNodes.size, 0);

		textNode.setAttr('t', 'Now has text');
		await reactive.wait();

		const textDomNode = domNodes.at(0);
		assertEquals(textDomNode.nodeValue, 'Now has text');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive non-empty to empty", async () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Has text']);
		const domNodes = $c.sm(textNode, 'getDOM');

		// Initially has one node
		const textDomNode = domNodes.at(0);
		assertEquals(domNodes.size, 1);

		// Update to empty text
		$c.sm(textNode, 'setAttr', ['t', '']);
		await reactive.wait();

		// Should now have no nodes
		assertEquals(domNodes.size, 0);
	});

	await t.step(".getDOM() - Reactive non-empty to empty via JS", async () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Has text');
		const domNodes = textNode.getDOM();

		const textDomNode = domNodes.at(0);
		assertEquals(domNodes.size, 1);

		textNode.setAttr('t', '');
		await reactive.wait();

		assertEquals(domNodes.size, 0);
	});
});
