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

// Note to readers:
// Partial tag matches are intentional.
// The first HTML element of an aggregate buffer is typically
// assigned an id automatically (if it doesn't have one already)
// as a DOM sync aid.

Deno.test('MWIAggrScript (m.script) - SSR-HTML to mode (default buffer)', async (t) => {
	await t.step('(getHTML) - to mode with inline script stores <script> tag', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['m.text', 'console.log("test");']);
		const html = scriptNode('getHTML');
		
		assertEquals(html, '', 'to mode should return empty string');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<script'), 'Should store script tag');
		assert(values[0].includes('console.log'), 'Should include script content');
		assert(values[0].includes('</script>'), 'Should include closing tag');
	});

	await t.step('.getHTML() - to mode with inline script stores <script> tag via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc.createNode('m.script');
		scriptNode.setAttr('m.text', 'alert("js");');
		const html = scriptNode.getHTML();
		
		assertEquals(html, '', 'to mode should return empty string via JS');
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.script:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<script'), 'Should store script tag via JS');
		assert(values[0].includes('alert'), 'Should include script content via JS');
	});

	await t.step('(getHTML) - to mode with external script stores <script src>', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['src', '/app.js']);
		const html = scriptNode('getHTML');
		
		assertEquals(html, '', 'to mode should return empty string');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<script'), 'Should store script tag');
		assert(values[0].includes('src="/app.js"'), 'Should include src attribute');
		assert(values[0].includes('</script>'), 'Should include closing tag');
	});

	await t.step('.getHTML() - to mode with external script stores <script src> via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc.createNode('m.script');
		scriptNode.setAttr('src', '/app-js.js');
		const html = scriptNode.getHTML();
		
		assertEquals(html, '', 'to mode should return empty string via JS');
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.script:head');
		const values = [...buffer.values()];
		assert(values[0].includes('src="/app-js.js"'), 'Should include src attribute via JS');
	});

	await t.step('(getHTML) - to mode with explicit buffer name', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['to', 'footer']);
		scriptNode('setAttr', ['src', '/footer.js']);
		const html = scriptNode('getHTML');
		
		assertEquals(html, '', 'to mode should return empty string');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:footer');
		assert(buffer instanceof Map, 'Should create buffer for named key');
		assert(buffer.size > 0, 'Buffer should have content');
	});

	await t.step('.getHTML() - to mode with explicit buffer name via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc.createNode('m.script');
		scriptNode.setAttr('to', 'jsFooter');
		scriptNode.setAttr('src', '/footer-js.js');
		scriptNode.getHTML();
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.script:jsFooter');
		assert(buffer instanceof Map, 'Should create buffer for named key via JS');
	});

	await t.step('(getHTML) - Inline script content escapes closing tag', () => {
		const testDoc = getInstance('MWIDocument');
		const scriptNode = testDoc('createNode', ls([, 'm.script']));
		scriptNode('setAttr', ['m.text', 'var x = "</ script >";']);
		scriptNode('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		const values = [...buffer.values()];
		// Should escape </script> within content as \x3c/script>
		assert(values[0].includes('\\x3c'), 'Should escape closing tag within content');
		// The actual closing tag should still be present (not in content)
		assert(values[0].endsWith('</script>'), 'Should have actual closing script tag');
		// The content should not contain an unescaped closing tag
		const content = values[0].match(/<script[^>]*>(.*)<\/script>/s)?.[1];
		assert(!content.includes('</script>'), 'Content should not contain unescaped closing tag');
	});

	await t.step('(getHTML) - Duplicate scripts are deduplicated', () => {
		const testDoc = getInstance('MWIDocument');
		
		const script1 = testDoc('createNode', ls([, 'm.script']));
		script1('setAttr', ['src', '/dup.js']);
		script1('getHTML');
		
		const script2 = testDoc('createNode', ls([, 'm.script']));
		script2('setAttr', ['src', '/dup.js']);
		script2('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 1, 'Duplicate scripts should be deduplicated');
	});

	await t.step('.getHTML() - Duplicate scripts are deduplicated via JS', () => {
		const testDoc = getInstance('MWIDocument');
		
		const script1 = testDoc.createNode('m.script');
		script1.setAttr('m.text', 'shared();');
		script1.getHTML();
		
		const script2 = testDoc.createNode('m.script');
		script2.setAttr('m.text', 'shared();');
		script2.getHTML();
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.script:head');
		assertEquals(buffer.size, 1, 'Duplicate scripts should be deduplicated via JS');
	});
});

