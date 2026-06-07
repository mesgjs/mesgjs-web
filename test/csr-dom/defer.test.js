import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.csr', 'test.deferred.csr2'],
});

const { fwait, fready, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

// Register a deferred component for testing (no interface/template yet)
const deferredEntry = ls([
	'allowLate', true,
	'ftr', 'test.deferred.csr'
]);
registry.register('test.deferred.csr', deferredEntry);

// Register a second deferred component (no ftr - unconditional suppression)
const deferredNoFtrEntry = ls([
	'allowLate', true,
]);
registry.register('test.deferred.noftr', deferredNoFtrEntry);

Deno.test("MWICoreDefer (m.defer) - CSR-DOM No Gate (empty sub-spec)", async (t) => {
	await t.step("(getDOM) - Returns empty NANOS when sub-spec is empty", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no sub-spec)');
	});

	await t.step(".getDOM() - Returns empty NANOS when sub-spec is empty via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no sub-spec)');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM No Gate (component has no ftr)", async (t) => {
	// Note: doc(from) with a no-ftr component won't create m.defer (createNode only defers if there's a feature).
	// Test by creating m.defer directly and setting a sub-spec with a no-ftr component type.
	await t.step("(getDOM) - Returns empty NANOS when sub-spec component has no ftr", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		// Set sub-spec to a component that has no ftr in registry
		deferNode('setSubSpec', { subSpec: ps('[([test.deferred.noftr])]') });
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no ftr)');
	});

	await t.step(".getDOM() - Returns empty NANOS when sub-spec component has no ftr via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setSubSpec({ subSpec: ps('[([test.deferred.noftr])]') });
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no ftr)');
	});
});

// FAILING with infinite loop
Deno.test("MWICoreDefer (m.defer) - CSR-DOM With Gate (feature-gated rendering)", async (t) => {
	await t.step("(getDOM) - Returns empty NANOS before gate opens", async () => {
		const nodes = doc('from', { list: '[([test.deferred.csr])]' });
		assert(Array.isArray(nodes), 'Should return array');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		const domNodes = deferNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should be empty before gate opens');
	});

	await t.step(".getDOM() - Returns empty NANOS before gate opens via JS", async () => {
		const nodes = doc.from({ list: '[([test.deferred.csr])]' });
		assert(Array.isArray(nodes), 'Should return array');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		const domNodes = deferNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Should be empty before gate opens');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Real-World Scenarios", async (t) => {
	await t.step("(getDOM) - Defer node created for unloaded component (no rendering)", async () => {
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
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'Before');
		assertEquals(domNodes.at(1).nodeType, 3); // Text node
		assertEquals(domNodes.at(1).nodeValue, 'After');
	});

	await t.step(".getDOM() - Mixed content with defer node via JS", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.csr] [m.t t=End])]' });
		const domNodes = testDoc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2, 'Should only have nodes from text elements');
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'Start');
		assertEquals(domNodes.at(1).nodeType, 3); // Text node
		assertEquals(domNodes.at(1).nodeValue, 'End');
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
		// Still no rendering (no sub-spec)
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
