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
	return doc('getHTML');
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
	return node('document')('getDOM', { sync });
}

// ---------------------------------------------------------------------------
// from mode: SSR-generated aggregated DOM nodes are reused during CSR sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: from mode basic sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode: SSR-generated element reused during CSR sync', async () => {
		// SSR: build a doc with a `from` node and a `to` node
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = ssrDoc('from', { item: ps(`[(m.aggr [h.span Content])]`) });
		ssrDoc('append', ls([, fromNode, , toNode]));

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
		const subSpec = ssrDoc('root')('getSubSpec');
		const csrDoc = makeDoc(), csrRoot = csrDoc('root');
		csrRoot('setSubSpec', { subSpec });

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
		const fromNode = ssrDoc('from', { item: ps(`[(m.aggr from=default)]`) });
		const toNode = ssrDoc('from', { item: ps(`[(m.aggr [h.div JSContent])]`) });
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
	// THE REMAINING TESTS NEED TO BE REWRITTEN LIKE THE TWO ABOVE

	await t.step('(getDOM) - from mode: multiple aggregated elements reused during CSR sync', () => {
		// SSR: two `to` nodes contributing to the same buffer
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const toNode1 = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode1('setSubSpec', { subSpec: ps('[([h.li id=item1 Item1])]') });
		const toNode2 = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode2('setSubSpec', { subSpec: ps('[([h.li id=item2 Item2])]') });
		ssrDoc('append', ls([, fromNode, , toNode1, , toNode2]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('>Item1</li>'), 'SSR includes first item');
		assert(html.includes('>Item2</li>'), 'SSR includes second item');

		document.body.innerHTML = html;
		const ssrLi1 = document.getElementById('item1');
		const ssrLi2 = document.getElementById('item2');
		assertExists(ssrLi1, 'SSR first li exists');
		assertExists(ssrLi2, 'SSR second li exists');

		// CSR
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		const csrToNode1 = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode1('setSubSpec', { subSpec: ps('[([h.li id=item1 Item1])]') });
		const csrToNode2 = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode2('setSubSpec', { subSpec: ps('[([h.li id=item2 Item2])]') });
		csrDoc('append', ls([, csrFromNode, , csrToNode1, , csrToNode2]));

		csrToNode1('getDOM');
		csrToNode2('getDOM');

		const domNodes = csrSync(csrFromNode, ssrLi1);

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

	await t.step('(getDOM) - named buffer: SSR-generated element reused during CSR sync', () => {
		// SSR: named buffer
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'scripts']);
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'scripts']);
		toNode('setSubSpec', { subSpec: ps('[([h.script id=myscript type=text/javascript console.log(1)])]') });
		ssrDoc('append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('<script'), 'SSR includes aggregated script');

		document.body.innerHTML = html;
		const ssrScript = document.getElementById('myscript');
		assertExists(ssrScript, 'SSR script element exists');
		assertEquals(ssrScript.tagName, 'SCRIPT', 'is a script element');

		// CSR
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'scripts']);
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('setAttr', ['to', 'scripts']);
		csrToNode('setSubSpec', { subSpec: ps('[([h.script id=myscript type=text/javascript console.log(1)])]') });
		csrDoc('append', ls([, csrFromNode, , csrToNode]));

		csrToNode('getDOM');

		const domNodes = csrSync(csrFromNode, ssrScript);

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script element reused');
	});

	await simulateBrowser();

	await t.step('(getDOM) - multiple named buffers: each syncs independently', () => {
		// SSR: two named buffers
		const ssrDoc = makeDoc();
		const fromHead = ssrDoc('createNode', ls([, 'm.aggr']));
		fromHead('setAttr', ['from', 'head-items']);
		const fromBody = ssrDoc('createNode', ls([, 'm.aggr']));
		fromBody('setAttr', ['from', 'body-items']);
		const toHead = ssrDoc('createNode', ls([, 'm.aggr']));
		toHead('setAttr', ['to', 'head-items']);
		toHead('setSubSpec', { subSpec: ps('[([h.meta id=headmeta name=desc content=test])]') });
		const toBody = ssrDoc('createNode', ls([, 'm.aggr']));
		toBody('setAttr', ['to', 'body-items']);
		toBody('setSubSpec', { subSpec: ps('[([h.p id=bodypara Body])]') });
		ssrDoc('append', ls([, fromHead, , fromBody, , toHead, , toBody]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('id="headmeta"'), 'SSR includes head meta');
		assert(html.includes('id="bodypara"'), 'SSR includes body para');

		document.body.innerHTML = html;
		const ssrMeta = document.getElementById('headmeta');
		const ssrPara = document.getElementById('bodypara');
		assertExists(ssrMeta, 'SSR meta element exists');
		assertExists(ssrPara, 'SSR para element exists');

		// CSR
		const csrDoc = makeDoc();
		const csrFromHead = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromHead('setAttr', ['from', 'head-items']);
		const csrFromBody = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromBody('setAttr', ['from', 'body-items']);
		const csrToHead = csrDoc('createNode', ls([, 'm.aggr']));
		csrToHead('setAttr', ['to', 'head-items']);
		csrToHead('setSubSpec', { subSpec: ps('[([h.meta id=headmeta name=desc content=test])]') });
		const csrToBody = csrDoc('createNode', ls([, 'm.aggr']));
		csrToBody('setAttr', ['to', 'body-items']);
		csrToBody('setSubSpec', { subSpec: ps('[([h.p id=bodypara Body])]') });
		csrDoc('append', ls([, csrFromHead, , csrFromBody, , csrToHead, , csrToBody]));

		csrToHead('getDOM');
		csrToBody('getDOM');

		const headNodes = csrSync(csrFromHead, ssrMeta);
		const bodyNodes = csrSync(csrFromBody, ssrPara);

		assertEquals(headNodes.size, 1, 'head buffer renders one node');
		assertStrictEquals(headNodes.at(0), ssrMeta, 'SSR meta reused');
		assertEquals(bodyNodes.size, 1, 'body buffer renders one node');
		assertStrictEquals(bodyNodes.at(0), ssrPara, 'SSR para reused');
	});
});