Deno.test('MWIAggrScript (m.script) - SSR-HTML from mode', async (t) => {
	await t.step('(getHTML) - from mode returns placeholder', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		const html = fromNode('getHTML');
		
		assert(html.startsWith('<{'), 'Should return a placeholder');
		assert(html.endsWith('>'), 'Placeholder should end with >');
		assert(/^<\{\d+\}>$/.test(html), 'Placeholder should be <{number}>');
	});

	await t.step('.getHTML() - from mode returns placeholder via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc.createNode('m.script');
		fromNode.setAttr('from', 'head');
		const html = fromNode.getHTML();
		
		assert(/^<\{\d+\}>$/.test(html), 'Placeholder should be <{number}> via JS');
	});

	await t.step('(getHTML) - from mode allocates buffer ID via mapAggrBuffer', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'footer']);
		const html = fromNode('getHTML');
		
		const match = html.match(/^<\{(\d+)\}>$/);
		assert(match, 'Should have a valid placeholder');
		const bufferId = parseInt(match[1], 10);
		
		const bufferName = testDoc('mapAggrBuffer', ls([, bufferId]));
		assertEquals(bufferName, 'm.script:footer', 'Buffer ID should map to correct key');
	});

	await t.step('(getHTML) - from mode with same buffer name returns same placeholder', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode1 = testDoc('createNode', ls([, 'm.script']));
		fromNode1('setAttr', ['from', 'shared']);
		const html1 = fromNode1('getHTML');
		
		const fromNode2 = testDoc('createNode', ls([, 'm.script']));
		fromNode2('setAttr', ['from', 'shared']);
		const html2 = fromNode2('getHTML');
		
		assertEquals(html1, html2, 'Same buffer name should produce same placeholder');
	});

	await t.step('(getHTML) - from mode with different buffer names returns different placeholders', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode1 = testDoc('createNode', ls([, 'm.script']));
		fromNode1('setAttr', ['from', 'bufA']);
		const html1 = fromNode1('getHTML');
		
		const fromNode2 = testDoc('createNode', ls([, 'm.script']));
		fromNode2('setAttr', ['from', 'bufB']);
		const html2 = fromNode2('getHTML');
		
		assert(html1 !== html2, 'Different buffer names should produce different placeholders');
	});
});

Deno.test('MWIAggrScript (m.script) - SSR-HTML m.csr suppression', async (t) => {
	await t.step('(getHTML) - m.csr=true suppresses from output', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		fromNode('setAttr', ['m.csr', true]);
		const html = fromNode('getHTML');
		
		assertEquals(html, '', 'from mode with m.csr should return empty string');
	});

	await t.step('.getHTML() - m.csr=true suppresses from output via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc.createNode('m.script');
		fromNode.setAttr('from', 'head');
		fromNode.setAttr('m.csr', true);
		const html = fromNode.getHTML();
		
		assertEquals(html, '', 'from mode with m.csr should return empty string via JS');
	});

	await t.step('(getHTML) - m.csr=true suppresses to mode output', () => {
		const testDoc = getInstance('MWIDocument');
		const toNode = testDoc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['m.csr', true]);
		toNode('setAttr', ['src', '/csr-only.js']);
		const html = toNode('getHTML');
		
		assertEquals(html, '', 'to mode with m.csr should return empty string');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.script:head');
		assert(!buffer || buffer.size === 0, 'Should not store content when m.csr is set');
	});
});

