// CSR-DOM tests for m.script and m.style (MWIAggrScript interface)

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
			featpro: 'mwi.comp.MWIAggr mwi.comp.MWIAggrScript',
		},
	},
});

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIAggrScript');

// Set up browser-like environment for DOM testing
await simulateBrowser();

Deno.test('MWIAggrScript (m.script) - CSR-DOM to mode', async (t) => {
	await t.step('(getDOM) - to mode with inline script returns empty DOM', async () => {
		const doc = getInstance('MWIDocument');
		const scriptNode = doc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['m.text', 'console.log("test");']);
		const domNodes = scriptNode('getDOM');

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM');
	});

	await t.step('.getDOM() - to mode with inline script returns empty DOM via JS', async () => {
		const doc = getInstance('MWIDocument');
		const scriptNode = doc.createNode('m.script');
		scriptNode.setAttr('m.text', 'alert("js");');
		const domNodes = scriptNode.getDOM();

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM via JS');
	});

	await t.step('(getDOM) - to mode with external script returns empty DOM', async () => {
		const doc = getInstance('MWIDocument');
		const scriptNode = doc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['src', '/app.js']);
		const domNodes = scriptNode('getDOM');

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM');
	});

	await t.step('(getDOM) - to mode registers script in aggregation buffer', async () => {
		const doc = getInstance('MWIDocument');

		const scriptNode = doc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['m.text', 'console.log("registered");']);
		scriptNode('getDOM'); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.script:head');
		assert(buffer, 'Should create a buffer for default head key');
		assertEquals(buffer.size, 1, 'Buffer should have one registered script');
	});

	await t.step('(getDOM) - to mode with explicit buffer name registers in named buffer', async () => {
		const doc = getInstance('MWIDocument');

		const scriptNode = doc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['to', 'footer']);
		scriptNode('setAttr', ['src', '/footer.js']);
		scriptNode('getDOM'); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.script:footer');
		assert(buffer, 'Should create a buffer for named key');
		assertEquals(buffer.size, 1, 'Named buffer should have one registered script');
	});

	await t.step('.getDOM() - to mode with explicit buffer name via JS', async () => {
		const doc = getInstance('MWIDocument');

		const scriptNode = doc.createNode('m.script');
		scriptNode.setAttr('to', 'jsFooter');
		scriptNode.setAttr('src', '/footer-js.js');
		scriptNode.getDOM(); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc.getAggr();
		const buffer = aggrData.get('m.script:jsFooter');
		assert(buffer, 'Should create a buffer for named key via JS');
		assertEquals(buffer.size, 1, 'Named buffer should have one registered script via JS');
	});

	await t.step('(getDOM) - Multiple to nodes register in same buffer', async () => {
		const doc = getInstance('MWIDocument');

		const script1 = doc('createNode', ls([, 'm.script']));
		script1('setAttr', ['src', '/lib1.js']);
		script1('getDOM');

		const script2 = doc('createNode', ls([, 'm.script']));
		script2('setAttr', ['src', '/lib2.js']);
		script2('getDOM');

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 2, 'Both scripts should be registered in the same buffer');
	});
});

