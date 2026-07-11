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
const { ls } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIAggr');

Deno.test('MWIDocument - getHTML with aggregate placeholder replacement', async (t) => {
	await t.step('(getHTML) - No aggregation: returns plain HTML', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.div hello])]']));
		const html =  $c.sm(doc, 'getHTML');
		assertEquals(html, '<div>hello</div>', 'Should return plain HTML without aggregation');
	});

	await t.step('(getHTML) - Replaces placeholder with aggregated content', () => {
		const doc = getInstance('MWIDocument');

		// Manually set up aggregation: create a buffer and a placeholder
		const bufferKey = 'm.aggr:default';
		$c.sm(doc, 'mapAggrBuffer', ls([, bufferKey]));

		// Populate the aggregation map with content
		const aggrData =  $c.sm(doc, 'getAggr');
		const buffer = new Map();
		buffer.set(Symbol(), '<p>Aggregated Content</p>');
		aggrData.set(bufferKey, buffer);

		// Create a node that renders the placeholder (set `from` attribute after creation)
		const aggrNode = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(aggrNode, 'setAttr', ['from', 'default']);
		$c.sm(doc, 'append', ls([, aggrNode]));

		const html =  $c.sm(doc, 'getHTML');
		assert(html.includes('<p>Aggregated Content</p>'), 'Should include aggregated content');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('(getHTML) - Multiple placeholders replaced correctly', () => {
		const doc = getInstance('MWIDocument');

		// Set up two buffers
		const key1 = 'm.aggr:buf1';
		const key2 = 'm.aggr:buf2';
		$c.sm(doc, 'mapAggrBuffer', ls([, key1]));
		$c.sm(doc, 'mapAggrBuffer', ls([, key2]));

		const aggrData =  $c.sm(doc, 'getAggr');
		const buf1 = new Map();
		buf1.set(Symbol(), '<span>First</span>');
		aggrData.set(key1, buf1);

		const buf2 = new Map();
		buf2.set(Symbol(), '<span>Second</span>');
		aggrData.set(key2, buf2);

		// Create from nodes for both buffers (set `from` attribute after creation)
		const fromNode1 = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(fromNode1, 'setAttr', ['from', 'buf1']);
		const fromNode2 = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(fromNode2, 'setAttr', ['from', 'buf2']);
		$c.sm(doc, 'append', ls([, fromNode1, , fromNode2]));

		const html =  $c.sm(doc, 'getHTML');
		assert(html.includes('<span>First</span>'), 'Should include first buffer content');
		assert(html.includes('<span>Second</span>'), 'Should include second buffer content');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('(getHTML) - False-positive placeholders inside comments/scripts/styles are not replaced', () => {
		// This test verifies that <{N}> patterns inside HTML comments, script tags, and
		// style tags are treated as literal text and NOT replaced as aggregation placeholders.
		// The pattern tested is: false (comment) - real - false (script)
		// Only the real placeholder outside protected regions should be replaced.
		const doc = getInstance('MWIDocument');

		// Set up a real buffer with content (gets ID 0)
		const bufferKey = 'm.aggr:real';
		$c.sm(doc, 'mapAggrBuffer', ls([, bufferKey]));
		const aggrData =  $c.sm(doc, 'getAggr');
		const buffer = new Map();
		buffer.set(Symbol(), 'REAL_CONTENT');
		aggrData.set(bufferKey, buffer);

		// 1. Add a comment node containing a fake placeholder pattern (false - comes first)
		// The <{0}> here matches the real buffer ID but is inside a comment, so it should NOT be replaced
		const commentNode = $c.sm(doc, 'createNode', ls([, 'm.com']));
		$c.sm(commentNode, 'setAttr', ['t', '<{0}> is a fake placeholder']);
		$c.sm(doc, 'append', ls([, commentNode]));

		// 2. Create a real from node for the real buffer (real - comes second)
		const fromNode = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(fromNode, 'setAttr', ['from', 'real']);
		$c.sm(doc, 'append', ls([, fromNode]));

		// 3. Add a script node containing a fake placeholder pattern (false - comes third)
		// The <{0}> here matches the real buffer ID but is inside a script, so it should NOT be replaced
		const scriptNode = $c.sm(doc, 'createNode', ls([, 'h.script']));
		$c.sm(scriptNode, 'setAttr', ['m.text', 'var x = "scr<{0}>ipt";']);
		$c.sm(doc, 'append', ls([, scriptNode]));

		// Capture console.warn to verify no spurious warnings are issued
		const warnings = [];
		const origWarn = console.warn;
		console.warn = (...args) => warnings.push(args.join(' '));

		const html =  $c.sm(doc, 'getHTML');

		console.warn = origWarn;

		// The real placeholder should be replaced
		assert(html.includes('REAL_CONTENT'), 'Real placeholder should be replaced with content');

		// The fake placeholders inside comment and script should be preserved as-is
		assert(html.includes('<!--<{0}> is a fake placeholder-->'), 'Fake placeholder in comment should be preserved');
		assert(html.includes('scr<{0}>ipt'), 'Fake placeholder in script should be preserved');

		// Verify the order: comment (with fake) - real content - script (with fake)
		const commentIdx = html.indexOf('<!--<{0}>');
		const realIdx = html.indexOf('REAL_CONTENT');
		const scriptIdx = html.indexOf('scr<{0}>ipt');
		assert(commentIdx < realIdx, 'Comment (false) should come before real content');
		assert(realIdx < scriptIdx, 'Real content should come before script (false)');

		// No warnings should be issued (false positives are silently ignored and don't corrupt real reference counts)
		assertEquals(warnings.length, 0, 'No warnings should be issued for false-positive placeholders');
	});

	await t.step('(getHTML) - Same placeholder referenced multiple times: first renders, second warns and is empty, third+ are empty', () => {
		// When the same buffer is referenced by multiple `from` nodes:
		// - The first reference renders the content normally
		// - The second reference produces a console warning and renders nothing (prevents loops/DOM-to-doc mismatches)
		// - Third+ references also render nothing (no additional warnings)
		const doc = getInstance('MWIDocument');

		// Set up a buffer with content
		const bufferKey = 'm.aggr:multi';
		$c.sm(doc, 'mapAggrBuffer', ls([, bufferKey]));
		const aggrData =  $c.sm(doc, 'getAggr');
		const buffer = new Map();
		buffer.set(Symbol(), 'SHARED_CONTENT');
		aggrData.set(bufferKey, buffer);

		// Create three from nodes referencing the same buffer
		const fromNode1 = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(fromNode1, 'setAttr', ['from', 'multi']);
		const fromNode2 = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(fromNode2, 'setAttr', ['from', 'multi']);
		const fromNode3 = $c.sm(doc, 'createNode', ls([, 'm.aggr']));
		$c.sm(fromNode3, 'setAttr', ['from', 'multi']);
		$c.sm(doc, 'append', ls([, fromNode1, , fromNode2, , fromNode3]));

		// Capture console.warn to verify the warning is issued
		const warnings = [];
		const origWarn = console.warn;
		console.warn = (...args) => warnings.push(args.join(' '));

		const html =  $c.sm(doc, 'getHTML');

		console.warn = origWarn;

		// Only the first reference should render content
		const count = (html.match(/SHARED_CONTENT/g) || []).length;
		assertEquals(count, 1, 'Content should appear only once (first reference only)');

		// Exactly one warning should have been issued (for the second reference only)
		assertEquals(warnings.length, 1, 'Should have issued exactly one warning (for second reference)');
		assert(warnings[0].includes('already been processed'), 'Warning should mention already processed');

		// No unresolved placeholders
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});
});
