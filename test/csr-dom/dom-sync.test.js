import {
	assertEquals,
	assertExists,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance, getInterface } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');

// Helper: create a MWIDOMSync instance starting at a given DOM node
function createSync (cursor) {
	return getInstance('MWIDOMSync', [cursor]);
}

// Helper: create a doc-node of the given type with optional attributes
function makeDocNode (type, attrs = {}) {
	const node = doc.createNode(type);
	for (const [k, v] of Object.entries(attrs)) node.setAttr(k, v);
	return node;
}

Deno.test("MWIDOMSync - Initialization", async (t) => {
	await t.step("(cursor) - Returns initial cursor node", () => {
		const container = document.createElement('div');
		const textNode = document.createTextNode('hello');
		container.appendChild(textNode);

		const sync = createSync(textNode);
		assertStrictEquals(sync('cursor'), textNode, 'cursor should be the initial node');
	});

	await t.step(".cursor - Returns initial cursor node via JS", () => {
		const container = document.createElement('div');
		const elem = document.createElement('span');
		container.appendChild(elem);

		const sync = createSync(elem);
		assertStrictEquals(sync.cursor, elem, 'cursor should be the initial element');
	});

	await t.step("(cursor) - Returns null when initialized with null", () => {
		const sync = createSync(null);
		assertEquals(sync('cursor'), null, 'cursor should be null');
	});

	await t.step("(cursor) - Returns undefined when initialized with undefined", () => {
		const sync = createSync(undefined);
		assertEquals(sync('cursor'), undefined, 'cursor should be undefined');
	});
});

Deno.test("MWIDOMSync - Text Node Sync", async (t) => {
	await t.step("(sync) - Matches text node with matching content", () => {
		const container = document.createElement('div');
		const textNode = document.createTextNode('Hello World');
		container.appendChild(textNode);

		const docNode = makeDocNode('m.t', { t: 'Hello World' });
		const sync = createSync(textNode);
		const result = sync('sync', ['m.t', docNode]);

		assertStrictEquals(result, textNode, 'should return the matching text node');
		// Cursor should advance to next sibling (null)
		assertEquals(sync('cursor'), null, 'cursor should advance past matched node');
	});

	await t.step(".sync() - Matches text node with matching content via JS", () => {
		const container = document.createElement('div');
		const textNode = document.createTextNode('JS Hello');
		container.appendChild(textNode);

		const docNode = makeDocNode('m.t', { t: 'JS Hello' });
		const sync = createSync(textNode);
		const result = sync.sync('m.t', docNode);

		assertStrictEquals(result, textNode, 'should return the matching text node');
		assertEquals(sync.cursor, null, 'cursor should advance past matched node');
	});

	await t.step("(sync) - Does not match text node with different content", () => {
		const container = document.createElement('div');
		const textNode = document.createTextNode('Different text');
		container.appendChild(textNode);

		const docNode = makeDocNode('m.t', { t: 'Expected text' });
		const sync = createSync(textNode);
		const result = sync('sync', ['m.t', docNode]);

		assertEquals(result, undefined, 'should return undefined for non-matching text');
		// Cursor should not advance
		assertStrictEquals(sync('cursor'), textNode, 'cursor should not advance on mismatch');
	});

	await t.step("(sync) - Does not match element node for m.t tag", () => {
		const container = document.createElement('div');
		const elem = document.createElement('span');
		container.appendChild(elem);

		const docNode = makeDocNode('m.t', { t: 'text' });
		const sync = createSync(elem);
		const result = sync('sync', ['m.t', docNode]);

		assertEquals(result, undefined, 'should return undefined when cursor is not a text node');
	});

	await t.step("(sync) - Advances cursor after successful text match", () => {
		const container = document.createElement('div');
		const text1 = document.createTextNode('First');
		const text2 = document.createTextNode('Second');
		container.appendChild(text1);
		container.appendChild(text2);

		const docNode1 = makeDocNode('m.t', { t: 'First' });
		const docNode2 = makeDocNode('m.t', { t: 'Second' });
		const sync = createSync(text1);

		const result1 = sync('sync', ['m.t', docNode1]);
		assertStrictEquals(result1, text1, 'first sync should match text1');
		assertStrictEquals(sync('cursor'), text2, 'cursor should advance to text2');

		const result2 = sync('sync', ['m.t', docNode2]);
		assertStrictEquals(result2, text2, 'second sync should match text2');
		assertEquals(sync('cursor'), null, 'cursor should advance to null');
	});
});

