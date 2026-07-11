// Tests for SSR-to-CSR DOM hydration (DOM sync mode).
// Each test follows the full hydration sequence:
//   1. Create a doc spec
//   2. SSR to HTML
//   3. Load HTML into the simulated browser DOM
//   4. Note the generated DOM nodes
//   5. CSR in sync mode (passing MWIDOMSync)
//   6. Verify matching nodes are preserved (same identity)
//   7. Verify mismatches are rerendered (different identity)

import {
	assertEquals,
	assertExists,
	assertNotStrictEquals,
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
	const nodes = $c.sm(doc, 'from', ls(['list', spec]));
	$c.sm(doc, 'append', nodes);
	return $c.sm(doc, 'getHTML');
}

// Load an HTML string into document.body so we can inspect the resulting DOM.
// Returns the first child element of document.body (the SSR root).
function loadSSRIntoBody (html) {
	document.body.innerHTML = html;
	return document.body.firstChild;
}

// CSR in sync mode: build the same doc spec, then call getDOM with a
// MWIDOMSync instance starting at the given DOM cursor node.
// Returns { doc, domNodes } so callers can inspect both.
function csrSync (spec, cursor) {
	const doc = makeDoc();
	const nodes = $c.sm(doc, 'from', ls(['list', spec]));
	$c.sm(doc, 'append', nodes);
	const sync = getInstance('MWIDOMSync', [cursor]);
	const domNodes = $c.sm(doc, 'getDOM', { sync });
	return { doc, domNodes };
}

// ---------------------------------------------------------------------------
// Basic element preservation
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Basic element preservation", async (t) => {
	await t.step("Single div: SSR node is reused by CSR", () => {
		const spec = ps('[( [h.div Hello] )]');

		// SSR
		const html = ssrHTML(spec);
		assertEquals(html, '<div>Hello</div>');

		// Load into browser
		const ssrRoot = loadSSRIntoBody(html);
		assertExists(ssrRoot, 'SSR root element exists');
		assertEquals(ssrRoot.tagName, 'DIV');

		// CSR in sync mode
		const { domNodes } = csrSync(spec, ssrRoot);

		// The CSR should have reused the SSR node
		assertStrictEquals(domNodes.at(0), ssrRoot, 'CSR reuses the SSR div element');
		assertEquals(domNodes.at(0).textContent, 'Hello', 'content preserved');
	});

	await t.step("Single span: SSR node is reused by CSR", () => {
		const spec = ps('[( [h.span World] )]');

		const html = ssrHTML(spec);
		const ssrRoot = loadSSRIntoBody(html);
		assertEquals(ssrRoot.tagName, 'SPAN');

		const { domNodes } = csrSync(spec, ssrRoot);

		assertStrictEquals(domNodes.at(0), ssrRoot, 'CSR reuses the SSR span element');
	});

	await t.step("Multiple siblings: all SSR nodes reused", () => {
		const spec = ps('[( [h.div First] [h.p Second] [h.span Third] )]');

		const html = ssrHTML(spec);
		document.body.innerHTML = html;
		const ssrDiv  = document.body.children[0];
		const ssrP    = document.body.children[1];
		const ssrSpan = document.body.children[2];

		assertEquals(ssrDiv.tagName, 'DIV');
		assertEquals(ssrP.tagName, 'P');
		assertEquals(ssrSpan.tagName, 'SPAN');

		const { domNodes } = csrSync(spec, ssrDiv);

		assertStrictEquals(domNodes.at(0), ssrDiv,  'first sibling reused');
		assertStrictEquals(domNodes.at(1), ssrP,    'second sibling reused');
		assertStrictEquals(domNodes.at(2), ssrSpan, 'third sibling reused');
	});

	await t.step("Element with attributes: SSR node reused, attributes synced", () => {
		const spec = ps('[( [h.div id=myid class=box data-x=42 "Content"] )]');

		const html = ssrHTML(spec);
		const ssrRoot = loadSSRIntoBody(html);

		const { domNodes } = csrSync(spec, ssrRoot);

		assertStrictEquals(domNodes.at(0), ssrRoot, 'SSR node reused');
		assertEquals(domNodes.at(0).id, 'myid', 'id attribute preserved');
		assertEquals(domNodes.at(0).className, 'box', 'class attribute preserved');
		assertEquals(domNodes.at(0).getAttribute('data-x'), '42', 'data attribute preserved');
	});
});

