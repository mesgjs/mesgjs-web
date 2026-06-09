// Tests for SSR-to-CSR hydration of special core components:
// - MWICoreHeadBody (m.head / m.body) with managed regions
// - MWICoreScpCSS (m.scpcss) scoped CSS
//
// Tests verify that:
// - Managed regions sync correctly with existing boundary markers
// - External content in protected regions is preserved
// - m.csrStatic content is handled properly during sync
// - Scoped CSS syncs with SSR-generated style elements
// - Reactive updates work correctly after hydration

import {
	assert,
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
const ls = globalThis.ls;
const registry = getInstance('MWIRegistry');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Create a fresh MWIDocument for each test to avoid cross-test contamination.
function makeDoc () {
	return getInstance('MWIDocument');
}

// SSR: build a doc from a node and return the HTML string.
function ssrHTML (node) {
	return node.getHTML();
}

// Load an HTML string into document.body or document.head as appropriate.
// Returns the parsed element.
function loadSSRIntoDOM (html, target = 'body') {
	if (target === 'body') {
		document.body.innerHTML = html;
		return document.body;
	} else if (target === 'head') {
		document.head.innerHTML = html;
		return document.head;
	}
}

// CSR in sync mode: call getDOM with a MWIDOMSync instance starting at the given DOM cursor node.
function csrSync (node, cursor) {
	const sync = getInstance('MWIDOMSync', [cursor]);
	const domNodes = node.getDOM({ sync });
	return { domNodes };
}

// ---------------------------------------------------------------------------
// MWICoreHeadBody - m.head managed region sync
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - m.head managed region sync", async (t) => {
	await simulateBrowser();

	await t.step("m.head: SSR boundary markers preserved during CSR sync", () => {
		const doc = makeDoc();
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Test Page');
		headNode.append(titleNode);

		// SSR
		const html = ssrHTML(headNode);
		assert(html.includes('data-mwi="begin"'), 'SSR includes begin marker');
		assert(html.includes('data-mwi="end"'), 'SSR includes end marker');

		// Load into browser
		loadSSRIntoDOM(html, 'head');

		// Find SSR boundary markers
		let ssrBegin = null, ssrEnd = null;
		for (const child of document.head.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') ssrBegin = child;
				if (child.dataset.mwi === 'end') ssrEnd = child;
			}
		}
		assertExists(ssrBegin, 'SSR begin marker exists');
		assertExists(ssrEnd, 'SSR end marker exists');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		// Verify the same boundary markers are still present
		let csrBegin = null, csrEnd = null;
		for (const child of document.head.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') csrBegin = child;
				if (child.dataset.mwi === 'end') csrEnd = child;
			}
		}
		assertStrictEquals(csrBegin, ssrBegin, 'begin marker preserved');
		assertStrictEquals(csrEnd, ssrEnd, 'end marker preserved');
		assertStrictEquals(domNodes.at(0), document.head, 'head element reused');
	});

	await simulateBrowser();

	await t.step("m.head: SSR children preserved and synced", () => {
		const doc = makeDoc();
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'My Page');
		headNode.append(titleNode);

		// SSR
		const html = ssrHTML(headNode);
		loadSSRIntoDOM(html, 'head');

		const ssrTitle = document.head.querySelector('title');
		assertExists(ssrTitle, 'SSR title exists');
		assertEquals(ssrTitle.textContent, 'My Page');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		const csrTitle = document.head.querySelector('title');
		assertStrictEquals(csrTitle, ssrTitle, 'title element reused');
		assertStrictEquals(domNodes.at(0), document.head, 'head element reused');
	});

	await simulateBrowser();

	await t.step("m.head: External content in first protected region preserved", () => {
		const doc = makeDoc();
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Test');
		headNode.append(titleNode);

		// SSR
		const html = ssrHTML(headNode);
		loadSSRIntoDOM(html, 'head');

		// Simulate external content added before CSR (e.g., Google Tag Manager)
		// This should be in the first protected region (before begin marker)
		const externalScript = document.createElement('script');
		externalScript.src = '/gtm.js';
		externalScript.id = 'gtm-external';
		// Insert before the begin marker
		const beginMarker = document.head.querySelector('script[data-mwi="begin"]');
		document.head.insertBefore(externalScript, beginMarker);

		// Verify external script is present before CSR
		const externalBefore = document.getElementById('gtm-external');
		assertExists(externalBefore, 'external script present before CSR');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		// External script should still be present after CSR
		const externalAfter = document.getElementById('gtm-external');
		assertExists(externalAfter, 'external script preserved after CSR');
		assertStrictEquals(externalAfter, externalBefore, 'same external script element');
	});

	await simulateBrowser();

	await t.step("m.head: Live DOM additions in protected region preserved during reactive updates", async () => {
		const doc = makeDoc();
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Initial');
		headNode.append(titleNode);

		// SSR
		const html = ssrHTML(headNode);
		loadSSRIntoDOM(html, 'head');

		// Add external content to first protected region
		const externalMeta = document.createElement('meta');
		externalMeta.name = 'external';
		externalMeta.content = 'value';
		externalMeta.id = 'external-meta';
		const beginMarker = document.head.querySelector('script[data-mwi="begin"]');
		document.head.insertBefore(externalMeta, beginMarker);

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		// Verify external content is still present
		const externalAfterSync = document.getElementById('external-meta');
		assertExists(externalAfterSync, 'external content preserved after sync');

		// Now do a reactive update
		titleNode.setAttr('m.text', 'Updated');
		await globalThis.reactive.wait();  // Wait for reactive update to propagate

		// External content should still be preserved after reactive update
		const externalAfterUpdate = document.getElementById('external-meta');
		assertExists(externalAfterUpdate, 'external content preserved after reactive update');
		assertStrictEquals(externalAfterUpdate, externalAfterSync, 'same external element');

		// Title should be updated
		const title = document.head.querySelector('title');
		assertEquals(title.textContent, 'Updated', 'title updated');
	});

	await simulateBrowser();

	await t.step("m.head: m.csrStatic content added during CSR sync", () => {
		const doc = makeDoc();
		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Page');
		headNode.append(titleNode);

		// Add m.csrStatic content (not in SSR output)
		const csrStatic = ps('[( [h.script src="/csr-only.js"] )]');
		headNode.setAttr('m.csrStatic', csrStatic);

		// SSR
		const html = ssrHTML(headNode);
		assert(!html.includes('csr-only.js'), 'm.csrStatic not in SSR output');
		loadSSRIntoDOM(html, 'head');

		// Verify csrStatic content is not present before CSR
		const csrScriptBefore = document.head.querySelector('script[src="/csr-only.js"]');
		assertEquals(csrScriptBefore, null, 'csrStatic script not present before CSR');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		// csrStatic content should now be present
		const csrScriptAfter = document.head.querySelector('script[src="/csr-only.js"]');
		assertExists(csrScriptAfter, 'csrStatic script added during CSR');

		// Verify it's after the end marker
		const endMarker = document.head.querySelector('script[data-mwi="end"]');
		assertExists(endMarker, 'end marker exists');

		let foundCsrScript = false;
		let node = endMarker.nextSibling;
		while (node) {
			if (node === csrScriptAfter) foundCsrScript = true;
			node = node.nextSibling;
		}
		assert(foundCsrScript, 'csrStatic script is after end marker');
	});
});