Deno.test("MWIDOMSync - Comment Node Sync", async (t) => {
	await t.step("(sync) - Matches comment node with matching content", () => {
		const container = document.createElement('div');
		const commentNode = document.createComment('My comment');
		container.appendChild(commentNode);

		const docNode = makeDocNode('m.com', { t: 'My comment' });
		const sync = createSync(commentNode);
		const result = sync('sync', ['m.com', docNode]);

		assertStrictEquals(result, commentNode, 'should return the matching comment node');
		assertEquals(sync('cursor'), null, 'cursor should advance past matched node');
	});

	await t.step(".sync() - Matches comment node via JS", () => {
		const container = document.createElement('div');
		const commentNode = document.createComment('JS comment');
		container.appendChild(commentNode);

		const docNode = makeDocNode('m.com', { t: 'JS comment' });
		const sync = createSync(commentNode);
		const result = sync.sync('m.com', docNode);

		assertStrictEquals(result, commentNode, 'should return the matching comment node');
	});

	await t.step("(sync) - Does not match comment node with different content", () => {
		const container = document.createElement('div');
		const commentNode = document.createComment('Actual comment');
		container.appendChild(commentNode);

		const docNode = makeDocNode('m.com', { t: 'Expected comment' });
		const sync = createSync(commentNode);
		const result = sync('sync', ['m.com', docNode]);

		assertEquals(result, undefined, 'should return undefined for non-matching comment');
		assertStrictEquals(sync('cursor'), commentNode, 'cursor should not advance on mismatch');
	});

	await t.step("(sync) - Does not match text node for m.com tag", () => {
		const container = document.createElement('div');
		const textNode = document.createTextNode('text');
		container.appendChild(textNode);

		const docNode = makeDocNode('m.com', { t: 'text' });
		const sync = createSync(textNode);
		const result = sync('sync', ['m.com', docNode]);

		assertEquals(result, undefined, 'should return undefined when cursor is not a comment node');
	});
});

Deno.test("MWIDOMSync - Element Node Sync", async (t) => {
	await t.step("(sync) - Matches element by tag name", () => {
		const container = document.createElement('div');
		const span = document.createElement('span');
		container.appendChild(span);

		const docNode = makeDocNode('h.span');
		const sync = createSync(span);
		const result = sync('sync', ['SPAN', docNode]);

		assertStrictEquals(result, span, 'should return the matching element');
		assertEquals(sync('cursor'), null, 'cursor should advance past matched element');
	});

	await t.step(".sync() - Matches element by tag name via JS", () => {
		const container = document.createElement('div');
		const divElem = document.createElement('div');
		container.appendChild(divElem);

		const docNode = makeDocNode('h.div');
		const sync = createSync(divElem);
		const result = sync.sync('DIV', docNode);

		assertStrictEquals(result, divElem, 'should return the matching element');
	});

	await t.step("(sync) - Does not match element with different tag name", () => {
		const container = document.createElement('div');
		const span = document.createElement('span');
		container.appendChild(span);

		const docNode = makeDocNode('h.div');
		const sync = createSync(span);
		const result = sync('sync', ['DIV', docNode]);

		assertEquals(result, undefined, 'should return undefined for tag name mismatch');
		assertStrictEquals(sync('cursor'), span, 'cursor should not advance on mismatch');
	});

	await t.step("(sync) - Advances past text nodes before matching element", () => {
		const container = document.createElement('div');
		const textNode = document.createTextNode('whitespace');
		const span = document.createElement('span');
		container.appendChild(textNode);
		container.appendChild(span);

		const docNode = makeDocNode('h.span');
		const sync = createSync(textNode);
		const result = sync('sync', ['SPAN', docNode]);

		assertStrictEquals(result, span, 'should advance past text node and match span');
		assertEquals(sync('cursor'), null, 'cursor should advance past matched element');
	});

	await t.step("(sync) - Advances past comment nodes before matching element", () => {
		const container = document.createElement('div');
		const commentNode = document.createComment('comment');
		const divElem = document.createElement('div');
		container.appendChild(commentNode);
		container.appendChild(divElem);

		const docNode = makeDocNode('h.div');
		const sync = createSync(commentNode);
		const result = sync('sync', ['DIV', docNode]);

		assertStrictEquals(result, divElem, 'should advance past comment node and match div');
	});

	await t.step("(sync) - Advances past multiple text/comment nodes before matching element", () => {
		const container = document.createElement('div');
		const text1 = document.createTextNode('text1');
		const comment = document.createComment('comment');
		const text2 = document.createTextNode('text2');
		const span = document.createElement('span');
		container.appendChild(text1);
		container.appendChild(comment);
		container.appendChild(text2);
		container.appendChild(span);

		const docNode = makeDocNode('h.span');
		const sync = createSync(text1);
		const result = sync('sync', ['SPAN', docNode]);

		assertStrictEquals(result, span, 'should advance past all text/comment nodes and match span');
	});
});

