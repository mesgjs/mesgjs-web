import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, renderHTML } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();
const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

Deno.test("MWIDocument - basic document creation", async (t) => {
	const doc = getInstance('MWIDocument');
	assert(doc, 'MWIDocument instance exists');
	assertEquals(typeof doc, 'function', 'MWIDocument instance is a function');
	assertEquals(doc?.msjsType, 'MWIDocument', 'MWIDocument instance has correct Mesgjs type');

	const root = await doc('root');
	assert(root, 'document root node exists');
	assertEquals(typeof root, 'function', 'root node is a function');
	assertEquals(root?.msjsType, 'MWICoreFrag', 'root node is a MWICoreFrag');
});

Deno.test('MWIDocNode - basic node creation', async (t) => {
	// Create a simple text node
	const doc = getInstance('MWIDocument');
	const textNode = await doc('createNode', ps('[(m.t t="Hello World")]'));
	assert(textNode, 'text node created');
	assertEquals(textNode('type'), 'm.t', 'text node has correct type');
});

Deno.test("MWIDocument - (append item) to HTML rendering", async (t) => {
	// Test simple text rendering
	const doc = getInstance('MWIDocument');
	await doc('append', ps('[(item="Hello World")]'));
	const html = await doc('getHTML');
	assert(html, 'HTML generated');
	assert(html.includes('Hello World'), 'text content present in HTML');
});

Deno.test("MWIDocument - component node creation", async (t) => {
	const doc = getInstance('MWIDocument');

	// Create a fragment node (m.frg)
	const fragNode = await doc('createNode', ls([, 'm.frg']));
	assert(fragNode, 'fragment node created');
	assertEquals(fragNode('type'), 'm.frg', 'fragment node has correct type');
});