Deno.test('MWIAggrScript (m.script) - SSR-HTML end-to-end', async (t) => {
	await t.step('(getHTML) - to/from round-trip via document', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		
		const toNode = testDoc('createNode', ls([, 'm.script']));
		toNode('setAttr', ['src', '/main.js']);
		
		testDoc('append', ls([, fromNode, , toNode]));
		
		const html = testDoc('getHTML');
		assert(html.includes('<script'), 'Should include script tag');
		assert(html.includes('src="/main.js"'), 'Should include src attribute');
		assert(html.includes('</script>'), 'Should include closing tag');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('.getHTML() - to/from round-trip via document via JS', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc.createNode('m.script');
		fromNode.setAttr('from', 'head');
		
		const toNode = testDoc.createNode('m.script');
		toNode.setAttr('src', '/main-js.js');
		
		testDoc.append(fromNode, toNode);
		
		const html = testDoc.getHTML();
		assert(html.includes('<script'), 'Should include script tag via JS');
		assert(html.includes('src="/main-js.js"'), 'Should include src attribute via JS');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders via JS');
	});

	await t.step('(getHTML) - Multiple scripts aggregated with deduplication', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'head']);
		
		const script1 = testDoc('createNode', ls([, 'm.script']));
		script1('setAttr', ['src', '/lib.js']);
		
		const script2 = testDoc('createNode', ls([, 'm.script']));
		script2('setAttr', ['src', '/app.js']);
		
		const script3 = testDoc('createNode', ls([, 'm.script']));
		script3('setAttr', ['src', '/lib.js']); // Duplicate of script1
		
		testDoc('append', ls([, fromNode, , script1, , script2, , script3]));
		
		const html = testDoc('getHTML');
		assert(html.includes('src="/lib.js"'), 'Should include lib.js');
		assert(html.includes('src="/app.js"'), 'Should include app.js');
		
		// Count script tags - should be 2, not 3 (deduplication)
		const scriptCount = (html.match(/<script/g) || []).length;
		assertEquals(scriptCount, 2, 'Should deduplicate duplicate script');
	});

	await t.step('(getHTML) - Empty buffer renders nothing', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc('createNode', ls([, 'm.script']));
		fromNode('setAttr', ['from', 'empty']);
		testDoc('append', ls([, fromNode]));
		
		const html = testDoc('getHTML');
		assertEquals(html, '', 'Empty buffer should render nothing');
	});
});

