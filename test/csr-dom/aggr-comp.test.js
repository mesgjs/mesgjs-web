import {
	assert,
	assertEquals,
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

Deno.test('MWIAggr (m.aggr) - CSR-DOM to mode', async (t) => {
	await t.step('(getDOM) - to mode returns empty DOM', async () => {
		const doc = getInstance('MWIDocument');
		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([m.t t=Content])]') });
		const domNodes = toNode('getDOM');

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM');
	});

	await t.step('.getDOM() - to mode returns empty DOM via JS', async () => {
		const doc = getInstance('MWIDocument');
		const toNode = doc.createNode('m.aggr');
		toNode.setSubSpec({ subSpec: ps('[([m.t t=Content])]') });
		const domNodes = toNode.getDOM();

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM via JS');
	});

	await t.step('(getDOM) - to mode registers node in aggregation buffer', async () => {
		const doc = getInstance('MWIDocument');

		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([m.t t=Registered])]') });
		toNode('getDOM'); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.aggr:default');
		assert(buffer, 'Should create a buffer for default key');
		assertEquals(buffer.size, 1, 'Buffer should have one registered node');
	});

	await t.step('(getDOM) - to mode with explicit buffer name registers in named buffer', async () => {
		const doc = getInstance('MWIDocument');

		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'myBuffer']);
		toNode('setSubSpec', { subSpec: ps('[([m.t t=Named])]') });
		toNode('getDOM'); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.aggr:myBuffer');
		assert(buffer, 'Should create a buffer for named key');
		assertEquals(buffer.size, 1, 'Named buffer should have one registered node');
	});

	await t.step('.getDOM() - to mode with explicit buffer name via JS', async () => {
		const doc = getInstance('MWIDocument');

		const toNode = doc.createNode('m.aggr');
		toNode.setAttr('to', 'jsBuffer');
		toNode.setSubSpec({ subSpec: ps('[([m.t t=JSNamed])]') });
		toNode.getDOM(); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc.getAggr();
		const buffer = aggrData.get('m.aggr:jsBuffer');
		assert(buffer, 'Should create a buffer for named key via JS');
		assertEquals(buffer.size, 1, 'Named buffer should have one registered node via JS');
	});

	await t.step('(getDOM) - Multiple to nodes register in same buffer', async () => {
		const doc = getInstance('MWIDocument');

		const toNode1 = doc('createNode', ls([, 'm.aggr']));
		toNode1('setSubSpec', { subSpec: ps('[([m.t t=First])]') });
		toNode1('getDOM');

		const toNode2 = doc('createNode', ls([, 'm.aggr']));
		toNode2('setSubSpec', { subSpec: ps('[([m.t t=Second])]') });
		toNode2('getDOM');

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.aggr:default');
		assertEquals(buffer.size, 2, 'Both nodes should be registered in the same buffer');
	});
});

