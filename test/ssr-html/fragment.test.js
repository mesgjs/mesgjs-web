import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWICoreFrag (m.frg) - Transparent Rendering", async (t) => {
	await t.step("(getHTML) - Empty fragment renders as empty string", async () => {
		const fragNode = await doc.createNode('m.frg');
		const html = await fragNode('getHTML');
		assertEquals(html, '');
	});

	await t.step(".getHTML() - Empty fragment renders as empty string via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const html = await fragNode.getHTML();
		assertEquals(html, '');
	});

	await t.step("(getHTML) - Fragment with single text child", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Hello World']));
		fragNode('append', ls([, textNode]));
		const html = await fragNode('getHTML');
		assertEquals(html, 'Hello World');
	});

	await t.step(".getHTML() - Fragment with single text child via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS Hello World');
		fragNode.append(textNode);
		const html = await fragNode.getHTML();
		assertEquals(html, 'JS Hello World');
	});

	await t.step("(getHTML) - Fragment with multiple text children", async () => {
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1('setAttr', ls([, 't', , 'First']));
		const text2 = await doc.createNode('m.t');
		text2('setAttr', ls([, 't', , 'Second']));
		const text3 = await doc.createNode('m.t');
		text3('setAttr', ls([, 't', , 'Third']));
		fragNode('append', ls([, text1, , text2, , text3]));
		const html = await fragNode('getHTML');
		assertEquals(html, 'FirstSecondThird');
	});

	await t.step(".getHTML() - Fragment with multiple text children via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		const text3 = await doc.createNode('m.t');
		text3.setAttr('t', 'JS Third');
		fragNode.append(text1, text2, text3);
		const html = await fragNode.getHTML();
		assertEquals(html, 'JS FirstJS SecondJS Third');
	});

	await t.step("(getHTML) - Fragment with mixed content (text and comment)", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Text content']));
		const commentNode = await doc.createNode('m.com');
		commentNode('setAttr', ls([, 't', , 'Comment content']));
		fragNode('append', ls([, textNode, , commentNode]));
		const html = await fragNode('getHTML');
		assertEquals(html, 'Text content<!--Comment content-->');
	});

	await t.step(".getHTML() - Fragment with mixed content via JS", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'JS Text');
		const commentNode = await doc.createNode('m.com');
		commentNode.setAttr('t', 'JS Comment');
		fragNode.append(textNode, commentNode);
		const html = await fragNode.getHTML();
		assertEquals(html, 'JS Text<!--JS Comment-->');
	});
});

Deno.test("MWICoreFrag (m.frg) - No Wrapper Element", async (t) => {
	await t.step("Fragment does NOT add HTML wrapper", async () => {
		const fragNode = await doc.createNode('m.frg');
		fragNode.append('Content');
		const html = await fragNode.getHTML();
		// Should be just the content, no tags
		assertEquals(html, 'Content');
		assert(!html.includes('<'), 'No opening tags');
		assert(!html.includes('>'), 'No closing tags');
	});

	await t.step("Fragment vs. direct children rendering (should be identical)", async () => {
		// Create fragment with children
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', 'Alpha');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'Beta');
		fragNode.append(text1, text2);
		const fragHTML = await fragNode.getHTML();

		// Render children directly
		const directHTML1 = await text1.getHTML();
		const directHTML2 = await text2.getHTML();
		const directHTML = directHTML1 + directHTML2;

		// Should be identical
		assertEquals(fragHTML, directHTML);
	});

	await t.step("Fragment attributes do NOT appear in HTML output", async () => {
		const fragNode = await doc.createNode('m.frg');
		fragNode.setAttr('id', 'frag-id');
		fragNode.setAttr('class', 'frag-class');
		fragNode.setAttr('data-test', 'test-value');
		fragNode.append('Content');
		const html = await fragNode.getHTML();
		
		// HTML should only contain the content
		assertEquals(html, 'Content');
		// Verify no attributes appear
		assert(!html.includes('id='), 'No id attribute');
		assert(!html.includes('class='), 'No class attribute');
		assert(!html.includes('data-test'), 'No data-test attribute');
		assert(!html.includes('frag-id'), 'No id value');
		assert(!html.includes('frag-class'), 'No class value');
	});

	await t.step("Only child content renders", async () => {
		const fragNode = await doc.createNode('m.frg');
		fragNode.setAttr('id', 'invisible-id');
		fragNode.setAttr('title', 'Invisible Title');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', 'Visible Content');
		fragNode.append(textNode);
		const html = await fragNode.getHTML();
		
		assertEquals(html, 'Visible Content');
		assert(!html.includes('invisible'), 'Fragment attributes not in output');
		assert(!html.includes('Invisible'), 'Fragment attributes not in output');
	});
});

Deno.test("MWICoreFrag (m.frg) - Nested Fragments", async (t) => {
	await t.step("Fragment containing other fragments", async () => {
		const outerFrag = await doc.createNode('m.frg');
		const innerFrag = await doc.createNode('m.frg');
		innerFrag.append('Inner content');
		outerFrag.append(innerFrag);
		const html = await outerFrag.getHTML();
		assertEquals(html, 'Inner content');
	});

	await t.step("Nested fragments render transparently", async () => {
		const frag1 = await doc.createNode('m.frg');
		const frag2 = await doc.createNode('m.frg');
		const frag3 = await doc.createNode('m.frg');
		
		frag3.append('Deepest');
		frag2.append(frag3);
		frag1.append(frag2);
		
		const html = await frag1.getHTML();
		assertEquals(html, 'Deepest');
	});

	await t.step("Deep nesting (3+ levels)", async () => {
		const levels = [];
		for (let i = 0; i < 5; i++) {
			levels.push(await doc.createNode('m.frg'));
		}
		
		// Add content to deepest level
		levels[4].append('Deep content');
		
		// Nest them
		for (let i = 3; i >= 0; i--) {
			levels[i].append(levels[i + 1]);
		}
		
		const html = await levels[0].getHTML();
		assertEquals(html, 'Deep content');
	});

	await t.step("Nested fragments with mixed content", async () => {
		const outer = await doc.createNode('m.frg');
		const inner1 = await doc.createNode('m.frg');
		const inner2 = await doc.createNode('m.frg');
		
		inner1.append('First');
		inner2.append('Second');
		outer.append(inner1, 'Middle', inner2);
		
		const html = await outer.getHTML();
		assertEquals(html, 'FirstMiddleSecond');
	});
});

