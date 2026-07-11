// Tests for SSR-to-CSR DOM hydration of m.script and m.style (MWIAggrScript).
//
// m.script and m.style have two modes:
//   - `to` mode: collects script/style content into a buffer (renders nothing in SSR/CSR)
//   - `from` mode: renders the collected content (SSR: placeholder; CSR: reactive DOM)
//
// During SSR-CSR hydration, the `from` node renders its aggregated content in
// sync mode, attempting to reuse the SSR-generated DOM nodes. The `to` nodes
// themselves do not render DOM and do not participate in sync directly.
//
// Key behaviors tested:
//   1. `from` mode: SSR-generated script/style elements are reused during CSR sync
//   2. `to` mode: does not render DOM; does not affect sync cursor
//   3. Deduplication: duplicate scripts/styles in SSR must match CSR deduplication
//   4. Named buffers: named buffer content is synced correctly
//   5. `m.csr` suppression: SSR emits nothing; CSR generates content fresh
//   6. Reactive updates: content changes update the DOM reactively after hydration
//   7. End-to-end document sync: full document with from/to nodes

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
			featpro: 'mwi.comp.MWIAggr mwi.comp.MWIAggrScript',
		},
	},
});

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIAggrScript');

// Set up browser-like environment for DOM testing
await simulateBrowser();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Create a fresh MWIDocument for each test to avoid cross-test contamination.
function makeDoc() {
	return getInstance('MWIDocument');
}

// SSR: build a document, append nodes, and return the final HTML string.
// Uses the document-level getHTML() so placeholders are resolved.
function ssrDocHTML(doc) {
	return $c.sm(doc, 'getHTML');
}

// Load an HTML string into document.body so we can inspect the resulting DOM.
function loadSSRIntoBody(html) {
	document.body.innerHTML = html;
	return document.body.firstChild;
}

// CSR in sync mode: call getDOM with a MWIDOMSync instance starting at the
// given DOM cursor node. Returns the domNodes NANOS.
function csrSync(node, cursor) {
	const sync = getInstance('MWIDOMSync', [cursor]);
	return node.document.getDOM({ sync });
}

// ---------------------------------------------------------------------------
// m.script: from mode basic sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggrScript (m.script) - SSR-CSR Hydration: from mode basic sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode: SSR-generated script element reused during CSR sync', async () => {
		// SSR: build a doc with a `from` node and a `to` node
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script src=/test.js)]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		// The from node renders the aggregated script
		assert(html.includes('<script'), 'SSR includes aggregated script');
		assert(html.includes('src="/test.js"'), 'SSR includes script src');

		// Load into browser
		document.body.innerHTML = html;
		const ssrScript = document.body.querySelector('script');
		assertExists(ssrScript, 'SSR script element exists');
		assertEquals(ssrScript.getAttribute('src'), '/test.js', 'SSR script has correct src');

		// CSR: build from the SSR spec and sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		// Now sync the `from` node starting at the SSR script
		const domNodes = csrSync(csrRoot, ssrScript);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script element reused during sync');
		assertEquals(domNodes.at(0).getAttribute('src'), '/test.js', 'src preserved');
	});

	await simulateBrowser();

	await t.step('.getDOM() - from mode: SSR-generated script element reused during CSR sync via JS', async () => {
		// SSR
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script src=/test-js.js)]`) });
		ssrDoc.append(fromNode, toNode);

		const html = ssrDoc.getHTML();
		assert(html.includes('<script'), 'SSR includes aggregated script');

		document.body.innerHTML = html;
		const ssrScript = document.body.querySelector('script');
		assertExists(ssrScript, 'SSR script element exists');
		assertEquals(ssrScript.getAttribute('src'), '/test-js.js');

		// CSR
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const domNodes = csrSync(csrRoot, ssrScript);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node via JS');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script element reused via JS');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: inline script element reused during CSR sync', async () => {
		// SSR: inline script content
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script m.text="console.log(1);")]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('console.log(1);'), 'SSR includes inline script content');

		document.body.innerHTML = html;
		const ssrScript = document.body.querySelector('script');
		assertExists(ssrScript, 'SSR script element exists');
		assertEquals(ssrScript.textContent, 'console.log(1);', 'SSR has inline content');

		// CSR
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrScript);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script element reused');
		assertEquals(domNodes.at(0).textContent, 'console.log(1);', 'inline content preserved');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: multiple scripts reused during CSR sync', async () => {
		// SSR: two `to` nodes contributing to the same buffer
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script id=script1 src=/lib1.js)]`) });
		const toNode2 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script id=script2 src=/lib2.js)]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode1, , toNode2]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('src="/lib1.js"'), 'SSR includes first script');
		assert(html.includes('src="/lib2.js"'), 'SSR includes second script');

		document.body.innerHTML = html;
		const ssrScript1 = document.getElementById('script1');
		const ssrScript2 = document.getElementById('script2');
		assertExists(ssrScript1, 'SSR first script exists');
		assertExists(ssrScript2, 'SSR second script exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrScript1);
		await reactive.wait();

		assertEquals(domNodes.size, 2, 'from mode renders two DOM nodes');
		assertStrictEquals(domNodes.at(0), ssrScript1, 'first SSR script reused');
		assertStrictEquals(domNodes.at(1), ssrScript2, 'second SSR script reused');
	});
});

