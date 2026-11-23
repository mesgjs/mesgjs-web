import { describe, it } from '@compat/test';
import {
	assertEquals,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');

describe("MWICoreCom (m.com) - SSR-HTML Tests", () => {
	it("(getHTML) - Simple text comment", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'Simple comment']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--Simple comment-->');
	});

	it(".getHTML() - Simple text comment via JS", () => {
		const comNode = doc.createNode('m.com');
		comNode.setAttr('t', 'Another simple comment');
		const html = comNode.getHTML();
		assertEquals(html, '<!--Another simple comment-->');
	});

	it("(getHTML) - Crazy comment with special sequences", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		const commentContent = '-> & <!-- <!--!> crazy comment <!--> --!> --> <!-';
		const expectedHTML = '<!---&gt; &amp; &lt;!-- <!-&#45;!> crazy comment <!-&#45;> --!&gt; --&gt; &lt;!--->';

		$c.sm(comNode, 'setAttr', ['t', commentContent]);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, expectedHTML);
	});

	it("(getHTML) - Comment starting with >", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', '>starts with gt']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--&gt;starts with gt-->');
	});

	it("(getHTML) - Comment starting with ->", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', '->starts with arrow']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!---&gt;starts with arrow-->');
	});

	it("(getHTML) - Comment with <!-- sequence", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'text <!-- here']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--text &lt;!-- here-->');
	});

	it("(getHTML) - Comment with <!--> sequence", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'text <!--> here']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--text <!-&#45;> here-->');
	});

	it("(getHTML) - Comment with <!--!> sequence", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'text <!--!> here']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--text <!-&#45;!> here-->');
	});

	it("(getHTML) - Comment with --> sequence", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'text --> here']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--text --&gt; here-->');
	});

	it("(getHTML) - Comment with --!> sequence", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'text --!> here']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--text --!&gt; here-->');
	});

	it("(getHTML) - Comment ending with <!-", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'ends with <!-']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--ends with &lt;!--->');
	});

	it("(getHTML) - Comment with & character", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'text & more']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--text &amp; more-->');
	});

	it("(getHTML) - Empty comment", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', '']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!---->');
	});

	it("(getHTML) - Comment with supplementary-plane character (surrogate pair)", () => {
		const comNode = $c.sm(doc, 'createNode', ['m.com']);
		$c.sm(comNode, 'setAttr', ['t', 'emoji \u{1F600} here']);
		const html =  $c.sm(comNode, 'getHTML');
		assertEquals(html, '<!--emoji &#128512; here-->');
	});
});