// ---------------------------------------------------------------------------
// MWICoreHeadBody - m.body managed region sync
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - m.body managed region sync", async (t) => {
	await simulateBrowser();

	await t.step("m.body: SSR boundary markers preserved during CSR sync", () => {
		const doc = makeDoc();
		const bodyNode = doc.createNode('m.body');
		const divNode = doc.createNode('h.div');
		divNode.append('Content');
		bodyNode.append(divNode);

		// SSR
		const html = ssrHTML(bodyNode);
		assert(html.includes('data-mwi="begin"'), 'SSR includes begin marker');
		assert(html.includes('data-mwi="end"'), 'SSR includes end marker');

		// Load into browser
		loadSSRIntoDOM(html, 'body');

		// Find SSR boundary markers
		let ssrBegin = null, ssrEnd = null;
		for (const child of document.body.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') ssrBegin = child;
				if (child.dataset.mwi === 'end') ssrEnd = child;
			}
		}
		assertExists(ssrBegin, 'SSR begin marker exists');
		assertExists(ssrEnd, 'SSR end marker exists');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(bodyNode, document.body);

		// Verify the same boundary markers are still present
		let csrBegin = null, csrEnd = null;
		for (const child of document.body.children) {
			if (child.tagName === 'SCRIPT') {
				if (child.dataset.mwi === 'begin') csrBegin = child;
				if (child.dataset.mwi === 'end') csrEnd = child;
			}
		}
		assertStrictEquals(csrBegin, ssrBegin, 'begin marker preserved');
		assertStrictEquals(csrEnd, ssrEnd, 'end marker preserved');
		assertStrictEquals(domNodes.at(0), document.body, 'body element reused');
	});

	await simulateBrowser();

	await t.step("m.body: External content in first protected region preserved", () => {
		const doc = makeDoc();
		const bodyNode = doc.createNode('m.body');
		const divNode = doc.createNode('h.div');
		divNode.append('Main');
		bodyNode.append(divNode);

		// SSR
		const html = ssrHTML(bodyNode);
		loadSSRIntoDOM(html, 'body');

		// Simulate external content added before CSR (e.g., noscript tag)
		const externalNoscript = document.createElement('noscript');
		externalNoscript.id = 'external-noscript';
		externalNoscript.textContent = 'Enable JavaScript';
		// Insert before the begin marker
		const beginMarker = document.body.querySelector('script[data-mwi="begin"]');
		document.body.insertBefore(externalNoscript, beginMarker);

		// Verify external content is present before CSR
		const externalBefore = document.getElementById('external-noscript');
		assertExists(externalBefore, 'external noscript present before CSR');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(bodyNode, document.body);

		// External content should still be present after CSR
		const externalAfter = document.getElementById('external-noscript');
		assertExists(externalAfter, 'external noscript preserved after CSR');
		assertStrictEquals(externalAfter, externalBefore, 'same external element');
	});

	await simulateBrowser();

	await t.step("m.body: m.csrStatic content added during CSR sync", () => {
		const doc = makeDoc();
		const bodyNode = doc.createNode('m.body');
		const divNode = doc.createNode('h.div');
		divNode.append('Body content');
		bodyNode.append(divNode);

		// Add m.csrStatic content (not in SSR output)
		const csrStatic = ps('[( [h.script src="/csr-body.js"] )]');
		bodyNode.setAttr('m.csrStatic', csrStatic);

		// SSR
		const html = ssrHTML(bodyNode);
		assert(!html.includes('csr-body.js'), 'm.csrStatic not in SSR output');
		loadSSRIntoDOM(html, 'body');

		// Verify csrStatic content is not present before CSR
		const csrScriptBefore = document.body.querySelector('script[src="/csr-body.js"]');
		assertEquals(csrScriptBefore, null, 'csrStatic script not present before CSR');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(bodyNode, document.body);

		// csrStatic content should now be present
		const csrScriptAfter = document.body.querySelector('script[src="/csr-body.js"]');
		assertExists(csrScriptAfter, 'csrStatic script added during CSR');

		// Verify it's after the end marker
		const endMarker = document.body.querySelector('script[data-mwi="end"]');
		assertExists(endMarker, 'end marker exists');

		let foundCsrScript = false;
		let node = endMarker.nextSibling;
		while (node) {
			if (node === csrScriptAfter) foundCsrScript = true;
			node = node.nextSibling;
		}
		assert(foundCsrScript, 'csrStatic script is after end marker');
	});
});

