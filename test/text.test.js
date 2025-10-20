import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from './harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';
const DOC_IF = 'MWIDocument';
const DOC_NODE_IF = 'MWIDocNode';

await setupRuntime();

const { fwait, getInstance, typeChains } = globalThis.$c;
await fwait(REG_READY_FT);

Deno.test("MWICoreText - interface registration", async (t) => {
	const registry = getInstance('MWIRegistry');
	const textEntry = await registry.get('m.t');
	assert(textEntry, 'm.t component is registered');
	assertEquals(textEntry.at('if'), 'MWICoreText', 'm.t has correct interface name');
});

Deno.test("MWICoreText - node creation via MWIDocument", async (t) => {
	const doc = getInstance(DOC_IF);
	const textNode = await doc('createNode', 'm.t');
	assert(textNode, 'text node created');
	assertEquals(textNode('type'), 'm.t', 'text node has correct type');
	assertEquals(textNode?.msjsType, 'MWICoreText', 'text node has correct Mesgjs type');
});

Deno.test("MWICoreText - inherits from MWIDocNode", async (t) => {
	const doc = getInstance(DOC_IF);
	const textNode = await doc('createNode', 'm.t');
	assert(typeChains(textNode.msjsType, DOC_NODE_IF));
});

Deno.test("MWICoreText - document reference", async (t) => {
	const doc = getInstance(DOC_IF);
	const textNode = await doc('createNode', 'm.t');

	// Text node should have reference to its document
	const nodeDoc = textNode.document;
	assert(nodeDoc, 'text node has document reference');
	assertEquals(nodeDoc?.msjsType, DOC_IF, 'document reference is correct');
});

Deno.test("MWICoreText - t attribute and getHTML", async (t) => {
	const doc = getInstance(DOC_IF);
	const textNode = await doc('createNode', 'm.t');

	textNode('setAttr', [ 't', 'Hello' ]);
	assertEquals(textNode('getAttr', 't'), 'Hello', '"t" getAttr matches setAttr');

	const html = textNode('getHTML');
	assertEquals(html, 'Hello', 'getHTML returns simple string as is');
});

Deno.test("MWICoreText - via document from item", async (t) => {
	const doc = getInstance(DOC_IF);
	let html;

	const itemString = await doc('from', { item: 'item string' });
	html = itemString('getHTML');
	assertEquals(html, 'item string', 'item string generated/rendered correctly');

	const itemNode = await doc('from', { item: ls([, 'm.t', 't', 'item node']) });
	html = itemNode('getHTML');
	assertEquals(html, 'item node', 'item node generated/rendered correctly');
});

Deno.test("MWICoreText - via document from list", async (t) => {
	const doc = getInstance(DOC_IF);
	let html;

	const listString = await doc('from', { list: ls([, 'list string']) });
	html = listString[0]('getHTML');
	assertEquals(html, 'list string', 'list string generated/rendered correctly');

	const listNode = await doc('from', { list: ls([, ls([, 'm.t', 't', 'list node'])]) });
	html = listNode[0]('getHTML');
	assertEquals(html, 'list node', 'list node generated/rendered correctly');
});

Deno.test('MWICoreText - basic HTML escaping', async (t) => {
	const doc = getInstance(DOC_IF);
	const node = await doc('createNode', 'm.t');

	node.setAttr('t', '< & >');
	assertEquals(node.getHTML(), '&lt; &amp; &gt;', '"<", "&", and ">" escaped correctly');

	node.setAttr('t', '\x01 \x10 \u0100 \u1000');
	assertEquals(node.getHTML(), '&#1; &#16; &#256; &#4096;', 'char codes escaped correctly');
});