// ---------------------------------------------------------------------------
// m.csr suppression: SSR emits nothing; CSR generates content fresh
// ---------------------------------------------------------------------------

Deno.test('MWIAggr (m.aggr) - SSR-CSR Hydration: m.csr suppression', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode with m.csr: SSR emits nothing, CSR generates element', () => {
		// SSR: from node with m.csr=true emits nothing
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		fromNode('setAttr', ['m.csr', true]);
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.p CSROnly])]') });
		ssrDoc('append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assertEquals(html, '', 'SSR emits nothing when m.csr is set on from node');

		// CSR: no sync needed — nothing to sync with
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		csrFromNode('setAttr', ['m.csr', true]);
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('setSubSpec', { subSpec: ps('[([h.p CSROnly])]') });
		csrDoc('append', ls([, csrFromNode, , csrToNode]));

		csrToNode('getDOM');
		const domNodes = csrFromNode('getDOM');

		assertEquals(domNodes.size, 1, 'CSR generates one DOM node');
		assertEquals(domNodes.at(0).tagName, 'P', 'CSR generates a paragraph');
		assertEquals(domNodes.at(0).textContent, 'CSROnly', 'CSR content correct');
	});

	await simulateBrowser();

	await t.step('(getDOM) - to mode with m.csr: SSR emits nothing, CSR still registers', () => {
		// SSR: to node with m.csr=true does not store content
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['m.csr', true]);
		toNode('setSubSpec', { subSpec: ps('[([h.span CSRToOnly])]') });
		ssrDoc('append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assertEquals(html, '', 'SSR emits nothing when to node has m.csr');

		// CSR: to node registers normally; from node renders the content
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('setAttr', ['m.csr', true]);
		csrToNode('setSubSpec', { subSpec: ps('[([h.span CSRToOnly])]') });
		csrDoc('append', ls([, csrFromNode, , csrToNode]));

		csrToNode('getDOM');
		const domNodes = csrFromNode('getDOM');

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

	await t.step('(getDOM) - from mode with fallback: SSR emits nothing, CSR renders fallback', () => {
		// SSR: from node with no to nodes — empty buffer renders nothing
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'empty-buf']);
		// Set fallback sub-spec (CSR-only)
		fromNode('setSubSpec', { subSpec: ps('[([h.p Loading])]') });
		ssrDoc('append', ls([, fromNode]));

		const html = ssrDocHTML(ssrDoc);
		assertEquals(html, '', 'SSR emits nothing for empty buffer');

		// CSR: from node renders fallback content (no sync needed)
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'empty-buf']);
		csrFromNode('setSubSpec', { subSpec: ps('[([h.p Loading])]') });
		csrDoc('append', ls([, csrFromNode]));

		const domNodes = csrFromNode('getDOM');

		assertEquals(domNodes.size, 1, 'CSR renders fallback content');
		assertEquals(domNodes.at(0).tagName, 'P', 'CSR renders fallback paragraph');
		assertEquals(domNodes.at(0).textContent, 'Loading', 'CSR fallback content correct');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: fallback switches to registered content when to node is added', async () => {
		// CSR: from node starts with fallback, then switches to registered content
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'switch-buf']);
		csrFromNode('setSubSpec', { subSpec: ps('[([h.p FallbackContent])]') });
		csrDoc('append', ls([, csrFromNode]));

		const domNodes = csrFromNode('getDOM');
		assertEquals(domNodes.size, 1, 'CSR renders fallback initially');
		assertEquals(domNodes.at(0).textContent, 'FallbackContent', 'fallback content shown');

		// Now add a to node
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('setAttr', ['to', 'switch-buf']);
		csrToNode('setSubSpec', { subSpec: ps('[([h.span RegisteredContent])]') });
		csrDoc('append', ls([, csrToNode]));
		csrToNode('getDOM');

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
		// SSR
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const textNode = ssrDoc('createNode', ls([, 'm.t']));
		textNode('setAttr', ['t', 'Initial']);
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('append', ls([, textNode]));
		ssrDoc('append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('Initial'), 'SSR includes initial text');

		document.body.innerHTML = html;
		// The aggregated content is a text node — find it
		const ssrText = document.body.firstChild;
		assertExists(ssrText, 'SSR text node exists');
		assertEquals(ssrText.nodeType, 3, 'is a text node');
		assertEquals(ssrText.data, 'Initial', 'SSR text has initial content');

		// CSR
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		const csrTextNode = csrDoc('createNode', ls([, 'm.t']));
		csrTextNode('setAttr', ['t', 'Initial']);
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('append', ls([, csrTextNode]));
		csrDoc('append', ls([, csrFromNode, , csrToNode]));

		csrToNode('getDOM');

		const sync = getInstance('MWIDOMSync', [ssrText]);
		const domNodes = csrFromNode('getDOM', { sync });

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrText, 'SSR text node reused');

		// Reactive update
		csrTextNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).data, 'Updated', 'text updated reactively');
		assertStrictEquals(domNodes.at(0), ssrText, 'same text node after update');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: reactive update with element node reuses SSR element', async () => {
		// SSR
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.div id=aggr-div class=initial Content])]') });
		ssrDoc('append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrDiv = document.getElementById('aggr-div');
		assertExists(ssrDiv, 'SSR div exists');
		assertEquals(ssrDiv.className, 'initial', 'initial class');

		// CSR
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		const csrDivNode = csrDoc('createNode', ls([, 'h.div']));
		csrDivNode('setAttr', ['id', 'aggr-div']);
		csrDivNode('setAttr', ['class', 'initial']);
		csrDivNode('append', ls([, 'Content']));
		csrToNode('append', ls([, csrDivNode]));
		csrDoc('append', ls([, csrFromNode, , csrToNode]));

		csrToNode('getDOM');

		const domNodes = csrSync(csrFromNode, ssrDiv);

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrDiv, 'SSR div reused');
		assertEquals(domNodes.at(0).className, 'initial', 'initial class preserved');

		// Reactive update
		csrDivNode('setAttr', ['class', 'updated']);
		await globalThis.reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrDiv, 'same DOM node after update');
		assertEquals(domNodes.at(0).className, 'updated', 'class updated reactively');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: new to node added after hydration updates DOM reactively', async () => {
		// SSR: one to node
		const ssrDoc = makeDoc();
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const toNode1 = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode1('setSubSpec', { subSpec: ps('[([h.li id=li1 Item1])]') });
		ssrDoc('append', ls([, fromNode, , toNode1]));

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrLi1 = document.getElementById('li1');
		assertExists(ssrLi1, 'SSR li1 exists');

		// CSR: sync with one to node
		const csrDoc = makeDoc();
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		const csrToNode1 = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode1('setSubSpec', { subSpec: ps('[([h.li id=li1 Item1])]') });
		csrDoc('append', ls([, csrFromNode, , csrToNode1]));

		csrToNode1('getDOM');

		const domNodes = csrSync(csrFromNode, ssrLi1);

		assertEquals(domNodes.size, 1, 'initially one DOM node');
		assertStrictEquals(domNodes.at(0), ssrLi1, 'SSR li1 reused');

		// Add a second to node after hydration
		const csrToNode2 = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode2('setSubSpec', { subSpec: ps('[([h.li id=li2 Item2])]') });
		csrDoc('append', ls([, csrToNode2]));
		csrToNode2('getDOM');

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

	await t.step('(getDOM) - full document: surrounding content and aggregated content all synced', () => {
		// SSR: before text, from node (aggregated content), after text, to node
		const ssrDoc = makeDoc();
		const beforeNode = ssrDoc('createNode', ls([, 'h.span']));
		beforeNode('setAttr', ['id', 'before-span']);
		beforeNode('append', ls([, 'Before']));
		const fromNode = ssrDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const afterNode = ssrDoc('createNode', ls([, 'h.span']));
		afterNode('setAttr', ['id', 'after-span']);
		afterNode('append', ls([, 'After']));
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.p id=aggr-p Middle])]') });
		ssrDoc('append', ls([, beforeNode, , fromNode, , afterNode, , toNode]));

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
		const ssrBefore = document.getElementById('before-span');
		const ssrMiddle = document.getElementById('aggr-p');
		const ssrAfter = document.getElementById('after-span');
		assertExists(ssrBefore, 'SSR before span exists');
		assertExists(ssrMiddle, 'SSR middle p exists');
		assertExists(ssrAfter, 'SSR after span exists');

		// CSR: build the same doc and sync
		const csrDoc = makeDoc();
		const csrBeforeNode = csrDoc('createNode', ls([, 'h.span']));
		csrBeforeNode('setAttr', ['id', 'before-span']);
		csrBeforeNode('append', ls([, 'Before']));
		const csrFromNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrFromNode('setAttr', ['from', 'default']);
		const csrAfterNode = csrDoc('createNode', ls([, 'h.span']));
		csrAfterNode('setAttr', ['id', 'after-span']);
		csrAfterNode('append', ls([, 'After']));
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('setSubSpec', { subSpec: ps('[([h.p id=aggr-p Middle])]') });
		csrDoc('append', ls([, csrBeforeNode, , csrFromNode, , csrAfterNode, , csrToNode]));

		csrToNode('getDOM');

		const sync = getInstance('MWIDOMSync', [ssrBefore]);
		const domNodes = csrDoc('getDOM', { sync });

		// Document renders: before span, aggregated p (from from node), after span
		// to node renders nothing
		assertEquals(domNodes.size, 3, 'document renders 3 DOM nodes');
		assertStrictEquals(domNodes.at(0), ssrBefore, 'before span reused');
		assertStrictEquals(domNodes.at(1), ssrMiddle, 'aggregated p reused');
		assertStrictEquals(domNodes.at(2), ssrAfter, 'after span reused');
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
		ssrDoc('append', { list: ssrSpec });

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

		// CSR: build the same doc and sync
		const csrSpec = ssrDoc('root')('getSubSpec');
		const csrDoc = makeDoc();
		csrDoc('root')('setSubSpec', { subSpec: csrSpec });

		// Register all to nodes first
		const aggrData = csrDoc.getAggr();
		// Trigger getDOM on the document to register all to nodes
		// We need to walk the tree to register to nodes before syncing from nodes
		// Use the document's getDOM in sync mode
		const sync = getInstance('MWIDOMSync', [ssrHeader]);
		const domNodes = csrDoc('getDOM', { sync });

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

	await t.step('(getDOM) - to mode returns empty DOM (does not affect sync)', () => {
		// SSR: a div, then a to node (which renders nothing), then another div
		const ssrDoc = makeDoc();
		const div1 = ssrDoc('createNode', ls([, 'h.div']));
		div1('setAttr', ['id', 'div1']);
		div1('append', ls([, 'First']));
		const toNode = ssrDoc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.span Aggregated])]') });
		const div2 = ssrDoc('createNode', ls([, 'h.div']));
		div2('setAttr', ['id', 'div2']);
		div2('append', ls([, 'Second']));
		ssrDoc('append', ls([, div1, , toNode, , div2]));

		// Note: no `from` node, so aggregated content is never rendered in SSR
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

		// CSR: build the same doc and sync
		const csrDoc = makeDoc();
		const csrDiv1 = csrDoc('createNode', ls([, 'h.div']));
		csrDiv1('setAttr', ['id', 'div1']);
		csrDiv1('append', ls([, 'First']));
		const csrToNode = csrDoc('createNode', ls([, 'm.aggr']));
		csrToNode('setSubSpec', { subSpec: ps('[([h.span Aggregated])]') });
		const csrDiv2 = csrDoc('createNode', ls([, 'h.div']));
		csrDiv2('setAttr', ['id', 'div2']);
		csrDiv2('append', ls([, 'Second']));
		csrDoc('append', ls([, csrDiv1, , csrToNode, , csrDiv2]));

		const sync = getInstance('MWIDOMSync', [ssrDiv1]);
		const domNodes = csrDoc('getDOM', { sync });

		// Document renders: div1, nothing from to node, div2
		assertEquals(domNodes.size, 2, 'document renders 2 DOM nodes (to node renders nothing)');
		assertStrictEquals(domNodes.at(0), ssrDiv1, 'div1 reused');
		assertStrictEquals(domNodes.at(1), ssrDiv2, 'div2 reused (sync cursor not disrupted by to node)');
	});
});
