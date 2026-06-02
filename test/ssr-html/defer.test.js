import {
	assert,
	assertEquals,
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

Deno.test("MWICoreDefer (m.defer) - SSR-HTML No Rendering", async (t) => {
	await t.step("(getHTML) - Returns empty string (no rendering)", () => {
		const deferNode = doc('createNode', ['m.defer']);
		const html = deferNode('getHTML');
		assertEquals(html, '', 'Should return empty string');
	});

	await t.step(".getHTML() - Returns empty string via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string');
	});

	await t.step("(getHTML) - No rendering even with attributes", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setAttr', ['class', 'test-class']);
		deferNode('setAttr', ['id', 'test-id']);
		deferNode('setAttr', ['data-custom', 'value']);
		const html = deferNode('getHTML');
		assertEquals(html, '', 'Should return empty string regardless of attributes');
	});

	await t.step(".getHTML() - No rendering even with attributes via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setAttr('class', 'test-class');
		deferNode.setAttr('style', 'color: red');
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string regardless of attributes');
	});
});

Deno.test("MWICoreDefer (m.defer) - SSR-HTML Real-World Scenarios", async (t) => {
	await t.step("(getHTML) - Defer node created for unloaded component", () => {
		const node = doc('createNode', ['test.deferred.ssr']);
		const html = node('getHTML');
		assertEquals(html, '', 'Should return empty string (no rendering)');
	});

	await t.step(".getHTML() - Defer node created for unloaded component via JS", () => {
		const node = doc.createNode('test.deferred.ssr');
		const html = node.getHTML();
		assertEquals(html, '', 'Should return empty string (no rendering)');
	});

	await t.step("(getHTML) - Defer node in document fragment (not visible in HTML)", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([test.deferred.ssr])]' });
		const html = testDoc('getHTML');
		// Defer node contributes no HTML
		assertEquals(html, '', 'Document with only defer node should produce empty HTML');
	});

	await t.step(".getHTML() - Defer node in document fragment via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.ssr])]' });
		const html = testDoc.getHTML();
		assertEquals(html, '', 'Document with only defer node should produce empty HTML');
	});

	await t.step("(getHTML) - Mixed content with defer node (defer invisible)", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc('append', { list: '[([m.t t=Before] [test.deferred.ssr] [m.t t=After])]' });
		const html = testDoc('getHTML');
		// Should only see content from text nodes
		assertEquals(html.includes('Before'), true, 'Should include text before');
		assertEquals(html.includes('After'), true, 'Should include text after');
		// Defer node contributes nothing
		assertEquals(html, 'BeforeAfter', 'Defer node should be invisible in output');
	});

	await t.step(".getHTML() - Mixed content with defer node via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.ssr] [m.t t=End])]' });
		const html = testDoc.getHTML();
		assertEquals(html.includes('Start'), true, 'Should include text before');
		assertEquals(html.includes('End'), true, 'Should include text after');
		assertEquals(html, 'StartEnd', 'Defer node should be invisible in output');
	});
});

Deno.test("MWICoreDefer (m.defer) - SSR-HTML Empty Content", async (t) => {
	await t.step("(getHTML) - Defer node ignores appended content", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('append', ['ignored content']);
		const html = deferNode('getHTML');
		assertEquals(html, '', 'Should return empty string');
	});

	await t.step(".getHTML() - Defer node ignores appended content via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.append('ignored content');
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string');
	});

	await t.step("(getHTML) - Defer node with setSubSpec still renders nothing", () => {
		const deferNode = doc('createNode', ['m.defer']);
		deferNode('setSubSpec', { subSpec: ls([, 'child1', , 'child2']) });
		const html = deferNode('getHTML');
		assertEquals(html, '', 'Should return empty string even with sub-spec');
	});

	await t.step(".getHTML() - Defer node with setSubSpec still renders nothing via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setSubSpec({ subSpec: ls([, 'child1', , 'child2']) });
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string even with sub-spec');
	});
});
