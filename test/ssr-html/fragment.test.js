import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

describe("MWICoreFrag (m.frg) - Transparent Rendering", () => {
	it("(getHTML) - Empty fragment renders as empty string", () => {
		const fragNode = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		const html =  $c.sm(fragNode, 'getHTML');
		assertEquals(html, '');
	});

	it(".getHTML() - Empty fragment renders as empty string via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const html = fragNode.getHTML();
		assertEquals(html, '');
	});

	it("(getHTML) - Fragment with single text child", () => {
		const fragNode = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		const textNode = $c.sm(doc, 'createNode', ls([, 'm.t']));
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Hello World']));
		$c.sm(fragNode, 'append', ls([, textNode]));
		const html =  $c.sm(fragNode, 'getHTML');
		assertEquals(html, 'Hello World');
	});

	it(".getHTML() - Fragment with single text child via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Hello World');
		fragNode.append(textNode);
		const html = fragNode.getHTML();
		assertEquals(html, 'JS Hello World');
	});

	it("(getHTML) - Fragment with multiple text children", () => {
		const fragNode = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		const text1 = $c.sm(doc, 'createNode', ls([, 'm.t']));
		$c.sm(text1, 'setAttr', ls([, 't', , 'First']));
		const text2 = $c.sm(doc, 'createNode', ls([, 'm.t']));
		$c.sm(text2, 'setAttr', ls([, 't', , 'Second']));
		const text3 = $c.sm(doc, 'createNode', ls([, 'm.t']));
		$c.sm(text3, 'setAttr', ls([, 't', , 'Third']));
		$c.sm(fragNode, 'append', ls([, text1, , text2, , text3]));
		const html =  $c.sm(fragNode, 'getHTML');
		assertEquals(html, 'FirstSecondThird');
	});

	it(".getHTML() - Fragment with multiple text children via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		const text3 = doc.createNode('m.t');
		text3.setAttr('t', 'JS Third');
		fragNode.append(text1, text2, text3);
		const html = fragNode.getHTML();
		assertEquals(html, 'JS FirstJS SecondJS Third');
	});

	it("(getHTML) - Fragment with mixed content (text and comment)", () => {
		const fragNode = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		const textNode = $c.sm(doc, 'createNode', ls([, 'm.t']));
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Text content']));
		const commentNode = $c.sm(doc, 'createNode', ls([, 'm.com']));
		$c.sm(commentNode, 'setAttr', ls([, 't', , 'Comment content']));
		$c.sm(fragNode, 'append', ls([, textNode, , commentNode]));
		const html =  $c.sm(fragNode, 'getHTML');
		assertEquals(html, 'Text content<!--Comment content-->');
	});

	it(".getHTML() - Fragment with mixed content via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Text');
		const commentNode = doc.createNode('m.com');
		commentNode.setAttr('t', 'JS Comment');
		fragNode.append(textNode, commentNode);
		const html = fragNode.getHTML();
		assertEquals(html, 'JS Text<!--JS Comment-->');
	});
});

describe("MWICoreFrag (m.frg) - No Wrapper Element", () => {
	it("Fragment does NOT add HTML wrapper", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.append('Content');
		const html = fragNode.getHTML();
		// Should be just the content, no tags
		assertEquals(html, 'Content');
		assert(!html.includes('<'), 'No opening tags');
		assert(!html.includes('>'), 'No closing tags');
	});

	it("Fragment vs. direct children rendering (should be identical)", () => {
		// Create fragment with children
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'Alpha');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'Beta');
		fragNode.append(text1, text2);
		const fragHTML = fragNode.getHTML();

		// Render children directly
		const directHTML1 = text1.getHTML();
		const directHTML2 = text2.getHTML();
		const directHTML = directHTML1 + directHTML2;

		// Should be identical
		assertEquals(fragHTML, directHTML);
	});

	it("Fragment attributes do NOT appear in HTML output", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'frag-id');
		fragNode.setAttr('class', 'frag-class');
		fragNode.setAttr('data-test', 'test-value');
		fragNode.append('Content');
		const html = fragNode.getHTML();

		// HTML should only contain the content
		assertEquals(html, 'Content');
		// Verify no attributes appear
		assert(!html.includes('id='), 'No id attribute');
		assert(!html.includes('class='), 'No class attribute');
		assert(!html.includes('data-test'), 'No data-test attribute');
		assert(!html.includes('frag-id'), 'No id value');
		assert(!html.includes('frag-class'), 'No class value');
	});

	it("Only child content renders", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'invisible-id');
		fragNode.setAttr('title', 'Invisible Title');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Visible Content');
		fragNode.append(textNode);
		const html = fragNode.getHTML();

		assertEquals(html, 'Visible Content');
		assert(!html.includes('invisible'), 'Fragment attributes not in output');
		assert(!html.includes('Invisible'), 'Fragment attributes not in output');
	});
});

