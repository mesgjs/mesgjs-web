import {
	assert,
	assertEquals,
	assertMatch,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.ssr'],
});

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = doc.registry();
const ls = globalThis.ls;
const ps = globalThis.ps;

// Register a deferred component for testing
const deferredEntry = ls([
	'allowLate', true,
	'ftr', 'test.deferred.ssr'
]);
registry.register('test.deferred.ssr', deferredEntry);

Deno.test("MWICoreDefer (m.defer) - SSR-HTML Basic Rendering", async (t) => {
	await t.step("(getHTML) - Renders as slot element", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const html = deferNode('getHTML');
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should render as slot element');
	});

	await t.step(".getHTML() - Renders as slot element via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const html = deferNode.getHTML();
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should render as slot element');
	});

	await t.step("(getHTML) - Includes auto-assigned ID", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const html = deferNode('getHTML');
		assertMatch(html, /id="[^"]+"/,  'Should include id attribute');
	});

	await t.step(".getHTML() - Includes auto-assigned ID via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const html = deferNode.getHTML();
		assertMatch(html, /id="[^"]+"/, 'Should include id attribute');
	});

	await t.step("(getHTML) - Includes data-mwi-defer attribute", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const html = deferNode('getHTML');
		assertMatch(html, /data-mwi-defer="m\.defer"/, 'Should include data-mwi-defer attribute');
	});

	await t.step(".getHTML() - Includes data-mwi-defer attribute via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const html = deferNode.getHTML();
		assertMatch(html, /data-mwi-defer="m\.defer"/, 'Should include data-mwi-defer attribute');
	});

	await t.step("(getHTML) - Only renders allowed attributes (id and data-mwi-defer)", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setAttr', ['class', 'should-not-render']);
		deferNode('setAttr', ['style', 'color: red']);
		deferNode('setAttr', ['aria-label', 'should-not-render']);
		const html = deferNode('getHTML');

		// Should have id and data-mwi-defer
		assertMatch(html, /id="[^"]+"/, 'Should include id');
		assertMatch(html, /data-mwi-defer="m\.defer"/, 'Should include data-mwi-defer');

		// Should NOT have other attributes
		assert(!html.includes('class='), 'Should not include class attribute');
		assert(!html.includes('style='), 'Should not include style attribute');
		assert(!html.includes('aria-label='), 'Should not include aria-label attribute');
	});

	await t.step(".getHTML() - Only renders allowed attributes via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setAttr('class', 'should-not-render');
		deferNode.setAttr('data-custom', 'should-not-render');
		const html = deferNode.getHTML();

		assertMatch(html, /id="[^"]+"/, 'Should include id');
		assertMatch(html, /data-mwi-defer="m\.defer"/, 'Should include data-mwi-defer');
		assert(!html.includes('class='), 'Should not include class attribute');
		assert(!html.includes('data-custom='), 'Should not include data-custom attribute');
	});
});

Deno.test("MWICoreDefer (m.defer) - SSR-HTML with Explicit ID", async (t) => {
	await t.step("(getHTML) - Preserves explicit ID", () => {
		const spec = ps('[(m.defer id=my-defer-id)]');
		const deferNode = doc('from', { item: spec });
		const html = deferNode('getHTML');
		assertMatch(html, /id="my-defer-id"/, 'Should preserve explicit ID');
	});

	await t.step(".getHTML() - Preserves explicit ID via JS", () => {
		const spec = ps('[(m.defer id=custom-id-123)]');
		const deferNode = doc.from({ item: spec });
		const html = deferNode.getHTML();
		assertMatch(html, /id="custom-id-123"/, 'Should preserve explicit ID');
	});
});

Deno.test("MWICoreDefer (m.defer) - SSR-HTML Real-World Scenarios", async (t) => {
	await t.step("(getHTML) - Defer node created via document for unloaded component", () => {
		const node = doc('createNode', ['test.deferred.ssr']);
		const html = node('getHTML');
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should render as slot');
		assertMatch(html, /data-mwi-defer="test\.deferred\.ssr"/, 'Should have correct defer type');
		assertMatch(html, /id="[^"]+"/,  'Should have auto-assigned ID');
	});

	await t.step(".getHTML() - Defer node created via document for unloaded component via JS", () => {
		const node = doc.createNode('test.deferred.ssr');
		const html = node.getHTML();
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should render as slot');
		assertMatch(html, /data-mwi-defer="test\.deferred\.ssr"/, 'Should have correct defer type');
		assertMatch(html, /id="[^"]+"/, 'Should have auto-assigned ID');
	});

	await t.step("(getHTML) - Multiple defer nodes have unique IDs", () => {
		const defer1 = doc('createNode', ['m.defer']);
		const defer2 = doc('createNode', ['m.defer']);
		const html1 = defer1('getHTML');
		const html2 = defer2('getHTML');

		const id1Match = html1.match(/id="([^"]+)"/);
		const id2Match = html2.match(/id="([^"]+)"/);

		assert(id1Match && id1Match[1], 'First defer should have ID');
		assert(id2Match && id2Match[1], 'Second defer should have ID');
		assert(id1Match[1] !== id2Match[1], 'IDs should be unique');
	});

	await t.step(".getHTML() - Multiple defer nodes have unique IDs via JS", () => {
		const defer1 = doc.createNode('m.defer');
		const defer2 = doc.createNode('m.defer');
		const html1 = defer1.getHTML();
		const html2 = defer2.getHTML();

		const id1Match = html1.match(/id="([^"]+)"/);
		const id2Match = html2.match(/id="([^"]+)"/);

		assert(id1Match && id1Match[1], 'First defer should have ID');
		assert(id2Match && id2Match[1], 'Second defer should have ID');
		assert(id1Match[1] !== id2Match[1], 'IDs should be unique');
	});

	await t.step("(getHTML) - Defer node in document fragment", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([test.deferred.ssr])]' });
		const html = testDoc('getHTML');
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should render defer node as slot');
		assertMatch(html, /data-mwi-defer="test\.deferred\.ssr"/, 'Should have correct defer type');
	});

	await t.step(".getHTML() - Defer node in document fragment via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.ssr])]' });
		const html = testDoc.getHTML();
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should render defer node as slot');
		assertMatch(html, /data-mwi-defer="test\.deferred\.ssr"/, 'Should have correct defer type');
	});

	await t.step("(getHTML) - Mixed content with defer and regular nodes", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([m.t t=Before] [test.deferred.ssr] [m.t t=After])]' });
		const html = testDoc('getHTML');
		assertEquals(html.includes('Before'), true, 'Should include text before');
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should include defer node');
		assertEquals(html.includes('After'), true, 'Should include text after');
	});

	await t.step(".getHTML() - Mixed content with defer and regular nodes via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.ssr] [m.t t=End])]' });
		const html = testDoc.getHTML();
		assertEquals(html.includes('Start'), true, 'Should include text before');
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should include defer node');
		assertEquals(html.includes('End'), true, 'Should include text after');
	});
});

Deno.test("MWICoreDefer (m.defer) - SSR-HTML Empty Content", async (t) => {
	await t.step("(getHTML) - Defer node ignores appended content", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('append', ['ignored content']);
		const html = deferNode('getHTML');
		// Should render as empty slot (no content between tags)
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should be empty slot element');
		assert(!html.includes('ignored'), 'Should not include appended content');
	});

	await t.step(".getHTML() - Defer node ignores appended content via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.append('ignored content');
		const html = deferNode.getHTML();
		assertMatch(html, /<slot[^>]*><\/slot>/, 'Should be empty slot element');
		assert(!html.includes('ignored'), 'Should not include appended content');
	});
});
