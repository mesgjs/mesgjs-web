// Tests for SSR-to-CSR DOM hydration of m.stag (style aggregation).

import {
	assert,
	assertEquals,
	assertExists,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

await setupRuntime({
	modules: {
		'mwi/mwi-style-aggr-comp': {
			url: './src/mwi-style-aggr-comp.msjs',
			featpro: 'mwi.comp.MWIStyleAggr',
		},
	},
});

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIStyleAggr');

await simulateBrowser();

function makeDoc () {
	return getInstance('MWIDocument');
}

function ssrDocHTML (doc) {
	return $c.sm(doc, 'getHTML');
}

function csrSync (node, cursor) {
	const sync = getInstance('MWIDOMSync', [cursor]);
	return node.document.getDOM({ sync });
}

Deno.test('MWIStyleAggr (m.stag) - SSR-CSR Hydration: basic sync', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - SSR-generated style element reused during CSR sync', async () => {
		// SSR: build a document with render node and collector nodes
		const ssrDoc = makeDoc();
		const renderNode = ssrDoc.createNode('m.stag');
		const c1 = ssrDoc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'theme']) });
		ssrDoc.append(renderNode, c1);

		const html = ssrDocHTML(ssrDoc);
		assert(html.includes('<style'), 'SSR includes style tag');
		assert(html.includes(':root { container-name: theme; }'), 'SSR includes style rule');

		// Load into browser
		document.body.innerHTML = html;
		const ssrStyle = document.body.querySelector('style');
		assertExists(ssrStyle, 'SSR style element exists');
		assertEquals(ssrStyle.textContent, ':root { container-name: theme; }');

		// CSR: reconstruct from SSR subSpec and sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const domNodes = csrSync(csrRoot, ssrStyle);
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'renders 1 DOM node');
		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR style element reused during CSR sync');
		assertEquals(domNodes.at(0).textContent, ':root { container-name: theme; }', 'content preserved');
	});

	await simulateBrowser();

	await t.step('.getDOM() - SSR-generated style element reused during CSR sync via JS', async () => {
		const ssrDoc = makeDoc();
		const renderNode = ssrDoc.createNode('m.stag');
		const c1 = ssrDoc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, '#app', , 'container-name', , 'main']) });
		ssrDoc.append(renderNode, c1);

		const html = ssrDoc.getHTML();
		document.body.innerHTML = html;
		const ssrStyle = document.body.querySelector('style');
		assertExists(ssrStyle, 'SSR style element exists');

		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const sync = getInstance('MWIDOMSync', [ssrStyle]);
		const domNodes = csrDoc.getDOM({ sync });
		await reactive.wait();

		assertEquals(domNodes.size, 1);
		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR style reused via JS sync');
	});
});

Deno.test('MWIStyleAggr (m.stag) - SSR-CSR Hydration: post-hydration reactivity', async (t) => {
	await simulateBrowser();

	await t.step('(getDOM) - dynamically adding a collector node after hydration updates synced style element', async () => {
		const ssrDoc = makeDoc();
		const renderNode = ssrDoc.createNode('m.stag');
		const c1 = ssrDoc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'base']) });
		ssrDoc.append(renderNode, c1);

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrStyle = document.body.querySelector('style');
		assertExists(ssrStyle);

		// CSR sync
		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const domNodes = csrSync(csrRoot, ssrStyle);
		await reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrStyle, 'SSR style node reused');
		assertEquals(domNodes.at(0).textContent, ':root { container-name: base; }');

		// Dynamically append new collector node in CSR
		const c2 = csrDoc.createNode('m.stag');
		c2.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'dynamic']) });
		csrDoc.append(c2);
		csrDoc.getDOM(); // Register c2
		await reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrStyle, 'same DOM style element is retained');
		assertEquals(domNodes.at(0).textContent, ':root { container-name: base dynamic; }', 'style element text updated reactively after hydration');
	});

	await simulateBrowser();

	await t.step('(getDOM) - modifying existing collector node after hydration updates synced style element', async () => {
		const ssrDoc = makeDoc();
		const renderNode = ssrDoc.createNode('m.stag');
		const c1 = ssrDoc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'oldVal']) });
		ssrDoc.append(renderNode, c1);

		const html = ssrDocHTML(ssrDoc);
		document.body.innerHTML = html;
		const ssrStyle = document.body.querySelector('style');

		const subSpec = ssrDoc.root.getSubSpec();
		const csrDoc = makeDoc(), csrRoot = csrDoc.root;
		csrRoot.setSubSpec({ subSpec });

		const domNodes = csrSync(csrRoot, ssrStyle);
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, ':root { container-name: oldVal; }');

		// Mutate collector node in CSR subDoc
		const csrSubDoc = csrRoot.getSubDoc();
		const csrCollector = csrSubDoc.at(1);
		csrCollector.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'newVal']) });
		await reactive.wait();

		assertStrictEquals(domNodes.at(0), ssrStyle, 'same DOM style element is retained');
		assertEquals(domNodes.at(0).textContent, ':root { container-name: newVal; }', 'style element text updated reactively after subSpec modification');
	});
});
