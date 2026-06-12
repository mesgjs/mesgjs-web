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

Deno.test("MWICoreScpCSS SSR - Basic HTML Rendering", async (t) => {
	await t.step("Render empty m.scpcss", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');
		assertEquals(html, '', "Empty m.scpcss should render empty string");
	});

	await t.step("Render single component CSS", () => {
		registry.register('test.ssr.scpcss.single', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.single');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.startsWith('<style'), "Should start with <style> tag");
		assert(html.endsWith('</style>'), "Should end with </style> tag");
		assert(html.includes('color: blue'), "Should include CSS content");
		assert(html.includes('_MO_'), "Should include component ID");
		assert(!html.includes('@@'), "Should not contain @@ placeholder");
	});

	await t.step("Render CSS with </style> escaping", () => {
		registry.register('test.ssr.scpcss.escape', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "</style>"; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.escape');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('\\3c /style>'), "Should escape </style> as \\3c /style>");
		assert(!html.includes('</style></style>'), "Should not have premature closure");
		// Count closing tags - should be exactly 1
		const closeTags = html.match(/<\/style>/gi);
		assertEquals(closeTags?.length, 1, "Should have exactly one closing </style>");
	});

	await t.step("Render multiple component CSS", () => {
		registry.register('test.ssr.scpcss.multi1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));
		registry.register('test.ssr.scpcss.multi2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: green; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.multi1');
		doc.createNode('test.ssr.scpcss.multi2');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.startsWith('<style'), "Should start with <style>");
		assert(html.endsWith('</style>'), "Should end with </style>");
		assert(html.includes('color: red'), "Should include first component CSS");
		assert(html.includes('color: green'), "Should include second component CSS");
		// Should be single style tag with both CSS blocks
		const styleTags = html.match(/<style/g);
		assertEquals(styleTags?.length, 1, "Should have single <style> tag");
	});
});

Deno.test("MWICoreScpCSS SSR - Integration with Document", async (t) => {
	await t.step("m.scpcss in document root", () => {
		registry.register('test.ssr.scpcss.doc1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { margin: 0; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);
		doc.createNode('test.ssr.scpcss.doc1');

		const html = doc('getHTML');
		assert(html.includes('<style'), "Document HTML should include style tag");
		assert(html.includes('margin: 0'), "Document HTML should include CSS");
	});

	await t.step("m.scpcss position in output", () => {
		registry.register('test.ssr.scpcss.pos', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { padding: 0; }'
		]));
		const doc = getInstance('MWIDocument');

		// Add content before
		const text1 = doc.createNode('m.t');
		text1('setAttr', ls([, 't', , 'Before']));
		doc('append', text1);

		// Add m.scpcss
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		// Add content after
		const text2 = doc.createNode('m.t');
		text2('setAttr', ls([, 't', , 'After']));
		doc('append', text2);

		doc.createNode('test.ssr.scpcss.pos');

		const html = doc('getHTML');
		const beforeIdx = html.indexOf('Before');
		const styleIdx = html.indexOf('<style');
		const afterIdx = html.indexOf('After');

		assert(beforeIdx < styleIdx, "Style should come after 'Before'");
		assert(styleIdx < afterIdx, "Style should come before 'After'");
	});

	await t.step("Multiple m.scpcss nodes", () => {
		registry.register('test.ssr.scpcss.multiple', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { border: 1px; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.multiple');

		const scpNode1 = doc.createNode('m.scpcss');
		const scpNode2 = doc.createNode('m.scpcss');
		doc('append', scpNode1);
		doc('append', scpNode2);

		const html = doc('getHTML');
		const styleTags = html.match(/<style/g);
		assertEquals(styleTags?.length, 2, "Should have two style tags");

		// Both should have the same CSS
		const matches = html.match(/border: 1px/g);
		assertEquals(matches?.length, 2, "CSS should appear twice (once per m.scpcss)");
	});
});

Deno.test("MWICoreScpCSS SSR - Real-World Patterns", async (t) => {
	await t.step("Complete page with scoped styles", () => {
		// Register components with scoped CSS
		registry.register('test.ssr.scpcss.header', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { background: #333; color: white; }'
		]));
		registry.register('test.ssr.scpcss.nav', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { display: flex; }'
		]));
		registry.register('test.ssr.scpcss.main', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { padding: 2rem; }'
		]));
		registry.register('test.ssr.scpcss.footer', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { text-align: center; }'
		]));

		const doc = getInstance('MWIDocument');

		// Add m.scpcss in head
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		// Add components
		doc.createNode('test.ssr.scpcss.header');
		doc.createNode('test.ssr.scpcss.nav');
		doc.createNode('test.ssr.scpcss.main');
		doc.createNode('test.ssr.scpcss.footer');

		const html = doc('getHTML');

		assert(html.includes('<style'), "Should include style tag");
		assert(html.includes('background: #333'), "Should include header CSS");
		assert(html.includes('display: flex'), "Should include nav CSS");
		assert(html.includes('padding: 2rem'), "Should include main CSS");
		assert(html.includes('text-align: center'), "Should include footer CSS");
	});

	await t.step("Component library pattern", () => {
		// Register many components
		for (let i = 0; i < 10; i++) {
			registry.register(`test.ssr.scpcss.lib${i}`, ls([
				'allowLate', true,
				'if', 'MWIHTML',
				'scopedCSS', `.@@ { z-index: ${i}; }`
			]));
		}

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		doc('append', scpNode);

		// Use only subset
		doc.createNode('test.ssr.scpcss.lib3');
		doc.createNode('test.ssr.scpcss.lib7');
		doc.createNode('test.ssr.scpcss.lib9');

		const html = doc('getHTML');

		// Should only include used components
		assert(html.includes('z-index: 3'), "Should include lib3 CSS");
		assert(html.includes('z-index: 7'), "Should include lib7 CSS");
		assert(html.includes('z-index: 9'), "Should include lib9 CSS");
		assert(!html.includes('z-index: 0'), "Should not include unused lib0 CSS");
		assert(!html.includes('z-index: 5'), "Should not include unused lib5 CSS");
	});
});

