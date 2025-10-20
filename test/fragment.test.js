import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from './harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

Deno.test("MWICoreFrag - interface registration", async (t) => {
	const registry = getInstance('MWIRegistry');
	const fragEntry = await registry.get('m.frg');
	assert(fragEntry, 'm.frg component is registered');
	assertEquals(fragEntry.at('if'), 'MWICoreFrag', 'm.frg has correct interface name');
});

Deno.test("MWICoreFrag - node creation via MWIDocument", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');
	assert(fragNode, 'fragment node created');
	assertEquals(fragNode('type'), 'm.frg', 'fragment node has correct type');
	assertEquals(fragNode?.msjsType, 'MWICoreFrag', 'fragment node has correct Mesgjs type');
});

Deno.test("MWICoreFrag - inherits from MWIDocNode", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Test inherited MWIDocNode methods
	assert(typeof fragNode.getAttr === 'function', 'fragment has getAttr method');
	assert(typeof fragNode.setAttr === 'function', 'fragment has setAttr method');
	assert(typeof fragNode.hasAttr === 'function', 'fragment has hasAttr method');
	assert(typeof fragNode.delAttr === 'function', 'fragment has delAttr method');
	assert(typeof fragNode.hasClass === 'function', 'fragment has hasClass method');
	assert(typeof fragNode.textToHTML === 'function', 'fragment has textToHTML method');
});

Deno.test("MWICoreFrag - attribute management", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Set and get attributes
	fragNode.setAttr('data-test', 'value123');
	assertEquals(fragNode.getAttr('data-test'), 'value123', 'attribute value set and retrieved');

	// Check attribute existence
	assert(fragNode.hasAttr('data-test'), 'hasAttr returns true for set attribute');
	assert(!fragNode.hasAttr('nonexistent'), 'hasAttr returns false for unset attribute');

	// Delete attribute
	fragNode.delAttr('data-test');
	assert(!fragNode.hasAttr('data-test'), 'attribute deleted successfully');
});

Deno.test("MWICoreFrag - class management", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Set classes
	fragNode.setAttr('class', 'class1 class2');
	assert(fragNode.hasClass('class1'), 'class1 is present');
	assert(fragNode.hasClass('class2'), 'class2 is present');

	// Add more classes
	fragNode.setAttr('class', '+ class3');
	assert(fragNode.hasClass('class1'), 'class1 still present after adding');
	assert(fragNode.hasClass('class3'), 'class3 added');

	// Get class attribute
	const classAttr = fragNode.getAttr('class');
	assert(classAttr.includes('class1'), 'class1 in class attribute');
	assert(classAttr.includes('class3'), 'class3 in class attribute');
});

Deno.test("MWICoreFrag - document reference", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Fragment should have reference to its document
	const nodeDoc = fragNode.document;
	assert(nodeDoc, 'fragment has document reference');
	assertEquals(nodeDoc?.msjsType, 'MWIDocument', 'document reference is correct');
});

Deno.test("MWICoreFrag - getHTML with no children", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Empty fragment should render as empty string
	const html = fragNode('getHTML');
	assertEquals(html, '', 'empty fragment renders as empty string');
});

Deno.test("MWICoreFrag - getHTML with child nodes", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Add a text child
	const textNode = await doc('createNode', ls([, 'm.t']));
	textNode.setAttr('t', 'Hello');
	const textHTML = textNode('getHTML');
	assertEquals(textHTML, 'Hello', 'simple text node renders directly');
	await fragNode('append', [ textNode ]);

	// Fragment should render its children without wrapper
	const fragHTML = fragNode('getHTML');
	assertEquals(fragHTML, 'Hello', 'fragment renders child content without wrapper');
});

Deno.test("MWICoreFrag - getSpec reconstructs node spec", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Set some attributes
	fragNode.setAttr('data-id', 'test123');

	// Get spec
	const spec = fragNode('getSpec');
	assert(spec, 'getSpec returns a spec');
	assertEquals(spec.at(0), 'm.frg', 'spec type is m.frg');
	assertEquals(spec.at('data-id'), 'test123', 'spec includes attributes');
});

Deno.test("MWICoreFrag - Mesgjs interface via message passing", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Test Mesgjs message passing interface
	const type = fragNode('type');
	assertEquals(type, 'm.frg', 'Mesgjs message passing works for type');

	// Set attribute via message
	fragNode('setAttr', ['test-attr', 'test-value']);
	const value = fragNode('getAttr', ['test-attr']);
	assertEquals(value, 'test-value', 'Mesgjs message passing works for setAttr/getAttr');
});

Deno.test("MWICoreFrag - chaining operations", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// setAttr should return the node for chaining
	const result = fragNode.setAttr('attr1', 'value1');
	assertEquals(result?.msjsType, 'MWICoreFrag', 'setAttr returns fragment for chaining');

	// Verify the attribute was set
	assertEquals(fragNode.getAttr('attr1'), 'value1', 'chained setAttr worked');
});

Deno.test("MWICoreFrag - getSubSpec for content slotting", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Empty fragment should have empty subSpec
	const emptySubSpec = fragNode('getSubSpec');
	assertEquals(emptySubSpec.size, 0, 'empty fragment has empty subSpec');
});

Deno.test("MWICoreFrag - textToHTML utility", async (t) => {
	const doc = getInstance('MWIDocument');
	const fragNode = await doc('createNode', 'm.frg');

	// Test HTML escaping via textToHTML
	const escaped = fragNode.textToHTML('<script>alert("xss")</script>');
	assert(escaped.includes('&lt;'), 'less-than escaped');
	assert(escaped.includes('&gt;'), 'greater-than escaped');
	assert(!escaped.includes('<script>'), 'script tag escaped');
});

Deno.test("MWICoreFrag - multiple fragments in document", async (t) => {
	const doc = getInstance('MWIDocument');

	// Create multiple fragments
	const frag1 = await doc('createNode', 'm.frg');
	const frag2 = await doc('createNode', 'm.frg');

	// Each should be independent
	frag1.setAttr('id', 'frag1');
	frag2.setAttr('id', 'frag2');

	assertEquals(frag1.getAttr('id'), 'frag1', 'first fragment has correct id');
	assertEquals(frag2.getAttr('id'), 'frag2', 'second fragment has correct id');
});
