import {
	assert,
	assertEquals,
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

Deno.test('MWIStyleAggr (m.stag) - CSR-DOM collector mode', async (t) => {
	await t.step('(getDOM) - collector node returns empty DOM', () => {
		const doc = getInstance('MWIDocument');
		const collector = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		$c.sm(collector, 'setSubSpec', { subSpec: ls([, ':root', , 'container-name', , 'group1']) });
		const domNodes = $c.sm(collector, 'getDOM');

		assertEquals(domNodes.size, 0, 'collector node should return empty DOM');
	});

	await t.step('.getDOM() - collector node returns empty DOM via JS', () => {
		const doc = getInstance('MWIDocument');
		const collector = doc.createNode('m.stag');
		collector.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });
		const domNodes = collector.getDOM();

		assertEquals(domNodes.size, 0, 'collector node should return empty DOM via JS');
	});
});

Deno.test('MWIStyleAggr (m.stag) - CSR-DOM render mode & mounting', async (t) => {
	await t.step('(getDOM) - renders <style> element with aggregated CSS rules', async () => {
		const doc = getInstance('MWIDocument');
		const renderNode = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		const c1 = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		$c.sm(c1, 'setSubSpec', { subSpec: ls([, ':root', , 'container-name', , 'group1']) });
		const c2 = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		$c.sm(c2, 'setSubSpec', { subSpec: ls([, ':root', , 'container-name', , 'group2']) });

		$c.sm(doc, 'append', ls([, renderNode, , c1, , c2]));
		const domNodes = $c.sm(doc, 'getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Document should render 1 DOM node for the <style> element');
		assertEquals(domNodes.at(0).tagName, 'STYLE', 'DOM node should be <style>');
		assertEquals(domNodes.at(0).textContent, ':root { container-name: group1 group2; }', 'Style tag content should match aggregated CSS');
	});

	await t.step('.getDOM() - renders <style> element via JS', async () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c1 = doc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });

		doc.append(renderNode, c1);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Document should render 1 DOM node via JS');
		assertEquals(domNodes.at(0).tagName, 'STYLE', 'DOM node should be <style> via JS');
		assertEquals(domNodes.at(0).textContent, ':root { container-name: group1; }', 'Style tag content should match aggregated CSS via JS');
	});

	await t.step('(getDOM) - render node DOM is stable across multiple getDOM calls', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const dom1 = renderNode.getDOM();
		const dom2 = renderNode.getDOM();

		assertStrictEquals(dom1, dom2, 'getDOM should return stable NANOS');
	});
});

Deno.test('MWIStyleAggr (m.stag) - CSR-DOM Reactivity', async (t) => {
	await t.step('(getDOM) - dynamically appending a collector node updates stylesheet reactively', async () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c1 = doc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'initial']) });

		doc.append(renderNode, c1);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, ':root { container-name: initial; }');

		// Append new collector node
		const c2 = doc.createNode('m.stag');
		c2.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'added']) });
		doc.append(c2);
		doc.getDOM(); // Register c2 in CSR phase
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, ':root { container-name: initial added; }', 'Stylesheet should reactively update with new value');
	});

	await t.step('(getDOM) - modifying subSpec on existing collector node updates stylesheet reactively', async () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c1 = doc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'v1']) });

		doc.append(renderNode, c1);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, ':root { container-name: v1; }');

		// Modify subSpec of c1
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'v2']) });
		await reactive.wait();

		assertEquals(domNodes.at(0).textContent, ':root { container-name: v2; }', 'Stylesheet should reactively reflect changed subSpec');
	});
});
