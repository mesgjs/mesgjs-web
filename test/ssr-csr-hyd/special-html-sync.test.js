// Tests for SSR-to-CSR DOM hydration of special HTML elements.
// Tests <script>, <style>, and <title> elements which use m.text
// attribute for content instead of children.

import {
	assertEquals,
	assertExists,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const ps = globalThis.ps;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Create a fresh MWIDocument for each test to avoid cross-test contamination.
function makeDoc () {
	return getInstance('MWIDocument');
}

// SSR: build a doc from a SLID spec and return the HTML string.
function ssrHTML (spec) {
	const doc = makeDoc();
	const nodes = doc('from', ls(['list', spec]));
	doc('append', nodes);
	return $c.sm(doc, 'getHTML');
}

// Load an HTML string into document.body so we can inspect the resulting DOM.
// Returns the first child element of document.body (the SSR root).
function loadSSRIntoBody (html) {
	document.body.innerHTML = html;
	return document.body.firstChild;
}

// For <head> elements which can't be placed in body, parse and return directly
function loadSSRIntoHead (html) {
	// Create a detached head element and populate it
	const head = document.createElement('head');
	head.innerHTML = html.replace(/^<head[^>]*>|<\/head>$/gi, '');
	return head;
}

// CSR in sync mode: build the same doc spec, then call getDOM with a
// MWIDOMSync instance starting at the given DOM cursor node.
// Returns { doc, domNodes } so callers can inspect both.
function csrSync (spec, cursor) {
	const doc = makeDoc();
	const nodes = doc('from', ls(['list', spec]));
	doc('append', nodes);
	const sync = getInstance('MWIDOMSync', [cursor]);
	const domNodes = $c.sm(doc, 'getDOM', { sync });
	return { doc, domNodes };
}

// ---------------------------------------------------------------------------
// Script element hydration
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Script elements", async (t) => {
	await t.step("Basic script: SSR node reused by CSR", () => {
		const spec = ps('[( [h.script m.text="console.log(\\"Hello\\");"] )]');

		// SSR
		const html = ssrHTML(spec);
		assertEquals(html, '<script>console.log("Hello");</script>');

		// Load into browser
		const ssrScript = loadSSRIntoBody(html);
		assertExists(ssrScript, 'SSR script element exists');
		assertEquals(ssrScript.tagName, 'SCRIPT');
		assertEquals(ssrScript.textContent, 'console.log("Hello");');

		// CSR in sync mode
		const { domNodes } = csrSync(spec, ssrScript);

		// The CSR should have reused the SSR node
		assertStrictEquals(domNodes.at(0), ssrScript, 'CSR reuses the SSR script element');
		assertEquals(domNodes.at(0).textContent, 'console.log("Hello");', 'content preserved');
	});

	await t.step("Script with attributes: SSR node reused, attributes synced", () => {
		const spec = ps('[( [h.script type=module defer=true m.text="import { init } from \\"./app.js\\";"] )]');

		const html = ssrHTML(spec);
		const ssrScript = loadSSRIntoBody(html);

		assertEquals(ssrScript.tagName, 'SCRIPT');
		assertEquals(ssrScript.getAttribute('type'), 'module');
		assertEquals(ssrScript.getAttribute('defer'), 'true');

		const { domNodes } = csrSync(spec, ssrScript);

		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR node reused');
		assertEquals(domNodes.at(0).getAttribute('type'), 'module', 'type attribute preserved');
		assertEquals(domNodes.at(0).getAttribute('defer'), 'true', 'defer attribute preserved');
		assertEquals(domNodes.at(0).textContent, 'import { init } from "./app.js";', 'content preserved');
	});

	await t.step("External script (no m.text): SSR node reused", () => {
		const spec = ps('[( [h.script src=/app.js defer=true] )]');

		const html = ssrHTML(spec);
		const ssrScript = loadSSRIntoBody(html);

		assertEquals(ssrScript.tagName, 'SCRIPT');
		assertEquals(ssrScript.getAttribute('src'), '/app.js');
		assertEquals(ssrScript.textContent, '', 'no content');

		const { domNodes } = csrSync(spec, ssrScript);

		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR node reused');
		assertEquals(domNodes.at(0).getAttribute('src'), '/app.js', 'src attribute preserved');
		assertEquals(domNodes.at(0).textContent, '', 'content still empty');
	});

	await t.step("Script with escaped closing tag: SSR escaping preserved", () => {
		const doc = makeDoc();
		const script = doc.createNode('h.script');
		script.setAttr('m.text', 'const html = "<script>alert(1)</script>";');

		// SSR should escape the embedded </script>
		const html = script.getHTML();
		// The < in </script> should be escaped as \x3c
		assertEquals(html.includes('\\x3c/script>'), true, 'closing tag escaped in SSR');
		assertEquals(html.includes('</script></script>'), false, 'not prematurely closed');

		// Load into browser
		const ssrScript = loadSSRIntoBody(html);
		assertEquals(ssrScript.tagName, 'SCRIPT');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrScript]);
		const domNodes = script.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR node reused');
		// The browser will have interpreted the escaped content
		assertEquals(domNodes.at(0).textContent, 'const html = "<script>alert(1)</script>";', 'content correct');
	});

	await t.step("Empty script: SSR node reused", () => {
		const spec = ps('[( [h.script] )]');

		const html = ssrHTML(spec);
		assertEquals(html, '<script></script>');

		const ssrScript = loadSSRIntoBody(html);
		assertEquals(ssrScript.tagName, 'SCRIPT');
		assertEquals(ssrScript.textContent, '');

		const { domNodes } = csrSync(spec, ssrScript);

		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, '', 'content is empty');
	});

	await t.step("Script with reactive content update after hydration", async () => {
		const doc = makeDoc();
		const script = doc.createNode('h.script');
		script.setAttr('m.text', 'console.log("v1");');

		const html = script.getHTML();
		const ssrScript = loadSSRIntoBody(html);
		assertEquals(ssrScript.textContent, 'console.log("v1");');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrScript]);
		const domNodes = script.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, 'console.log("v1");', 'initial content');

		// Reactive update
		script.setAttr('m.text', 'console.log("v2");');
		await globalThis.reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrScript, 'same DOM node after update');
		assertEquals(domNodes.at(0).textContent, 'console.log("v2");', 'content updated reactively');
	});
});

