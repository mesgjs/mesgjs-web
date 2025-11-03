import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.csr'],
});

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const registry = doc.registry();
const ls = globalThis.ls;
const ps = globalThis.ps;

// Register a deferred component for testing
const deferredEntry = ls([
	'allowLate', true,
	'ftr', 'test.deferred.csr'
]);
registry.register('test.deferred.csr', deferredEntry);

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Basic Rendering", async (t) => {
	await t.step("(getDOM) - Renders as slot element", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		// Should return a reactive NANOS with one <slot> element
		const slotElem = domNodes.at(0);
		assertExists(slotElem);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Renders as slot element via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Includes auto-assigned ID", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		const id = slotElem.getAttribute('id');
		assert(id, 'Should have id attribute');
		assert(id.length > 0, 'ID should not be empty');
	});

	await t.step(".getDOM() - Includes auto-assigned ID via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		const id = slotElem.getAttribute('id');
		assert(id, 'Should have id attribute');
		assert(id.length > 0, 'ID should not be empty');
	});

	await t.step("(getDOM) - Includes data-mwi-defer attribute", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step(".getDOM() - Includes data-mwi-defer attribute via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step("(getDOM) - Only renders allowed attributes (id and data-mwi-defer)", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setAttr', ['class', 'should-not-render']);
		deferNode('setAttr', ['style', 'color: red']);
		deferNode('setAttr', ['aria-label', 'should-not-render']);
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		
		// Should have id and data-mwi-defer
		assert(slotElem.hasAttribute('id'), 'Should have id attribute');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
		
		// Should NOT have other attributes
		assertEquals(slotElem.hasAttribute('class'), false, 'Should not have class attribute');
		assertEquals(slotElem.hasAttribute('style'), false, 'Should not have style attribute');
		assertEquals(slotElem.hasAttribute('aria-label'), false, 'Should not have aria-label attribute');
	});

	await t.step(".getDOM() - Only renders allowed attributes via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setAttr('class', 'should-not-render');
		deferNode.setAttr('data-custom', 'should-not-render');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		
		assert(slotElem.hasAttribute('id'), 'Should have id attribute');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
		assertEquals(slotElem.hasAttribute('class'), false, 'Should not have class attribute');
		assertEquals(slotElem.hasAttribute('data-custom'), false, 'Should not have data-custom attribute');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM with Explicit ID", async (t) => {
	await t.step("(getDOM) - Preserves explicit ID", () => {
		const spec = ps('[(m.defer id=my-defer-id)]');
		const deferNode = doc('from', { item: spec });
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.getAttribute('id'), 'my-defer-id');
	});

	await t.step(".getDOM() - Preserves explicit ID via JS", () => {
		const spec = ps('[(m.defer id=custom-id-123)]');
		const deferNode = doc.from({ item: spec });
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.getAttribute('id'), 'custom-id-123');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Reactive Updates", async (t) => {
	await t.step("(getDOM) - Reactive attribute updates (filtered)", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		const originalId = slotElem.getAttribute('id');
		
		// Try to add attributes that should be filtered
		deferNode('setAttr', ['class', 'new-class']);
		deferNode('setAttr', ['data-custom', 'custom-value']);
		await globalThis.reactive.wait();
		
		// Filtered attributes should not appear
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('data-custom'), false);
		
		// Original attributes should remain
		assertEquals(slotElem.getAttribute('id'), originalId);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step(".getDOM() - Reactive attribute updates via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		const originalId = slotElem.getAttribute('id');
		
		deferNode.setAttr('class', 'new-class');
		deferNode.setAttr('style', 'color: blue');
		await globalThis.reactive.wait();
		
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('style'), false);
		assertEquals(slotElem.getAttribute('id'), originalId);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step("(getDOM) - Slot element remains stable across updates", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		const slotElem1 = domNodes.at(0);
		
		// Make some attribute changes
		deferNode('setAttr', ['data-test', 'value']);
		await globalThis.reactive.wait();
		
		const slotElem2 = domNodes.at(0);
		
		// Should be the same DOM element
		assertEquals(slotElem1, slotElem2, 'Slot element should remain stable');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Slot element remains stable via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		const slotElem1 = domNodes.at(0);
		
		deferNode.setAttr('data-test', 'value');
		await globalThis.reactive.wait();
		
		const slotElem2 = domNodes.at(0);
		
		assertEquals(slotElem1, slotElem2, 'Slot element should remain stable');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Real-World Scenarios", async (t) => {
	await t.step("(getDOM) - Defer node created for unloaded component", () => {
		const node = doc('createNode', ['test.deferred.csr']);
		const domNodes = node('getDOM');
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
		assert(slotElem.hasAttribute('id'));
	});

	await t.step(".getDOM() - Defer node created for unloaded component via JS", () => {
		const node = doc.createNode('test.deferred.csr');
		const domNodes = node.getDOM();
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
		assert(slotElem.hasAttribute('id'));
	});

	await t.step("(getDOM) - Multiple defer nodes have unique IDs", () => {
		const defer1 = doc('createNode', ['m.defer']);
		const defer2 = doc('createNode', ['m.defer']);
		const domNodes1 = defer1('getDOM');
		const domNodes2 = defer2('getDOM');
		
		const id1 = domNodes1.at(0).getAttribute('id');
		const id2 = domNodes2.at(0).getAttribute('id');
		
		assert(id1 !== id2, 'IDs should be unique');
	});

	await t.step(".getDOM() - Multiple defer nodes have unique IDs via JS", () => {
		const defer1 = doc.createNode('m.defer');
		const defer2 = doc.createNode('m.defer');
		const domNodes1 = defer1.getDOM();
		const domNodes2 = defer2.getDOM();
		
		const id1 = domNodes1.at(0).getAttribute('id');
		const id2 = domNodes2.at(0).getAttribute('id');
		
		assert(id1 !== id2, 'IDs should be unique');
	});

	await t.step("(getDOM) - Defer node in document fragment", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([test.deferred.csr])]' });
		const domNodes = testDoc('getDOM');
		
		// Should have one slot element in the document
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
	});

	await t.step(".getDOM() - Defer node in document fragment via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.csr])]' });
		const domNodes = testDoc.getDOM();
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.tagName, 'SLOT');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'test.deferred.csr');
	});

	await t.step("(getDOM) - Mixed content with defer and regular nodes", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([m.t t=Before] [test.deferred.csr] [m.t t=After])]' });
		const domNodes = testDoc('getDOM');
		
		// Should have 3 elements: output, slot, output
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Before');
		assertEquals(domNodes.at(1).tagName, 'SLOT');
		assertEquals(domNodes.at(2).tagName, 'OUTPUT');
		assertEquals(domNodes.at(2).textContent, 'After');
	});

	await t.step(".getDOM() - Mixed content with defer and regular nodes via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.csr] [m.t t=End])]' });
		const domNodes = testDoc.getDOM();
		
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Start');
		assertEquals(domNodes.at(1).tagName, 'SLOT');
		assertEquals(domNodes.at(2).tagName, 'OUTPUT');
		assertEquals(domNodes.at(2).textContent, 'End');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Empty Content", async (t) => {
	await t.step("(getDOM) - Defer node ignores appended content", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('append', ['ignored content']);
		const domNodes = deferNode('getDOM');
		
		// Should render as empty slot (no child nodes)
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.childNodes.length, 0, 'Slot should be empty');
	});

	await t.step(".getDOM() - Defer node ignores appended content via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.append('ignored content');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		assertEquals(slotElem.childNodes.length, 0, 'Slot should be empty');
	});
});

