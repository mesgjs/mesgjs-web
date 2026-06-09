import {
	assert,
	assertEquals,
	assertExists,
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

Deno.test("MWICoreScpCSS Core - Basic Interface Behavior", async (t) => {
	await t.step("Create m.scpcss node", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		assertExists(scpNode, "Node creation should succeed");
		assertEquals(scpNode('type'), 'm.scpcss', "Node should have correct type");

		// Verify void behavior - setSubSpec should be no-op
		scpNode('setSubSpec', ps('[( [m.t t="test"] )]'));
		assertEquals(scpNode('hasChildren'), false, "Void node should not accept children");
	});

	await t.step("Empty document (no components used)", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assertEquals(html, '', "Empty document should render empty string");

		const dom = scpNode('getDOM');
		assertEquals(dom.size, 0, "Empty document should return empty NANOS");
	});

	await t.step("Document with no scoped CSS components", () => {
		// Register component without scopedCSS
		registry.register('test.core.scpcss.noscope', ls([
			'allowLate', true,
			'if', 'MWIHTML'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.noscope');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assertEquals(html, '', "Should render nothing when no scoped CSS");
	});
});

Deno.test("MWICoreScpCSS Core - CSS Aggregation Logic", async (t) => {
	await t.step("Single component with scoped CSS", () => {
		registry.register('test.core.scpcss.single', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.single');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assert(html.includes('color: blue'), "Should include CSS content");
		assert(html.includes('_MO_'), "Should include component ID");
		assert(!html.includes('@@'), "Should not contain @@ placeholder");
	});

	await t.step("Multiple components with scoped CSS", () => {
		registry.register('test.core.scpcss.multi1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));
		registry.register('test.core.scpcss.multi2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: green; }'
		]));
		registry.register('test.core.scpcss.multi3', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: yellow; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.multi1');
		doc.createNode('test.core.scpcss.multi2');
		doc.createNode('test.core.scpcss.multi3');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assert(html.includes('color: red'), "Should include first component CSS");
		assert(html.includes('color: green'), "Should include second component CSS");
		assert(html.includes('color: yellow'), "Should include third component CSS");

		// Verify all @@ replaced
		assert(!html.includes('@@'), "Should not contain any @@ placeholders");
	});

	await t.step("Component ID substitution patterns", () => {
		registry.register('test.core.scpcss.patterns', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; } .@@ .child { color: red; } .@@:hover { color: green; } .@@::before { content: "x"; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.patterns');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');

		// Count component ID occurrences (should be 4, one for each @@)
		const compIdMatches = html.match(/_MO_\w+/g);
		assertEquals(compIdMatches?.length, 4, "Should replace all @@ occurrences");

		// Verify contexts preserved
		assert(html.includes('.child'), "Should preserve child selector");
		assert(html.includes(':hover'), "Should preserve pseudo-class");
		assert(html.includes('::before'), "Should preserve pseudo-element");
	});

	await t.step("Mixed components (with and without scoped CSS)", () => {
		registry.register('test.core.scpcss.withcss', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { margin: 1rem; }'
		]));
		registry.register('test.core.scpcss.nocss', ls([
			'allowLate', true,
			'if', 'MWIHTML'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.withcss');
		doc.createNode('test.core.scpcss.nocss');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assert(html.includes('margin: 1rem'), "Should include CSS from component with scopedCSS");

		// Should only have one component ID (from withcss)
		const compIdMatches = html.match(/_MO_\w+/g);
		assertEquals(compIdMatches?.length, 1, "Should only include components with scopedCSS");
	});
});

Deno.test("MWICoreScpCSS Core - Edge Cases", async (t) => {
	await t.step("Component with empty scopedCSS string", () => {
		registry.register('test.core.scpcss.empty', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', ''
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.empty');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assertEquals(html, '', "Empty scopedCSS should not contribute to output");
	});

	await t.step("Component with whitespace-only scopedCSS", () => {
		registry.register('test.core.scpcss.whitespace', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '   \n  '
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.whitespace');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		// Whitespace-only CSS should still be included (implementation detail)
		assert(html.length > 0, "Whitespace CSS should be included");
	});

	await t.step("CSS with special characters", () => {
		registry.register('test.core.scpcss.special', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "test\'s \\"quoted\\" & <text>"; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.special');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assert(html.includes('content:'), "Should handle special characters");
		assert(html.includes('test'), "Should preserve content");
	});

	await t.step("CSS containing </style> tag", () => {
		registry.register('test.core.scpcss.closetag', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "</style>"; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.closetag');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assert(html.includes('\\3c /style>'), "Should escape </style> as \\3c /style>");

		// Count closing tags - should be exactly 1 (the actual closing tag)
		const closeTags = html.match(/<\/style>/gi);
		assertEquals(closeTags?.length, 1, "Should have exactly one closing </style>");
	});

	await t.step("CSS containing </style> - case variations", () => {
		registry.register('test.core.scpcss.casevar', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "</STYLE></Style></sTyLe>"; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.casevar');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');

		// All variations should be escaped
		const unescapedCloseTags = html.match(/<\/style>/gi);
		assertEquals(unescapedCloseTags?.length, 1, "Should have only one unescaped </style> (the closing tag)");
	});

	await t.step("Very long CSS content", () => {
		// Generate large CSS block
		let longCSS = '';
		for (let i = 0; i < 1000; i++) {
			longCSS += `.@@ .class${i} { color: color${i}; } `;
		}

		registry.register('test.core.scpcss.long', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', longCSS
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.long');
		const scpNode = doc.createNode('m.scpcss');

		const html = scpNode('getHTML');
		assert(html.includes('class0'), "Should include first class");
		assert(html.includes('class999'), "Should include last class");
		assert(html.length > 10000, "Should have substantial length");
	});
});

Deno.test("MWICoreScpCSS Core - m.ci Virtual Attribute", async (t) => {
	await t.step("Read m.ci from node itself", () => {
		registry.register('test.core.scpcss.ci1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = getInstance('MWIDocument');
		const node = doc.createNode('test.core.scpcss.ci1');

		const ci = node('getAttr', ls([, 'm.ci']));
		assertExists(ci, "m.ci should be defined for node");
		assert(ci.startsWith('_MO_'), "Component ID should start with _MO_");
	});

	await t.step("Read m.ci via m.slat from slot source", () => {
		registry.register('test.core.scpcss.ci2', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.slat=[ci=[m.ci]]] )]')
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.core.scpcss.ci2');

		// The template's internal div should have ci attribute set from slot source
		const html = tplNode('getHTML');
		assert(html.includes('ci='), "Should have ci attribute from m.slat");
	});

	await t.step("m.ci is read-only", () => {
		registry.register('test.core.scpcss.ci3', ls([
			'allowLate', true,
			'if', 'MWIHTML'
		]));

		const doc = getInstance('MWIDocument');
		const node = doc.createNode('test.core.scpcss.ci3');

		const originalCi = node('getAttr', ls([, 'm.ci']));

		// Attempt to set m.ci
		node('setAttr', ls([, 'm.ci', , 'fake-id']));

		const afterCi = node('getAttr', ls([, 'm.ci']));
		assertEquals(afterCi, originalCi, "m.ci should remain unchanged (read-only)");
	});
});

Deno.test("MWICoreScpCSS Core - m.coat with m.ci Integration", async (t) => {
	await t.step("Use m.ci in m.coat to set m.percl", () => {
		registry.register('test.core.scpcss.coat1', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"]] )]'),
			'scopedCSS', '.@@ { border: 1px solid; }'
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.core.scpcss.coat1');

		// Get the internal div
		const html = tplNode('getHTML');

		// Should have m.percl set to component ID
		const compId = tplNode('getAttr', ls([, 'm.ci']));
		assert(html.includes(`class="${compId}"`), "Should have component ID as class");
	});

	await t.step("Use m.ci in m.coat to set regular class", () => {
		registry.register('test.core.scpcss.coat2', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[class="<m.ci>"]] )]')
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.core.scpcss.coat2');

		const compId = tplNode('getAttr', ls([, 'm.ci']));
		const html = tplNode('getHTML');

		assert(html.includes(`class="${compId}"`), "Should have component ID as class");
	});

	await t.step("Multiple m.coat attributes using m.ci", () => {
		registry.register('test.core.scpcss.coat3', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>" data-comp="<m.ci>"]] )]')
		]));

		const doc = getInstance('MWIDocument');
		const tplNode = doc.createNode('test.core.scpcss.coat3');

		const compId = tplNode('getAttr', ls([, 'm.ci']));
		const html = tplNode('getHTML');

		assert(html.includes(`class="${compId}"`), "Should have component ID as class");
		assert(html.includes(`data-comp="${compId}"`), "Should have component ID as data attribute");
	});

	await t.step("m.coat with m.ci in nested template context", () => {
		registry.register('test.core.scpcss.coat4outer', ls([
			'allowLate', true,
			'tpl', ps('[( [test.core.scpcss.coat4inner m.slat=[outerci=[m.ci]]] )]'),
			'scopedCSS', '.@@ { border: 2px solid; }'
		]));
		registry.register('test.core.scpcss.coat4inner', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<outerci>"]] )]'),
			'scopedCSS', '.@@ { padding: 1rem; }'
		]));

		const doc = getInstance('MWIDocument');
		const outerNode = doc.createNode('test.core.scpcss.coat4outer');

		const html = outerNode('getHTML');

		// The inner div should have the outer template's component ID
		const outerCompId = outerNode('getAttr', ls([, 'm.ci']));
		assert(html.includes(`class="${outerCompId}"`), "Should have outer component ID as class");
	});
});

Deno.test("MWICoreScpCSS Core - CSS Deduplication", async (t) => {
	await t.step("Single component type, multiple instances", () => {
		registry.register('test.core.scpcss.dedup1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { width: 100%; }'
		]));

		const doc = getInstance('MWIDocument');

		// Create 5 instances
		for (let i = 0; i < 5; i++) {
			doc.createNode('test.core.scpcss.dedup1');
		}

		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// CSS should appear only once
		const matches = html.match(/width: 100%/g);
		assertEquals(matches?.length, 1, "CSS should appear only once despite multiple instances");
	});

	await t.step("Component type reuse across document", () => {
		registry.register('test.core.scpcss.dedup2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { height: 50px; }'
		]));

		const doc = getInstance('MWIDocument');

		// Use in different parts
		const frag1 = doc.createNode('m.frg');
		frag1('append', doc.createNode('test.core.scpcss.dedup2'));
		doc('append', frag1);

		const frag2 = doc.createNode('m.frg');
		frag2('append', doc.createNode('test.core.scpcss.dedup2'));
		doc('append', frag2);

		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// CSS should not be duplicated
		const matches = html.match(/height: 50px/g);
		assertEquals(matches?.length, 1, "CSS should not be duplicated across document");
	});

	await t.step("Multiple m.scpcss nodes with same components", () => {
		registry.register('test.core.scpcss.dedup3', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { margin: 2rem; }'
		]));

		const doc = getInstance('MWIDocument');
		doc.createNode('test.core.scpcss.dedup3');

		const scpNode1 = doc.createNode('m.scpcss');
		scpNode1.setAttr('id', 'scpcss'); // Prevent mismatch due to auto-assigned id
		const scpNode2 = doc.createNode('m.scpcss');
		scpNode2.setAttr('id', 'scpcss');

		const html1 = scpNode1('getHTML');
		const html2 = scpNode2('getHTML');

		// Both should generate the same CSS (expected behavior)
		assertEquals(html1, html2, "Each m.scpcss should independently aggregate same CSS");

		// Each should have the CSS once
		const matches1 = html1.match(/margin: 2rem/g);
		const matches2 = html2.match(/margin: 2rem/g);
		assertEquals(matches1?.length, 1, "First m.scpcss should have CSS once");
		assertEquals(matches2?.length, 1, "Second m.scpcss should have CSS once");
	});
});

