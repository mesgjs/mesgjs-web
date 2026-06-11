import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

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

const doc = getInstance('MWIDocument');

// Note to readers:
// Partial tag matches are intentional.
// The first HTML element of an aggregate buffer is typically
// assigned an id automatically (if it doesn't have one already)
// as a DOM sync aid.

Deno.test('MWIAggr (m.aggr) - SSR-HTML to mode (default buffer)', async (t) => {
	await t.step('(getHTML) - to mode returns empty string', () => {
		const testDoc = getInstance('MWIDocument');
		const aggrNode = testDoc('createNode', ls([, 'm.aggr']));
		aggrNode('setSubSpec', { subSpec: ps('[([m.t t=Content])]') });
		const html = aggrNode('getHTML');
		assertEquals(html, '', 'to mode should return empty string');
	});

	await t.step('.getHTML() - to mode returns empty string via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const aggrNode = testDoc.createNode('m.aggr');
		aggrNode.setSubSpec({ subSpec: ps('[([m.t t=Content])]') });
		const html = aggrNode.getHTML();
		assertEquals(html, '', 'to mode should return empty string via JS');
	});

	await t.step('(getHTML) - to mode stores content in aggregation map', () => {
		const testDoc = getInstance('MWIDocument');

		const aggrNode = testDoc('createNode', ls([, 'm.aggr']));
		aggrNode('setSubSpec', { subSpec: ps('[([m.t t=Stored])]') });
		aggrNode('getHTML'); // Trigger aggregation

		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.aggr:default');
		assert(buffer instanceof Map, 'Should create a buffer Map for default key');
		assert(buffer.size > 0, 'Buffer should have content');

		// Verify the stored content
		const values = [...buffer.values()];
		assertEquals(values[0], 'Stored', 'Should store rendered text content');
	});

	await t.step('(getHTML) - to mode with explicit buffer name', () => {
		const testDoc = getInstance('MWIDocument');

		const aggrNode = testDoc('createNode', ls([, 'm.aggr']));
		aggrNode('setAttr', ['to', 'myBuffer']);
		aggrNode('setSubSpec', { subSpec: ps('[([m.t t=MyContent])]') });
		aggrNode('getHTML'); // Trigger aggregation

		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.aggr:myBuffer');
		assert(buffer instanceof Map, 'Should create a buffer Map for named key');
		assert(buffer.size > 0, 'Buffer should have content');

		const values = [...buffer.values()];
		assertEquals(values[0], 'MyContent', 'Should store content in named buffer');
	});

	await t.step('.getHTML() - to mode with explicit buffer name via JS', () => {
		const testDoc = getInstance('MWIDocument');

		const aggrNode = testDoc.createNode('m.aggr');
		aggrNode.setAttr('to', 'jsBuffer');
		aggrNode.setSubSpec({ subSpec: ps('[([m.t t=JSContent])]') });
		aggrNode.getHTML(); // Trigger aggregation

		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.aggr:jsBuffer');
		assert(buffer instanceof Map, 'Should create a buffer Map for named key via JS');
		assert(buffer.size > 0, 'Buffer should have content via JS');
	});

	await t.step('(getHTML) - Multiple to nodes accumulate in same buffer', () => {
		const testDoc = getInstance('MWIDocument');

		const node1 = testDoc('createNode', ls([, 'm.aggr']));
		node1('setSubSpec', { subSpec: ps('[([m.t t=First])]') });
		node1('getHTML');

		const node2 = testDoc('createNode', ls([, 'm.aggr']));
		node2('setSubSpec', { subSpec: ps('[([m.t t=Second])]') });
		node2('getHTML');

		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.aggr:default');
		assertEquals(buffer.size, 2, 'Both nodes should be in the same buffer');

		const values = [...buffer.values()];
		assert(values.includes('First'), 'Should include first content');
		assert(values.includes('Second'), 'Should include second content');
	});

	await t.step('(getHTML) - to mode with HTML children', () => {
		const testDoc = getInstance('MWIDocument');
		const aggrNode = testDoc('createNode', ls([, 'm.aggr']));
		aggrNode('setSubSpec', { subSpec: ps('[([h.span class=item Item])]') });
		aggrNode('getHTML');

		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.aggr:default');
		const values = [...buffer.values()];
		assert(values[0].includes('<span class="item"'), 'Should store rendered HTML');
		assert(values[0].includes('>Item</span>'), 'Should store rendered HTML');
	});
});