// ---------------------------------------------------------------------------
// Style element hydration
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Style elements", async (t) => {
	await t.step("Basic style: SSR node reused by CSR", () => {
		const spec = ps('[( [h.style m.text=".box { color: red; }"] )]');

		// SSR
		const html = ssrHTML(spec);
		assertEquals(html, '<style>.box { color: red; }</style>');

		// Load into browser
		const ssrStyle = loadSSRIntoBody(html);
		assertExists(ssrStyle, 'SSR style element exists');
		assertEquals(ssrStyle.tagName, 'STYLE');
		assertEquals(ssrStyle.textContent, '.box { color: red; }');

		// CSR in sync mode
		const { domNodes } = csrSync(spec, ssrStyle);

		// The CSR should have reused the SSR node
		assertStrictEquals(domNodes.at(0), ssrStyle, 'CSR reuses the SSR style element');
		assertEquals(domNodes.at(0).textContent, '.box { color: red; }', 'content preserved');
	});

	await t.step("Style with attributes: SSR node reused, attributes synced", () => {
		const spec = ps('[( [h.style media=print m.text=".page { margin: 1in; }"] )]');

		const html = ssrHTML(spec);
		const ssrStyle = loadSSRIntoBody(html);

		assertEquals(ssrStyle.tagName, 'STYLE');
		assertEquals(ssrStyle.getAttribute('media'), 'print');

		const { domNodes } = csrSync(spec, ssrStyle);

		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR node reused');
		assertEquals(domNodes.at(0).getAttribute('media'), 'print', 'media attribute preserved');
		assertEquals(domNodes.at(0).textContent, '.page { margin: 1in; }', 'content preserved');
	});

	await t.step("Style with escaped closing tag: SSR escaping preserved", () => {
		const doc = makeDoc();
		const style = doc.createNode('h.style');
		style.setAttr('m.text', '.x::after { content: "</style>"; }');

		// SSR should escape the embedded </style>
		const html = style.getHTML();
		// The < in </style> should be escaped as \3c with space
		assertEquals(html.includes('\\3c /style>'), true, 'closing tag escaped in SSR');
		assertEquals(html.includes('</style></style>'), false, 'not prematurely closed');

		// Load into browser
		const ssrStyle = loadSSRIntoBody(html);
		assertEquals(ssrStyle.tagName, 'STYLE');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrStyle]);
		const domNodes = style.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR node reused');
		// The browser will have interpreted the escaped content
		assertEquals(domNodes.at(0).textContent, '.x::after { content: "</style>"; }', 'content correct');
	});

	await t.step("Empty style: SSR node reused", () => {
		const spec = ps('[( [h.style] )]');

		const html = ssrHTML(spec);
		assertEquals(html, '<style></style>');

		const ssrStyle = loadSSRIntoBody(html);
		assertEquals(ssrStyle.tagName, 'STYLE');
		assertEquals(ssrStyle.textContent, '');

		const { domNodes } = csrSync(spec, ssrStyle);

		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, '', 'content is empty');
	});

	await t.step("Style with reactive content update after hydration", async () => {
		const doc = makeDoc();
		const style = doc.createNode('h.style');
		style.setAttr('m.text', '.v1 { color: red; }');

		const html = style.getHTML();
		const ssrStyle = loadSSRIntoBody(html);
		assertEquals(ssrStyle.textContent, '.v1 { color: red; }');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrStyle]);
		const domNodes = style.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, '.v1 { color: red; }', 'initial content');

		// Reactive update
		style.setAttr('m.text', '.v2 { color: blue; }');
		await globalThis.reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrStyle, 'same DOM node after update');
		assertEquals(domNodes.at(0).textContent, '.v2 { color: blue; }', 'content updated reactively');
	});
});