// ---------------------------------------------------------------------------
// Text node preservation
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Text node preservation", async (t) => {
	await t.step("Text node inside div: SSR text node reused", () => {
		const spec = ps('[( [h.div "Hello World"] )]');

		const html = ssrHTML(spec);
		const ssrDiv = loadSSRIntoBody(html);
		const ssrText = ssrDiv.firstChild;
		assertExists(ssrText, 'SSR text node exists');
		assertEquals(ssrText.nodeType, 3, 'is a text node');
		assertEquals(ssrText.data, 'Hello World');

		const { domNodes } = csrSync(spec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div element reused');
		assertStrictEquals(csrDiv.firstChild, ssrText, 'text node reused');
	});

	await t.step("Explicit m.t node: SSR text node reused", () => {
		const spec = ps('[( [h.div [m.t t="Explicit text"]] )]');

		const html = ssrHTML(spec);
		const ssrDiv = loadSSRIntoBody(html);
		const ssrText = ssrDiv.firstChild;
		assertEquals(ssrText.nodeType, 3);
		assertEquals(ssrText.data, 'Explicit text');

		const { domNodes } = csrSync(spec, ssrDiv);

		assertStrictEquals(domNodes.at(0).firstChild, ssrText, 'explicit text node reused');
	});

	await t.step("Multiple text nodes: each SSR text node reused", () => {
		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		const t1 = doc.createNode('m.t');
		t1.setAttr('t', 'First');
		const t2 = doc.createNode('m.t');
		t2.setAttr('t', 'Second');
		divNode.append(t1, t2);

		const html = divNode.getHTML();
		assertEquals(html, '<div>FirstSecond</div>');

		const ssrDiv = loadSSRIntoBody(html);

		// CSR in sync mode — sync starts at the div itself
		const sync = getInstance('MWIDOMSync', [ssrDiv]);
		const csrDivNodes = divNode.getDOM({ sync });

		const csrDiv = csrDivNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div element reused');
		// The text content should be correct regardless of node merging
		assertEquals(csrDiv.textContent, 'FirstSecond', 'text content correct');
	});
});

// ---------------------------------------------------------------------------
// Comment node preservation
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Comment node preservation", async (t) => {
	await t.step("Comment node inside div: SSR comment node reused", () => {
		const spec = ps('[( [h.div [m.com t="My comment"] "After"] )]');

		const html = ssrHTML(spec);
		const ssrDiv = loadSSRIntoBody(html);
		const ssrComment = ssrDiv.firstChild;
		assertExists(ssrComment, 'SSR comment node exists');
		assertEquals(ssrComment.nodeType, 8, 'is a comment node');
		assertEquals(ssrComment.data, 'My comment');

		const { domNodes } = csrSync(spec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div element reused');
		assertStrictEquals(csrDiv.firstChild, ssrComment, 'comment node reused');
	});

	await t.step("Comment with different content: not reused (mismatch)", () => {
		// SSR a comment with one text, then CSR with a different text
		const ssrSpec = ps('[( [h.div [m.com t="SSR comment"]] )]');
		const csrSpec = ps('[( [h.div [m.com t="CSR comment"]] )]');

		const html = ssrHTML(ssrSpec);
		const ssrDiv = loadSSRIntoBody(html);
		const ssrComment = ssrDiv.firstChild;
		assertEquals(ssrComment.nodeType, 8);
		assertEquals(ssrComment.data, 'SSR comment');

		// CSR with different comment text - should NOT reuse the SSR comment
		const { domNodes } = csrSync(csrSpec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div element reused');
		// The comment node should be a new one (different content)
		const csrComment = csrDiv.firstChild;
		assertExists(csrComment, 'comment node exists');
		assertEquals(csrComment.nodeType, 8, 'is a comment node');
		assertEquals(csrComment.data, 'CSR comment', 'comment has CSR content');
		assertNotStrictEquals(csrComment, ssrComment, 'comment node was replaced');
	});
});

