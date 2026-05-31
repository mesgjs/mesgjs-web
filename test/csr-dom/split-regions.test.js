// Tests for MWICoreHeadBody (m.head / m.body) CSR DOM behavior.
// Verifies that m.head and m.body adopt the existing document.head / document.body
// elements, that boundary markers are inserted when absent, that managed children
// are synchronized reactively within the boundary markers, that external content
// in protected regions is preserved across reactive updates, and that m.csrStatic
// content is appended after the end marker.

import {
	assert,
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
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWICoreHeadBody - CSR m.head adopts document.head", async (t) => {
	await t.step("(getDOM) - m.head returns document.head element", () => {
		const headNode = doc.createNode('m.head');
		const domNodes = headNode.getDOM();
		assertExists(domNodes.at(0));
		assertEquals(domNodes.at(0), document.head, 'returns the actual document.head element');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - m.head returns document.head via JS", () => {
		const headNode = doc.createNode('m.head');
		const domNodes = headNode.getDOM();
		assertEquals(domNodes.at(0), document.head, 'returns the actual document.head element');
	});
});

Deno.test("MWICoreHeadBody - CSR m.body adopts document.body", async (t) => {
	await t.step("(getDOM) - m.body returns document.body element", () => {
		const bodyNode = doc.createNode('m.body');
		const domNodes = bodyNode.getDOM();
		assertExists(domNodes.at(0));
		assertEquals(domNodes.at(0), document.body, 'returns the actual document.body element');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - m.body returns document.body via JS", () => {
		const bodyNode = doc.createNode('m.body');
		const domNodes = bodyNode.getDOM();
		assertEquals(domNodes.at(0), document.body, 'returns the actual document.body element');
	});
});

Deno.test("MWICoreHeadBody - CSR boundary markers inserted", async (t) => {
	// Use a fresh browser environment for each test group
	await simulateBrowser();

	await t.step("(getDOM) - m.head inserts begin/end boundary markers", async () => {
		const headNode = doc.createNode('m.head');
		headNode.getDOM();
		await globalThis.reactive.wait();

		const head = document.head;
		let begin = null, end = null;
		for (const child of head.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') begin = child;
				if (child.dataset.mwi === 'end') end = child;
			}
		}
		assertExists(begin, 'begin marker inserted');
		assertExists(end, 'end marker inserted');
		assert(begin.type === 'x', 'begin marker has type="x"');
		assert(end.type === 'x', 'end marker has type="x"');
	});

	await simulateBrowser();

	await t.step("(getDOM) - m.body inserts begin/end boundary markers", async () => {
		const bodyNode = doc.createNode('m.body');
		bodyNode.getDOM();
		await globalThis.reactive.wait();

		const body = document.body;
		let begin = null, end = null;
		for (const child of body.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') begin = child;
				if (child.dataset.mwi === 'end') end = child;
			}
		}
		assertExists(begin, 'begin marker inserted');
		assertExists(end, 'end marker inserted');
	});
});

Deno.test("MWICoreHeadBody - CSR managed children synchronized", async (t) => {
	await simulateBrowser();

	await t.step("(getDOM) - m.head children appear between boundary markers", async () => {
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Test Page');
		headNode.append(titleNode);
		headNode.getDOM();
		await globalThis.reactive.wait();

		const head = document.head;
		let begin = null, end = null;
		for (const child of head.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') begin = child;
				if (child.dataset.mwi === 'end') end = child;
			}
		}
		assertExists(begin, 'begin marker present');
		assertExists(end, 'end marker present');

		// Find the title element
		const titleElem = head.querySelector('title');
		assertExists(titleElem, 'title element present');
		assertEquals(titleElem.textContent, 'Test Page', 'title has correct content');

		// Verify title is between begin and end markers
		let node = begin.nextSibling;
		let foundTitle = false;
		while (node && node !== end) {
			if (node === titleElem) foundTitle = true;
			node = node.nextSibling;
		}
		assert(foundTitle, 'title is in the managed region');
	});

	await simulateBrowser();

	await t.step("(getDOM) - m.head external content in protected region preserved", async () => {
		// Simulate external content added before MWI renders
		const externalScript = document.createElement('script');
		externalScript.src = '/external.js';
		document.head.appendChild(externalScript);

		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'My Page');
		headNode.append(titleNode);
		headNode.getDOM();
		await globalThis.reactive.wait();

		// External script should still be present (in first protected region)
		const externalFound = document.head.querySelector('script[src="/external.js"]');
		assertExists(externalFound, 'external script preserved in protected region');
	});
});

Deno.test("MWICoreHeadBody - CSR reactive managed region updates", async (t) => {
	await simulateBrowser();

	await t.step("(getDOM) - m.head managed region updates reactively", async () => {
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Initial Title');
		headNode.append(titleNode);
		headNode.getDOM();
		await globalThis.reactive.wait();

		const titleElem = document.head.querySelector('title');
		assertExists(titleElem, 'title element present');
		assertEquals(titleElem.textContent, 'Initial Title', 'initial title correct');

		// Update the title reactively
		titleNode.setAttr('m.text', 'Updated Title');
		await globalThis.reactive.wait();

		assertEquals(titleElem.textContent, 'Updated Title', 'title updated reactively');
	});
});

Deno.test("MWICoreHeadBody - CSR m.csrStatic content appended", async (t) => {
	await simulateBrowser();

	await t.step("(getDOM) - m.head m.csrStatic content appended after end marker", async () => {
		const headNode = doc.createNode('m.head');
		const csrStatic = ps('[( [h.script src="/csr-only.js"] )]');
		headNode.setAttr('m.csrStatic', csrStatic);
		headNode.getDOM();
		await globalThis.reactive.wait();

		const head = document.head;
		// Find end marker
		let end = null;
		for (const child of head.children) {
			if (child.tagName === 'SCRIPT' && child.dataset.mwi === 'end') {
				end = child;
				break;
			}
		}
		assertExists(end, 'end marker present');

		// Find the csrStatic script
		const csrScript = head.querySelector('script[src="/csr-only.js"]');
		assertExists(csrScript, 'csrStatic script present');

		// Verify it's after the end marker
		let node = end.nextSibling;
		let foundCsr = false;
		while (node) {
			if (node === csrScript) foundCsr = true;
			node = node.nextSibling;
		}
		assert(foundCsr, 'csrStatic script is after end marker');
	});
});

Deno.test("MWICoreHeadBody - CSR getManagedRegion helper", async (t) => {
	await simulateBrowser();

	await t.step(".getManagedRegion() - finds existing boundary markers", async () => {
		const headNode = doc.createNode('m.head');
		headNode.getDOM();
		await globalThis.reactive.wait();

		const { begin, end } = headNode.getManagedRegion(document.head);
		assertExists(begin, 'begin marker found');
		assertExists(end, 'end marker found');
		assertEquals(begin.dataset.mwi, 'begin', 'begin marker has correct data-mwi');
		assertEquals(end.dataset.mwi, 'end', 'end marker has correct data-mwi');
	});

	await simulateBrowser();

	await t.step(".getManagedRegion() - returns null for missing markers", () => {
		// Fresh document.head with no markers
		const { begin, end } = doc.createNode('m.head').getManagedRegion(document.head);
		assertEquals(begin, null, 'begin is null when no markers');
		assertEquals(end, null, 'end is null when no markers');
	});
});