Deno.test('MWIAggrScript (m.script) - CSR-DOM from mode', async (t) => {
	await t.step('(getDOM) - from mode returns empty DOM when buffer is empty', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'empty-buf']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 0, 'from mode should return empty DOM when buffer is empty');
	});

	await t.step('.getDOM() - from mode returns empty DOM when buffer is empty via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.script');
		fromNode.setAttr('from', 'empty-buf-js');
		const domNodes = fromNode.getDOM();

		assertEquals(domNodes.size, 0, 'from mode should return empty DOM when buffer is empty via JS');
	});

	await t.step('(getDOM) - from mode renders script elements from registered to nodes', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node
		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['src', '/test.js']);
		toNode('getDOM'); // Register in buffer

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		const domNodes = fromNode('getDOM');

		await reactive.wait();
		assertEquals(domNodes.size, 1, 'from mode should render script element from to nodes');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render a script element');
		assertEquals(domNodes.at(0).getAttribute('src'), '/test.js', 'Should have correct src attribute');
	});

	await t.step('.getDOM() - from mode renders script elements from registered to nodes via JS', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node
		const toNode = doc.createNode('m.script');
		toNode.setAttr('src', '/test-js.js');
		toNode.getDOM(); // Register in buffer

		// Create a from node
		const fromNode = doc.createNode('m.script');
		fromNode.setAttr('from', 'head');
		const domNodes = fromNode.getDOM();

		assertEquals(domNodes.size, 1, 'from mode should render script element from to nodes via JS');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render a script element via JS');
		assertEquals(domNodes.at(0).getAttribute('src'), '/test-js.js', 'Should have correct src via JS');
	});

	await t.step('(getDOM) - from mode renders inline script with content', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node with inline content
		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['m.text', 'console.log("inline");']);
		toNode('getDOM'); // Register in buffer

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'from mode should render inline script');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render a script element');
		assertEquals(domNodes.at(0).textContent, 'console.log("inline");', 'Should have inline content');
	});

	await t.step('(getDOM) - from mode renders multiple scripts in buffer', async () => {
		const doc = getInstance('MWIDocument');

		// Register two to nodes
		const script1 = doc('createNode', ls([, 'm.script']));
		script1('setAttr', ['src', '/lib1.js']);
		script1('getDOM');

		const script2 = doc('createNode', ls([, 'm.script']));
		script2('setAttr', ['src', '/lib2.js']);
		script2('getDOM');

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 2, 'from mode should render all registered scripts');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'First should be SCRIPT');
		assertEquals(domNodes.at(0).getAttribute('src'), '/lib1.js', 'First should have correct src');
		assertEquals(domNodes.at(1).tagName, 'SCRIPT', 'Second should be SCRIPT');
		assertEquals(domNodes.at(1).getAttribute('src'), '/lib2.js', 'Second should have correct src');
	});

	await t.step('(getDOM) - from mode with named buffer', async () => {
		const doc = getInstance('MWIDocument');

		// Register a to node in a named buffer
		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['to', 'footer']);
		toNode('setAttr', ['src', '/footer.js']);
		toNode('getDOM');

		// Create a from node for the named buffer
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'footer']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'from mode should render script from named buffer');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render a script element');
		assertEquals(domNodes.at(0).getAttribute('src'), '/footer.js', 'Should have correct src');
	});

	await t.step('(getDOM) - from mode DOM is stable across calls', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'stable']);
		const dom1 = fromNode('getDOM');
		const dom2 = fromNode('getDOM');

		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
	});
});

Deno.test('MWIAggrScript (m.script) - CSR-DOM deduplication', async (t) => {
	await t.step('(getDOM) - Duplicate external scripts are deduplicated', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);

		const script1 = doc('createNode', ls([, 'm.script']));
		script1('setAttr', ['src', '/dup.js']);

		const script2 = doc('createNode', ls([, 'm.script']));
		script2('setAttr', ['src', '/dup.js']); // Duplicate

		doc('append', ls([, fromNode, , script1, , script2]));
		const domNodes = doc('getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Duplicate scripts should be deduplicated in rendering');
		assertEquals(domNodes.at(0).getAttribute('src'), '/dup.js', 'Should render the script once');
	});

	await t.step('.getDOM() - Duplicate inline scripts are deduplicated via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.script');
		fromNode.setAttr('from', 'head');

		const script1 = doc.createNode('m.script');
		script1.setAttr('m.text', 'console.log("dup");');

		const script2 = doc.createNode('m.script');
		script2.setAttr('m.text', 'console.log("dup");'); // Duplicate

		doc.append(fromNode, script1, script2);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Duplicate inline scripts should be deduplicated via JS');
		assertEquals(domNodes.at(0).textContent, 'console.log("dup");', 'Should render the script once via JS');
	});

	await t.step('(getDOM) - Multiple distinct scripts are all rendered', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);

		const script1 = doc('createNode', ls([, 'm.script']));
		script1('setAttr', ['src', '/lib.js']);

		const script2 = doc('createNode', ls([, 'm.script']));
		script2('setAttr', ['src', '/app.js']);

		doc('append', ls([, fromNode, , script1, , script2]));
		const domNodes = doc('getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 2, 'All distinct scripts should be rendered');
		assertEquals(domNodes.at(0).getAttribute('src'), '/lib.js', 'First script rendered');
		assertEquals(domNodes.at(1).getAttribute('src'), '/app.js', 'Second script rendered');
	});
});

Deno.test('MWIAggrScript (m.script) - CSR-DOM reactive behavior', async (t) => {
	await t.step('(getDOM) - from mode reactively updates when to node is added', async () => {
		const doc = getInstance('MWIDocument');

		// Create a from node first (empty buffer)
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'reactive-test']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 0, 'Should be empty initially');

		// Now add a to node
		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['to', 'reactive-test']);
		toNode('setAttr', ['src', '/added.js']);
		toNode('getDOM'); // Register in buffer

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1, 'Should reactively update when to node is added');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render the added script');
		assertEquals(domNodes.at(0).getAttribute('src'), '/added.js', 'Should have correct src');
	});

	await t.step('(getDOM) - from mode reactively updates when to node content changes', async () => {
		const doc = getInstance('MWIDocument');

		// Create a to node with initial content (using m.text for inline script)
		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['to', 'content-change']);
		toNode('setAttr', ['m.text', 'console.log("initial");']);
		toNode('getDOM'); // Register in buffer

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'content-change']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'Should have one script node');
		assertEquals(domNodes.at(0).textContent, 'console.log("initial");', 'Should have initial content');

		// Change the script content
		toNode('setAttr', ['m.text', 'console.log("updated");']);
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'console.log("updated");', 'Should reactively update content');
	});
});