// ---------------------------------------------------------------------------
// MWICoreScpCSS - Scoped CSS sync
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - m.scpcss scoped CSS sync", async (t) => {
	await simulateBrowser();

	await t.step("m.scpcss: SSR style element reused during CSR sync", () => {
		// Register a component with scoped CSS
		registry.register('test.hyd.scpcss.basic', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = makeDoc();
		doc.createNode('test.hyd.scpcss.basic');
		const scpNode = doc.createNode('m.scpcss');

		// SSR
		const html = ssrHTML(scpNode);
		assert(html.includes('<style'), 'SSR includes style tag');
		assert(html.includes('color: blue'), 'SSR includes CSS');

		// Load into browser (style typically goes in head)
		document.head.innerHTML = html;
		const ssrStyle = document.head.querySelector('style');
		assertExists(ssrStyle, 'SSR style element exists');
		assert(ssrStyle.textContent.includes('color: blue'), 'SSR style has CSS');

		// CSR in sync mode (synchronous via .rv)
		const sync = getInstance('MWIDOMSync', [ssrStyle]);
		const domNodes = scpNode.getDOM({ sync });

		assertEquals(domNodes.size, 1, 'CSR produces one style element');
		const csrStyle = domNodes.at(0);
		assertStrictEquals(csrStyle, ssrStyle, 'SSR style element reused');
	});

	await simulateBrowser();

	await t.step("m.scpcss: Multiple components - SSR style element reused and content verified", () => {
		// Register multiple components with scoped CSS
		registry.register('test.hyd.scpcss.multi1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { margin: 1rem; }'
		]));
		registry.register('test.hyd.scpcss.multi2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { padding: 2rem; }'
		]));

		const doc = makeDoc();
		doc.createNode('test.hyd.scpcss.multi1');
		doc.createNode('test.hyd.scpcss.multi2');
		const scpNode = doc.createNode('m.scpcss');

		// SSR
		const html = ssrHTML(scpNode);
		assert(html.includes('margin: 1rem'), 'SSR includes first component CSS');
		assert(html.includes('padding: 2rem'), 'SSR includes second component CSS');

		// Load into browser
		document.head.innerHTML = html;
		const ssrStyle = document.head.querySelector('style');
		assertExists(ssrStyle, 'SSR style element exists');

		// CSR in sync mode (synchronous via .rv)
		const sync = getInstance('MWIDOMSync', [ssrStyle]);
		const domNodes = scpNode.getDOM({ sync });

		const csrStyle = domNodes.at(0);
		assertStrictEquals(csrStyle, ssrStyle, 'SSR style element reused');
		assert(csrStyle.textContent.includes('margin: 1rem'), 'CSS includes first component');
		assert(csrStyle.textContent.includes('padding: 2rem'), 'CSS includes second component');
	});

	await simulateBrowser();

	await t.step("m.scpcss: Reactive component addition after sync", async () => {
		// Register initial component
		registry.register('test.hyd.scpcss.reactive1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));

		const doc = makeDoc();
		doc.createNode('test.hyd.scpcss.reactive1');
		const scpNode = doc.createNode('m.scpcss');

		// SSR
		const html = ssrHTML(scpNode);
		document.head.innerHTML = html;
		const ssrStyle = document.head.querySelector('style');
		assertExists(ssrStyle, 'SSR style element exists');

		// CSR in sync mode (synchronous via .rv)
		const sync = getInstance('MWIDOMSync', [ssrStyle]);
		const domNodes = scpNode.getDOM({ sync });

		const csrStyle = domNodes.at(0);
		assertStrictEquals(csrStyle, ssrStyle, 'SSR style element reused');
		assert(csrStyle.textContent.includes('color: red'), 'initial CSS present');

		// Register and add a new component after sync
		registry.register('test.hyd.scpcss.reactive2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: green; }'
		]));
		doc.createNode('test.hyd.scpcss.reactive2');
		await globalThis.reactive.wait();  // Wait for reactive update to propagate

		// Style element should be updated with new CSS
		assert(csrStyle.textContent.includes('color: red'), 'original CSS still present');
		assert(csrStyle.textContent.includes('color: green'), 'new CSS added');
		assertStrictEquals(domNodes.at(0), ssrStyle, 'same style element after reactive update');
	});
});

