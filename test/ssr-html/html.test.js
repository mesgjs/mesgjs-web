import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;

describe("MWIHTML interface renders standard and void elements", () => {
	it("renders standard and void elements", () => {
	const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
	$c.sm(divNode, 'setAttr', [ 'class', 'test' ]);
	$c.sm(divNode, 'setSubSpec', 'Content');
	const divHTML =  $c.sm(divNode, 'getHTML');
	assertEquals(divHTML, '<div class="test">Content</div>', 'standard element rendered');

	const brNode = $c.sm(doc, 'createNode', ls([, 'h.br']));
	$c.sm(brNode, 'setAttr', ls([, 'class', , 'break']));
	const brHTML =  $c.sm(brNode, 'getHTML');
	assertEquals(brHTML, '<br class="break">', 'void element rendered');
	});
});

describe("MWIHTMLScript interface renders sanitized content", () => {
	it("h.script sanitizes content", () => {
		const scriptNode = doc.createNode('h.script');
		const scriptContent = 'if (1 < 2) { console.log("</script>"); }';
		const expectedHTML = '<script>if (1 < 2) { console.log("\\x3c/script>"); }</script>';
		scriptNode.setAttr('m.text', scriptContent);
		const scriptHTML = scriptNode.getHTML();
		assertEquals(scriptHTML, expectedHTML, 'script content rendered and sanitized correctly');
	});

	it("h.style sanitizes content", () => {
		const styleNode = doc.createNode('h.style');
		const styleContent = '.x::after { content: "</style>"; }';
		const expectedHTML = '<style>.x::after { content: "\\3c /style>"; }</style>';
		styleNode.setAttr('m.text', styleContent);
		const styleHTML = styleNode.getHTML();
		assertEquals(styleHTML, expectedHTML, 'style content rendered and sanitized correctly');
	});
});


describe("MWIHTMLTitle interface renders HTML-escaped content", () => {
	it("renders HTML-escaped content", () => {
	const titleNode = doc.createNode('h.title');
	const titleContent = 'Title with <unsafe> content';
	const expectedHTML = '<title>Title with &lt;unsafe&gt; content</title>';
	titleNode.setAttr('m.text', titleContent);
	const titleHTML = titleNode.getHTML();
	assertEquals(titleHTML, expectedHTML, 'title content rendered and escaped correctly');
	});
});

describe("MWIHTMLTitle interface renders supplementary-plane content as a single numeric reference", () => {
	it("renders supplementary-plane content", () => {
	const titleNode = doc.createNode('h.title');
	const titleContent = 'Title with \u{1F600} emoji';
	const expectedHTML = '<title>Title with &#128512; emoji</title>';
	titleNode.setAttr('m.text', titleContent);
	const titleHTML = titleNode.getHTML();
	assertEquals(titleHTML, expectedHTML, 'title content renders full code point, not split surrogates');
	});
});


describe("MWIHTMLDocType interface renders correctly", () => {
	it("renders doctype correctly", () => {
	const doctypeNode = doc.createNode('h.doctype');
	const doctypeHTML = doctypeNode.getHTML();
	assertEquals(doctypeHTML, '<!DOCTYPE html>', 'doctype rendered correctly');
	});
});

describe("MWIHTML - Numeric Attribute Values", () => {
	it("(setAttr) - Numeric value via JS number", () => {
		const divNode = $c.sm(doc, 'createNode', ls([, 'h.div']));
		$c.sm(divNode, 'setAttr', ['data-count', 42]);
		$c.sm(divNode, 'setAttr', ['data-index', 0]);
		$c.sm(divNode, 'setAttr', ['tabindex', -1]);
		const html =  $c.sm(divNode, 'getHTML');

		assert(html.includes('data-count="42"'), 'Should render positive number');
		assert(html.includes('data-index="0"'), 'Should render zero');
		assert(html.includes('tabindex="-1"'), 'Should render negative number');
	});

	it(".setAttr() - Numeric value via JS number", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-value', 123);
		divNode.setAttr('data-zero', 0);
		divNode.setAttr('data-negative', -99);
		const html = divNode.getHTML();

		assert(html.includes('data-value="123"'), 'Should render positive number');
		assert(html.includes('data-zero="0"'), 'Should render zero');
		assert(html.includes('data-negative="-99"'), 'Should render negative number');
	});

	it("Numeric value in SLID spec", () => {
		const spec = globalThis.ps('[(h.div data-id=456 data-count=0 data-i-squared=-1)]');
		const divNode = doc.from({ item: spec });
		const html = divNode.getHTML();

		assert(html.includes('data-id="456"'), 'Should render positive number from SLID');
		assert(html.includes('data-count="0"'), 'Should render zero from SLID');
		assert(html.includes('data-i-squared="-1"'), 'Should render negative number from SLID');
	});

	it("Mixed string and numeric attributes", () => {
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