// ---------------------------------------------------------------------------
// Title element hydration
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Title elements", async (t) => {
	await t.step("Basic title: SSR node reused by CSR", () => {
		const spec = ps('[( [h.title m.text="My Page Title"] )]');

		// SSR
		const html = ssrHTML(spec);
		assertEquals(html, '<title>My Page Title</title>');

		// Load into browser
		const ssrTitle = loadSSRIntoBody(html);
		assertExists(ssrTitle, 'SSR title element exists');
		assertEquals(ssrTitle.tagName, 'TITLE');
		assertEquals(ssrTitle.textContent, 'My Page Title');

		// CSR in sync mode
		const { domNodes } = csrSync(spec, ssrTitle);

		// The CSR should have reused the SSR node
		assertStrictEquals(domNodes.at(0), ssrTitle, 'CSR reuses the SSR title element');
		assertEquals(domNodes.at(0).textContent, 'My Page Title', 'content preserved');
	});

	await t.step("Title with HTML entities: SSR escaping preserved", () => {
		const spec = ps('[( [h.title m.text="Products < $100 & \\"Special\\" Offers"] )]');

		const html = ssrHTML(spec);
		// HTML should have entities escaped
		assertEquals(html.includes('&lt;'), true, 'less-than escaped');
		assertEquals(html.includes('&amp;'), true, 'ampersand escaped');

		const ssrTitle = loadSSRIntoBody(html);
		assertEquals(ssrTitle.tagName, 'TITLE');
		// Browser interprets the entities back to original text
		assertEquals(ssrTitle.textContent, 'Products < $100 & "Special" Offers');

		const { domNodes } = csrSync(spec, ssrTitle);

		assertStrictEquals(domNodes.at(0), ssrTitle, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, 'Products < $100 & "Special" Offers', 'content correct');
	});

	await t.step("Empty title: SSR node reused", () => {
		const spec = ps('[( [h.title] )]');

		const html = ssrHTML(spec);
		assertEquals(html, '<title></title>');

		const ssrTitle = loadSSRIntoBody(html);
		assertEquals(ssrTitle.tagName, 'TITLE');
		assertEquals(ssrTitle.textContent, '');

		const { domNodes } = csrSync(spec, ssrTitle);

		assertStrictEquals(domNodes.at(0), ssrTitle, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, '', 'content is empty');
	});

	await t.step("Title with reactive content update after hydration", async () => {
		const doc = makeDoc();
		const title = doc.createNode('h.title');
		title.setAttr('m.text', 'Initial Title');

		const html = title.getHTML();
		const ssrTitle = loadSSRIntoBody(html);
		assertEquals(ssrTitle.textContent, 'Initial Title');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrTitle]);
		const domNodes = title.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrTitle, 'SSR node reused');
		assertEquals(domNodes.at(0).textContent, 'Initial Title', 'initial content');

		// Reactive update
		title.setAttr('m.text', 'Updated Title');
		await globalThis.reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrTitle, 'same DOM node after update');
		assertEquals(domNodes.at(0).textContent, 'Updated Title', 'content updated reactively');
	});

	await t.step("Title in head: SSR node reused in context", () => {
		const spec = ps(`[( [h.head
			[h.title m.text="Page Title"]
			[h.meta charset=utf-8]
		] )]`);

		const html = ssrHTML(spec);
		const ssrHead = loadSSRIntoHead(html);
		assertEquals(ssrHead.tagName, 'HEAD');

		const ssrTitle = ssrHead.querySelector('title');
		const ssrMeta = ssrHead.querySelector('meta');
		assertExists(ssrTitle, 'title exists in head');
		assertExists(ssrMeta, 'meta exists in head');
		assertEquals(ssrTitle.textContent, 'Page Title');

		const { domNodes } = csrSync(spec, ssrHead);

		const csrHead = domNodes.at(0);
		assertStrictEquals(csrHead, ssrHead, 'head element reused');

		const csrTitle = csrHead.querySelector('title');
		const csrMeta = csrHead.querySelector('meta');
		assertStrictEquals(csrTitle, ssrTitle, 'title element reused');
		assertStrictEquals(csrMeta, ssrMeta, 'meta element reused');
		assertEquals(csrTitle.textContent, 'Page Title', 'title content preserved');
	});
});

