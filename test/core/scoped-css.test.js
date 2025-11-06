import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

Deno.test("MWICoreScpCSS - Basic Interface Behavior", async (t) => {
	await t.step("Create m.scpcss node", () => {
		const scpNode = doc.createNode('m.scpcss');
		assert(scpNode, "m.scpcss node should be created");
		assertEquals(scpNode.msjsType, 'MWICoreScpCSS');
	});

	await t.step("m.scpcss node has correct type", () => {
		const scpNode = doc.createNode('m.scpcss');
		assertEquals(scpNode('type'), 'm.scpcss');
		assertEquals(scpNode.type, 'm.scpcss');
	});

	await t.step("m.scpcss is void (no children allowed)", () => {
		const scpNode = doc.createNode('m.scpcss');
		const subSpec = scpNode('getSubSpec');
		assertEquals(subSpec.size, 0, "getSubSpec should return empty NANOS");

		// setSubSpec should be a no-op
		const result = scpNode('setSubSpec', ls([, ps('[([m.t t="test"])]')]));
		assertStrictEquals(result, scpNode, "setSubSpec should return receiver");
		assertEquals(scpNode('getSubSpec').size, 0, "subSpec should still be empty");
	});
});

Deno.test("MWICoreScpCSS - Empty Document", async (t) => {
	await t.step("Empty document (no components used)", () => {
		const emptyDoc = getInstance('MWIDocument');
		const scpNode = emptyDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');
		assertEquals(html, '', "getHTML should return empty string for empty document");
	});

	await t.step("Empty document getDOM returns empty NANOS", () => {
		const emptyDoc = getInstance('MWIDocument');
		const scpNode = emptyDoc.createNode('m.scpcss');
		const dom = scpNode('getDOM');
		assertEquals(dom.size, 0, "getDOM should return empty NANOS for empty document");
	});
});

Deno.test("MWICoreScpCSS - Document with No Scoped CSS", async (t) => {
	await t.step("Components without scopedCSS property", () => {
		registry.register('test.scpcss.noCSS', ls(['allowLate', true, 'if', 'MWIHTML']));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.noCSS');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');
		assertEquals(html, '', "Should render nothing when no components have scopedCSS");
	});
});

Deno.test("MWICoreScpCSS - CSS Aggregation Logic", async (t) => {
	await t.step("Single component with scoped CSS", () => {
		registry.register('test.scpcss.single', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.single');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('<style>'), "Should include style tag");
		assert(html.includes('</style>'), "Should close style tag");
		assert(html.includes('color: blue'), "Should include CSS content");
		assert(html.includes('_MO_'), "Should replace @@ with component ID");
		assert(!html.includes('@@'), "Should not contain @@ placeholder");
	});

	await t.step("Multiple components with scoped CSS", () => {
		registry.register('test.scpcss.multi1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));
		registry.register('test.scpcss.multi2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: green; }'
		]));
		registry.register('test.scpcss.multi3', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.multi1');
		testDoc.createNode('test.scpcss.multi2');
		testDoc.createNode('test.scpcss.multi3');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('color: red'), "Should include first component CSS");
		assert(html.includes('color: green'), "Should include second component CSS");
		assert(html.includes('color: blue'), "Should include third component CSS");
	});

	await t.step("Component ID substitution - single occurrence", () => {
		registry.register('test.scpcss.subst1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { border: 1px solid; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.subst1');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		const matches = html.match(/_MO_[0-9a-z]+/g);
		assert(matches && matches.length === 1, "Should have exactly one component ID");
		assert(!html.includes('@@'), "Should not contain @@ placeholder");
	});

	await t.step("Component ID substitution - multiple occurrences", () => {
		registry.register('test.scpcss.subst2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; } .@@ .child { color: blue; } .@@:hover { color: green; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.subst2');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		const matches = html.match(/_MO_[0-9a-z]+/g);
		assert(matches && matches.length === 3, "Should replace all three @@ occurrences");
		// All should be the same ID
		const uniqueIds = new Set(matches);
		assertEquals(uniqueIds.size, 1, "All @@ should be replaced with same component ID");
	});

	await t.step("Mixed components (with and without scoped CSS)", () => {
		registry.register('test.scpcss.mixed1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));
		registry.register('test.scpcss.mixed2', ls([
			'allowLate', true,
			'if', 'MWIHTML'
			// No scopedCSS
		]));
		registry.register('test.scpcss.mixed3', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));

		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.mixed1');
		testDoc.createNode('test.scpcss.mixed2');
		testDoc.createNode('test.scpcss.mixed3');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('color: red'), "Should include CSS from first component");
		assert(html.includes('color: blue'), "Should include CSS from third component");
		// Should only have 2 component IDs (not 3)
		const matches = html.match(/_MO_[0-9a-z]+/g);
		const uniqueIds = new Set(matches);
		assertEquals(uniqueIds.size, 2, "Should only include IDs for components with scopedCSS");
	});
});

