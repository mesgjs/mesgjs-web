import {
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');

Deno.test("MWICoreText (m.t) - SSR-HTML Tests", async (t) => {
	await t.step("(getHTML) - Simple text", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Hello World']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Hello World');
	});

	await t.step(".getHTML() - Simple text via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Simple text content');
		const html = textNode.getHTML();
		assertEquals(html, 'Simple text content');
	});

	await t.step("(getHTML) - Escape < character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text with < character']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text with &lt; character');
	});

	await t.step("(getHTML) - Escape & character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text with & character']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text with &amp; character');
	});

	await t.step("(getHTML) - Escape > character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text with > character']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text with &gt; character');
	});

	await t.step("(getHTML) - Escape all special HTML characters", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '<tag> & "quotes"']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, '&lt;tag&gt; &amp; "quotes"');
	});

	await t.step("(getHTML) - Escape \\x01 control character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text\x01here']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text&#1;here');
	});

	await t.step("(getHTML) - Escape \\x10 control character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text\x10here']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text&#16;here');
	});

	await t.step("(getHTML) - Escape \\u0100 character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text\u0100here']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text&#256;here');
	});

	await t.step("(getHTML) - Escape \\u1000 character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text\u1000here']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'Text&#4096;here');
	});

	await t.step("(getHTML) - Complex escaping scenario", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '<script>alert("XSS")</script> & \x01\u0100']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, '&lt;script&gt;alert("XSS")&lt;/script&gt; &amp; &#1;&#256;');
	});

	await t.step("(getHTML) - Escape supplementary-plane character (surrogate pair)", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '\u{1F600}']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, '&#128512;');
	});

	await t.step(".getHTML() - Escape supplementary-plane character (surrogate pair) via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '\u{1F600}');
		const html = textNode.getHTML();
		assertEquals(html, '&#128512;');
	});

	await t.step("(getHTML) - Escape two consecutive supplementary-plane characters", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '\u{1F600}\u{1F600}']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, '&#128512;&#128512;');
	});

	await t.step("(getHTML) - Escape supplementary-plane character adjacent to reserved character", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'a\u{1F600}<b']);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, 'a&#128512;&lt;b');
	});

	await t.step("(getHTML) - Escape lone/unpaired high surrogate", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', String.fromCharCode(0xD83D)]);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, '&#65533;');
	});

	await t.step("(getHTML) - Escape lone/unpaired low surrogate", () => {
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', String.fromCharCode(0xDE00)]);
		const html =  $c.sm(textNode, 'getHTML');
		assertEquals(html, '&#65533;');
	});
});