// ---------------------------------------------------------------------------
// Nested structure preservation
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Nested structure preservation", async (t) => {
	await t.step("Nested divs: all SSR nodes reused", () => {
		const spec = ps('[( [h.div [h.div [h.span Deep]]] )]');

		const html = ssrHTML(spec);
		const ssrOuter = loadSSRIntoBody(html);
		const ssrMiddle = ssrOuter.firstChild;
		const ssrSpan = ssrMiddle.firstChild;

		assertEquals(ssrOuter.tagName, 'DIV');
		assertEquals(ssrMiddle.tagName, 'DIV');
		assertEquals(ssrSpan.tagName, 'SPAN');

		const { domNodes } = csrSync(spec, ssrOuter);

		const csrOuter = domNodes.at(0);
		assertStrictEquals(csrOuter, ssrOuter, 'outer div reused');
		assertStrictEquals(csrOuter.firstChild, ssrMiddle, 'middle div reused');
		assertStrictEquals(csrOuter.firstChild.firstChild, ssrSpan, 'inner span reused');
	});

	await t.step("Mixed content (elements + text): SSR nodes reused", () => {
		const spec = ps('[( [h.div Before [h.span Middle] After] )]');

		const html = ssrHTML(spec);
		const ssrDiv = loadSSRIntoBody(html);
		const ssrText1 = ssrDiv.childNodes[0];
		const ssrSpan  = ssrDiv.childNodes[1];
		const ssrText2 = ssrDiv.childNodes[2];

		assertEquals(ssrText1.nodeType, 3);
		assertEquals(ssrText1.data, 'Before');
		assertEquals(ssrSpan.tagName, 'SPAN');
		assertEquals(ssrText2.nodeType, 3);
		assertEquals(ssrText2.data, 'After');

		const { domNodes } = csrSync(spec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div reused');
		assertStrictEquals(csrDiv.childNodes[1], ssrSpan, 'span reused');
	});

	await t.step("Complex nested structure: all SSR nodes reused", () => {
		const spec = ps(`[( [h.article
			[h.header [h.h1 Title]]
			[h.section [h.p Content]]
		] )]`);

		const html = ssrHTML(spec);
		const ssrArticle = loadSSRIntoBody(html);
		const ssrHeader  = ssrArticle.children[0];
		const ssrH1      = ssrHeader.children[0];
		const ssrSection = ssrArticle.children[1];
		const ssrP       = ssrSection.children[0];

		assertEquals(ssrArticle.tagName, 'ARTICLE');
		assertEquals(ssrHeader.tagName, 'HEADER');
		assertEquals(ssrH1.tagName, 'H1');
		assertEquals(ssrSection.tagName, 'SECTION');
		assertEquals(ssrP.tagName, 'P');

		const { domNodes } = csrSync(spec, ssrArticle);

		const csrArticle = domNodes.at(0);
		assertStrictEquals(csrArticle, ssrArticle, 'article reused');
		assertStrictEquals(csrArticle.children[0], ssrHeader, 'header reused');
		assertStrictEquals(csrArticle.children[0].children[0], ssrH1, 'h1 reused');
		assertStrictEquals(csrArticle.children[1], ssrSection, 'section reused');
		assertStrictEquals(csrArticle.children[1].children[0], ssrP, 'p reused');
	});

	await t.step("Fragment children: SSR nodes reused (fragment is transparent)", () => {
		const spec = ps('[( [h.div [m.frg [h.span A] [h.span B]]] )]');

		const html = ssrHTML(spec);
		const ssrDiv = loadSSRIntoBody(html);
		const ssrSpanA = ssrDiv.children[0];
		const ssrSpanB = ssrDiv.children[1];

		assertEquals(ssrSpanA.tagName, 'SPAN');
		assertEquals(ssrSpanB.tagName, 'SPAN');

		const { domNodes } = csrSync(spec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div reused');
		assertStrictEquals(csrDiv.children[0], ssrSpanA, 'first span reused');
		assertStrictEquals(csrDiv.children[1], ssrSpanB, 'second span reused');
	});
});

