import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;

Deno.test("MWIHTML interface renders standard and void elements", async (t) => {
	const divNode = doc('createNode', ls([, 'h.div']));
	divNode('setAttr', [ 'class', 'test' ]);
	divNode('setSubSpec', 'Content');
	const divHTML = divNode('getHTML');
	assertEquals(divHTML, '<div class="test">Content</div>', 'standard element rendered');

	const brNode = doc('createNode', ls([, 'h.br']));
	brNode('setAttr', ls([, 'class', , 'break']));
	const brHTML = brNode('getHTML');
	assertEquals(brHTML, '<br class="break">', 'void element rendered');
});

Deno.test("MWIHTMLScript interface renders sanitized content", async (t) => {
	await t.step("h.script sanitizes content", () => {
		const scriptNode = doc.createNode('h.script');
		const scriptContent = 'if (1 < 2) { console.log("</script>"); }';
		const expectedHTML = '<script>if (1 < 2) { console.log("\\x3c/script>"); }</script>';
		scriptNode.setAttr('m.text', scriptContent);
		const scriptHTML = scriptNode.getHTML();
		assertEquals(scriptHTML, expectedHTML, 'script content rendered and sanitized correctly');
	});

	await t.step("h.style sanitizes content", () => {
		const styleNode = doc.createNode('h.style');
		const styleContent = '.x::after { content: "</style>"; }';
		const expectedHTML = '<style>.x::after { content: "\\3c /style>"; }</style>';
		styleNode.setAttr('m.text', styleContent);
		const styleHTML = styleNode.getHTML();
		assertEquals(styleHTML, expectedHTML, 'style content rendered and sanitized correctly');
	});
});


Deno.test("MWIHTMLTitle interface renders HTML-escaped content", async (t) => {
	const titleNode = doc.createNode('h.title');
	const titleContent = 'Title with <unsafe> content';
	const expectedHTML = '<title>Title with &lt;unsafe&gt; content</title>';
	titleNode.setAttr('m.text', titleContent);
	const titleHTML = titleNode.getHTML();
	assertEquals(titleHTML, expectedHTML, 'title content rendered and escaped correctly');
});


Deno.test("MWIHTMLDocType interface renders correctly", async (t) => {
	const doctypeNode = doc.createNode('h.doctype');
	const doctypeHTML = doctypeNode.getHTML();
	assertEquals(doctypeHTML, '<!DOCTYPE html>', 'doctype rendered correctly');
});

Deno.test("MWIHTML - Numeric Attribute Values", async (t) => {
	await t.step("(setAttr) - Numeric value via JS number", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ['data-count', 42]);
		divNode('setAttr', ['data-index', 0]);
		divNode('setAttr', ['tabindex', -1]);
		const html = divNode('getHTML');

		assert(html.includes('data-count="42"'), 'Should render positive number');
		assert(html.includes('data-index="0"'), 'Should render zero');
		assert(html.includes('tabindex="-1"'), 'Should render negative number');
	});

	await t.step(".setAttr() - Numeric value via JS number", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-value', 123);
		divNode.setAttr('data-zero', 0);
		divNode.setAttr('data-negative', -99);
		const html = divNode.getHTML();

		assert(html.includes('data-value="123"'), 'Should render positive number');
		assert(html.includes('data-zero="0"'), 'Should render zero');
		assert(html.includes('data-negative="-99"'), 'Should render negative number');
	});

	await t.step("Numeric value in SLID spec", () => {
		const spec = globalThis.ps('[(h.div data-id=456 data-count=0 data-i-squared=-1)]');
		const divNode = doc.from({ item: spec });
		const html = divNode.getHTML();

		assert(html.includes('data-id="456"'), 'Should render positive number from SLID');
		assert(html.includes('data-count="0"'), 'Should render zero from SLID');
		assert(html.includes('data-i-squared="-1"'), 'Should render negative number from SLID');
	});

	await t.step("Mixed string and numeric attributes", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-string', 'text');
		divNode.setAttr('data-number', 789);
		divNode.setAttr('class', 'test');
		const html = divNode.getHTML();

		assert(html.includes('data-string="text"'), 'Should render string value');
		assert(html.includes('data-number="789"'), 'Should render numeric value');
		assert(html.includes('class="test"'), 'Should render string class');
	});
});