Deno.test("MWICoreFrag (m.frg) - Content Aggregation in HTML", async (t) => {
	await t.step("Fragment with text nodes", async () => {
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', 'One');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'Two');
		const text3 = await doc.createNode('m.t');
		text3.setAttr('t', 'Three');
		fragNode.append(text1, text2, text3);
		const html = await fragNode.getHTML();
		assertEquals(html, 'OneTwoThree');
	});

	await t.step("Fragment with comment nodes", async () => {
		const fragNode = await doc.createNode('m.frg');
		const com1 = await doc.createNode('m.com');
		com1.setAttr('t', 'Comment 1');
		const com2 = await doc.createNode('m.com');
		com2.setAttr('t', 'Comment 2');
		fragNode.append(com1, com2);
		const html = await fragNode.getHTML();
		assertEquals(html, '<!--Comment 1--><!--Comment 2-->');
	});

	await t.step("Fragment with other fragments", async () => {
		const outer = await doc.createNode('m.frg');
		const inner1 = await doc.createNode('m.frg');
		const inner2 = await doc.createNode('m.frg');
		inner1.append('A');
		inner2.append('B');
		outer.append(inner1, inner2);
		const html = await outer.getHTML();
		assertEquals(html, 'AB');
	});

	await t.step("All children render in correct order", async () => {
		const fragNode = await doc.createNode('m.frg');
		const nodes = [];
		const expected = [];
		
		for (let i = 1; i <= 10; i++) {
			const textNode = await doc.createNode('m.t');
			textNode.setAttr('t', `Item${i}`);
			nodes.push(textNode);
			expected.push(`Item${i}`);
		}
		
		fragNode.append(...nodes);
		const html = await fragNode.getHTML();
		assertEquals(html, expected.join(''));
	});

	await t.step("No separators between children", async () => {
		const fragNode = await doc.createNode('m.frg');
		fragNode.append('A', 'B', 'C');
		const html = await fragNode.getHTML();
		assertEquals(html, 'ABC');
		// Verify no spaces, commas, or other separators
		assertEquals(html.length, 3);
	});
});

Deno.test("MWICoreFrag (m.frg) - Edge Cases", async (t) => {
	await t.step("Fragment with only whitespace text", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', '   ');
		fragNode.append(textNode);
		const html = await fragNode.getHTML();
		assertEquals(html, '   ');
	});

	await t.step("Fragment with empty text nodes", async () => {
		const fragNode = await doc.createNode('m.frg');
		const text1 = await doc.createNode('m.t');
		text1.setAttr('t', '');
		const text2 = await doc.createNode('m.t');
		text2.setAttr('t', 'Content');
		const text3 = await doc.createNode('m.t');
		text3.setAttr('t', '');
		fragNode.append(text1, text2, text3);
		const html = await fragNode.getHTML();
		assertEquals(html, 'Content');
	});

	await t.step("Fragment as sole child of another fragment", async () => {
		const parent = await doc.createNode('m.frg');
		const child = await doc.createNode('m.frg');
		child.append('Nested');
		parent.append(child);
		const html = await parent.getHTML();
		assertEquals(html, 'Nested');
	});

	await t.step("Fragment with no children in larger structure", async () => {
		const frag1 = await doc.createNode('m.frg');
		const emptyFrag = await doc.createNode('m.frg');
		const frag2 = await doc.createNode('m.frg');
		
		frag1.append('Before');
		frag2.append('After');
		
		const container = await doc.createNode('m.frg');
		container.append(frag1, emptyFrag, frag2);
		
		const html = await container.getHTML();
		assertEquals(html, 'BeforeAfter');
	});

	await t.step("Fragment with special HTML characters in children", async () => {
		const fragNode = await doc.createNode('m.frg');
		const textNode = await doc.createNode('m.t');
		textNode.setAttr('t', '<div>Test & "quotes"</div>');
		fragNode.append(textNode);
		const html = await fragNode.getHTML();
		// Text should be escaped, but no fragment wrapper
		assertEquals(html, '&lt;div&gt;Test &amp; "quotes"&lt;/div&gt;');
	});

	await t.step("Fragment appending string directly (auto-converts)", async () => {
		const fragNode = await doc.createNode('m.frg');
		fragNode.append('Direct string');
		const html = await fragNode.getHTML();
		assertEquals(html, 'Direct string');
	});

	await t.step("Multiple fragments at same level", async () => {
		const container = await doc.createNode('m.frg');
		const frag1 = await doc.createNode('m.frg');
		const frag2 = await doc.createNode('m.frg');
		const frag3 = await doc.createNode('m.frg');
		
		frag1.append('A');
		frag2.append('B');
		frag3.append('C');
		
		container.append(frag1, frag2, frag3);
		const html = await container.getHTML();
		assertEquals(html, 'ABC');
	});
});