// ---------------------------------------------------------------------------
// Mismatch / rerender scenarios
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Mismatch rerender", async (t) => {
	await t.step("Tag mismatch: CSR generates new element", () => {
		// SSR renders a <div>, but CSR spec has a <span> — mismatch
		const ssrSpec = ps('[( [h.div Content] )]');
		const csrSpec = ps('[( [h.span Content] )]');

		const html = ssrHTML(ssrSpec);
		const ssrDiv = loadSSRIntoBody(html);
		assertEquals(ssrDiv.tagName, 'DIV');

		const { domNodes } = csrSync(csrSpec, ssrDiv);

		const csrElem = domNodes.at(0);
		assertExists(csrElem, 'CSR element exists');
		assertEquals(csrElem.tagName, 'SPAN', 'CSR rendered a span');
		assertNotStrictEquals(csrElem, ssrDiv, 'CSR created a new element (not the SSR div)');
	});

	await t.step("Extra SSR elements: CSR removes extras", () => {
		// SSR renders 3 divs, CSR spec only has 2
		const ssrSpec = ps('[( [h.div A] [h.div B] [h.div C] )]');
		const csrSpec = ps('[( [h.div A] [h.div B] )]');

		const html = ssrHTML(ssrSpec);
		document.body.innerHTML = html;
		const ssrDiv1 = document.body.children[0];
		const ssrDiv2 = document.body.children[1];

		assertEquals(document.body.children.length, 3);

		const { domNodes } = csrSync(csrSpec, ssrDiv1);

		assertEquals(domNodes.size, 2, 'CSR produces 2 nodes');
		assertStrictEquals(domNodes.at(0), ssrDiv1, 'first div reused');
		assertStrictEquals(domNodes.at(1), ssrDiv2, 'second div reused');
	});

	await t.step("Missing SSR element: CSR generates new element", () => {
		// SSR renders 1 div, CSR spec has 2 — second one must be generated
		const ssrSpec = ps('[( [h.div A] )]');
		const csrSpec = ps('[( [h.div A] [h.div B] )]');

		const html = ssrHTML(ssrSpec);
		document.body.innerHTML = html;
		const ssrDiv1 = document.body.children[0];

		const { domNodes } = csrSync(csrSpec, ssrDiv1);

		assertEquals(domNodes.size, 2, 'CSR produces 2 nodes');
		assertStrictEquals(domNodes.at(0), ssrDiv1, 'first div reused');
		assertNotStrictEquals(domNodes.at(1), ssrDiv1, 'second div is new');
		assertEquals(domNodes.at(1).tagName, 'DIV', 'second div is a DIV');
		assertEquals(domNodes.at(1).textContent, 'B', 'second div has correct content');
	});

	await t.step("Text content mismatch: CSR updates text in reused node", () => {
		// SSR renders "Old text", CSR spec has "New text"
		// The div element should be reused, but text content updated
		const ssrSpec = ps('[( [h.div "Old text"] )]');
		const csrSpec = ps('[( [h.div "New text"] )]');

		const html = ssrHTML(ssrSpec);
		const ssrDiv = loadSSRIntoBody(html);
		assertEquals(ssrDiv.textContent, 'Old text');

		const { domNodes } = csrSync(csrSpec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'div element reused');
		assertEquals(csrDiv.textContent, 'New text', 'text content updated by CSR');
	});

	await t.step("Nested tag mismatch: outer reused, inner regenerated", () => {
		// SSR: <div><span>text</span></div>
		// CSR: <div><p>text</p></div>
		// The outer div should be reused, but the inner element regenerated
		const ssrSpec = ps('[( [h.div [h.span text]] )]');
		const csrSpec = ps('[( [h.div [h.p text]] )]');

		const html = ssrHTML(ssrSpec);
		const ssrDiv  = loadSSRIntoBody(html);
		const ssrSpan = ssrDiv.firstChild;
		assertEquals(ssrSpan.tagName, 'SPAN');

		const { domNodes } = csrSync(csrSpec, ssrDiv);

		const csrDiv = domNodes.at(0);
		assertStrictEquals(csrDiv, ssrDiv, 'outer div reused');
		const csrInner = csrDiv.firstChild;
		assertExists(csrInner, 'inner element exists');
		assertEquals(csrInner.tagName, 'P', 'inner element is a P');
		assertNotStrictEquals(csrInner, ssrSpan, 'inner element was regenerated');
	});
});