Deno.test("MWICoreScpCSS SSR - CSS Content Correctness", async (t) => {
	await t.step("CSS with newlines preserved", () => {
		registry.register('test.ssr.scpcss.newlines', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ {\n  color: red;\n  margin: 0;\n}'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.newlines');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('color: red'), "Should preserve CSS content");
		assert(html.includes('margin: 0'), "Should preserve all rules");
	});

	await t.step("CSS with multiple selectors", () => {
		registry.register('test.ssr.scpcss.selectors', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; } .@@ .child { color: red; } .@@:hover { color: green; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.selectors');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('.child'), "Should include child selector");
		assert(html.includes(':hover'), "Should include pseudo-class");
		assert(html.includes('color: blue'), "Should include first rule");
		assert(html.includes('color: red'), "Should include second rule");
		assert(html.includes('color: green'), "Should include third rule");
	});

	await t.step("CSS with media queries", () => {
		registry.register('test.ssr.scpcss.media', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { width: 100%; } @media (min-width: 768px) { .@@ { width: 50%; } }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.media');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('@media'), "Should include media query");
		assert(html.includes('min-width: 768px'), "Should include media condition");
		assert(html.includes('width: 100%'), "Should include base rule");
		assert(html.includes('width: 50%'), "Should include media rule");
	});

	await t.step("CSS with keyframes", () => {
		registry.register('test.ssr.scpcss.keyframes', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '@keyframes slide { from { left: 0; } to { left: 100%; } } .@@ { animation: slide 1s; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.keyframes');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('@keyframes'), "Should include keyframes");
		assert(html.includes('slide'), "Should include animation name");
		assert(html.includes('animation: slide 1s'), "Should include animation property");
	});
});