Deno.test('MWIAggr (m.aggr) - SSR-HTML from mode', async (t) => {
	await t.step('(getHTML) - from mode returns placeholder', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		const html = fromNode('getHTML');

		// Should return a placeholder like <{0}>
		assert(html.startsWith('<{'), 'Should return a placeholder');
		assert(html.endsWith('>'), 'Placeholder should end with >');
		assert(/^<\{\d+\}>$/.test(html), 'Placeholder should be <{number}>');
	});

	await t.step('.getHTML() - from mode returns placeholder via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc.createNode('m.aggr');
		fromNode.setAttr('from', 'default');
		const html = fromNode.getHTML();

		assert(/^<\{\d+\}>$/.test(html), 'Placeholder should be <{number}> via JS');
	});

	await t.step('(getHTML) - from mode allocates buffer ID via mapAggrBuffer', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'myBuf']);
		const html = fromNode('getHTML');

		// Extract the buffer ID from the placeholder
		const match = html.match(/^<\{(\d+)\}>$/);
		assert(match, 'Should have a valid placeholder');
		const bufferId = parseInt(match[1], 10);

		// Verify the buffer ID maps to the correct key
		const bufferName = testDoc('mapAggrBuffer', ls([, bufferId]));
		assertEquals(bufferName, 'm.aggr:myBuf', 'Buffer ID should map to correct key');
	});

	await t.step('(getHTML) - from mode with same buffer name returns same placeholder', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode1 = testDoc('createNode', ls([, 'm.aggr']));
		fromNode1('setAttr', ['from', 'shared']);
		const html1 = fromNode1('getHTML');

		const fromNode2 = testDoc('createNode', ls([, 'm.aggr']));
		fromNode2('setAttr', ['from', 'shared']);
		const html2 = fromNode2('getHTML');

		assertEquals(html1, html2, 'Same buffer name should produce same placeholder');
	});

	await t.step('(getHTML) - from mode with different buffer names returns different placeholders', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode1 = testDoc('createNode', ls([, 'm.aggr']));
		fromNode1('setAttr', ['from', 'bufA']);
		const html1 = fromNode1('getHTML');

		const fromNode2 = testDoc('createNode', ls([, 'm.aggr']));
		fromNode2('setAttr', ['from', 'bufB']);
		const html2 = fromNode2('getHTML');

		assert(html1 !== html2, 'Different buffer names should produce different placeholders');
	});
});

Deno.test('MWIAggr (m.aggr) - SSR-HTML m.csr suppression', async (t) => {
	await t.step('(getHTML) - m.csr=true suppresses all output', () => {
		const testDoc = getInstance('MWIDocument');

		// Test `from` mode with m.csr
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);
		fromNode('setAttr', ['m.csr', true]);
		const html = fromNode('getHTML');
		assertEquals(html, '', 'from mode with m.csr should return empty string');
	});

	await t.step('.getHTML() - m.csr=true suppresses all output via JS', () => {
		const testDoc = getInstance('MWIDocument');

		const fromNode = testDoc.createNode('m.aggr');
		fromNode.setAttr('from', 'default');
		fromNode.setAttr('m.csr', true);
		const html = fromNode.getHTML();
		assertEquals(html, '', 'from mode with m.csr should return empty string via JS');
	});

	await t.step('(getHTML) - m.csr=true suppresses to mode output', () => {
		const testDoc = getInstance('MWIDocument');
		const toNode = testDoc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['m.csr', true]);
		toNode('setSubSpec', { subSpec: ps('[([m.t t=CSROnly])]') });
		const html = toNode('getHTML');
		assertEquals(html, '', 'to mode with m.csr should return empty string');

		// Also verify nothing was stored in the aggregation map
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.aggr:default');
		assert(!buffer || buffer.size === 0, 'Should not store content when m.csr is set');
	});
});