// ---------------------------------------------------------------------------
// m.csr opt-in CSR nodes
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - m.csr opt-in CSR nodes", async (t) => {
	await t.step("m.csr node: SSR emits nothing, CSR generates element", () => {
		// A node with m.csr=true is suppressed in SSR output
		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.csr', true);
		divNode.append('CSR only');

		const html = divNode.getHTML();
		assertEquals(html, '', 'SSR emits nothing for m.csr node');

		// CSR should generate the element (no sync needed — nothing to sync with)
		const domNodes = divNode.getDOM();

		assertEquals(domNodes.size, 1, 'CSR generates one node');
		assertEquals(domNodes.at(0).tagName, 'DIV', 'CSR generates a div');
		assertEquals(domNodes.at(0).textContent, 'CSR only', 'CSR content correct');
	});

	await t.step("m.csr sibling: SSR-rendered siblings preserved, m.csr generated", () => {
		// SSR: <div>SSR</div>  (m.csr div is omitted)
		// CSR: <div>SSR</div><div>CSR only</div>
		const doc = makeDoc();
		const ssrDiv = doc.createNode('h.div');
		ssrDiv.append('SSR');
		const csrDiv = doc.createNode('h.div');
		csrDiv.setAttr('m.csr', true);
		csrDiv.append('CSR only');

		const rootFrag = doc.createNode('m.frg');
		rootFrag.append(ssrDiv, csrDiv);

		const html = rootFrag.getHTML();
		assertEquals(html, '<div>SSR</div>', 'SSR only emits the non-m.csr div');

		// Load into browser
		document.body.innerHTML = html;
		const ssrDivElem = document.body.firstChild;
		assertEquals(ssrDivElem.tagName, 'DIV');
		assertEquals(ssrDivElem.textContent, 'SSR');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrDivElem]);
		const domNodes = rootFrag.getDOM({ sync });

		assertEquals(domNodes.size, 2, 'CSR produces 2 nodes');
		assertStrictEquals(domNodes.at(0), ssrDivElem, 'SSR div reused');
		assertExists(domNodes.at(1), 'CSR div generated');
		assertEquals(domNodes.at(1).tagName, 'DIV', 'CSR div is a DIV');
		assertEquals(domNodes.at(1).textContent, 'CSR only', 'CSR div has correct content');
	});
});