Deno.test('MWIAggrStyle (m.style) - SSR-HTML to/from modes', async (t) => {
	await t.step('(getHTML) - to mode with inline style stores <style> tag', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['m.text', 'body { margin: 0; }']);
		const html = styleNode('getHTML');
		
		assertEquals(html, '', 'to mode should return empty string');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.style:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<style'), 'Should store style tag');
		assert(values[0].includes('body { margin: 0; }'), 'Should include style content');
		assert(values[0].includes('</style>'), 'Should include closing tag');
	});

	await t.step('.getHTML() - to mode with inline style stores <style> tag via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc.createNode('m.style');
		styleNode.setAttr('m.text', 'p { color: red; }');
		const html = styleNode.getHTML();
		
		assertEquals(html, '', 'to mode should return empty string via JS');
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.style:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<style'), 'Should store style tag via JS');
		assert(values[0].includes('p { color: red; }'), 'Should include style content via JS');
	});

	await t.step('(getHTML) - to mode with external stylesheet stores <link> tag', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['href', '/theme.css']);
		const html = styleNode('getHTML');
		
		assertEquals(html, '', 'to mode should return empty string');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.style:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<link'), 'Should store link tag');
		assert(values[0].includes('rel="stylesheet"'), 'Should include rel attribute');
		assert(values[0].includes('href="/theme.css"'), 'Should include href attribute');
	});

	await t.step('.getHTML() - to mode with external stylesheet stores <link> tag via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc.createNode('m.style');
		styleNode.setAttr('href', '/theme-js.css');
		const html = styleNode.getHTML();
		
		assertEquals(html, '', 'to mode should return empty string via JS');
		
		const aggrData = testDoc.getAggr();
		const buffer = aggrData.get('m.style:head');
		const values = [...buffer.values()];
		assert(values[0].includes('<link'), 'Should store link tag via JS');
		assert(values[0].includes('href="/theme-js.css"'), 'Should include href attribute via JS');
	});

	await t.step('(getHTML) - Inline style content escapes closing tag', () => {
		const testDoc = getInstance('MWIDocument');
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['m.text', '.x { content: "</ style >"; }']);
		styleNode('getHTML');
		
		const aggrData = testDoc('getAggr');
		const buffer = aggrData.get('m.style:head');
		const values = [...buffer.values()];
		// Should escape </style> within content as \3c /style>
		assert(values[0].includes('\\3c '), 'Should escape closing tag within content');
		// The actual closing tag should still be present (not in content)
		assert(values[0].endsWith('</style>'), 'Should have actual closing style tag');
		// The content should not contain an unescaped closing tag
		const content = values[0].match(/<style[^>]*>(.*)<\/style>/s)?.[1];
		assert(!content.includes('</style>'), 'Content should not contain unescaped closing tag');
	});

	await t.step('(getHTML) - from mode returns placeholder', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);
		const html = fromNode('getHTML');
		
		assert(/^<\{\d+\}>$/.test(html), 'Placeholder should be <{number}>');
	});

	await t.step('.getHTML() - from mode returns placeholder via JS', () => {
		const testDoc = getInstance('MWIDocument');
		const fromNode = testDoc.createNode('m.style');
		fromNode.setAttr('from', 'head');
		const html = fromNode.getHTML();
		
		assert(/^<\{\d+\}>$/.test(html), 'Placeholder should be <{number}> via JS');
	});

	await t.step('(getHTML) - to/from round-trip via document', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);
		
		const styleNode = testDoc('createNode', ls([, 'm.style']));
		styleNode('setAttr', ['href', '/app.css']);
		
		testDoc('append', ls([, fromNode, , styleNode]));
		
		const html = testDoc('getHTML');
		assert(html.includes('<link'), 'Should include link tag');
		assert(html.includes('href="/app.css"'), 'Should include href attribute');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders');
	});

	await t.step('.getHTML() - to/from round-trip via document via JS', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc.createNode('m.style');
		fromNode.setAttr('from', 'head');
		
		const styleNode = testDoc.createNode('m.style');
		styleNode.setAttr('href', '/app-js.css');
		
		testDoc.append(fromNode, styleNode);
		
		const html = testDoc.getHTML();
		assert(html.includes('<link'), 'Should include link tag via JS');
		assert(html.includes('href="/app-js.css"'), 'Should include href attribute via JS');
		assert(!html.includes('<{'), 'Should not contain unresolved placeholders via JS');
	});

	await t.step('(getHTML) - Duplicate stylesheets are deduplicated', () => {
		const testDoc = getInstance('MWIDocument');
		
		const fromNode = testDoc('createNode', ls([, 'm.style']));
		fromNode('setAttr', ['from', 'head']);
		
		const style1 = testDoc('createNode', ls([, 'm.style']));
		style1('setAttr', ['href', '/base.css']);
		
		const style2 = testDoc('createNode', ls([, 'm.style']));
		style2('setAttr', ['href', '/theme.css']);
		
		const style3 = testDoc('createNode', ls([, 'm.style']));
		style3('setAttr', ['href', '/base.css']); // Duplicate
		
		testDoc('append', ls([, fromNode, , style1, , style2, , style3]));
		
		const html = testDoc('getHTML');
		assert(html.includes('href="/base.css"'), 'Should include base.css');
		assert(html.includes('href="/theme.css"'), 'Should include theme.css');
		
		// Count link tags - should be 2, not 3
		const linkCount = (html.match(/<link/g) || []).length;
		assertEquals(linkCount, 2, 'Should deduplicate duplicate stylesheet');
	});
});
