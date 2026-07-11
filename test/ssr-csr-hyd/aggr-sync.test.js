// Tests for SSR-to-CSR DOM hydration of m.aggr (aggregate content).
//
// m.aggr has two modes:
//   - `to` mode: collects content into a named buffer (renders nothing in SSR/CSR)
//   - `from` mode: renders the collected content (SSR: placeholder; CSR: reactive DOM)
//
// During SSR-CSR hydration, the `from` node renders its aggregated content in
// sync mode, attempting to reuse the SSR-generated DOM nodes. The `to` nodes
// themselves do not render DOM and do not participate in sync directly.
//
// Key behaviors tested:
//   1. `from` mode: SSR-generated aggregated DOM nodes are reused during CSR sync
//   2. `to` mode: does not render DOM; does not affect sync cursor
//   3. ID-based sync: first element of aggregated content gets auto-assigned ID
//   4. Named buffers: named buffer content is synced correctly
//   5. `m.csr` suppression: SSR emits nothing; CSR generates content fresh
//   6. CSR-only fallback: when buffer is empty, fallback content is generated
//   7. Reactive updates: content changes update the DOM reactively after hydration
//   8. End-to-end document sync: full document with from/to nodes

import {
	assert,
	assertEquals,
	assertExists,
	assertNotStrictEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

await setupRuntime({
	modules: {
		'mwi/mwi-aggr-comp': {
			url: './src/mwi-aggr-comp.msjs',
			featpro: 'mwi.comp.MWIAggr',
		},
	},
});

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIAggr');

// Set up browser-like environment for DOM testing
await simulateBrowser();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Create a fresh MWIDocument for each test to avoid cross-test contamination.
function makeDoc () {
	return getInstance('MWIDocument');
}

// SSR: build a document, append nodes, and return the final HTML string.
// Uses the document-level getHTML() so placeholders are resolved.
function ssrDocHTML (doc) {
	return $c.sm(doc, 'getHTML');
}

// Load an HTML string into document.body so we can inspect the resulting DOM.
function loadSSRIntoBody (html) {
	document.body.innerHTML = html;
	return document.body.firstChild;
}

// CSR in sync mode: call getDOM with a MWIDOMSync instance starting at the
// given DOM cursor node. Returns the domNodes NANOS.
function csrSync (node, cursor) {
	const sync = getInstance('MWIDOMSync', [cursor]);
	return node.document.getDOM({ sync });
}

// ---------------------------------------------------------------------------
// from mode: SSR-generated aggregated DOM nodes are reused during CSR sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: from mode basic sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode: SSR-generated element reused during CSR sync', async () => {
		// SSR: build a doc with a `from` node and a `to` node
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.span Content])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		// The from node renders the aggregated content (a span)
		assert(html.includes('<span'), 'SSR includes aggregated span');
		assert(html.includes('>Content</span>'), 'SSR includes aggregated content');

		// Load into browser
		document.body.innerHTML = html;
		const ssrSpan = document.body.querySelector('span');
		assertExists(ssrSpan, 'SSR span element exists');
		assertEquals(ssrSpan.textContent, 'Content', 'SSR span has correct content');

		// CSR: build from the SSR spec and sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		// Now sync the `from` node starting at the SSR span
		const domNodes = csrSync(csrRoot, ssrSpan);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrSpan, 'SSR span element reused during sync');
		assertEquals(domNodes.at(0).textContent, 'Content', 'content preserved');
		assertStrictEquals(domNodes.at(0).firstChild, ssrSpan.firstChild, 'Text content reused during sync');

		// Single, guarded text node should be adopted too
	});

	await simulateBrowser();

	await t.step('.getDOM() - from mode: SSR-generated element reused during CSR sync via JS', async () => {
		// SSR
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.div JSContent])]`) });
		ssrDoc.append(fromNode, toNode);

		const html = ssrDoc.getHTML();
		assert(html.includes('<div'), 'SSR includes aggregated div');

		document.body.innerHTML = html;
		const ssrDiv = document.body.querySelector('div');
		assertExists(ssrDiv, 'SSR div element exists');
		assertEquals(ssrDiv.textContent, 'JSContent');

		// CSR
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const domNodes = csrSync(csrRoot, ssrDiv);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node via JS');
		assertStrictEquals(domNodes.at(0), ssrDiv, 'SSR div element reused via JS');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: multiple aggregated elements reused during CSR sync', async () => {
		// SSR: two `to` nodes contributing to the same buffer
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.li id=item1 Item1])]`) });
		const toNode2 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.li id=item2 Item2])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode1, , toNode2]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('>Item1</li>'), 'SSR includes first item');
		assert(html.includes('>Item2</li>'), 'SSR includes second item');

		document.body.innerHTML = html;
		const ssrLi1 = document.getElementById('item1');
		const ssrLi2 = document.getElementById('item2');
		assertExists(ssrLi1, 'SSR first li exists');
		assertExists(ssrLi2, 'SSR second li exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrLi1);
		await reactive.wait();

		assertEquals(domNodes.size, 2, 'from mode renders two DOM nodes');
		assertStrictEquals(domNodes.at(0), ssrLi1, 'first SSR li reused');
		assertStrictEquals(domNodes.at(1), ssrLi2, 'second SSR li reused');
	});
});

