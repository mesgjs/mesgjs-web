// Tests for MWICoreHeadBody (m.head / m.body) SSR HTML output.
// Verifies that managed-region boundary markers are emitted correctly,
// that normal children appear in the managed region, that m.ssrStatic
// content appears after the end marker, and that m.csrStatic content
// is absent from SSR output.

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

const BEGIN_MARKER = '<script type="x" data-mwi="begin"></script>';
const END_MARKER = '<script type="x" data-mwi="end"></script>';

Deno.test("MWICoreHeadBody - SSR m.head basic structure", async (t) => {
	await t.step("(getHTML) - m.head emits boundary markers", () => {
		const headNode = doc.createNode('m.head');
		const html = headNode.getHTML();
		assert(html.startsWith('<head>'), 'opens with <head>');
		assert(html.includes(BEGIN_MARKER), 'contains begin marker');
		assert(html.includes(END_MARKER), 'contains end marker');
		assert(html.endsWith('</head>'), 'closes with </head>');
	});

	await t.step("(getHTML) - m.head markers in correct order", () => {
		const headNode = doc.createNode('m.head');
		const html = headNode.getHTML();
		const beginIdx = html.indexOf(BEGIN_MARKER);
		const endIdx = html.indexOf(END_MARKER);
		assert(beginIdx < endIdx, 'begin marker precedes end marker');
	});

	await t.step("(getHTML) - m.head normal children in managed region", () => {
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'My Page');
		headNode.append(titleNode);
		const html = headNode.getHTML();
		const beginIdx = html.indexOf(BEGIN_MARKER);
		const endIdx = html.indexOf(END_MARKER);
		const titleIdx = html.indexOf('<title>My Page</title>');
		assert(titleIdx > beginIdx, 'title is after begin marker');
		assert(titleIdx < endIdx, 'title is before end marker');
	});

	await t.step("(getHTML) - m.head with HTML attributes", () => {
		const headNode = doc.createNode('m.head');
		headNode.setAttr('lang', 'en');
		const html = headNode.getHTML();
		assert(html.startsWith('<head lang="en">'), 'lang attribute rendered on head tag');
	});

	await t.step("(getHTML) - m.head m.ssrStatic content after end marker", () => {
		const headNode = doc.createNode('m.head');
		const ssrStatic = ps('[([h.script src="/gtm.js"])]');
		headNode.setAttr('m.ssrStatic', ssrStatic);
		const html = headNode.getHTML();
		const endIdx = html.indexOf(END_MARKER);
		const scriptIdx = html.indexOf('<script src="/gtm.js"></script>');
		assert(scriptIdx > endIdx, 'm.ssrStatic content is after end marker');
	});

	await t.step("(getHTML) - m.head m.csrStatic content absent from SSR", () => {
		const headNode = doc.createNode('m.head');
		const csrStatic = ps('[([h.script src="/csr-only.js"])]');
		headNode.setAttr('m.csrStatic', csrStatic);
		const html = headNode.getHTML();
		assert(!html.includes('csr-only.js'), 'm.csrStatic content not in SSR output');
	});

	await t.step("(getHTML) - m.head m.ssrStatic and m.csrStatic not rendered as HTML attributes", () => {
		const headNode = doc.createNode('m.head');
		const ssrStatic = ps('[([h.script src="/gtm.js"])]');
		const csrStatic = ps('[([h.script src="/csr.js"])]');
		headNode.setAttr('m.ssrStatic', ssrStatic);
		headNode.setAttr('m.csrStatic', csrStatic);
		const html = headNode.getHTML();
		assert(!html.includes('m.ssrStatic'), 'm.ssrStatic not rendered as HTML attribute');
		assert(!html.includes('m.csrStatic'), 'm.csrStatic not rendered as HTML attribute');
	});
});

Deno.test("MWICoreHeadBody - SSR m.body basic structure", async (t) => {
	await t.step("(getHTML) - m.body emits boundary markers", () => {
		const bodyNode = doc.createNode('m.body');
		const html = bodyNode.getHTML();
		assert(html.startsWith('<body>'), 'opens with <body>');
		assert(html.includes(BEGIN_MARKER), 'contains begin marker');
		assert(html.includes(END_MARKER), 'contains end marker');
		assert(html.endsWith('</body>'), 'closes with </body>');
	});

	await t.step("(getHTML) - m.body normal children in managed region", () => {
		const bodyNode = doc.createNode('m.body');
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'content');
		bodyNode.append(divNode);
		const html = bodyNode.getHTML();
		const beginIdx = html.indexOf(BEGIN_MARKER);
		const endIdx = html.indexOf(END_MARKER);
		const divIdx = html.indexOf('<div class="content">');
		assert(divIdx > beginIdx, 'div is after begin marker');
		assert(divIdx < endIdx, 'div is before end marker');
	});

	await t.step("(getHTML) - m.body with HTML attributes", () => {
		const bodyNode = doc.createNode('m.body');
		bodyNode.setAttr('class', 'main');
		const html = bodyNode.getHTML();
		assert(html.startsWith('<body class="main">'), 'class attribute rendered on body tag');
	});

	await t.step("(getHTML) - m.body m.ssrStatic content after end marker", () => {
		const bodyNode = doc.createNode('m.body');
		const ssrStatic = ps('[([h.script src="/analytics.js"])]');
		bodyNode.setAttr('m.ssrStatic', ssrStatic);
		const html = bodyNode.getHTML();
		const endIdx = html.indexOf(END_MARKER);
		const scriptIdx = html.indexOf('<script src="/analytics.js"></script>');
		assert(scriptIdx > endIdx, 'm.ssrStatic content is after end marker');
	});

	await t.step("(getHTML) - m.body m.csrStatic content absent from SSR", () => {
		const bodyNode = doc.createNode('m.body');
		const csrStatic = ps('[([h.script src="/csr-body.js"])]');
		bodyNode.setAttr('m.csrStatic', csrStatic);
		const html = bodyNode.getHTML();
		assert(!html.includes('csr-body.js'), 'm.csrStatic content not in SSR output');
	});
});

Deno.test("MWICoreHeadBody - SSR full example", async (t) => {
	await t.step("(getHTML) - m.head with managed content and ssrStatic", () => {
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'My Page');
		const linkNode = doc.createNode('h.link');
		linkNode.setAttr('rel', 'stylesheet');
		linkNode.setAttr('href', '/app.css');
		headNode.append(titleNode, linkNode);
		const ssrStatic = ps('[([h.script src="/gtm.js"])]');
		headNode.setAttr('m.ssrStatic', ssrStatic);

		const html = headNode.getHTML();
		const expected = '<head>' +
			BEGIN_MARKER +
			'<title>My Page</title>' +
			'<link rel="stylesheet" href="/app.css">' +
			END_MARKER +
			'<script src="/gtm.js"></script>' +
			'</head>';
		assertEquals(html, expected, 'full m.head SSR output matches expected');
	});
});