describe("MWICoreFrag (m.frg) - Nested Fragments", () => {
	it("Fragment containing other fragments", () => {
		const outerFrag = doc.createNode('m.frg');
		const innerFrag = doc.createNode('m.frg');
		innerFrag.append('Inner content');
		outerFrag.append(innerFrag);
		const html = outerFrag.getHTML();
		assertEquals(html, 'Inner content');
	});

	it("Nested fragments render transparently", () => {
		const frag1 = doc.createNode('m.frg');
		const frag2 = doc.createNode('m.frg');
		const frag3 = doc.createNode('m.frg');

		frag3.append('Deepest');
		frag2.append(frag3);
		frag1.append(frag2);

		const html = frag1.getHTML();
		assertEquals(html, 'Deepest');
	});

	it("Deep nesting (3+ levels)", () => {
		const levels = [];
		for (let i = 0; i < 5; i++) {
			levels.push(doc.createNode('m.frg'));
		}

		// Add content to deepest level
		levels[4].append('Deep content');

		// Nest them
		for (let i = 3; i >= 0; i--) {
			levels[i].append(levels[i + 1]);
		}

		const html = levels[0].getHTML();
		assertEquals(html, 'Deep content');
	});

	it("Nested fragments with mixed content", () => {
		const outer = doc.createNode('m.frg');
		const inner1 = doc.createNode('m.frg');
		const inner2 = doc.createNode('m.frg');

		inner1.append('First');
		inner2.append('Second');
		outer.append(inner1, 'Middle', inner2);

		const html = outer.getHTML();
		assertEquals(html, 'FirstMiddleSecond');
	});
});

describe("MWICoreFrag (m.frg) - Content Aggregation in HTML", () => {
	it("Fragment with text nodes", () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'One');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'Two');
		const text3 = doc.createNode('m.t');
		text3.setAttr('t', 'Three');
		fragNode.append(text1, text2, text3);
		const html = fragNode.getHTML();
		assertEquals(html, 'OneTwoThree');
	});

	it("Fragment with comment nodes", () => {
		const fragNode = doc.createNode('m.frg');
		const com1 = doc.createNode('m.com');
		com1.setAttr('t', 'Comment 1');
		const com2 = doc.createNode('m.com');
		com2.setAttr('t', 'Comment 2');
		fragNode.append(com1, com2);
		const html = fragNode.getHTML();
		assertEquals(html, '<!--Comment 1--><!--Comment 2-->');
	});

	it("Fragment with other fragments", () => {
		const outer = doc.createNode('m.frg');
		const inner1 = doc.createNode('m.frg');
		const inner2 = doc.createNode('m.frg');
		inner1.append('A');
		inner2.append('B');
		outer.append(inner1, inner2);
		const html = outer.getHTML();
		assertEquals(html, 'AB');
	});

	it("All children render in correct order", () => {
		const fragNode = doc.createNode('m.frg');
		const nodes = [];
		const expected = [];

		for (let i = 1; i <= 10; i++) {
			const textNode = doc.createNode('m.t');
			textNode.setAttr('t', `Item${i}`);
			nodes.push(textNode);
			expected.push(`Item${i}`);
		}

		fragNode.append(...nodes);
		const html = fragNode.getHTML();
		assertEquals(html, expected.join(''));
	});

	it("No separators between children", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.append('A', 'B', 'C');
		const html = fragNode.getHTML();
		assertEquals(html, 'ABC');
		// Verify no spaces, commas, or other separators
		assertEquals(html.length, 3);
	});
});

describe("MWICoreFrag (m.frg) - Edge Cases", () => {
	it("Fragment with only whitespace text", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '   ');
		fragNode.append(textNode);
		const html = fragNode.getHTML();
		assertEquals(html, '   ');
	});

	it("Fragment with empty text nodes", () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', '');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'Content');
		const text3 = doc.createNode('m.t');
		text3.setAttr('t', '');
		fragNode.append(text1, text2, text3);
		const html = fragNode.getHTML();
		assertEquals(html, 'Content');
	});

	it("Fragment as sole child of another fragment", () => {
		const parent = doc.createNode('m.frg');
		const child = doc.createNode('m.frg');
		child.append('Nested');
		parent.append(child);
		const html = parent.getHTML();
		assertEquals(html, 'Nested');
	});

	it("Fragment with no children in larger structure", () => {
		const frag1 = doc.createNode('m.frg');
		const emptyFrag = doc.createNode('m.frg');
		const frag2 = doc.createNode('m.frg');

		frag1.append('Before');
		frag2.append('After');

		const container = doc.createNode('m.frg');
		container.append(frag1, emptyFrag, frag2);

		const html = container.getHTML();
		assertEquals(html, 'BeforeAfter');
	});

	it("Fragment with special HTML characters in children", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '<div>Test & "quotes"</div>');
		fragNode.append(textNode);
		const html = fragNode.getHTML();
		// Text should be escaped, but no fragment wrapper
		assertEquals(html, '&lt;div&gt;Test &amp; "quotes"&lt;/div&gt;');
	});

	it("Fragment appending string directly (auto-converts)", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.append('Direct string');
		const html = fragNode.getHTML();
		assertEquals(html, 'Direct string');
	});

	it("Multiple fragments at same level", () => {
		const container = doc.createNode('m.frg');
		const frag1 = doc.createNode('m.frg');
		const frag2 = doc.createNode('m.frg');
		const frag3 = doc.createNode('m.frg');

		frag1.append('A');
		frag2.append('B');
		frag3.append('C');

		container.append(frag1, frag2, frag3);
		const html = container.getHTML();
		assertEquals(html, 'ABC');
	});
});
