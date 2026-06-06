import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const registry = getInstance('MWIRegistry');

Deno.test("MWICoreScpCSS SSR Compound - Complete Page with Scoped CSS", async (t) => {
	await t.step("Card component with scoped styles and m.coat/m.percl", async () => {
		registry.register('test.ssr.compound.card', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; } .@@ .header { font-weight: bold; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=header] [m.slot]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		const cardNode = doc.createNode('test.ssr.compound.card');
		cardNode('setAttr', ls([, 'header', , ps('[([m.t t="Card Header"])]')]));
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Card content']));
		cardNode('append', textNode);
		doc('append', cardNode);

		const html = doc('getHTML');

		// Should have style tag with scoped CSS
		assert(html.includes('<style>'), "Should include style tag");
		assert(html.includes('border: 1px solid #ccc'), "Should include card border CSS");
		assert(html.includes('.header'), "Should include nested selector");

		// Should have div with permanent class matching component ID
		assert(html.includes('class='), "Should have class attribute");
		assert(html.includes('_MO_'), "Should have component ID in class");

		// Should have content
		assert(html.includes('Card Header'), "Should include header content");
		assert(html.includes('Card content'), "Should include body content");
	});

	await t.step("m.scpcss renders before components triggering it", () => {
		registry.register('test.ssr.compound.order', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = getInstance('MWIDocument');

		// Create structure: [m.head [m.scpcss]][m.body [custom]]
		const headNode = doc.createNode('h.head');
		const scpNode = doc.createNode('m.scpcss');
		headNode('append', scpNode);
		doc('append', headNode);

		const bodyNode = doc.createNode('h.body');
		const customNode = doc.createNode('test.ssr.compound.order');
		bodyNode('append', customNode);
		doc('append', bodyNode);

		const html = doc('getHTML');

		// Find positions
		const styleIdx = html.indexOf('<style>');
		const bodyIdx = html.indexOf('<body');

		assert(styleIdx !== -1, "Should have style tag");
		assert(bodyIdx !== -1, "Should have body tag");
		assert(styleIdx < bodyIdx, "Style tag should come before body (in head)");

		// Verify CSS is present even though component comes after
		assert(html.includes('color: blue'), "Should include CSS for component in body");
	});
});

Deno.test("MWICoreScpCSS SSR Compound - Nested Components with Scoped CSS", async (t) => {
	await t.step("Parent and child components with scoped CSS", () => {
		registry.register('test.ssr.compound.parent', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { background: #f0f0f0; }',
			'tpl', ps('[([h.div [m.slot]])]')
		]));
		registry.register('test.ssr.compound.child', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { color: red; }',
			'tpl', ps('[([h.span [m.t t="Child"]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		const parentNode = doc.createNode('test.ssr.compound.parent');
		const childNode = doc.createNode('test.ssr.compound.child');
		parentNode('append', childNode);
		doc('append', parentNode);

		const html = doc('getHTML');

		// Both CSS blocks should be present
		assert(html.includes('background: #f0f0f0'), "Should include parent CSS");
		assert(html.includes('color: red'), "Should include child CSS");

		// Should have both component IDs
		const compIds = html.match(/_MO_[0-9a-z]+/g);
		const uniqueIds = new Set(compIds);
		assert(uniqueIds.size >= 2, "Should have at least 2 unique component IDs");
	});

	await t.step("Template with scoped CSS and slotting", () => {
		registry.register('test.ssr.compound.tplslot', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { padding: 2rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		const tplNode = doc.createNode('test.ssr.compound.tplslot');
		tplNode('setAttr', ls([, 'content', , ps('[([m.t t="Slotted content"])]')]));
		doc('append', tplNode);

		const html = doc('getHTML');

		// Should have scoped CSS
		assert(html.includes('padding: 2rem'), "Should include template CSS");

		// Should have permanent class from m.coat
		assert(html.includes('class='), "Should have class attribute");
		assert(html.includes('_MO_'), "Should have component ID");

		// Should have slotted content
		assert(html.includes('Slotted content'), "Should include slotted content");
	});
});

Deno.test("MWICoreScpCSS SSR Compound - Component Library Pattern", async (t) => {
	await t.step("Multiple components with scoped CSS in realistic page", () => {
		// Register component library
		registry.register('test.ssr.compound.button', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { padding: 0.5rem 1rem; border: none; cursor: pointer; }',
			'tpl', ps('[([h.button m.coat=[m.percl="<m.ci>"] [m.slot]])]')
		]));
		registry.register('test.ssr.compound.input', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { padding: 0.5rem; border: 1px solid #ccc; }',
			'tpl', ps('[([h.input m.coat=[m.percl="<m.ci>"]])]')
		]));
		registry.register('test.ssr.compound.card2', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 1px solid #ddd; border-radius: 4px; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot]])]')
		]));

		const doc = getInstance('MWIDocument');

		// Add m.scpcss in head
		const headNode = doc.createNode('h.head');
		const scpNode = doc.createNode('m.scpcss');
		headNode('append', scpNode);
		doc('append', headNode);

		// Add body with components
		const bodyNode = doc.createNode('h.body');

		const cardNode = doc.createNode('test.ssr.compound.card2');
		const inputNode = doc.createNode('test.ssr.compound.input');
		const buttonNode = doc.createNode('test.ssr.compound.button');
		const submitText = doc.createNode('m.t');
		submitText('setAttr', ls([, 't', , 'Submit']));
		buttonNode('append', submitText);

		cardNode('append', inputNode);
		cardNode('append', buttonNode);
		bodyNode('append', cardNode);
		doc('append', bodyNode);

		const html = doc('getHTML');

		// All component CSS should be present
		assert(html.includes('padding: 0.5rem 1rem'), "Should include button CSS");
		assert(html.includes('border: 1px solid #ccc'), "Should include input CSS");
		assert(html.includes('border-radius: 4px'), "Should include card CSS");

		// Should have all component IDs
		const compIds = html.match(/_MO_[0-9a-z]+/g);
		const uniqueIds = new Set(compIds);
		assert(uniqueIds.size >= 3, "Should have at least 3 unique component IDs");

		// Structure should be correct
		assert(html.includes('<head>'), "Should have head");
		assert(html.includes('<style>'), "Should have style in head");
		assert(html.includes('<body>'), "Should have body");
		assert(html.includes('Submit'), "Should have button text");
	});
});