// ---------------------------------------------------------------------------
// ID-based resync
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - ID-based resync", async (t) => {
	await t.step("Element with id: found via getElementById when cursor mismatches", () => {
		// SSR renders: <span>skip</span><div id="target">Content</div>
		// CSR cursor starts at <span>, but spec is for a <div id="target">
		// The sync should skip the span and find the div by id
		document.body.innerHTML = '<span>skip</span><div id="target">Content</div>';
		const ssrSpan = document.body.children[0];
		const ssrDiv  = document.body.children[1];

		assertEquals(ssrSpan.tagName, 'SPAN');
		assertEquals(ssrDiv.id, 'target');

		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'target');
		divNode.append('Content');

		// Start sync at the span (wrong element) — should fall back to getElementById
		const sync = getInstance('MWIDOMSync', [ssrSpan]);
		const domNodes = divNode.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrDiv, 'div found via getElementById');
	});

	await t.step("Element with id: direct match preferred over getElementById", () => {
		// SSR renders: <div id="target">Content</div>
		// CSR cursor starts at the div — should match directly, not via getElementById
		document.body.innerHTML = '<div id="target">Content</div>';
		const ssrDiv = document.body.children[0];

		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'target');
		divNode.append('Content');

		const sync = getInstance('MWIDOMSync', [ssrDiv]);
		const domNodes = divNode.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrDiv, 'div matched directly (not via getElementById)');
	});

	await t.step("Multiple elements with ids: each found correctly", () => {
		const spec = ps('[( [h.div id=first First] [h.div id=second Second] )]');

		const html = ssrHTML(spec);
		document.body.innerHTML = html;
		const ssrFirst  = document.getElementById('first');
		const ssrSecond = document.getElementById('second');

		assertExists(ssrFirst,  'first SSR element exists');
		assertExists(ssrSecond, 'second SSR element exists');

		const { domNodes } = csrSync(spec, ssrFirst);

		assertStrictEquals(domNodes.at(0), ssrFirst,  'first element reused');
		assertStrictEquals(domNodes.at(1), ssrSecond, 'second element reused');
	});
});

// ---------------------------------------------------------------------------
// Reactive updates after hydration
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - Reactive updates after hydration", async (t) => {
	await t.step("Attribute update after hydration: SSR node updated in place", async () => {
		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'initial');
		divNode.append('Content');

		const html = divNode.getHTML();
		const ssrDiv = loadSSRIntoBody(html);
		assertEquals(ssrDiv.className, 'initial');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrDiv]);
		const domNodes = divNode.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrDiv, 'SSR node reused');
		assertEquals(domNodes.at(0).className, 'initial', 'initial class preserved');

		// Reactive update
		divNode.setAttr('class', 'updated');
		await globalThis.reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrDiv, 'same DOM node after update');
		assertEquals(domNodes.at(0).className, 'updated', 'class updated reactively');
	});

	await t.step("Text update after hydration: SSR text node updated in place", async () => {
		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Initial text');
		divNode.append(textNode);

		const html = divNode.getHTML();
		const ssrDiv = loadSSRIntoBody(html);
		const ssrText = ssrDiv.firstChild;
		assertEquals(ssrText.nodeType, 3);
		assertEquals(ssrText.data, 'Initial text');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrDiv]);
		const domNodes = divNode.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrDiv, 'div reused');
		assertStrictEquals(domNodes.at(0).firstChild, ssrText, 'text node reused');

		// Reactive update
		textNode.setAttr('t', 'Updated text');
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).firstChild.data, 'Updated text', 'text updated reactively');
		assertStrictEquals(domNodes.at(0).firstChild, ssrText, 'same text node after update');
	});

	await t.step("Child append after hydration: new child added to reused parent", async () => {
		const doc = makeDoc();
		const divNode = doc.createNode('h.div');
		const span1 = doc.createNode('h.span');
		span1.append('First');
		divNode.append(span1);

		const html = divNode.getHTML();
		const ssrDiv = loadSSRIntoBody(html);
		const ssrSpan1 = ssrDiv.firstChild;
		assertEquals(ssrSpan1.tagName, 'SPAN');

		// CSR in sync mode
		const sync = getInstance('MWIDOMSync', [ssrDiv]);
		const domNodes = divNode.getDOM({ sync });

		assertStrictEquals(domNodes.at(0), ssrDiv, 'div reused');
		assertStrictEquals(domNodes.at(0).firstChild, ssrSpan1, 'first span reused');
		assertEquals(domNodes.at(0).children.length, 1, 'one child initially');

		// Append a new child
		const span2 = doc.createNode('h.span');
		span2.append('Second');
		divNode.append(span2);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).children.length, 2, 'two children after append');
		assertStrictEquals(domNodes.at(0).children[0], ssrSpan1, 'first span still reused');
		assertEquals(domNodes.at(0).children[1].textContent, 'Second', 'new span appended');
	});
});