Deno.test("MWIDOMSync - Non-local Element Sync (getElementById)", async (t) => {
	await t.step("(sync) - Falls back to getElementById when no local match", () => {
		// Create an element with an id in the document
		const targetElem = document.createElement('div');
		targetElem.id = 'target-element';
		document.body.appendChild(targetElem);
		//assertStrictEquals(document.getElementById('target-element'), targetElem);

		// Create a doc-node with the matching id
		const docNode = makeDocNode('h.div');
		docNode.setAttr('id', 'target-element');

		// Start sync at null (no local cursor)
		const sync = createSync(null);
		const result = sync('sync', ['DIV', docNode]);

		assertStrictEquals(result, targetElem, 'should find element by id');

		// Cleanup
		document.body.removeChild(targetElem);
	});

	await t.step("(sync) - Returns undefined when id not found in document", () => {
		const docNode = makeDocNode('h.div');
		docNode.setAttr('id', 'nonexistent-id-xyz');

		const sync = createSync(null);
		const result = sync('sync', ['DIV', docNode]);

		assertEquals(result, undefined, 'should return undefined when id not found');
	});

	await t.step("(sync) - Does not use getElementById when local match succeeds", () => {
		const container = document.createElement('div');
		const localSpan = document.createElement('span');
		container.appendChild(localSpan);

		// Also create a global element with an id
		const globalSpan = document.createElement('span');
		globalSpan.id = 'global-span';
		document.body.appendChild(globalSpan);

		const docNode = makeDocNode('h.span');
		docNode.setAttr('id', 'global-span');

		const sync = createSync(localSpan);
		const result = sync('sync', ['SPAN', docNode]);

		// Should match the local element, not the global one
		assertStrictEquals(result, localSpan, 'should prefer local match over getElementById');

		// Cleanup
		document.body.removeChild(globalSpan);
	});
});

Deno.test("MWIDOMSync - Sequential Sync Operations", async (t) => {
	await t.step("(sync) - Syncs a sequence of mixed nodes", () => {
		const container = document.createElement('div');
		const text1 = document.createTextNode('Hello');
		const span = document.createElement('span');
		const text2 = document.createTextNode('World');
		container.appendChild(text1);
		container.appendChild(span);
		container.appendChild(text2);

		const textDocNode1 = makeDocNode('m.t', { t: 'Hello' });
		const spanDocNode = makeDocNode('h.span');
		const textDocNode2 = makeDocNode('m.t', { t: 'World' });

		const sync = createSync(text1);

		const r1 = sync('sync', ['m.t', textDocNode1]);
		assertStrictEquals(r1, text1, 'first sync: text node');

		const r2 = sync('sync', ['SPAN', spanDocNode]);
		assertStrictEquals(r2, span, 'second sync: span element');

		const r3 = sync('sync', ['m.t', textDocNode2]);
		assertStrictEquals(r3, text2, 'third sync: text node');

		assertEquals(sync('cursor'), null, 'cursor should be null after all nodes synced');
	});

	await t.step("(sync) - Cursor advances correctly through multiple elements", () => {
		const container = document.createElement('div');
		const div1 = document.createElement('div');
		const div2 = document.createElement('div');
		const div3 = document.createElement('div');
		container.appendChild(div1);
		container.appendChild(div2);
		container.appendChild(div3);

		const sync = createSync(div1);

		sync('sync', ['DIV', makeDocNode('h.div')]);
		assertStrictEquals(sync('cursor'), div2, 'cursor at div2 after first sync');

		sync('sync', ['DIV', makeDocNode('h.div')]);
		assertStrictEquals(sync('cursor'), div3, 'cursor at div3 after second sync');

		sync('sync', ['DIV', makeDocNode('h.div')]);
		assertEquals(sync('cursor'), null, 'cursor null after third sync');
	});
});