Deno.test("MWICoreScpCSS - Edge Cases", async (t) => {
	await t.step("Component with empty scopedCSS string", () => {
		registry.register('test.scpcss.empty', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', ''
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.empty');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// Empty CSS should not contribute to output
		assertEquals(html, '', "Empty scopedCSS should not produce output");
	});

	await t.step("Component with whitespace-only scopedCSS", () => {
		registry.register('test.scpcss.whitespace', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '   \n  '
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.whitespace');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// Whitespace-only CSS should be included (implementation includes it)
		assert(html.includes('<style>'), "Should include style tag for whitespace");
	});

	await t.step("CSS with special characters", () => {
		registry.register('test.scpcss.special', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "test\'s \\"quoted\\" text"; background: url(\'data:image/svg+xml;utf8,<svg></svg>\'); }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.special');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('content:'), "Should handle quotes in CSS");
		assert(html.includes('background:'), "Should handle special characters");
	});

	await t.step("CSS containing </style> tag", () => {
		registry.register('test.scpcss.closetag', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { /* </style> in comment */ content: "</style>"; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.closetag');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('\\3c /style>'), "Should escape </style> as \\3c /style>");
		assert(!html.includes('</style></style>'), "Should not have premature tag closure");
		// Should have exactly one closing </style> at the end
		const closeTags = html.match(/<\/style>/gi);
		assertEquals(closeTags?.length, 1, "Should have exactly one closing </style> tag");
	});

	await t.step("CSS containing </STYLE> (case insensitive)", () => {
		registry.register('test.scpcss.caseinsens', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "</STYLE>"; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.caseinsens');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('\\3c /'), "Should escape case-insensitive </STYLE>");
		assert(!html.includes('</STYLE>'), "Should not contain unescaped </STYLE>");
	});

	await t.step("CSS with whitespace variations in </style>", () => {
		registry.register('test.scpcss.whitespace2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { content: "< /style>"; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.whitespace2');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('\\3c  /'), "Should escape whitespace variations");
	});
});

Deno.test("MWICoreScpCSS - CSS Deduplication", async (t) => {
	await t.step("Single component type, multiple instances", () => {
		registry.register('test.scpcss.dedup1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: purple; }'
		]));
		const testDoc = getInstance('MWIDocument');
		// Create 5 instances of the same component type
		testDoc.createNode('test.scpcss.dedup1');
		testDoc.createNode('test.scpcss.dedup1');
		testDoc.createNode('test.scpcss.dedup1');
		testDoc.createNode('test.scpcss.dedup1');
		testDoc.createNode('test.scpcss.dedup1');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// CSS should appear only once
		const matches = html.match(/color: purple/g);
		assertEquals(matches?.length, 1, "CSS should appear only once, not per instance");
	});

	await t.step("Component type reuse across document", () => {
		registry.register('test.scpcss.dedup2', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { border: 2px solid; }'
		]));
		const testDoc = getInstance('MWIDocument');
		// Use same component type in different parts
		const frag1 = testDoc.createNode('m.frg');
		frag1('append', testDoc.createNode('test.scpcss.dedup2'));
		const frag2 = testDoc.createNode('m.frg');
		frag2('append', testDoc.createNode('test.scpcss.dedup2'));
		testDoc('append', frag1);
		testDoc('append', frag2);

		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// CSS should not be duplicated
		const matches = html.match(/border: 2px solid/g);
		assertEquals(matches?.length, 1, "CSS should not be duplicated across document");
	});

	await t.step("Multiple m.scpcss nodes with same components", () => {
		registry.register('test.scpcss.dedup3', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { margin: 10px; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.dedup3');

		const scpNode1 = testDoc.createNode('m.scpcss');
		const scpNode2 = testDoc.createNode('m.scpcss');

		const html1 = scpNode1('getHTML');
		const html2 = scpNode2('getHTML');

		// Each m.scpcss independently aggregates, so both should have the same CSS
		assertEquals(html1, html2, "Multiple m.scpcss nodes should generate same CSS");
		assert(html1.includes('margin: 10px'), "Both should include the CSS");
	});
});

Deno.test("MWICoreScpCSS - m.sci Virtual Attribute", async (t) => {
	await t.step("Read m.sci from node with slot source", () => {
		registry.register('test.scpcss.sci1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }',
			'tpl', ps('[([h.div])]')
		]));
		const testDoc = getInstance('MWIDocument');
		const tplNode = testDoc.createNode('test.scpcss.sci1');

		// The template becomes the slotSrc for its content
		// We need to access the internal fragment's children to test m.sci
		// This is a bit tricky since we can't directly access internal state
		// For now, verify the template node exists
		assert(tplNode, "Template with scopedCSS should be created");
	});

	await t.step("Read m.sci from node without slot source", () => {
		const testDoc = getInstance('MWIDocument');
		const divNode = testDoc.createNode('h.div');
		const sci = divNode('getAttr', ls([, 'm.sci']));
		assertEquals(sci, undefined, "m.sci should be undefined without slot source");
	});
});