// ---------------------------------------------------------------------------
// Named buffer sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggrScript (m.script) - SSR-CSR Hydration: named buffer sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - named buffer: SSR-generated script reused during CSR sync', async () => {
		// SSR: named buffer
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=footer)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script to=footer id=footerscript src=/footer.js)]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('<script'), 'SSR includes aggregated script');

		document.body.innerHTML = html;
		const ssrScript = document.getElementById('footerscript');
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
});

// ---------------------------------------------------------------------------
// Deduplication sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggrScript (m.script) - SSR-CSR Hydration: deduplication sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - duplicate scripts: SSR and CSR both deduplicate consistently', async () => {
		// SSR: two identical script src values — should be deduplicated
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const script1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script src=/dup.js)]`) });
		const script2 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script src=/dup.js)]`) }); // Duplicate
		$c.sm(ssrDoc, 'append', ls([, fromNode, , script1, , script2]));

		const html = ssrDocHTML(ssrDoc);
		// SSR should only render one script tag
		const scriptCount = (html.match(/<script/g) || []).length;
		assertEquals(scriptCount, 1, 'SSR deduplicates duplicate scripts');

		document.body.innerHTML = html;
		const ssrScript = document.body.querySelector('script');
		assertExists(ssrScript, 'SSR script element exists');

		// CSR: reconstruct from SSR spec and sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrScript);
		await reactive.wait();

		// CSR should also deduplicate and reuse the SSR element
		assertEquals(domNodes.size, 1, 'CSR deduplicates duplicate scripts');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script element reused');
	});
});

// ---------------------------------------------------------------------------
// m.csr suppression
// ---------------------------------------------------------------------------

Deno.test('MWIAggrScript (m.script) - SSR-CSR Hydration: m.csr suppression', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode with m.csr: SSR emits nothing, CSR generates element', async () => {
		// SSR: from node with m.csr=true emits nothing
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head m.csr=true)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script src=/csr-only.js)]`) });
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
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'CSR generates a script');
		assertEquals(domNodes.at(0).getAttribute('src'), '/csr-only.js', 'CSR content correct');
	});

	await simulateBrowser();

	await t.step('(getDOM) - to mode with m.csr: SSR emits nothing, CSR still registers', async () => {
		// SSR: to node with m.csr=true does not store content
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script m.csr=true src=/csr-to.js)]`) });
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
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'CSR generates a script');
		assertEquals(domNodes.at(0).getAttribute('src'), '/csr-to.js', 'CSR content correct');
	});
});

// ---------------------------------------------------------------------------
// Reactive updates after hydration
// ---------------------------------------------------------------------------