Deno.test("MWICoreDefer (m.defer) - CSR-DOM Complex Scenarios", async (t) => {
	await t.step("(getDOM) - Defer node with explicit ID and filtered attributes", () => {
		const spec = ps('[(m.defer id=defer-123 class="should-not-render" data-priority=high)]');
		const deferNode = doc('from', { item: spec });
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		
		// Should have explicit ID
		assertEquals(slotElem.getAttribute('id'), 'defer-123');
		
		// Should have data-mwi-defer
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
		
		// Should NOT have filtered attributes
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('data-priority'), false);
	});

	await t.step(".getDOM() - Defer node with explicit ID and filtered attributes via JS", () => {
		const spec = ps('[(m.defer id=custom-defer class="filtered" style="display:none")]');
		const deferNode = doc.from({ item: spec });
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		
		assertEquals(slotElem.getAttribute('id'), 'custom-defer');
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('style'), false);
	});

	await t.step("(getDOM) - Defer node attribute modifications don't affect DOM", async () => {
		const deferNode = doc('createNode', ['m.defer']);
		const domNodes = deferNode('getDOM');
		
		const slotElem = domNodes.at(0);
		const originalId = slotElem.getAttribute('id');
		
		// Modify attributes after DOM creation
		deferNode('setAttr', ['class', 'updated-class']);
		deferNode('setAttr', ['data-status', 'loading']);
		await globalThis.reactive.wait();
		
		// Filtered attributes should not appear in DOM
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('data-status'), false);
		
		// Original attributes should remain unchanged
		assertEquals(slotElem.getAttribute('id'), originalId);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});

	await t.step(".getDOM() - Defer node attribute modifications via JS", async () => {
		const deferNode = doc.createNode('m.defer');
		const domNodes = deferNode.getDOM();
		
		const slotElem = domNodes.at(0);
		const originalId = slotElem.getAttribute('id');
		
		deferNode.setAttr('class', 'updated-class');
		deferNode.setAttr('data-status', 'loading');
		await globalThis.reactive.wait();
		
		assertEquals(slotElem.hasAttribute('class'), false);
		assertEquals(slotElem.hasAttribute('data-status'), false);
		assertEquals(slotElem.getAttribute('id'), originalId);
		assertEquals(slotElem.getAttribute('data-mwi-defer'), 'm.defer');
	});
});