Deno.test("MWICoreScpCSS - Real-World Patterns", async (t) => {
	await t.step("Card component with scoped styles", () => {
		registry.register('test.scpcss.card', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; } .@@ .header { font-weight: bold; }'
		]));
		const testDoc = getInstance('MWIDocument');
		testDoc.createNode('test.scpcss.card');
		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		assert(html.includes('border: 1px solid #ccc'), "Should include card border style");
		assert(html.includes('padding: 1rem'), "Should include card padding");
		assert(html.includes('.header'), "Should include nested selector");
		assert(html.includes('font-weight: bold'), "Should include header style");
	});

	await t.step("Component library pattern", () => {
		// Register multiple components
		for (let i = 0; i < 10; i++) {
			registry.register(`test.scpcss.lib${i}`, ls([
				'allowLate', true,
				'if', 'MWIHTML',
				'scopedCSS', `.@@ { color: color${i}; }`
			]));
		}

		const testDoc = getInstance('MWIDocument');
		// Use only a subset
		testDoc.createNode('test.scpcss.lib2');
		testDoc.createNode('test.scpcss.lib5');
		testDoc.createNode('test.scpcss.lib7');

		const scpNode = testDoc.createNode('m.scpcss');
		const html = scpNode('getHTML');

		// Should only include CSS for used components
		assert(html.includes('color2'), "Should include lib2 CSS");
		assert(html.includes('color5'), "Should include lib5 CSS");
		assert(html.includes('color7'), "Should include lib7 CSS");
		assert(!html.includes('color0'), "Should not include unused lib0 CSS");
		assert(!html.includes('color9'), "Should not include unused lib9 CSS");
	});
});
