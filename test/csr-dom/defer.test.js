import {
	assert,
	assertEquals,
	assertExists,
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

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Basic Rendering", async (t) => {
	await t.step("(getDOM) - Renders as slot element", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
	});

	await t.step(".getDOM() - Renders as slot element via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).tagName, 'SLOT');
	});

	await t.step("(getDOM) - Includes auto-assigned ID", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		assert(slotElem.id, 'Should have id attribute');
		assert(slotElem.id.length > 0, 'ID should not be empty');
	});

	await t.step(".getDOM() - Includes auto-assigned ID via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		assert(slotElem.id, 'Should have id attribute');
		assert(slotElem.id.length > 0, 'ID should not be empty');
	});

	await t.step("(getDOM) - Includes data-mwi-defer attribute", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step(".getDOM() - Includes data-mwi-defer attribute via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step("(getDOM) - Only renders allowed attributes (id and data-mwi-defer)", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setAttr', ['class', 'should-not-render']);
		deferNode('setAttr', ['style', 'color: red']);
		deferNode('setAttr', ['aria-label', 'should-not-render']);
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		
		// Should have id and data-mwi-defer
		assert(slotElem.id, 'Should have id');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
		
		// Should NOT have other attributes
		assertEquals(slotElem.hasAttribute('class'), false, 'Should not have class attribute');
		assertEquals(slotElem.hasAttribute('style'), false, 'Should not have style attribute');
		assertEquals(slotElem.hasAttribute('aria-label'), false, 'Should not have aria-label attribute');
	});

	await t.step(".getDOM() - Only renders allowed attributes via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setAttr('class', 'should-not-render');
		deferNode.setAttr('data-custom', 'should-not-render');
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		
		assert(slotElem.id, 'Should have id');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
		assertEquals(slotElem.hasAttribute('class'), false, 'Should not have class attribute');
		assertEquals(slotElem.hasAttribute('data-custom'), false, 'Should not have data-custom attribute');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM with Explicit ID", async (t) => {
	await t.step("(getDOM) - Preserves explicit ID", async () => {
		const spec = ps('[(m.defer id=my-defer-id)]');
		const deferNode = doc('from', { item: spec });
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.id, 'my-defer-id');
	});

	await t.step(".getDOM() - Preserves explicit ID via JS", async () => {
		const spec = ps('[(m.defer id=custom-id-123)]');
		const deferNode = doc.from({ item: spec });
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.id, 'custom-id-123');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Real-World Scenarios", async (t) => {
	await t.step("(getDOM) - Defer node created via document for unloaded component", async () => {
		const node = doc('createNode', ['test.deferred.csr']);
		const domNodes = node('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
		assert(slotElem.id, 'Should have auto-assigned ID');
	});

	await t.step(".getDOM() - Defer node created via document for unloaded component via JS", async () => {
		const node = doc.createNode('test.deferred.csr');
		const domNodes = node.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
		assert(slotElem.id, 'Should have auto-assigned ID');
	});

	await t.step("(getDOM) - Multiple defer nodes have unique IDs", async () => {
		const defer1 = doc('createNode', ['m.defer']);
		const defer2 = doc('createNode', ['m.defer']);
		const dom1 = defer1('getDOM');
		const dom2 = defer2('getDOM');
		
		await globalThis.reactive.wait();
		const id1 = dom1.at(0).id;
		const id2 = dom2.at(0).id;
		
		assert(id1, 'First defer should have ID');
		assert(id2, 'Second defer should have ID');
		assert(id1 !== id2, 'IDs should be unique');
	});

	await t.step(".getDOM() - Multiple defer nodes have unique IDs via JS", async () => {
		const defer1 = doc.createNode('m.defer');
		const defer2 = doc.createNode('m.defer');
		const dom1 = defer1.getDOM();
		const dom2 = defer2.getDOM();
		
		await globalThis.reactive.wait();
		const id1 = dom1.at(0).id;
		const id2 = dom2.at(0).id;
		
		assert(id1, 'First defer should have ID');
		assert(id2, 'Second defer should have ID');
		assert(id1 !== id2, 'IDs should be unique');
	});

	await t.step("(getDOM) - Defer node in document fragment", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([test.deferred.csr])]' });
		const domNodes = testDoc('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
	});

	await t.step(".getDOM() - Defer node in document fragment via JS", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.csr])]' });
		const domNodes = testDoc.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
	});

	await t.step("(getDOM) - Mixed content with defer and regular nodes", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([m.t t=Before] [test.deferred.csr] [m.t t=After])]' });
		const domNodes = testDoc('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Before');
		assertEquals(domNodes.at(1).tagName, 'SLOT');
		assertEquals(domNodes.at(2).tagName, 'OUTPUT');
		assertEquals(domNodes.at(2).textContent, 'After');
	});

	await t.step(".getDOM() - Mixed content with defer and regular nodes via JS", async () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.csr] [m.t t=End])]' });
		const domNodes = testDoc.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Start');
		assertEquals(domNodes.at(1).tagName, 'SLOT');
		assertEquals(domNodes.at(2).tagName, 'OUTPUT');
		assertEquals(domNodes.at(2).textContent, 'End');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Empty Content", async (t) => {
	await t.step("(getDOM) - Defer node ignores appended content", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('append', ['ignored content']);
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		// Slot should be empty (no child nodes)
		assertEquals(slotElem.childNodes.length, 0);
	});

	await t.step(".getDOM() - Defer node ignores appended content via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.append('ignored content');
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.childNodes.length, 0);
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Reactive Behavior", async (t) => {
	await t.step("(getDOM) - Defer node DOM is stable across calls", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const dom1 = deferNode('getDOM');
		const dom2 = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
		assertStrictEquals(dom1.at(0), dom2.at(0), 'Should return same slot element');
	});

	await t.step(".getDOM() - Defer node DOM is stable across calls via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const dom1 = deferNode.getDOM();
		const dom2 = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
		assertStrictEquals(dom1.at(0), dom2.at(0), 'Should return same slot element');
	});

	await t.step("(getDOM) - Attribute changes don't affect rendered attributes (filtered)", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		const originalId = slotElem.id;
		
		// Try to change attributes
		deferNode('setAttr', ['class', 'new-class']);
		deferNode('setAttr', ['data-custom', 'custom-value']);
		
		await globalThis.reactive.wait();
		// ID should remain the same
		assertEquals(slotElem.id, originalId);
		// Filtered attributes should not appear
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('data-custom'), false);
		// Only allowed attributes should be present
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step(".getDOM() - Attribute changes don't affect rendered attributes via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		await globalThis.reactive.wait();
		const slotElem = domNodes.at(0);
		const originalId = slotElem.id;
		
		deferNode.setAttr('style', 'color: red');
		deferNode.setAttr('aria-label', 'test');
		
		await globalThis.reactive.wait();
		assertEquals(slotElem.id, originalId);
		assertEquals(slotElem.hasAttribute('style'), false);
		assertEquals(slotElem.hasAttribute('aria-label'), false);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});
});
