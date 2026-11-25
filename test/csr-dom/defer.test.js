import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.csr', 'test.deferred.csr2'],
});

const { fwait, fready, getInstance } = globalThis.$c;
const { ls, ps, reactive } = globalThis;

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

describe("MWICoreDefer (m.defer) - CSR-DOM No Gate (empty sub-spec)", () => {
	it("(getDOM) - Returns empty NANOS when sub-spec is empty", () => {
		const deferNode = $c.sm(doc, 'createNode', ['m.defer']);
		const domNodes = $c.sm(deferNode, 'getDOM');
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no sub-spec)');
	});

	it(".getDOM() - Returns empty NANOS when sub-spec is empty via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no sub-spec)');
	});
});

describe("MWICoreDefer (m.defer) - CSR-DOM No Gate (component has no ftr)", () => {
	// Note: $c.sm(doc, from) with a no-ftr component won't create m.defer (createNode only defers if there's a feature).
	// Test by creating m.defer directly and setting a sub-spec with a no-ftr component type.
	it("(getDOM) - Returns empty NANOS when sub-spec component has no ftr", () => {
		const deferNode = $c.sm(doc, 'createNode', ['m.defer']);
		// Set sub-spec to a component that has no ftr in registry
		$c.sm(deferNode, 'setSubSpec', { subSpec: ps('[([test.deferred.noftr])]') });
		const domNodes = $c.sm(deferNode, 'getDOM');

		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no ftr)');
	});

	it(".getDOM() - Returns empty NANOS when sub-spec component has no ftr via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setSubSpec({ subSpec: ps('[([test.deferred.noftr])]') });
		const domNodes = deferNode.getDOM();

		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no ftr)');
	});
});

describe("MWICoreDefer (m.defer) - CSR-DOM With Gate (feature-gated rendering)", () => {
	it("(getDOM) - Returns empty NANOS before gate opens", () => {
		const nodes = $c.sm(doc, 'from', { list: '[([test.deferred.csr])]' });
		assert(Array.isArray(nodes), 'Should return array');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		const domNodes = $c.sm(deferNode, 'getDOM');

		assertEquals(domNodes.size, 0, 'Should be empty before gate opens');
	});

	it(".getDOM() - Returns empty NANOS before gate opens via JS", () => {
		const nodes = doc.from({ list: '[([test.deferred.csr])]' });
		assert(Array.isArray(nodes), 'Should return array');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		const domNodes = deferNode.getDOM();

		assertEquals(domNodes.size, 0, 'Should be empty before gate opens');
	});
});

describe("MWICoreDefer (m.defer) - CSR-DOM Real-World Scenarios", () => {
	it("(getDOM) - Defer node created for unloaded component (no rendering)", () => {
		const node = $c.sm(doc, 'createNode', ['test.deferred.csr']);
		const domNodes = $c.sm(node, 'getDOM');

		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no rendering)');
	});

	it(".getDOM() - Defer node created for unloaded component via JS", () => {
		const node = doc.createNode('test.deferred.csr');
		const domNodes = node.getDOM();

		assertEquals(domNodes.size, 0, 'Should return empty NANOS (no rendering)');
	});

	it("(getDOM) - Defer node in document fragment (not visible in DOM)", () => {
		const testDoc = getInstance('MWIDocument');
		$c.sm(testDoc, 'append', { list: '[([test.deferred.csr])]' });
		const domNodes = $c.sm(testDoc, 'getDOM');

		// Defer node contributes no DOM nodes
		assertEquals(domNodes.size, 0, 'Document with only defer node should produce empty DOM');
	});

	it(".getDOM() - Defer node in document fragment via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.csr])]' });
		const domNodes = testDoc.getDOM();

		assertEquals(domNodes.size, 0, 'Document with only defer node should produce empty DOM');
	});

	it("(getDOM) - Mixed content with defer node (defer invisible)", () => {
		const testDoc = getInstance('MWIDocument');
		$c.sm(testDoc, 'append', { list: '[([m.t t=Before] [test.deferred.csr] [m.t t=After])]' });
		const domNodes = $c.sm(testDoc, 'getDOM');

		// Should only see content from text nodes (2 nodes)
		assertEquals(domNodes.size, 2, 'Should only have nodes from text elements');
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'Before');
		assertEquals(domNodes.at(1).nodeType, 3); // Text node
		assertEquals(domNodes.at(1).nodeValue, 'After');
	});

	it(".getDOM() - Mixed content with defer node via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.csr] [m.t t=End])]' });
		const domNodes = testDoc.getDOM();

		assertEquals(domNodes.size, 2, 'Should only have nodes from text elements');
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'Start');
		assertEquals(domNodes.at(1).nodeType, 3); // Text node
		assertEquals(domNodes.at(1).nodeValue, 'End');
	});
});

describe("MWICoreDefer (m.defer) - CSR-DOM Reactive Behavior", () => {
	it("(getDOM) - Attribute changes don't affect rendering (still empty)", async () => {
		const deferNode = $c.sm(doc, 'createNode', ['m.defer']);
		const domNodes = $c.sm(deferNode, 'getDOM');

		assertEquals(domNodes.size, 0, 'Should be empty initially');

		// Try to change attributes
		$c.sm(deferNode, 'setAttr', ['class', 'new-class']);
		$c.sm(deferNode, 'setAttr', ['id', 'new-id']);
		$c.sm(deferNode, 'setAttr', ['data-custom', 'custom-value']);

		await reactive.wait();
		// Still no rendering (no sub-spec)
		assertEquals(domNodes.size, 0, 'Should still be empty after attribute changes');
	});

	it(".getDOM() - Attribute changes don't affect rendering via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();

		assertEquals(domNodes.size, 0, 'Should be empty initially');

		deferNode.setAttr('style', 'color: red');
		deferNode.setAttr('aria-label', 'test');

		await reactive.wait();
		assertEquals(domNodes.size, 0, 'Should still be empty after attribute changes');
	});
});