Deno.test("MWICoreScpCSS SSR Compound - CSS Deduplication in Complex Structures", async (t) => {
	await t.step("Same component type used multiple times", () => {
		registry.register('test.ssr.compound.item', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { margin: 0.5rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		// Create multiple instances
		for (let i = 0; i < 5; i++) {
			const itemNode = doc.createNode('test.ssr.compound.item');
			const textNode = doc.createNode('m.t');
			textNode('setAttr', ls([, 't', , `Item ${i}`]));
			itemNode('append', textNode);
			doc('append', itemNode);
		}

		const html = doc('getHTML');

		// CSS should appear only once
		const cssMatches = html.match(/margin: 0\.5rem/g);
		assertEquals(cssMatches?.length, 1, "CSS should appear only once despite 5 instances");

		// But all instances should have the component ID class
		const classMatches = html.match(/class="[^"]*_MO_[0-9a-z]+[^"]*"/g);
		assert(classMatches && classMatches.length >= 5, "All instances should have component ID class");
	});
});

Deno.test("MWICoreScpCSS SSR Compound - Edge Cases", async (t) => {
	await t.step("m.scpcss with no components in document", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Just text']));
		doc('append', textNode);

		const html = doc('getHTML');

		// Should not have style tag
		assert(!html.includes('<style>'), "Should not have style tag when no scoped CSS");
		assert(html.includes('Just text'), "Should still have content");
	});

	await t.step("Multiple m.scpcss nodes in different locations", () => {
		registry.register('test.ssr.compound.multi', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { opacity: 0.9; }'
		]));

		const doc = getInstance('MWIDocument');

		// Add m.scpcss at start
		const scpNode1 = doc.createNode('m.scpcss');
		doc('append', scpNode1);

		// Add component
		doc.createNode('test.ssr.compound.multi');

		// Add another m.scpcss at end
		const scpNode2 = doc.createNode('m.scpcss');
		doc('append', scpNode2);

		const html = doc('getHTML');

		// Should have two style tags with same CSS
		const styleTags = html.match(/<style>/g);
		assertEquals(styleTags?.length, 2, "Should have two style tags");

		const cssMatches = html.match(/opacity: 0\.9/g);
		assertEquals(cssMatches?.length, 2, "CSS should appear in both style tags");
	});

	await t.step("CSS with </style> in complex document", () => {
		registry.register('test.ssr.compound.escape', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "</style>"; }'
		]));

		const doc = getInstance('MWIDocument');

		const headNode = doc.createNode('h.head');
		const scpNode = doc.createNode('m.scpcss');
		headNode('append', scpNode);
		doc('append', headNode);

		const bodyNode = doc.createNode('h.body');
		const compNode = doc.createNode('test.ssr.compound.escape');
		bodyNode('append', compNode);
		doc('append', bodyNode);

		const html = doc('getHTML');

		// Should escape </style> in CSS
		assert(html.includes('\\3c /style>'), "Should escape </style>");

		// Should have proper structure
		const closeTags = html.match(/<\/style>/gi);
		assertEquals(closeTags?.length, 1, "Should have exactly one closing </style> tag");
		assert(html.includes('</head>'), "Should have closing head tag");
		assert(html.includes('</body>'), "Should have closing body tag");
	});
});