// ---------------------------------------------------------------------------
// Mixed special elements
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Mixed special elements", async (t) => {
	await t.step("Script and style siblings: both SSR nodes reused", () => {
		const spec = ps(`[( 
			[h.script m.text="console.log(\\"init\\");"]
			[h.style m.text=".app { margin: 0; }"]
		)]`);

		const html = ssrHTML(spec);
		document.body.innerHTML = html;
		const ssrScript = document.body.children[0];
		const ssrStyle = document.body.children[1];

		assertEquals(ssrScript.tagName, 'SCRIPT');
		assertEquals(ssrStyle.tagName, 'STYLE');

		const { domNodes } = csrSync(spec, ssrScript);

		assertStrictEquals(domNodes.at(0), ssrScript, 'script reused');
		assertStrictEquals(domNodes.at(1), ssrStyle, 'style reused');
		assertEquals(domNodes.at(0).textContent, 'console.log("init");', 'script content preserved');
		assertEquals(domNodes.at(1).textContent, '.app { margin: 0; }', 'style content preserved');
	});

	await t.step("Complete head with title, style, and script: all SSR nodes reused", () => {
		const spec = ps(`[( [h.head
			[h.title m.text="Full Page"]
			[h.meta charset=utf-8]
			[h.style m.text=".container { width: 100%; }"]
			[h.script src=/app.js]
		] )]`);

		const html = ssrHTML(spec);
		const ssrHead = loadSSRIntoHead(html);
		const ssrTitle = ssrHead.querySelector('title');
		const ssrMeta = ssrHead.querySelector('meta');
		const ssrStyle = ssrHead.querySelector('style');
		const ssrScript = ssrHead.querySelector('script');

		assertExists(ssrTitle);
		assertExists(ssrMeta);
		assertExists(ssrStyle);
		assertExists(ssrScript);

		const { domNodes } = csrSync(spec, ssrHead);

		const csrHead = domNodes.at(0);
		assertStrictEquals(csrHead, ssrHead, 'head reused');

		const csrTitle = csrHead.querySelector('title');
		const csrMeta = csrHead.querySelector('meta');
		const csrStyle = csrHead.querySelector('style');
		const csrScript = csrHead.querySelector('script');

		assertStrictEquals(csrTitle, ssrTitle, 'title reused');
		assertStrictEquals(csrMeta, ssrMeta, 'meta reused');
		assertStrictEquals(csrStyle, ssrStyle, 'style reused');
		assertStrictEquals(csrScript, ssrScript, 'script reused');

		assertEquals(csrTitle.textContent, 'Full Page', 'title content preserved');
		assertEquals(csrStyle.textContent, '.container { width: 100%; }', 'style content preserved');
		assertEquals(csrScript.getAttribute('src'), '/app.js', 'script src preserved');
	});
});
