import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.csr'],
});

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

// Register a deferred component for testing
const deferredEntry = ls([
	'allowLate', true,
	'ftr', 'test.deferred.csr'
]);
registry.register('test.deferred.csr', deferredEntry);

Deno.test("MWICoreDefer (m.defer) - CSR-DOM No Rendering", async (t) => {
	await t.step("(getDOM) - Returns empty NANOS (no rendering)", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS');
	});

	await t.step(".getDOM() - Returns empty NANOS via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS');
	});

	await t.step("(getDOM) - No rendering even with attributes", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setAttr', ['class', 'test-class']);
		deferNode('setAttr', ['id', 'test-id']);
		deferNode('setAttr', ['data-custom', 'value']);
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS regardless of attributes');
	});

	await t.step(".getDOM() - No rendering even with attributes via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setAttr('class', 'test-class');
		deferNode.setAttr('style', 'color: red');
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS regardless of attributes');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Real-World Scenarios", async (t) => {
	await t.step("(getDOM) - Defer node created for unloaded component", async () => {
		const node = doc('createNode', ['test.deferred.csr']);
		const domNodes = node('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no rendering)');
	});

	await t.step(".getDOM() - Defer node created for unloaded component via JS", async () => {
		const node = doc.createNode('test.deferred.csr');
		const domNodes = node.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no rendering)');
	});

	await t.step("(getDOM) - Defer node in document fragment (not visible in DOM)", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([test.deferred.csr])]' });
		const domNodes = testDoc('getDOM');

		await globalThis.reactive.wait();
		// Defer node contributes no DOM nodes
		assertEquals(domNodes.size, 0, 'Document with only defer node should produce empty DOM');
	});

	await t.step(".getDOM() - Defer node in document fragment via JS", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.csr])]' });
		const domNodes = testDoc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Document with only defer node should produce empty DOM');
	});

	await t.step("(getDOM) - Mixed content with defer node (defer invisible)", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([m.t t=Before] [test.deferred.csr] [m.t t=After])]' });
		const domNodes = testDoc('getDOM');

		await globalThis.reactive.wait();
		// Should only see content from text nodes (2 nodes)
		assertEquals(domNodes.size, 2, 'Should only have nodes from text elements');
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Before');
		assertEquals(domNodes.at(1).tagName, 'OUTPUT');
		assertEquals(domNodes.at(1).textContent, 'After');
	});

	await t.step(".getDOM() - Mixed content with defer node via JS", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.csr] [m.t t=End])]' });
		const domNodes = testDoc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2, 'Should only have nodes from text elements');
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Start');
		assertEquals(domNodes.at(1).tagName, 'OUTPUT');
		assertEquals(domNodes.at(1).textContent, 'End');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Empty Content", async (t) => {
	await t.step("(getDOM) - Defer node ignores appended content", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('append', ['ignored content']);
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS');
	});

	await t.step(".getDOM() - Defer node ignores appended content via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.append('ignored content');
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS');
	});

	await t.step("(getDOM) - Defer node with setSubSpec still renders nothing", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setSubSpec', { subSpec: ls([, 'child1', , 'child2']) });
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS even with sub-spec');
	});

	await t.step(".getDOM() - Defer node with setSubSpec still renders nothing via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setSubSpec({ subSpec: ls([, 'child1', , 'child2']) });
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS even with sub-spec');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Reactive Behavior", async (t) => {
	await t.step("(getDOM) - Attribute changes don't affect rendering (still empty)", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should be empty initially');

		// Try to change attributes
		deferNode('setAttr', ['class', 'new-class']);
		deferNode('setAttr', ['id', 'new-id']);
		deferNode('setAttr', ['data-custom', 'custom-value']);

		await globalThis.reactive.wait();
		// Still no rendering
		assertEquals(domNodes.size, 0, 'Should still be empty after attribute changes');
	});

	await t.step(".getDOM() - Attribute changes don't affect rendering via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should be empty initially');

		deferNode.setAttr('style', 'color: red');
		deferNode.setAttr('aria-label', 'test');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should still be empty after attribute changes');
	});
});