Deno.test("MWICoreScpCSS Core - Real-World Patterns", async (t) => {
	await t.step("Card component with scoped styles", () => {
		registry.register('test.core.scpcss.card', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
			'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; } .@@ .header { font-weight: bold; }'
		]));

		const doc = getInstance('MWIDocument');
		const cardNode = doc.createNode('test.core.scpcss.card');
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
		registry.register('test.core.scpcss.parent', ls([
			'allowLate', true,
			'tpl', ps('[( [m.scpcss] [h.div m.coat=[m.percl="<m.ci>"] [test.core.scpcss.child m.slat=[parentci=[m.ci]]]] )]'),
			'scopedCSS', '.@@ { background: #f0f0f0; }'
		]));
		registry.register('test.core.scpcss.child', ls([
			'allowLate', true,
			'tpl', ps('[( [h.span m.coat=[m.percl="<parentci>"] "Child"] )]'),
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const doc = getInstance('MWIDocument');
		const parNode = doc.createNode('test.core.scpcss.parent');

		const html = parNode('getHTML');

		assert(html.includes('background: #f0f0f0'), "Should include parent CSS");
		assert(html.includes('color: blue'), "Should include child CSS");

		// Should have two different component IDs
		const compIdMatches = html.match(/_MO_\w+/g);
		assert(compIdMatches.length >= 2, "Should have at least two component IDs");
	});

	await t.step("Component library pattern", () => {
		// Register multiple components
		registry.register('test.core.scpcss.button', ls([
			'allowLate', true,
			'tpl', ps('[( [h.button m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
			'scopedCSS', '.@@ { padding: 0.5rem 1rem; border-radius: 4px; }'
		]));
		registry.register('test.core.scpcss.input', ls([
			'allowLate', true,
			'tpl', ps('[( [h.input m.coat=[m.percl="<m.ci>"]] )]'),
			'scopedCSS', '.@@ { border: 1px solid #ddd; padding: 0.5rem; }'
		]));
		registry.register('test.core.scpcss.cardlib', ls([
			'allowLate', true,
			'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
			'scopedCSS', '.@@ { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }'
		]));

		const doc = getInstance('MWIDocument');

		// Use all components
		doc.createNode('test.core.scpcss.button');
		doc.createNode('test.core.scpcss.input');
		doc.createNode('test.core.scpcss.cardlib');

		const scpNode = doc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('padding: 0.5rem 1rem'), "Should include button CSS");
		assert(html.includes('border-radius: 4px'), "Should include button border-radius");
		assert(html.includes('border: 1px solid #ddd'), "Should include input CSS");
		assert(html.includes('box-shadow'), "Should include card CSS");
	});
});