// ---------------------------------------------------------------------------
// Combined managed region + scoped CSS integration
// ---------------------------------------------------------------------------

Deno.test("SSR-CSR Hydration - m.head with m.scpcss integration", async (t) => {
	await simulateBrowser();

	await t.step("m.head with m.scpcss child: both sync correctly", () => {
		// Register a component with scoped CSS
		registry.register('test.hyd.integration.comp', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { display: flex; }'
		]));

		const doc = makeDoc();
		doc.createNode('test.hyd.integration.comp');

		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Integration Test');
		const scpNode = doc.createNode('m.scpcss');
		headNode.append(titleNode, scpNode);

		// SSR
		const html = ssrHTML(headNode);
		assert(html.includes('data-mwi="begin"'), 'includes begin marker');
		assert(html.includes('data-mwi="end"'), 'includes end marker');
		assert(html.includes('<title>Integration Test</title>'), 'includes title');
		assert(html.includes('<style'), 'includes style tag');
		assert(html.includes('display: flex'), 'includes CSS');

		// Load into browser
		document.head.innerHTML = html;

		const ssrTitle = document.head.querySelector('title');
		const ssrStyle = document.head.querySelector('style');
		assertExists(ssrTitle, 'SSR title exists');
		assertExists(ssrStyle, 'SSR style exists');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		// Both title and style should be reused
		const csrTitle = document.head.querySelector('title');
		const csrStyle = document.head.querySelector('style');
		assertStrictEquals(csrTitle, ssrTitle, 'title element reused');
		assertStrictEquals(csrStyle, ssrStyle, 'style element reused');
		assertStrictEquals(domNodes.at(0), document.head, 'head element reused');
	});

	await simulateBrowser();

	await t.step("m.head with external content + m.scpcss: all preserved during reactive updates", async () => {
		// Register component with scoped CSS
		registry.register('test.hyd.integration.reactive', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { font-size: 14px; }'
		]));

		const doc = makeDoc();
		doc.createNode('test.hyd.integration.reactive');

		const headNode = doc.createNode('m.head');
		const titleNode = doc.createNode('h.title');
		titleNode.setAttr('m.text', 'Initial');
		const scpNode = doc.createNode('m.scpcss');
		headNode.append(titleNode, scpNode);

		// SSR
		const html = ssrHTML(headNode);
		document.head.innerHTML = html;

		// Add external content before CSR
		const externalLink = document.createElement('link');
		externalLink.rel = 'icon';
		externalLink.href = '/favicon.ico';
		externalLink.id = 'external-link';
		const beginMarker = document.head.querySelector('script[data-mwi="begin"]');
		document.head.insertBefore(externalLink, beginMarker);

		const externalBefore = document.getElementById('external-link');
		assertExists(externalBefore, 'external link present before CSR');

		// CSR in sync mode (synchronous via .rv)
		const { domNodes } = csrSync(headNode, document.head);

		// External content should be preserved
		const externalAfterSync = document.getElementById('external-link');
		assertExists(externalAfterSync, 'external link preserved after sync');
		assertStrictEquals(externalAfterSync, externalBefore, 'same external link');

		// Reactive update
		titleNode.setAttr('m.text', 'Updated');
		await globalThis.reactive.wait();  // Wait for reactive update to propagate

		// External content should still be preserved
		const externalAfterUpdate = document.getElementById('external-link');
		assertExists(externalAfterUpdate, 'external link preserved after reactive update');
		assertStrictEquals(externalAfterUpdate, externalBefore, 'same external link');

		// Title should be updated
		const title = document.head.querySelector('title');
		assertEquals(title.textContent, 'Updated', 'title updated');

		// Style should still be present
		const style = document.head.querySelector('style');
		assertExists(style, 'style element present');
		assert(style.textContent.includes('font-size: 14px'), 'CSS still present');
	});
});