// ---------------------------------------------------------------------------
// Named buffer sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: named buffer sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - named buffer: SSR-generated element reused during CSR sync', async () => {
		// SSR: named buffer
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=scripts)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr to=scripts [h.script id=myscript type=text/javascript console.log(1)])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('<script'), 'SSR includes aggregated script');

		document.body.innerHTML = html;
		const ssrScript = document.getElementById('myscript');
		assertExists(ssrScript, 'SSR script element exists');
		assertEquals(ssrScript.tagName, 'SCRIPT', 'is a script element');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrScript);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script element reused');
	});

	await simulateBrowser();

	await t.step('(getDOM) - multiple named buffers: each syncs independently', async () => {
		// SSR: two named buffers — fromHead first, then fromBody, then toHead, then toBody
		const ssrDoc = makeDoc();
		const fromHead = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=head-items)]`) });
		const fromBody = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=body-items)]`) });
		const toHead = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr to=head-items [h.meta id=headmeta name=desc content=test])]`) });
		const toBody = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr to=body-items [h.p id=bodypara Body])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromHead, , fromBody, , toHead, , toBody]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('id="headmeta"'), 'SSR includes head meta');
		assert(html.includes('id="bodypara"'), 'SSR includes body para');

		document.body.innerHTML = html;
		const ssrMeta = document.getElementById('headmeta');
		const ssrPara = document.getElementById('bodypara');
		assertExists(ssrMeta, 'SSR meta element exists');
		assertExists(ssrPara, 'SSR para element exists');

		// CSR: reconstruct from SSR spec and sync at document level
		// The document renders: headmeta (from head-items), bodypara (from body-items)
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrMeta);
		await reactive.wait();

		assertEquals(domNodes.size, 2, 'document renders 2 DOM nodes (one per from node)');
		assertStrictEquals(domNodes.at(0), ssrMeta, 'SSR meta reused');
		assertStrictEquals(domNodes.at(1), ssrPara, 'SSR para reused');
	});
});

// ---------------------------------------------------------------------------
// m.csr suppression: SSR emits nothing; CSR generates content fresh
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: m.csr suppression', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode with m.csr: SSR emits nothing, CSR generates element', async () => {
		// SSR: from node with m.csr=true emits nothing
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default m.csr=true)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.p CSROnly])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assertEquals(html, '', 'SSR emits nothing when m.csr is set on from node');

		// CSR: no sync needed — nothing to sync with; reconstruct from SSR spec
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = $c.sm(csrDoc, 'getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'CSR generates one DOM node');
		assertEquals(domNodes.at(0).tagName, 'P', 'CSR generates a paragraph');
		assertEquals(domNodes.at(0).textContent, 'CSROnly', 'CSR content correct');
	});

	await simulateBrowser();

	await t.step('(getDOM) - to mode with m.csr: SSR emits nothing, CSR still registers', async () => {
		// SSR: to node with m.csr=true does not store content
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr m.csr=true [h.span CSRToOnly])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assertEquals(html, '', 'SSR emits nothing when to node has m.csr');

		// CSR: to node registers normally; from node renders the content
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = $c.sm(csrDoc, 'getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'CSR generates one DOM node from m.csr to node');
		assertEquals(domNodes.at(0).tagName, 'SPAN', 'CSR generates a span');
		assertEquals(domNodes.at(0).textContent, 'CSRToOnly', 'CSR content correct');
	});
});

// ---------------------------------------------------------------------------
// CSR-only fallback: when buffer is empty, fallback content is generated
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: CSR-only fallback', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode with fallback: SSR emits nothing, CSR renders fallback', async () => {
		// SSR: from node with no to nodes — empty buffer renders nothing
		// The from node has fallback children that render in CSR when buffer is empty
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=empty-buf [h.p Loading])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode]));

		const html = ssrDocHTML(ssrDoc);
		assertEquals(html, '', 'SSR emits nothing for empty buffer');

		// CSR: from node renders fallback content (no sync needed)
		// Reconstruct from SSR spec so the CSR doc matches exactly
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = $c.sm(csrDoc, 'getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'CSR renders fallback content');
		assertEquals(domNodes.at(0).tagName, 'P', 'CSR renders fallback paragraph');
		assertEquals(domNodes.at(0).textContent, 'Loading', 'CSR fallback content correct');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: fallback switches to registered content when to node is added', async () => {
		// CSR: from node starts with fallback, then switches to registered content
		// Build the initial doc with just the from node (with fallback children)
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=switch-buf [h.p FallbackContent])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode]));

		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = $c.sm(csrDoc, 'getDOM');
		await reactive.wait();
		assertEquals(domNodes.size, 1, 'CSR renders fallback initially');
		assertEquals(domNodes.at(0).textContent, 'FallbackContent', 'fallback content shown');

		// Now add a to node to the CSR doc
		const csrToNode = $c.sm(csrDoc, 'from', { item: ps(`[(m.aggr to=switch-buf [h.span RegisteredContent])]`) });
		$c.sm(csrDoc, 'append', ls([, csrToNode]));
		$c.sm(csrDoc, 'getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1, 'CSR switches to registered content');
		assertEquals(domNodes.at(0).tagName, 'SPAN', 'registered span rendered');
		assertEquals(domNodes.at(0).textContent, 'RegisteredContent', 'registered content shown');
	});
});

// ---------------------------------------------------------------------------
// Reactive updates after hydration
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: reactive updates after hydration', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode: reactive update after sync reuses SSR node', async () => {
		// SSR: a to node with a span child (explicit id so SSR can assign it for sync)
		// Note: a bare text node as the first aggregated item cannot receive an id,
		// so we wrap it in a span to enable proper DOM reuse during sync.
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.span id=text-span Initial])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('Initial'), 'SSR includes initial text');

		document.body.innerHTML = html;
		const ssrSpan = document.getElementById('text-span');
		assertExists(ssrSpan, 'SSR span exists');
		assertEquals(ssrSpan.textContent, 'Initial', 'SSR span has initial content');

		// CSR: reconstruct from SSR spec (includes auto-assigned ids) and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrSpan);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrSpan, 'SSR span reused');

		// Reactive update: find the span node in the CSR doc's sub-doc and update its text
		const csrSubDoc = $c.sm(csrRoot, 'getSubDoc');
		// The sub-doc has: fromNode (index 0), toNode (index 1)
		// The toNode's sub-doc has the span node
		const csrToNode = csrSubDoc.at(1);
		const csrToSubDoc = $c.sm(csrToNode, 'getSubDoc');
		const csrSpanNode = csrToSubDoc.at(0);
		// Update the span's text child
		const csrSpanSubDoc = $c.sm(csrSpanNode, 'getSubDoc');
		const csrTextNode = csrSpanSubDoc.at(0);
		$c.sm(csrTextNode, 'setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, 'Updated', 'text updated reactively');
		assertStrictEquals(domNodes.at(0), ssrSpan, 'same span node after update');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: reactive update with element node reuses SSR element', async () => {
		// SSR: a to node with a div child (explicit id provided — no auto-assign needed)
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.div id=aggr-div class=initial Content])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrDiv = document.getElementById('aggr-div');
		assertExists(ssrDiv, 'SSR div exists');
		assertEquals(ssrDiv.className, 'initial', 'initial class');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrDiv);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrDiv, 'SSR div reused');
		assertEquals(domNodes.at(0).className, 'initial', 'initial class preserved');

		// Reactive update: find the div node in the CSR doc's sub-doc
		const csrSubDoc = $c.sm(csrRoot, 'getSubDoc');
		const csrToNode = csrSubDoc.at(1);
		const csrToSubDoc = $c.sm(csrToNode, 'getSubDoc');
		const csrDivNode = csrToSubDoc.at(0);
		$c.sm(csrDivNode, 'setAttr', ['class', 'updated']);
		await globalThis.reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrDiv, 'same DOM node after update');
		assertEquals(domNodes.at(0).className, 'updated', 'class updated reactively');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: new to node added after hydration updates DOM reactively', async () => {
		// SSR: one to node with explicit id on first element (avoids auto-assign dependency)
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.li id=li1 Item1])]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode1]));

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrLi1 = document.getElementById('li1');
		assertExists(ssrLi1, 'SSR li1 exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrLi1);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'initially one DOM node');
		assertStrictEquals(domNodes.at(0), ssrLi1, 'SSR li1 reused');

		// Add a second to node after hydration
		const csrToNode2 = $c.sm(csrDoc, 'from', { item: ps(`[(m.aggr [h.li id=li2 Item2])]`) });
		$c.sm(csrDoc, 'append', ls([, csrToNode2]));
		$c.sm(csrDoc, 'getDOM');

		await globalThis.reactive.wait();

		assertEquals(domNodes.size, 2, 'two DOM nodes after adding second to node');
		assertStrictEquals(domNodes.at(0), ssrLi1, 'first li still reused');
		assertEquals(domNodes.at(1).tagName, 'LI', 'second li generated');
		assertEquals(domNodes.at(1).textContent, 'Item2', 'second li has correct content');
		assertNotStrictEquals(domNodes.at(1), ssrLi1, 'second li is a new element');
	});
});

// ---------------------------------------------------------------------------
// End-to-end document sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: end-to-end document sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - full document: surrounding content and aggregated content all synced', async () => {
		// SSR: a container div with before span, from node (aggregated content), after span, and to node.
		// Wrapping in a container element is required so that the SSR children are preserved
		// during the initial CSR render (when the from node defers while to nodes register).
		// The aggregated p has an explicit id so no auto-assign is needed.
		const ssrDoc = makeDoc();
		const containerNode = $c.sm(ssrDoc, 'from', { item: ps(`[(h.div id=container
			[h.span id=before-span Before]
			[m.aggr from=default]
			[h.span id=after-span After]
			[m.aggr [h.p id=aggr-p Middle]]
		)]`) });
		$c.sm(ssrDoc, 'append', ls([, containerNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('Before'), 'SSR includes before text');
		assert(html.includes('Middle'), 'SSR includes aggregated content');
		assert(html.includes('After'), 'SSR includes after text');

		// Verify order: Before, Middle (aggregated), After
		const beforeIdx = html.indexOf('Before');
		const middleIdx = html.indexOf('Middle');
		const afterIdx = html.indexOf('After');
		assert(beforeIdx < middleIdx, 'Before comes before Middle');
		assert(middleIdx < afterIdx, 'Middle comes before After');

		document.body.innerHTML = html;
		const ssrContainer = document.getElementById('container');
		const ssrBefore = document.getElementById('before-span');
		const ssrMiddle = document.getElementById('aggr-p');
		const ssrAfter = document.getElementById('after-span');
		assertExists(ssrContainer, 'SSR container exists');
		assertExists(ssrBefore, 'SSR before span exists');
		assertExists(ssrMiddle, 'SSR middle p exists');
		assertExists(ssrAfter, 'SSR after span exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrContainer);
		$c.sm(csrRoot, 'getDOM');
		await reactive.wait();

		// Document renders: container div (which contains before, middle, after)
		assertEquals(domNodes.size, 1, 'document renders 1 DOM node (container)');
		assertStrictEquals(domNodes.at(0), ssrContainer, 'container reused');

		// Inside the container: before span, aggregated p, after span
		const csrBefore = ssrContainer.querySelector('#before-span');
		const csrMiddle = ssrContainer.querySelector('#aggr-p');
		const csrAfter = ssrContainer.querySelector('#after-span');
		assertStrictEquals(csrBefore, ssrBefore, 'before span reused');
		assertStrictEquals(csrMiddle, ssrMiddle, 'aggregated p reused');
		assertStrictEquals(csrAfter, ssrAfter, 'after span reused');
	});

	await simulateBrowser();

	await t.step('(getDOM) - nested aggregation: from-within-to structure syncs correctly', async () => {
		// SSR: nested aggregation (from inside to's subSpec)
		// Structure:
		//   [h.header [m.aggr from=header]]
		//   [m.aggr to=header [h.title m.text="Page Title"] [h.nav [m.aggr from=nav]]]
		//   [m.aggr to=nav [h.a id=home-link href=/ Home]]
		const ssrSpec = ps(`[(
			[h.header [m.aggr from=header]]
			[m.aggr to=header
				[h.title m.text="Page Title"]
				[h.nav [m.aggr from=nav]]
			]
			[m.aggr to=nav [h.a id=home-link href=/ Home]]
		)]`);

		const ssrDoc = makeDoc();
		$c.sm(ssrDoc, 'append', { list: ssrSpec });

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('>Page Title</title>'), 'SSR includes page title');
		assert(html.includes('<nav'), 'SSR includes nav');
		assert(html.includes('>Home</a>'), 'SSR includes Home link');
		assert(html.includes('<header>'), 'SSR includes header');
		assert(!html.includes('<{'), 'No unresolved placeholders');

		document.body.innerHTML = html;
		const ssrHeader = document.body.querySelector('header');
		const ssrHomeLink = document.getElementById('home-link');
		assertExists(ssrHeader, 'SSR header exists');
		assertExists(ssrHomeLink, 'SSR home link exists');

		// CSR: reconstruct from SSR spec (includes auto-assigned ids) and sync at document level
		const csrSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec: csrSpec });

		const domNodes = csrSync(csrRoot, ssrHeader);
		await reactive.wait();

		// The document renders: header (from aggregation), nothing from to nodes
		assertEquals(domNodes.size, 1, 'document renders 1 DOM node (header)');
		assertStrictEquals(domNodes.at(0), ssrHeader, 'SSR header reused');

		// The home link should be inside the header
		const csrHomeLink = domNodes.at(0).querySelector('#home-link');

		assertExists(csrHomeLink, 'home link exists inside header');
		assertStrictEquals(csrHomeLink, ssrHomeLink, 'SSR home link reused');
	});
});

// ---------------------------------------------------------------------------
// to mode: does not render DOM; does not affect sync cursor
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: to mode behavior', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - to mode returns empty DOM (does not affect sync)', async () => {
		// SSR: a div, then a to node (which renders nothing), then another div
		// No from node, so aggregated content is never rendered in SSR
		const ssrDoc = makeDoc();
		const div1 = $c.sm(ssrDoc, 'from', { item: ps(`[(h.div id=div1 First)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.aggr [h.span Aggregated])]`) });
		const div2 = $c.sm(ssrDoc, 'from', { item: ps(`[(h.div id=div2 Second)]`) });
		$c.sm(ssrDoc, 'append', ls([, div1, , toNode, , div2]));

		const html = ssrDocHTML(ssrDoc);
		// Only div1 and div2 should appear (to node renders nothing)
		assert(html.includes('id="div1"'), 'SSR includes div1');
		assert(html.includes('id="div2"'), 'SSR includes div2');
		assert(!html.includes('Aggregated'), 'SSR does not include aggregated content (no from node)');

		document.body.innerHTML = html;
		const ssrDiv1 = document.getElementById('div1');
		const ssrDiv2 = document.getElementById('div2');
		assertExists(ssrDiv1, 'SSR div1 exists');
		assertExists(ssrDiv2, 'SSR div2 exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrDiv1);
		await reactive.wait();

		// Document renders: div1, nothing from to node, div2
		assertEquals(domNodes.size, 2, 'document renders 2 DOM nodes (to node renders nothing)');
		assertStrictEquals(domNodes.at(0), ssrDiv1, 'div1 reused');
		assertStrictEquals(domNodes.at(1), ssrDiv2, 'div2 reused (sync cursor not disrupted by to node)');
	});
});