Deno.test('MWIAggr (m.aggr) - SSR-HTML end-to-end via MWIDocument.getHTML', async (t) => {
	await t.step('(getHTML) - to/from round-trip via document', () => {
		const testDoc = getInstance('MWIDocument');

		// Build a document with a `from` node first, then a `to` node
		// (simulating content that appears before its aggregation source)
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);

		const toNode = testDoc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([h.p Aggregated])]') });

		testDoc('append', ls([, fromNode, , toNode]));

		const html = testDoc('getHTML');
		assert(html.includes('>Aggregated</p>'), 'Should include aggregated content');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('.getHTML() - to/from round-trip via document via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc.createNode('m.aggr');
		fromNode.setAttr('from', 'default');

		const toNode = testDoc.createNode('m.aggr');
		toNode.setSubSpec({ subSpec: ps('[([h.p JSAggregated])]') });

		testDoc.append(fromNode, toNode);

		const html = testDoc.getHTML();
		assert(html.includes('>JSAggregated</p>'), 'Should include aggregated content via JS');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders via JS');
	});

	await t.step('(getHTML) - Multiple to nodes aggregated to single from', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);

		const toNode1 = testDoc('createNode', ls([, 'm.aggr']));
		toNode1('setSubSpec', { subSpec: ps('[([h.li Item1])]') });

		const toNode2 = testDoc('createNode', ls([, 'm.aggr']));
		toNode2('setSubSpec', { subSpec: ps('[([h.li Item2])]') });

		testDoc('append', ls([, fromNode, , toNode1, , toNode2]));

		const html = testDoc('getHTML');
		assert(html.includes('>Item1</li>'), 'Should include first item');
		assert(html.includes('>Item2</li>'), 'Should include second item');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('(getHTML) - Named buffer aggregation', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'scripts']);

		const toNode = testDoc('createNode', ls([, 'm.aggr']));
		toNode('setAttr', ['to', 'scripts']);
		toNode('setSubSpec', { subSpec: ps('[([h.script type=text/javascript console.log(1)])]') });

		testDoc('append', ls([, fromNode, , toNode]));

		const html = testDoc('getHTML');
		assert(html.includes('<script'), 'Should include script tag');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('(getHTML) - Empty buffer renders nothing', () => {
		const testDoc = getInstance('MWIDocument');

		// Only a `from` node, no `to` nodes
		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'empty']);
		testDoc('append', ls([, fromNode]));

		const html = testDoc('getHTML');
		assertEquals(html, '', 'Empty buffer should render nothing');
	});

	await t.step('(getHTML) - Surrounding content preserved', () => {
		const testDoc = getInstance('MWIDocument');
		const beforeNode = testDoc('createNode', ls([, 'm.t']));
		beforeNode('setAttr', ['t', 'Before']);

		const fromNode = testDoc('createNode', ls([, 'm.aggr']));
		fromNode('setAttr', ['from', 'default']);

		const afterNode = testDoc('createNode', ls([, 'm.t']));
		afterNode('setAttr', ['t', 'After']);

		const toNode = testDoc('createNode', ls([, 'm.aggr']));
		toNode('setSubSpec', { subSpec: ps('[([m.t t=Middle])]') });

		testDoc('append', ls([, beforeNode, , fromNode, , afterNode, , toNode]));

		const html = testDoc('getHTML');
		assert(html.includes('Before'), 'Should include before text');
		assert(html.includes('Middle'), 'Should include aggregated content');
		assert(html.includes('After'), 'Should include after text');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');

		// Verify order: Before, then Middle (from aggregation), then After
		const beforeIdx = html.indexOf('Before');
		const middleIdx = html.indexOf('Middle');
		const afterIdx = html.indexOf('After');
		assert(beforeIdx < middleIdx, 'Before should come before Middle');
		assert(middleIdx < afterIdx, 'Middle should come before After');
	});

	await t.step('(getHTML) - from-within-to: nested from inside to subSpec resolves correctly', () => {
		// This tests the key scenario where a `to`-mode node's subSpec contains a `from`-mode
		// node, causing a <{N}> placeholder to be embedded inside aggregated buffer content.
		// The SSR string-surgery in opGetHTML must recursively resolve placeholders that were
		// injected via a prior buffer substitution.
		//
		// Structure:
		//   [h.header [m.aggr from=header]]          <- from=header renders placeholder <{0}>
		//   [m.aggr to=header                         <- to=header stores content in header buffer
		//       [h.title m.text="Page Title"]
		//       [h.nav [m.aggr from=nav]]             <- from=nav inside to=header: <{1}> in buffer
		//   ]
		//   [m.aggr to=nav [h.a href=/ Home]]
		//   [m.aggr to=nav [h.a href=/about About]]
		//   [m.aggr to=nav [h.a href=/contact Contact]]
		const testDoc = getInstance('MWIDocument');

		testDoc('append', { list: ps(`[(
			[h.header [m.aggr from=header]]
			[m.aggr to=header
				[h.title m.text="Page Title"]
				[h.nav [m.aggr from=nav]]
			]
			[m.aggr to=nav [h.a href=/ Home]]
			[m.aggr to=nav [h.a href=/about About]]
			[m.aggr to=nav [h.a href=/contact Contact]]
		)]`) });

		const html = testDoc('getHTML');

		// All nav links should appear (nested placeholder resolved)
		assert(html.includes('>Home</a>'), 'Should include Home link');
		assert(html.includes('>About</a>'), 'Should include About link');
		assert(html.includes('>Contact</a>'), 'Should include Contact link');

		// The title should appear inside the header
		assert(html.includes('>Page Title</title>'), 'Should include page title');

		// The nav should wrap the links
		assert(html.includes('<nav'), 'Should include nav element');

		// The header should wrap everything
		assert(html.includes('<header>'), 'Should include header element');

		// No unresolved placeholders
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');

		// Structural order: header wraps title and nav; nav wraps links
		const headerIdx = html.indexOf('<header>');
		const titleIdx = html.indexOf('>Page Title</title>');
		const navIdx = html.indexOf('<nav');
		const homeIdx = html.indexOf('>Home</a>');
		const headerCloseIdx = html.indexOf('</header>');

		assert(headerIdx < titleIdx, 'header should open before title');
		assert(titleIdx < navIdx, 'title should come before nav');
		assert(navIdx < homeIdx, 'nav should open before Home link');
		assert(homeIdx < headerCloseIdx, 'Home link should be inside header');
	});

	await t.step('.getHTML() - from-within-to: nested from inside to subSpec resolves correctly via JS', () => {
		const testDoc = getInstance('MWIDocument');

		testDoc.append({ list: ps(`[(
			[h.header [m.aggr from=header]]
			[m.aggr to=header
				[h.title m.text="Page Title"]
				[h.nav [m.aggr from=nav]]
			]
			[m.aggr to=nav [h.a href=/ Home]]
			[m.aggr to=nav [h.a href=/about About]]
			[m.aggr to=nav [h.a href=/contact Contact]]
		)]`) });

		const html = testDoc.getHTML();

		assert(html.includes('>Home</a>'), 'Should include Home link via JS');
		assert(html.includes('>About</a>'), 'Should include About link via JS');
		assert(html.includes('>Contact</a>'), 'Should include Contact link via JS');
		assert(html.includes('>Page Title</title>'), 'Should include page title via JS');
		assert(html.includes('<nav'), 'Should include nav element via JS');
		assert(html.includes('<header>'), 'Should include header element via JS');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders via JS');
	});
});
