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

Deno.test("MWICoreCom (m.com) - CSR-DOM Tests", async (t) => {
	await t.step("(getDOM) - Simple comment", async () => {
		const comNode = doc('createNode', ['m.com']);
		comNode('setAttr', ['t', 'Simple comment']);
		const domNodes = comNode('getDOM');

		// Should return a reactive NANOS with one Comment node
		const commentNode = domNodes.at(0);
		assertExists(commentNode);
		assertEquals(commentNode.nodeType, 8); // Node.COMMENT_NODE
		assertEquals(commentNode.nodeValue, 'Simple comment');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Simple comment via JS", () => {
		const comNode = doc.createNode('m.com');
		comNode.setAttr('t', 'Another simple comment');
		const domNodes = comNode.getDOM();

		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeType, 8);
		assertEquals(commentNode.nodeValue, 'Another simple comment');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Empty comment", async () => {
		const comNode = doc('createNode', ['m.com']);
		comNode('setAttr', ['t', '']);
		const domNodes = comNode('getDOM');

		// Empty comment should still create a comment node
		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeType, 8);
		assertEquals(commentNode.nodeValue, '');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Empty comment via JS", () => {
		const comNode = doc.createNode('m.com');
		comNode.setAttr('t', '');
		const domNodes = comNode.getDOM();

		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeType, 8);
		assertEquals(commentNode.nodeValue, '');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive comment update", async () => {
		const comNode = doc('createNode', ['m.com']);
		comNode('setAttr', ['t', 'Initial comment']);
		const domNodes = comNode('getDOM');

		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeValue, 'Initial comment');
		assertEquals(domNodes.size, 1);

		// Update the comment text
		comNode('setAttr', ['t', 'Updated comment']);
		await globalThis.reactive.wait();

		// The same DOM node should be updated reactively
		assertEquals(commentNode.nodeValue, 'Updated comment');
		assertEquals(domNodes.size, 1); // Still just one node
	});

	await t.step(".getDOM() - Reactive comment update via JS", async () => {
		const comNode = doc.createNode('m.com');
		comNode.setAttr('t', 'Initial comment');
		const domNodes = comNode.getDOM();

		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeValue, 'Initial comment');
		assertEquals(domNodes.size, 1);

		// Update the comment text
		comNode.setAttr('t', 'Updated comment');
		await globalThis.reactive.wait();

		// The same DOM node should be updated reactively
		assertEquals(commentNode.nodeValue, 'Updated comment');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive empty to non-empty", async () => {
		const comNode = doc('createNode', ['m.com']);
		comNode('setAttr', ['t', '']);
		const domNodes = comNode('getDOM');

		// Initially empty - still has a comment node
		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeValue, '');
		assertEquals(domNodes.size, 1);

		// Update to non-empty text
		comNode('setAttr', ['t', 'Now has text']);
		await globalThis.reactive.wait();

		// Should still be the same comment node, just updated
		assertEquals(commentNode.nodeValue, 'Now has text');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive empty to non-empty via JS", async () => {
		const comNode = doc.createNode('m.com');
		comNode.setAttr('t', '');
		const domNodes = comNode.getDOM();

		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeValue, '');
		assertEquals(domNodes.size, 1);

		comNode.setAttr('t', 'Now has text');
		await globalThis.reactive.wait();

		assertEquals(commentNode.nodeValue, 'Now has text');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive non-empty to empty", async () => {
		const comNode = doc('createNode', ['m.com']);
		comNode('setAttr', ['t', 'Has text']);
		const domNodes = comNode('getDOM');

		// Initially has text
		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeValue, 'Has text');
		assertEquals(domNodes.size, 1);

		// Update to empty text
		comNode('setAttr', ['t', '']);
		await globalThis.reactive.wait();

		// Should still have the comment node, just empty
		assertEquals(commentNode.nodeValue, '');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive non-empty to empty via JS", async () => {
		const comNode = doc.createNode('m.com');
		comNode.setAttr('t', 'Has text');
		const domNodes = comNode.getDOM();

		const commentNode = domNodes.at(0);
		assertEquals(commentNode.nodeValue, 'Has text');
		assertEquals(domNodes.size, 1);

		comNode.setAttr('t', '');
		await globalThis.reactive.wait();

		assertEquals(commentNode.nodeValue, '');
		assertEquals(domNodes.size, 1);
	});
});