Deno.test("MWICoreScpCSS SSR - Edge Cases", async (t) => {
	await t.step("Very long CSS content", () => {
		// Generate a large CSS block
		let longCSS = '';
		for (let i = 0; i < 100; i++) {
			longCSS += `.@@ .class${i} { color: color${i}; } `;
		}

		registry.register('test.ssr.scpcss.long', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', longCSS
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.long');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('<style'), "Should handle long CSS");
		assert(html.includes('class0'), "Should include first class");
		assert(html.includes('class99'), "Should include last class");
		assert(html.length > 1000, "Should have substantial length");
	});

	await t.step("CSS with special characters in strings", () => {
		registry.register('test.ssr.scpcss.special', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "test\'s \\"quoted\\" & <text>"; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.special');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('content:'), "Should handle special characters");
		// The content should be preserved as-is in CSS
		assert(html.includes('test'), "Should include content");
	});

	await t.step("Multiple </style> occurrences", () => {
		registry.register('test.ssr.scpcss.multistyle', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "</style></style></style>"; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.multistyle');
		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// All </style> in content should be escaped
		const unescapedCloseTags = html.match(/<\/style>/gi);
		assertEquals(unescapedCloseTags?.length, 1, "Should have only one unescaped </style> (the closing tag)");
		assert(html.includes('\\3c /style>'), "Should escape </style> in content");
	});
});

Deno.test("MWICoreScpCSS SSR - Output Parameter", async (t) => {
	await t.step("getHTML with output array", () => {
		registry.register('test.ssr.scpcss.output', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: orange; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.ssr.scpcss.output');
		const scpNode = doc.createNode('m.scpcss');

		const output = [];
		const html = scpNode('getHTML', ls(['in', output]));

		assertEquals(output.length, 1, "Should push to output array");
		assertEquals(output[0], html, "Output array should contain same HTML");
		assert(html.includes('color: orange'), "Should include CSS");
	});

	await t.step("getHTML with output array - empty CSS", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		const output = [];
		const html = scpNode('getHTML', ls(['in', output]));

		assertEquals(html, '', "Should return empty string");
		assertEquals(output.length, 0, "Should not push to output array when empty");
	});
});

Deno.test("MWICoreScpCSS SSR - Edge Cases (migrated from core)", async (t) => {
	// Migrated from test/core/scoped-css.test.js - unique coverage not in SSR file

	await t.step("Component with whitespace-only scopedCSS", () => {
		registry.register('test.migrate.scpcss.whitespace', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '   \n  '
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.migrate.scpcss.whitespace');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		// Whitespace-only CSS should still be included (implementation detail)
		assert(html.length > 0, "Whitespace CSS should be included");
	});
});

Deno.test("MWICoreScpCSS SSR - m.ci Virtual Attribute (migrated from core)", async (t) => {
	// Migrated from test/core/scoped-css.test.js - unique coverage not in SSR file

	await t.step("Read m.ci via m.slat from slot source", () => {
		registry.register('test.migrate.scpcss.ci2', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.slat=[ci=[m.ci]]] )]')
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.migrate.scpcss.ci2');

		// The template's internal div should have ci attribute set from slot source
		const html = tplNode('getHTML');
		assert(html.includes('ci='), "Should have ci attribute from m.slat");
	});
});

Deno.test("MWICoreScpCSS SSR - m.coat with m.ci Integration (migrated from core)", async (t) => {
	// Migrated from test/core/scoped-css.test.js - unique coverage not in SSR file

	await t.step("Use m.ci in m.coat to set m.percl", () => {
		registry.register('test.migrate.scpcss.coat1', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"]] )]'),
			'scopedCSS', '.@@ { border: 1px solid; }'
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.migrate.scpcss.coat1');

		// Get the internal div
		const html = tplNode('getHTML');

		// Should have m.percl set to component ID
		const compId = tplNode('getAttr', ls([, 'm.ci']));
		assert(html.includes(`class="${compId}"`), "Should have component ID as class");
	});

	await t.step("Use m.ci in m.coat to set regular class", () => {
		registry.register('test.migrate.scpcss.coat2', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[class="<m.ci>"]] )]')
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.migrate.scpcss.coat2');

		const compId = tplNode('getAttr', ls([, 'm.ci']));
		const html = tplNode('getHTML');

		assert(html.includes(`class="${compId}"`), "Should have component ID as class");
	});

	await t.step("Multiple m.coat attributes using m.ci", () => {
		registry.register('test.migrate.scpcss.coat3', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>" data-comp="<m.ci>"]] )]')
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.migrate.scpcss.coat3');

		const compId = tplNode('getAttr', ls([, 'm.ci']));
		const html = tplNode('getHTML');

		assert(html.includes(`class="${compId}"`), "Should have component ID as class");
		assert(html.includes(`data-comp="${compId}"`), "Should have component ID as data attribute");
	});

	await t.step("m.coat with m.ci in nested template context", () => {
		registry.register('test.migrate.scpcss.coat4outer', ls([
			'allowLate', true,
			'tpl', ps('[( [test.migrate.scpcss.coat4inner m.slat=[outerci=[m.ci]]] )]'),
			'scopedCSS', '.@@ { border: 2px solid; }'
		]));
		registry.register('test.migrate.scpcss.coat4inner', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<outerci>"]] )]'),
			'scopedCSS', '.@@ { padding: 1rem; }'
		]));

		const doc = getInstance('MWIDocument');
		const outerNode = doc.createNode('test.migrate.scpcss.coat4outer');

		const html = outerNode('getHTML');

		// The inner div should have the outer template's component ID
		const outerCompId = outerNode('getAttr', ls([, 'm.ci']));
		assert(html.includes(`class="${outerCompId}"`), "Should have outer component ID as class");
	});
});