Deno.test('MWIAggr (m.aggr) - CSR-DOM from mode', async (t) => {
	await t.step('(getDOM) - from mode returns empty DOM when buffer is empty', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'empty-buf']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 0, 'from mode should return empty DOM when buffer is empty');
	});

	await t.step('.getDOM() - from mode returns empty DOM when buffer is empty via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.aggr');
		fromNode.setAttr('from', 'empty-buf-js');
		const domNodes = fromNode.getDOM();

		assertEquals(domNodes.size, 0, 'from mode should return empty DOM when buffer is empty via JS');
	});

	await t.step('(getDOM) - from mode renders content from registered to nodes', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node
		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.span Content])]') });
		toNode('getDOM'); // Register in buffer

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'from mode should render content from to nodes');
		assertEquals(domNodes.at(0).tagName, 'SPAN', 'Should render the span element');
		assertEquals(domNodes.at(0).textContent, 'Content', 'Should have correct text content');
	});

	await t.step('.getDOM() - from mode renders content from registered to nodes via JS', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node
		const toNode = doc.createNode('m.aggr');
		toNode.setSubSpec({ subSpec: ps('[([h.div JSContent])]') });
		toNode.getDOM(); // Register in buffer

		// Create a from node
		const fromNode = doc.createNode('m.aggr');
		fromNode.setAttr('from', 'default');
		const domNodes = fromNode.getDOM();

		assertEquals(domNodes.size, 1, 'from mode should render content from to nodes via JS');
		assertEquals(domNodes.at(0).tagName, 'DIV', 'Should render the div element via JS');
		assertEquals(domNodes.at(0).textContent, 'JSContent', 'Should have correct text content via JS');
	});

	await t.step('(getDOM) - from mode renders multiple to nodes in buffer', async () => {
		const doc = getInstance('MWIDocument');

		// Register two to nodes
		const toNode1 = doc('createNode', ls([, 'm.aggr']));
		toNode1('setSubSpec', { subSpec: ps('[([h.li Item1])]') });
		toNode1('getDOM');

		const toNode2 = doc('createNode', ls([, 'm.aggr']));
		toNode2('setSubSpec', { subSpec: ps('[([h.li Item2])]') });
		toNode2('getDOM');

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 2, 'from mode should render all registered to nodes');
		assertEquals(domNodes.at(0).tagName, 'LI', 'First should be LI');
		assertEquals(domNodes.at(0).textContent, 'Item1', 'First should have correct text');
		assertEquals(domNodes.at(1).tagName, 'LI', 'Second should be LI');
		assertEquals(domNodes.at(1).textContent, 'Item2', 'Second should have correct text');
	});

	await t.step('(getDOM) - from mode with named buffer', async () => {
		const doc = getInstance('MWIDocument');

		// Register a to node in a named buffer
		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'named']);
		toNode('setSubSpec', { subSpec: ps('[([h.p Named])]') });
		toNode('getDOM');

		// Create a from node for the named buffer
		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'named']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'from mode should render content from named buffer');
		assertEquals(domNodes.at(0).tagName, 'P', 'Should render the paragraph element');
		assertEquals(domNodes.at(0).textContent, 'Named', 'Should have correct text content');
	});

	await t.step('(getDOM) - from mode DOM is stable across calls', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'stable']);
		const dom1 = fromNode('getDOM');
		const dom2 = fromNode('getDOM');

		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
	});
});

Deno.test('MWIAggr (m.aggr) - CSR-DOM reactive behavior', async (t) => {
	await t.step('(getDOM) - from mode reactively updates when to node is added', async () => {
		const doc = getInstance('MWIDocument');

		// Create a from node first (empty buffer)
		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'reactive-test']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 0, 'Should be empty initially');

		// Now add a to node
		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'reactive-test']);
		toNode('setSubSpec', { subSpec: ps('[([h.span Added])]') });
		toNode('getDOM'); // Register in buffer

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1, 'Should reactively update when to node is added');
		assertEquals(domNodes.at(0).tagName, 'SPAN', 'Should render the added span');
		assertEquals(domNodes.at(0).textContent, 'Added', 'Should have correct text');
	});

	await t.step('(getDOM) - from mode reactively updates when to node content changes', async () => {
		const doc = getInstance('MWIDocument');

		// Create a to node with initial content
		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'content-change']);
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ['t', 'Initial']);
		toNode('append', ls([, textNode]));
		toNode('getDOM'); // Register in buffer

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'content-change']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'Should have one text node');
		assertEquals(domNodes.at(0).textContent, 'Initial', 'Should have initial text');

		// Change the text content
		textNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Updated', 'Should reactively update text');
	});
});