Deno.test('MWIAggrScript (m.script) - CSR-DOM end-to-end in document', async (t) => {
	await t.step('(getDOM) - to/from round-trip in document', async () => {
		const doc = getInstance('MWIDocument');

		// Build a document with a `from` node and a `to` node
		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);

		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['src', '/app.js']);

		doc('append', ls([, fromNode, , toNode]));
		const domNodes = doc('getDOM');
		await reactive.wait();

		// The document should contain the aggregated script (from the from node)
		// and nothing from the to node (it renders empty)
		assertEquals(domNodes.size, 1, 'Document should have one DOM node (from the from node)');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render the aggregated script');
		assertEquals(domNodes.at(0).getAttribute('src'), '/app.js', 'Should have aggregated src');
	});

	await t.step('.getDOM() - to/from round-trip in document via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.script');
		fromNode.setAttr('from', 'head');

		const toNode = doc.createNode('m.script');
		toNode.setAttr('src', '/app-js.js');

		doc.append(fromNode, toNode);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Document should have one DOM node via JS');
		assertEquals(domNodes.at(0).tagName, 'SCRIPT', 'Should render the aggregated script via JS');
		assertEquals(domNodes.at(0).getAttribute('src'), '/app-js.js', 'Should have aggregated src via JS');
	});

	await t.step('(getDOM) - Surrounding content preserved with script aggregation', async () => {
		const doc = getInstance('MWIDocument');

		const beforeNode = doc('createNode', ls([, 'm.t']));
		beforeNode('setAttr', ['t', 'Before']);

		const fromNode = doc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);

		const afterNode = doc('createNode', ls([, 'm.t']));
		afterNode('setAttr', ['t', 'After']);

		const toNode = doc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['src', '/middle.js']);

		doc('append', ls([, beforeNode, , fromNode, , afterNode, , toNode]));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		// Should have: Before text, Middle script (from aggregation), After text
		// The to node renders empty, so we get 3 nodes total
		assertEquals(domNodes.size, 3, 'Should have 3 DOM nodes (before, aggregated, after)');
		assertEquals(domNodes.at(0).textContent, 'Before', 'First should be Before text');
		assertEquals(domNodes.at(1).tagName, 'SCRIPT', 'Second should be aggregated script');
		assertEquals(domNodes.at(1).getAttribute('src'), '/middle.js', 'Second should have middle src');
		assertEquals(domNodes.at(2).textContent, 'After', 'Third should be After text');
	});
});