Deno.test("MWICoreScpCSS SSR - CSS Deduplication (migrated from core)", async (t) => {
	// Migrated from test/core/scoped-css.test.js - unique coverage not in SSR file

	await t.step("Single component type, multiple instances", () => {
		registry.register('test.migrate.scpcss.dedup1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { width: 100%; }'
		]));

		const doc = getInstance('MWIDocument');

		// Create 5 instances
		for (let i = 0; i < 5; i++) {
			doc.createNode('test.migrate.scpcss.dedup1');
		}

		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// CSS should appear only once
		const matches = html.match(/width: 100%/g);
		assertEquals(matches?.length, 1, "CSS should appear only once despite multiple instances");
	});

	await t.step("Component type reuse across document", () => {
		registry.register('test.migrate.scpcss.dedup2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { height: 50px; }'
		]));

		const doc = getInstance('MWIDocument');

		// Use in different parts
		const frag1 = doc.createNode('m.frg');
		frag1('append', doc.createNode('test.migrate.scpcss.dedup2'));
		doc('append', frag1);

		const frag2 = doc.createNode('m.frg');
		frag2('append', doc.createNode('test.migrate.scpcss.dedup2'));
		doc('append', frag2);

		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// CSS should not be duplicated
		const matches = html.match(/height: 50px/g);
		assertEquals(matches?.length, 1, "CSS should not be duplicated across document");
	});
});

Deno.test("MWICoreScpCSS SSR - Real-World Patterns (migrated from core)", async (t) => {
	// Migrated from test/core/scoped-css.test.js - unique coverage not in SSR file

	await t.step("Card component with scoped styles", () => {
		registry.register('test.migrate.scpcss.card', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
			'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; } .@@ .header { font-weight: bold; }'
		]));

		const doc = getInstance('MWIDocument');
		const cardNode = doc.createNode('test.migrate.scpcss.card');
		cardNode('setSubSpec', ps('[( [h.div class="header" "Card Title"] )]'));

		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('border: 1px solid #ccc'), "Should include card border CSS");
		assert(html.includes('padding: 1rem'), "Should include padding CSS");
		assert(html.includes('.header'), "Should include nested selector");
		assert(html.includes('font-weight: bold'), "Should include header style");

		// Verify card HTML has scoped class
		const cardHtml = cardNode('getHTML');
		const compId = cardNode('getAttr', ls([, 'm.ci']));
		assert(cardHtml.includes(`class="${compId}"`), "Card should have scoped class");
	});

	await t.step("Nested components with scoped CSS", () => {
		registry.register('test.migrate.scpcss.parent', ls([
			'allowLate', true,
			'tpl', ps('[( [m.scpcss] [h.div m.coat=[m.percl="<m.ci>"] [test.migrate.scpcss.child m.slat=[parentci=[m.ci]]]] )]'),
			'scopedCSS', '.@@ { background: #f0f0f0; }'
		]));
		registry.register('test.migrate.scpcss.child', ls([
			'allowLate', true,
			'tpl', ps('[( [h.span m.coat=[m.percl="<parentci>"] "Child"] )]'),
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = getInstance('MWIDocument');
		const parNode = doc.createNode('test.migrate.scpcss.parent');

		const html = parNode('getHTML');

		assert(html.includes('background: #f0f0f0'), "Should include parent CSS");
		assert(html.includes('color: blue'), "Should include child CSS");

		// Should have two different component IDs
		const compIdMatches = html.match(/_MO_\w+/g);
		assert(compIdMatches.length >= 2, "Should have at least two component IDs");
	});
});