Deno.test('MWIAggr (m.aggr) - CSR-DOM CSR-only fallback', async (t) => {
	await t.step('(getDOM) - from mode uses local sub-doc as fallback when buffer is empty', async () => {
		// When there are no `to` nodes registered in the buffer, the `from` node
		// falls back to rendering its own sub-doc (CSR-only fallback feature)
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'fallback-test']);
		// Set local sub-doc content as fallback
		fromNode('setSubSpec', { subSpec: ps('[([h.p Fallback])]') });
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'Should render fallback content when buffer is empty');
		assertEquals(domNodes.at(0).tagName, 'P', 'Should render the fallback paragraph');
		assertEquals(domNodes.at(0).textContent, 'Fallback', 'Should have fallback text');
	});

	await t.step('.getDOM() - from mode uses local sub-doc as fallback via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.aggr');
		fromNode.setAttr('from', 'fallback-test-js');
		fromNode.setSubSpec({ subSpec: ps('[([h.div JSFallback])]') });
		const domNodes = fromNode.getDOM();

		assertEquals(domNodes.size, 1, 'Should render fallback content via JS');
		assertEquals(domNodes.at(0).tagName, 'DIV', 'Should render the fallback div via JS');
		assertEquals(domNodes.at(0).textContent, 'JSFallback', 'Should have fallback text via JS');
	});

	await t.step('(getDOM) - from mode switches from fallback to registered content when to node is added', async () => {
		// When a `to` node is added after the `from` node was using fallback content,
		// the `from` node should switch to rendering the registered content
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'switch-test']);
		fromNode('setSubSpec', { subSpec: ps('[([h.p FallbackContent])]') });
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'Should render fallback initially');
		assertEquals(domNodes.at(0).textContent, 'FallbackContent', 'Should have fallback text');

		// Now add a to node
		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'switch-test']);
		toNode('setSubSpec', { subSpec: ps('[([h.span RegisteredContent])]') });
		toNode('getDOM'); // Register in buffer

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1, 'Should switch to registered content');
		assertEquals(domNodes.at(0).tagName, 'SPAN', 'Should render registered span');
		assertEquals(domNodes.at(0).textContent, 'RegisteredContent', 'Should have registered text');
	});

	await t.step('(getDOM) - from mode with no fallback and no to nodes returns empty DOM', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'no-fallback']);
		// No sub-spec set (no fallback)
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 0, 'Should return empty DOM when no fallback and no to nodes');
	});
});

Deno.test('MWIAggr (m.aggr) - CSR-DOM end-to-end in document', async (t) => {
	await t.step('(getDOM) - to/from round-trip in document', async () => {
		const doc = getInstance('MWIDocument');

		// Build a document with a `from` node and a `to` node
		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);

		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.p Aggregated])]') });

		doc('append', ls([, fromNode, , toNode]));
		const domNodes = doc('getDOM');
		await reactive.wait();

		// The document should contain the aggregated content (from the from node)
		// and nothing from the to node (it renders empty)
		assertEquals(domNodes.size, 1, 'Document should have one DOM node (from the from node)');
		assertEquals(domNodes.at(0).tagName, 'P', 'Should render the aggregated paragraph');
		assertEquals(domNodes.at(0).textContent, 'Aggregated', 'Should have aggregated text');
	});

	await t.step('.getDOM() - to/from round-trip in document via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.aggr');
		fromNode.setAttr('from', 'default');

		const toNode = doc.createNode('m.aggr');
		toNode.setSubSpec({ subSpec: ps('[([h.div JSAggregated])]') });

		doc.append(fromNode, toNode);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Document should have one DOM node via JS');
		assertEquals(domNodes.at(0).tagName, 'DIV', 'Should render the aggregated div via JS');
		assertEquals(domNodes.at(0).textContent, 'JSAggregated', 'Should have aggregated text via JS');
	});

	await t.step('(getDOM) - Surrounding content preserved with aggregation', async () => {
		const doc = getInstance('MWIDocument');

		const beforeNode = doc('createNode', ls([, 'm.t']));
		beforeNode('setAttr', ['t', 'Before']);

		const fromNode = doc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);

		const afterNode = doc('createNode', ls([, 'm.t']));
		afterNode('setAttr', ['t', 'After']);

		const toNode = doc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.span Middle])]') });

		doc('append', ls([, beforeNode, , fromNode, , afterNode, , toNode]));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		// Should have: Before text, Middle span (from aggregation), After text
		// The to node renders empty, so we get 3 nodes total
		assertEquals(domNodes.size, 3, 'Should have 3 DOM nodes (before, aggregated, after)');
		assertEquals(domNodes.at(0).textContent, 'Before', 'First should be Before text');
		assertEquals(domNodes.at(1).tagName, 'SPAN', 'Second should be aggregated span');
		assertEquals(domNodes.at(1).textContent, 'Middle', 'Second should have Middle text');
		assertEquals(domNodes.at(2).textContent, 'After', 'Third should be After text');
	});
});