Deno.test('MWIAggrStyle (m.style) - CSR-DOM to/from modes', async (t) => {
	await t.step('(getDOM) - to mode with inline style returns empty DOM', async () => {
		const doc = getInstance('MWIDocument');
		const styleNode = doc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['m.text', 'body { margin: 0; }']);
		const domNodes = styleNode('getDOM');

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM');
	});

	await t.step('.getDOM() - to mode with inline style returns empty DOM via JS', async () => {
		const doc = getInstance('MWIDocument');
		const styleNode = doc.createNode('m.style');
		styleNode.setAttr('m.text', 'p { color: red; }');
		const domNodes = styleNode.getDOM();

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM via JS');
	});

	await t.step('(getDOM) - to mode with external stylesheet returns empty DOM', async () => {
		const doc = getInstance('MWIDocument');
		const styleNode = doc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['href', '/theme.css']);
		const domNodes = styleNode('getDOM');

		assertEquals(domNodes.size, 0, 'to mode should return empty DOM');
	});

	await t.step('(getDOM) - to mode registers stylesheet in aggregation buffer', async () => {
		const doc = getInstance('MWIDocument');

		const styleNode = doc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['m.text', '.registered { }']);
		styleNode('getDOM'); // Trigger registration

		await globalThis.reactive.wait();

		const aggrData = doc('getAggr');
		const buffer = aggrData.get('m.style:head');
		assert(buffer, 'Should create a buffer for default head key');
		assertEquals(buffer.size, 1, 'Buffer should have one registered stylesheet');
	});

	await t.step('(getDOM) - from mode returns empty DOM when buffer is empty', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'empty-buf']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 0, 'from mode should return empty DOM when buffer is empty');
	});

	await t.step('(getDOM) - from mode renders inline style from registered to nodes', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node with inline style
		const toNode = doc('createNode', ls([, 'm.style']));
		toNode('setAttr', ['m.text', 'body { color: blue; }']);
		toNode('getDOM'); // Register in buffer

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 1, 'from mode should render style element');
		assertEquals(domNodes.at(0).tagName, 'STYLE', 'Should render a style element');
		assertEquals(domNodes.at(0).textContent, 'body { color: blue; }', 'Should have inline content');
	});

	await t.step('.getDOM() - from mode renders external stylesheet from registered to nodes via JS', async () => {
		const doc = getInstance('MWIDocument');

		// Create and register a to node with external stylesheet
		const toNode = doc.createNode('m.style');
		toNode.setAttr('href', '/app.css');
		toNode.getDOM(); // Register in buffer

		// Create a from node
		const fromNode = doc.createNode('m.style');
		fromNode.setAttr('from', 'head');
		const domNodes = fromNode.getDOM();

		assertEquals(domNodes.size, 1, 'from mode should render link element via JS');
		assertEquals(domNodes.at(0).tagName, 'LINK', 'Should render a link element via JS');
		assertEquals(domNodes.at(0).getAttribute('rel'), 'stylesheet', 'Should have rel=stylesheet via JS');
		assertEquals(domNodes.at(0).getAttribute('href'), '/app.css', 'Should have correct href via JS');
	});

	await t.step('(getDOM) - from mode renders multiple stylesheets in buffer', async () => {
		const doc = getInstance('MWIDocument');

		// Register two to nodes
		const style1 = doc('createNode', ls([, 'm.style']));
		style1('setAttr', ['href', '/base.css']);
		style1('getDOM');

		const style2 = doc('createNode', ls([, 'm.style']));
		style2('setAttr', ['href', '/theme.css']);
		style2('getDOM');

		// Create a from node
		const fromNode = doc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);
		const domNodes = fromNode('getDOM');

		assertEquals(domNodes.size, 2, 'from mode should render all registered stylesheets');
		assertEquals(domNodes.at(0).tagName, 'LINK', 'First should be LINK');
		assertEquals(domNodes.at(0).getAttribute('href'), '/base.css', 'First should have correct href');
		assertEquals(domNodes.at(1).tagName, 'LINK', 'Second should be LINK');
		assertEquals(domNodes.at(1).getAttribute('href'), '/theme.css', 'Second should have correct href');
	});

	await t.step('(getDOM) - Duplicate external stylesheets are deduplicated', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);

		const style1 = doc('createNode', ls([, 'm.style']));
		style1('setAttr', ['href', '/dup.css']);

		const style2 = doc('createNode', ls([, 'm.style']));
		style2('setAttr', ['href', '/dup.css']); // Duplicate

		doc('append', ls([, fromNode, , style1, , style2]));
		const domNodes = doc('getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Duplicate stylesheets should be deduplicated in rendering');
		assertEquals(domNodes.at(0).getAttribute('href'), '/dup.css', 'Should render the stylesheet once');
	});

	await t.step('.getDOM() - Duplicate inline styles are deduplicated via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.style');
		fromNode.setAttr('from', 'head');

		const style1 = doc.createNode('m.style');
		style1.setAttr('m.text', '.dup { }');

		const style2 = doc.createNode('m.style');
		style2.setAttr('m.text', '.dup { }'); // Duplicate

		doc.append(fromNode, style1, style2);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Duplicate inline styles should be deduplicated via JS');
		assertEquals(domNodes.at(0).textContent, '.dup { }', 'Should render the style once via JS');
	});

	await t.step('(getDOM) - to/from round-trip in document', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);

		const toNode = doc('createNode', ls([, 'm.style']));
		toNode('setAttr', ['href', '/app.css']);

		doc('append', ls([, fromNode, , toNode]));
		const domNodes = doc('getDOM');
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Document should have one DOM node');
		assertEquals(domNodes.at(0).tagName, 'LINK', 'Should render the aggregated stylesheet');
		assertEquals(domNodes.at(0).getAttribute('href'), '/app.css', 'Should have aggregated href');
	});

	await t.step('.getDOM() - to/from round-trip in document via JS', async () => {
		const doc = getInstance('MWIDocument');

		const fromNode = doc.createNode('m.style');
		fromNode.setAttr('from', 'head');

		const toNode = doc.createNode('m.style');
		toNode.setAttr('href', '/app-js.css');

		doc.append(fromNode, toNode);
		const domNodes = doc.getDOM();
		await reactive.wait();

		assertEquals(domNodes.size, 1, 'Document should have one DOM node via JS');
		assertEquals(domNodes.at(0).tagName, 'LINK', 'Should render the aggregated stylesheet via JS');
		assertEquals(domNodes.at(0).getAttribute('href'), '/app-js.css', 'Should have aggregated href via JS');
	});
});
