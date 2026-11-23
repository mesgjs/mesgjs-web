import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	features: ['test.deferred.ssr'],
});

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = doc.registry;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Register a deferred component for testing
const deferredEntry = ls([
	'allowLate', true,
	'ftr', 'test.deferred.ssr'
]);
registry.register('test.deferred.ssr', deferredEntry);

describe("MWICoreDefer (m.defer) - SSR-HTML No Rendering", () => {
	it("(getHTML) - Returns empty string (no rendering)", () => {
		const deferNode = $c.sm(doc, 'createNode', ['m.defer']);
		const html =  $c.sm(deferNode, 'getHTML');
		assertEquals(html, '', 'Should return empty string');
	});

	it(".getHTML() - Returns empty string via JS", () => {
		const deferNode = doc.createNode('m.defer');
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string');
	});

	it("(getHTML) - No rendering even with attributes", () => {
		const deferNode = $c.sm(doc, 'createNode', ['m.defer']);
		$c.sm(deferNode, 'setAttr', ['class', 'test-class']);
		$c.sm(deferNode, 'setAttr', ['id', 'test-id']);
		$c.sm(deferNode, 'setAttr', ['data-custom', 'value']);
		const html =  $c.sm(deferNode, 'getHTML');
		assertEquals(html, '', 'Should return empty string regardless of attributes');
	});

	it(".getHTML() - No rendering even with attributes via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setAttr('class', 'test-class');
		deferNode.setAttr('style', 'color: red');
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string regardless of attributes');
	});
});

describe("MWICoreDefer (m.defer) - SSR-HTML Real-World Scenarios", () => {
	it("(getHTML) - Defer node created for unloaded component", () => {
		const node = $c.sm(doc, 'createNode', ['test.deferred.ssr']);
		const html =  $c.sm(node, 'getHTML');
		assertEquals(html, '', 'Should return empty string (no rendering)');
	});

	it(".getHTML() - Defer node created for unloaded component via JS", () => {
		const node = doc.createNode('test.deferred.ssr');
		const html = node.getHTML();
		assertEquals(html, '', 'Should return empty string (no rendering)');
	});

	it("(getHTML) - Defer node in document fragment (not visible in HTML)", () => {
		const testDoc = getInstance('MWIDocument');
		$c.sm(testDoc, 'append', { list: '[([test.deferred.ssr])]' });
		const html =  $c.sm(testDoc, 'getHTML');
		// Defer node contributes no HTML
		assertEquals(html, '', 'Document with only defer node should produce empty HTML');
	});

	it(".getHTML() - Defer node in document fragment via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([test.deferred.ssr])]' });
		const html = testDoc.getHTML();
		assertEquals(html, '', 'Document with only defer node should produce empty HTML');
	});

	it("(getHTML) - Mixed content with defer node (defer invisible)", () => {
		const testDoc = getInstance('MWIDocument');
		$c.sm(testDoc, 'append', { list: '[([m.t t=Before] [test.deferred.ssr] [m.t t=After])]' });
		const html =  $c.sm(testDoc, 'getHTML');
		// Should only see content from text nodes
		assertEquals(html.includes('Before'), true, 'Should include text before');
		assertEquals(html.includes('After'), true, 'Should include text after');
		// Defer node contributes nothing
		assertEquals(html, 'BeforeAfter', 'Defer node should be invisible in output');
	});

	it(".getHTML() - Mixed content with defer node via JS", () => {
		const testDoc = getInstance('MWIDocument');
		testDoc.append({ list: '[([m.t t=Start] [test.deferred.ssr] [m.t t=End])]' });
		const html = testDoc.getHTML();
		assertEquals(html.includes('Start'), true, 'Should include text before');
		assertEquals(html.includes('End'), true, 'Should include text after');
		assertEquals(html, 'StartEnd', 'Defer node should be invisible in output');
	});
});

describe("MWICoreDefer (m.defer) - SSR-HTML Children Accepted But Not Rendered", () => {
	it("(getHTML) - Defer node with children renders nothing", () => {
		const deferNode = $c.sm(doc, 'createNode', ['m.defer']);
		// Children are now accepted (stored in sub-spec) but not rendered during SSR
		$c.sm(deferNode, 'setSubSpec', { subSpec: ps('[(hello)]') });
		const html =  $c.sm(deferNode, 'getHTML');
		assertEquals(html, '', 'Should return empty string even with children');
	});

	it(".getHTML() - Defer node with children renders nothing via JS", () => {
		const deferNode = doc.createNode('m.defer');
		deferNode.setSubSpec({ subSpec: ps('[(world)]') });
		const html = deferNode.getHTML();
		assertEquals(html, '', 'Should return empty string even with children');
	});

	it("(getHTML) - from() defer node with original spec renders nothing", () => {
		const nodes =  $c.sm(doc, 'from', { list: '[([test.deferred.ssr class=widget])]' });
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 1, 'Should create one node');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		// Sub-spec should contain the original spec
		assertEquals(deferNode.getSubSpec().size, 1, 'Should have sub-spec');
		// But rendering produces nothing
		assertEquals($c.sm(deferNode, 'getHTML'), '', 'Should render nothing');
	});

	it(".getHTML() - from() defer node with original spec renders nothing via JS", () => {
		const nodes = doc.from({ list: '[([test.deferred.ssr class=widget])]' });
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 1, 'Should create one node');
		const deferNode = nodes[0];
		assertEquals(deferNode.msjsType, 'MWICoreDefer', 'Should be defer');
		assertEquals(deferNode.getHTML(), '', 'Should render nothing');
	});
});
