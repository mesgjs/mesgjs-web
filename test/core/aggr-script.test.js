import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

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

const doc = getInstance('MWIDocument');

Deno.test('MWIAggrScript (m.script) - Core deduplication', async (t) => {
	await t.step('(getDedupeKey) - Inline script uses m.text as key', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['m.text', 'console.log("test");']);
		
		// We can't directly test getDedupeKey, but we can test the behavior
		// by creating two nodes with the same m.text and verifying deduplication
		const aggrData = testDoc('getAggr');
		scriptNode('getHTML'); // Trigger aggregation
		
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 1, 'Should store one script');
		assert(buffer.has('console.log("test");'), 'Should use m.text as key');
	});

	await t.step('.getHTML() - Inline script uses m.text as key via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc.createNode('m.script');
		scriptNode.setAttr('m.text', 'console.log("js");');
		
		const aggrData = testDoc.getAggr();
		scriptNode.getHTML();
		
		const buffer = aggrData.get('m.script:head');
		assert(buffer.has('console.log("js");'), 'Should use m.text as key via JS');
	});

	await t.step('(getDedupeKey) - External script uses src as key', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['src', '/test.js']);
		
		const aggrData = testDoc('getAggr');
		scriptNode('getHTML');
		
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 1, 'Should store one script');
		assert(buffer.has('/test.js'), 'Should use src as key');
	});

	await t.step('.getHTML() - External script uses src as key via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc.createNode('m.script');
		scriptNode.setAttr('src', '/test-js.js');
		
		const aggrData = testDoc.getAggr();
		scriptNode.getHTML();
		
		const buffer = aggrData.get('m.script:head');
		assert(buffer.has('/test-js.js'), 'Should use src as key via JS');
	});

	await t.step('(getDedupeKey) - Duplicate inline scripts are deduplicated', () => {
		const testDoc = getInstance('MWIDocument');
		const script1 = testDoc('createNode', ls([, 'm.script']));
		script1('setAttr', ['m.text', 'shared();']);
		script1('getHTML');
		
		const script2 = testDoc('createNode', ls([, 'm.script']));
		script2('setAttr', ['m.text', 'shared();']);
		script2('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 1, 'Duplicate scripts should be deduplicated');
	});

	await t.step('.getHTML() - Duplicate external scripts are deduplicated via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const script1 = testDoc.createNode('m.script');
		script1.setAttr('src', '/shared.js');
		script1.getHTML();
		
		const script2 = testDoc.createNode('m.script');
		script2.setAttr('src', '/shared.js');
		script2.getHTML();
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 1, 'Duplicate external scripts should be deduplicated via JS');
	});

	await t.step('(getDedupeKey) - Invalid node (no src or m.text) is skipped', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		// No src or m.text set
		scriptNode('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		assert(!buffer || buffer.size === 0, 'Invalid script should not be stored');
	});

	await t.step('.getHTML() - Invalid node (no src or m.text) is skipped via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc.createNode('m.script');
		scriptNode.getHTML();
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.script:head');
		assert(!buffer || buffer.size === 0, 'Invalid script should not be stored via JS');
	});
});

Deno.test('MWIAggrScript (m.style) - Core deduplication', async (t) => {
	await t.step('(getDedupeKey) - Inline style uses m.text as key', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['m.text', 'body { color: red; }']);
		
		const aggrData = testDoc('getAggr');
		styleNode('getHTML');
		
		const buffer = aggrData.get('m.style:head');
		assertEquals(buffer.size, 1, 'Should store one style');
		assert(buffer.has('body { color: red; }'), 'Should use m.text as key');
	});

	await t.step('.getHTML() - Inline style uses m.text as key via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc.createNode('m.style');
		styleNode.setAttr('m.text', 'p { margin: 0; }');
		
		const aggrData = testDoc.getAggr();
		styleNode.getHTML();
		
		const buffer = aggrData.get('m.style:head');
		assert(buffer.has('p { margin: 0; }'), 'Should use m.text as key via JS');
	});

	await t.step('(getDedupeKey) - External stylesheet uses href as key', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['href', '/test.css']);
		
		const aggrData = testDoc('getAggr');
		styleNode('getHTML');
		
		const buffer = aggrData.get('m.style:head');
		assertEquals(buffer.size, 1, 'Should store one stylesheet');
		assert(buffer.has('/test.css'), 'Should use href as key');
	});

	await t.step('.getHTML() - External stylesheet uses href as key via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc.createNode('m.style');
		styleNode.setAttr('href', '/test-js.css');
		
		const aggrData = testDoc.getAggr();
		styleNode.getHTML();
		
		const buffer = aggrData.get('m.style:head');
		assert(buffer.has('/test-js.css'), 'Should use href as key via JS');
	});

	await t.step('(getDedupeKey) - Duplicate inline styles are deduplicated', () => {
		const testDoc = getInstance('MWIDocument');
		const style1 = testDoc('createNode', ls([, 'm.style']));
		style1('setAttr', ['m.text', '.shared { }']);
		style1('getHTML');
		
		const style2 = testDoc('createNode', ls([, 'm.style']));
		style2('setAttr', ['m.text', '.shared { }']);
		style2('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.style:head');
		assertEquals(buffer.size, 1, 'Duplicate styles should be deduplicated');
	});

	await t.step('.getHTML() - Duplicate external stylesheets are deduplicated via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const style1 = testDoc.createNode('m.style');
		style1.setAttr('href', '/shared.css');
		style1.getHTML();
		
		const style2 = testDoc.createNode('m.style');
		style2.setAttr('href', '/shared.css');
		style2.getHTML();
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.style:head');
		assertEquals(buffer.size, 1, 'Duplicate external stylesheets should be deduplicated via JS');
	});

	await t.step('(getDedupeKey) - Invalid node (no href or m.text) is skipped', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.style:head');
		assert(!buffer || buffer.size === 0, 'Invalid style should not be stored');
	});

	await t.step('.getHTML() - Invalid node (no href or m.text) is skipped via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc.createNode('m.style');
		styleNode.getHTML();
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.style:head');
		assert(!buffer || buffer.size === 0, 'Invalid style should not be stored via JS');
	});
});