Deno.test('MWIAggrScript (m.script) - SSR-CSR Hydration: reactive updates after hydration', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode: reactive update after sync reuses SSR node', async () => {
		// SSR: a to node with inline script (explicit id for sync)
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script id=myscript m.text="console.log('initial');")]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('initial'), 'SSR includes initial text');

		document.body.innerHTML = html;
		const ssrScript = document.getElementById('myscript');
		assertExists(ssrScript, 'SSR script exists');
		assertEquals(ssrScript.textContent, "console.log('initial');", 'SSR script has initial content');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrScript);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrScript, 'SSR script reused');

		// Reactive update: find the script node in the CSR doc's sub-doc and update its content
		const csrSubDoc = $c.sm(csrRoot, 'getSubDoc');
		// The sub-doc has: fromNode (index 0), toNode (index 1)
		const csrToNode = csrSubDoc.at(1);
		$c.sm(csrToNode, 'setAttr', ['m.text', "console.log('updated');"]);
		await globalThis.reactive.wait();

		assertEquals(domNodes.at(0).textContent, "console.log('updated');", 'text updated reactively');
		assertStrictEquals(domNodes.at(0), ssrScript, 'same script node after update');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: new to node added after hydration updates DOM reactively', async () => {
		// SSR: one to node with explicit id
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script from=head)]`) });
		const toNode1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.script id=script1 src=/lib1.js)]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode1]));

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrScript1 = document.getElementById('script1');
		assertExists(ssrScript1, 'SSR script1 exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrScript1);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'initially one DOM node');
		assertStrictEquals(domNodes.at(0), ssrScript1, 'SSR script1 reused');

		// Add a second to node after hydration
		const csrToNode2 = $c.sm(csrDoc, 'from', { item: ps(`[(m.script id=script2 src=/lib2.js)]`) });
		$c.sm(csrDoc, 'append', ls([, csrToNode2]));
		$c.sm(csrDoc, 'getDOM');

		await globalThis.reactive.wait();

		assertEquals(domNodes.size, 2, 'two DOM nodes after adding second to node');
		assertStrictEquals(domNodes.at(0), ssrScript1, 'first script still reused');
		assertEquals(domNodes.at(1).tagName, 'SCRIPT', 'second script generated');
		assertEquals(domNodes.at(1).getAttribute('src'), '/lib2.js', 'second script has correct src');
		assertNotStrictEquals(domNodes.at(1), ssrScript1, 'second script is a new element');
	});
});

// ---------------------------------------------------------------------------
// End-to-end document sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggrScript (m.script) - SSR-CSR Hydration: end-to-end document sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - full document: surrounding content and aggregated scripts all synced', async () => {
		// SSR: a container div with before text, from node (aggregated script), after text, and to node
		const ssrDoc = makeDoc();
		const containerNode = $c.sm(ssrDoc, 'from', { item: ps(`[(h.div id=container
			[m.t t=Before]
			[m.script from=head]
			[m.t t=After]
			[m.script id=myscript src=/middle.js]
		)]`) });
		$c.sm(ssrDoc, 'append', ls([, containerNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('Before'), 'SSR includes before text');
		assert(html.includes('<script'), 'SSR includes aggregated script');
		assert(html.includes('After'), 'SSR includes after text');

		document.body.innerHTML = html;
		const ssrContainer = document.getElementById('container');
		const ssrScript = document.getElementById('myscript');
		assertExists(ssrContainer, 'SSR container exists');
		assertExists(ssrScript, 'SSR script exists');

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

		// Inside the container: before text, aggregated script, after text
		const csrScript = ssrContainer.querySelector('#myscript');
		assertStrictEquals(csrScript, ssrScript, 'aggregated script reused');
	});
});

// ---------------------------------------------------------------------------
// m.style: from mode basic sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggrStyle (m.style) - SSR-CSR Hydration: from mode basic sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - from mode: SSR-generated style element reused during CSR sync', async () => {
		// SSR: inline style
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style m.text="body { margin: 0; }")]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('<style'), 'SSR includes aggregated style');
		assert(html.includes('body { margin: 0; }'), 'SSR includes style content');

		document.body.innerHTML = html;
		const ssrStyle = document.body.querySelector('style');
		assertExists(ssrStyle, 'SSR style element exists');
		assertEquals(ssrStyle.textContent, 'body { margin: 0; }', 'SSR style has correct content');

		// CSR: build from the SSR spec and sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrStyle);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node');
		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR style element reused during sync');
		assertEquals(domNodes.at(0).textContent, 'body { margin: 0; }', 'content preserved');
	});

	await simulateBrowser();

	await t.step('.getDOM() - from mode: SSR-generated link element reused during CSR sync via JS', async () => {
		// SSR: external stylesheet
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style from=head)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style href=/style-js.css)]`) });
		ssrDoc.append(fromNode, toNode);

		const html = ssrDoc.getHTML();
		assert(html.includes('<link'), 'SSR includes aggregated link');

		document.body.innerHTML = html;
		const ssrLink = document.body.querySelector('link');
		assertExists(ssrLink, 'SSR link element exists');
		assertEquals(ssrLink.getAttribute('href'), '/style-js.css');

		// CSR
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const domNodes = csrSync(csrRoot, ssrLink);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'from mode renders one DOM node via JS');
		assertStrictEquals(domNodes.at(0), ssrLink, 'SSR link element reused via JS');
	});

	await simulateBrowser();

	await t.step('(getDOM) - from mode: multiple stylesheets reused during CSR sync', async () => {
		// SSR: two `to` nodes contributing to the same buffer
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style from=head)]`) });
		const toNode1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style id=style1 href=/base.css)]`) });
		const toNode2 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style id=style2 href=/theme.css)]`) });
		$c.sm(ssrDoc, 'append', ls([, fromNode, , toNode1, , toNode2]));

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('href="/base.css"'), 'SSR includes first stylesheet');
		assert(html.includes('href="/theme.css"'), 'SSR includes second stylesheet');

		document.body.innerHTML = html;
		const ssrLink1 = document.getElementById('style1');
		const ssrLink2 = document.getElementById('style2');
		assertExists(ssrLink1, 'SSR first link exists');
		assertExists(ssrLink2, 'SSR second link exists');

		// CSR: reconstruct from SSR spec and sync at document level
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrLink1);
		await reactive.wait();

		assertEquals(domNodes.size, 2, 'from mode renders two DOM nodes');
		assertStrictEquals(domNodes.at(0), ssrLink1, 'first SSR link reused');
		assertStrictEquals(domNodes.at(1), ssrLink2, 'second SSR link reused');
	});
});

// ---------------------------------------------------------------------------
// m.style deduplication sync
// ---------------------------------------------------------------------------

Deno.test('MWIAggrStyle (m.style) - SSR-CSR Hydration: deduplication sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - duplicate stylesheets: SSR and CSR both deduplicate consistently', async () => {
		// SSR: two identical href values — should be deduplicated
		const ssrDoc = makeDoc();
		const fromNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style from=head)]`) });
		const style1 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style href=/dup.css)]`) });
		const style2 = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style href=/dup.css)]`) }); // Duplicate
		$c.sm(ssrDoc, 'append', ls([, fromNode, , style1, , style2]));

		const html = ssrDocHTML(ssrDoc);
		// SSR should only render one link tag
		const linkCount = (html.match(/<link/g) || []).length;
		assertEquals(linkCount, 1, 'SSR deduplicates duplicate stylesheets');

		document.body.innerHTML = html;
		const ssrLink = document.body.querySelector('link');
		assertExists(ssrLink, 'SSR link element exists');

		// CSR: reconstruct from SSR spec and sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		$c.sm(csrRoot, 'setSubSpec', { subSpec });

		const domNodes = csrSync(csrRoot, ssrLink);
		await reactive.wait();

		// CSR should also deduplicate and reuse the SSR element
		assertEquals(domNodes.size, 1, 'CSR deduplicates duplicate stylesheets');
		assertStrictEquals(domNodes.at(0), ssrLink, 'SSR link element reused');
	});
});

// ---------------------------------------------------------------------------
// m.style: to mode behavior
// ---------------------------------------------------------------------------

Deno.test('MWIAggrStyle (m.style) - SSR-CSR Hydration: to mode behavior', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - to mode returns empty DOM (does not affect sync)', async () => {
		// SSR: a div, then a to node (which renders nothing), then another div
		// No from node, so aggregated content is never rendered in SSR
		const ssrDoc = makeDoc();
		const div1 = $c.sm(ssrDoc, 'from', { item: ps(`[(h.div id=div1 First)]`) });
		const toNode = $c.sm(ssrDoc, 'from', { item: ps(`[(m.style href=/aggregated.css)]`) });
		const div2 = $c.sm(ssrDoc, 'from', { item: ps(`[(h.div id=div2 Second)]`) });
		$c.sm(ssrDoc, 'append', ls([, div1, , toNode, , div2]));

		const html = ssrDocHTML(ssrDoc);
		// Only div1 and div2 should appear (to node renders nothing)
		assert(html.includes('id="div1"'), 'SSR includes div1');
		assert(html.includes('id="div2"'), 'SSR includes div2');
		assert(!html.includes('aggregated.css'), 'SSR does not include aggregated content (no from node)');

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
