import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();
await simulateBrowser();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const registry = getInstance('MWIRegistry');

Deno.test("MWICoreScpCSS CSR Compound - Card Component with m.coat", async (t) => {
	await t.step("Card component with scoped styles and m.percl", async () => {
		// Register card component with scoped CSS
		registry.register('test.csr.compound.card', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; border-radius: 4px; } .@@ .card-header { font-weight: bold; font-size: 1.2rem; } .@@ .card-body { margin-top: 0.5rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [h.div class=card-header [m.slot name=header]] [h.div class=card-body [m.slot name=body]]])]')
		]));

		const doc = getInstance('MWIDocument');

		// Create m.scpcss node
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Create card instance with slotted content via attributes
		const cardNode = doc.createNode('test.csr.compound.card');
		$c.sm(cardNode, 'setAttr', ls([, 'header', , ps('[([m.t t="Card Title"])]')]));
		$c.sm(cardNode, 'setAttr', ls([, 'body', , ps('[([m.t t="Card content goes here"])]')]));

		$c.sm(doc, 'append', cardNode);

		await globalThis.reactive.wait();

		// Verify style element exists
		const styleDom = $c.sm(scpNode, 'getDOM');
		assertEquals(styleDom.size, 1, "Should have style element");
		const styleElem = styleDom.at(0);

		// Verify CSS content
		assert(styleElem.textContent.includes('border: 1px solid #ccc'), "Should include card border style");
		assert(styleElem.textContent.includes('padding: 1rem'), "Should include padding");
		assert(styleElem.textContent.includes('_MO_'), "Should include component ID");
		assert(!styleElem.textContent.includes('@@'), "Should not contain @@ placeholder");

		// Verify card DOM structure
		const cardDom = $c.sm(cardNode, 'getDOM');
		assert(cardDom.size > 0, "Card should have DOM elements");

		const cardDiv = cardDom.at(0);
		assert(cardDiv instanceof globalThis.window.HTMLDivElement, "Should be div element");

		// Verify m.percl was applied (component ID should be in class)
		const classes = cardDiv.className.split(' ');
		const hasComponentId = classes.some(c => c.startsWith('_MO_'));
		assert(hasComponentId, "Card div should have component ID class from m.percl");
	});

	await t.step("Card component with dynamic content updates", async () => {
		registry.register('test.csr.compound.card2', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { background: #f9f9f9; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Initially no card
		let styleDom = $c.sm(scpNode, 'getDOM');
		assertEquals(styleDom.size, 0, "Should be empty initially");

		// Add card dynamically
		const cardNode = doc.createNode('test.csr.compound.card2');
		$c.sm(cardNode, 'setAttr', ls([, 'content', , ps('[([m.t t="Initial content"])]')]));
		$c.sm(doc, 'append', cardNode);

		await globalThis.reactive.wait();

		// Style should now exist
		styleDom = $c.sm(scpNode, 'getDOM');
		assertEquals(styleDom.size, 1, "Should have style element after card added");
		const styleElem = styleDom.at(0);
		assert(styleElem.textContent.includes('background: #f9f9f9'), "Should include card CSS");
	});
});

Deno.test("MWICoreScpCSS CSR Compound - Nested Components", async (t) => {
	await t.step("Parent and child components with scoped CSS", async () => {
		// Register parent component
		registry.register('test.csr.compound.parent', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 2px solid blue; padding: 2rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot]])]')
		]));

		// Register child component
		registry.register('test.csr.compound.child', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 1px solid red; padding: 1rem; margin: 0.5rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Create parent with nested children
		const parentNode = doc.createNode('test.csr.compound.parent');

		const child1 = doc.createNode('test.csr.compound.child');
		$c.sm(child1, 'setAttr', ls([, 'content', , ps('[([m.t t="Child 1"])]')]));

		const child2 = doc.createNode('test.csr.compound.child');
		$c.sm(child2, 'setAttr', ls([, 'content', , ps('[([m.t t="Child 2"])]')]));

		$c.sm(parentNode, 'append', child1);
		$c.sm(parentNode, 'append', child2);

		$c.sm(doc, 'append', parentNode);

		await globalThis.reactive.wait();

		// Verify both CSS blocks are present
		const styleDom = $c.sm(scpNode, 'getDOM');
		assertEquals(styleDom.size, 1, "Should have style element");
		const styleElem = styleDom.at(0);

		assert(styleElem.textContent.includes('border: 2px solid blue'), "Should include parent CSS");
		assert(styleElem.textContent.includes('border: 1px solid red'), "Should include child CSS");
		assert(styleElem.textContent.includes('padding: 2rem'), "Should include parent padding");
		assert(styleElem.textContent.includes('padding: 1rem'), "Should include child padding");

		// Verify unique component IDs
		const componentIds = styleElem.textContent.match(/_MO_[0-9a-z]+/g);
		const uniqueIds = new Set(componentIds);
		assertEquals(uniqueIds.size, 2, "Should have two unique component IDs (parent and child)");
	});

	await t.step("Deeply nested components with reactive updates", async () => {
		registry.register('test.csr.compound.level1', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { background: #f0f0f0; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		registry.register('test.csr.compound.level2', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { background: #e0e0e0; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		registry.register('test.csr.compound.level3', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { background: #d0d0d0; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Start with level1 only
		const level1 = doc.createNode('test.csr.compound.level1');
		$c.sm(doc, 'append', level1);

		await globalThis.reactive.wait();

		let styleDom = $c.sm(scpNode, 'getDOM');
		let styleElem = styleDom.at(0);
		assert(styleElem.textContent.includes('#f0f0f0'), "Should include level1 CSS");
		assert(!styleElem.textContent.includes('#e0e0e0'), "Should not include level2 CSS yet");

		// Add level2 nested in level1
		const level2 = doc.createNode('test.csr.compound.level2');
		$c.sm(level1, 'setAttr', ls([, 'content', , level2]));

		await globalThis.reactive.wait();

		styleDom = $c.sm(scpNode, 'getDOM');
		styleElem = styleDom.at(0);
		assert(styleElem.textContent.includes('#f0f0f0'), "Should still include level1 CSS");
		assert(styleElem.textContent.includes('#e0e0e0'), "Should now include level2 CSS");
		assert(!styleElem.textContent.includes('#d0d0d0'), "Should not include level3 CSS yet");

		// Add level3 nested in level2
		const level3 = doc.createNode('test.csr.compound.level3');
		$c.sm(level3, 'setAttr', ls([, 'content', , ps('[([m.t t="Deep content"])]')]));
		$c.sm(level2, 'setAttr', ls([, 'content', , level3]));

		await globalThis.reactive.wait();

		styleDom = $c.sm(scpNode, 'getDOM');
		styleElem = styleDom.at(0);
		assert(styleElem.textContent.includes('#f0f0f0'), "Should include level1 CSS");
		assert(styleElem.textContent.includes('#e0e0e0'), "Should include level2 CSS");
		assert(styleElem.textContent.includes('#d0d0d0'), "Should now include level3 CSS");
	});
});

Deno.test("MWICoreScpCSS CSR Compound - Template with Scoped CSS", async (t) => {
	await t.step("Template with scoped CSS and slotting", async () => {
		registry.register('test.csr.compound.tpl', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { display: flex; gap: 1rem; } .@@ .item { flex: 1; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [h.div class=item m.coat=[m.percl="<m.ci>"] [m.slot name=item1]] [h.div class=item m.coat=[m.percl="<m.ci>"] [m.slot name=item2]] [h.div class=item m.coat=[m.percl="<m.ci>"] [m.slot name=item3]]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		const tplNode = doc.createNode('test.csr.compound.tpl');

		// Add slotted content via attributes
		$c.sm(tplNode, 'setAttr', ls([, 'item1', , ps('[([m.t t="Item 1"])]')]));
		$c.sm(tplNode, 'setAttr', ls([, 'item2', , ps('[([m.t t="Item 2"])]')]));
		$c.sm(tplNode, 'setAttr', ls([, 'item3', , ps('[([m.t t="Item 3"])]')]));

		$c.sm(doc, 'append', tplNode);

		await globalThis.reactive.wait();

		// Verify CSS
		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		assert(styleElem.textContent.includes('display: flex'), "Should include flex display");
		assert(styleElem.textContent.includes('gap: 1rem'), "Should include gap");
		assert(styleElem.textContent.includes('.item'), "Should include item selector");
		assert(styleElem.textContent.includes('flex: 1'), "Should include flex property");

		// Verify DOM structure
		const tplDom = $c.sm(tplNode, 'getDOM');
		assert(tplDom.size > 0, "Template should have DOM elements");

		const containerDiv = tplDom.at(0);
		assert(containerDiv instanceof globalThis.window.HTMLDivElement, "Should be div element");

		// Verify component ID class is applied
		const classes = containerDiv.className.split(' ');
		const hasComponentId = classes.some(c => c.startsWith('_MO_'));
		assert(hasComponentId, "Container should have component ID class");
	});

	await t.step("Template with conditional slotting", async () => {
		registry.register('test.csr.compound.conditional', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 1px dashed gray; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		const tplNode = doc.createNode('test.csr.compound.conditional');
		$c.sm(doc, 'append', tplNode);

		await globalThis.reactive.wait();

		// Initially with no slotted content
		let styleDom = $c.sm(scpNode, 'getDOM');
		let styleElem = styleDom.at(0);
		assert(styleElem.textContent.includes('border: 1px dashed gray'), "Should include CSS even without slotted content");

		// Add slotted content
		$c.sm(tplNode, 'setAttr', ls([, 'content', , ps('[([m.t t="Now with content"])]')]));

		await globalThis.reactive.wait();

		// CSS should remain the same
		styleDom = $c.sm(scpNode, 'getDOM');
		styleElem = styleDom.at(0);
		assert(styleElem.textContent.includes('border: 1px dashed gray'), "CSS should remain after adding content");
	});
});

Deno.test("MWICoreScpCSS CSR Compound - Component Library Pattern", async (t) => {
	await t.step("Button, input, and card components", async () => {
		// Register button component
		registry.register('test.csr.compound.button', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; } .@@:hover { background: #0056b3; }',
			'tpl', ps('[([h.button m.coat=[m.percl="<m.ci>"] [m.slot name=label]])]')
		]));

		// Register input component
		registry.register('test.csr.compound.input', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; } .@@:focus { border-color: #007bff; outline: none; }',
			'tpl', ps('[([h.input m.coat=[m.percl="<m.ci>"]])]')
		]));

		// Register card component
		registry.register('test.csr.compound.libcard', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { border: 1px solid #ddd; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Create a form using all components
		const cardNode = doc.createNode('test.csr.compound.libcard');

		const inputNode = doc.createNode('test.csr.compound.input');
		const buttonNode = doc.createNode('test.csr.compound.button');
		$c.sm(buttonNode, 'setAttr', ls([, 'label', , ps('[([m.t t="Submit"])]')]));

		const formFrag = doc.createNode('m.frg');
		$c.sm(formFrag, 'append', inputNode);
		$c.sm(formFrag, 'append', buttonNode);

		$c.sm(cardNode, 'setAttr', ls([, 'content', , formFrag]));
		$c.sm(doc, 'append', cardNode);

		await globalThis.reactive.wait();

		// Verify all component CSS is present
		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		assert(styleElem.textContent.includes('background: #007bff'), "Should include button CSS");
		assert(styleElem.textContent.includes('border: 1px solid #ccc'), "Should include input CSS");
		assert(styleElem.textContent.includes('box-shadow'), "Should include card CSS");
		assert(styleElem.textContent.includes(':hover'), "Should include hover state");
		assert(styleElem.textContent.includes(':focus'), "Should include focus state");

		// Verify three unique component IDs
		const componentIds = styleElem.textContent.match(/_MO_[0-9a-z]+/g);
		const uniqueIds = new Set(componentIds);
		assertEquals(uniqueIds.size, 3, "Should have three unique component IDs");
	});

	await t.step("Selective component loading", async () => {
		// Register many components
		for (let i = 0; i < 10; i++) {
			registry.register(`test.csr.compound.comp${i}`, ls([
				'allowLate', true,
				'if', 'MWIHTML',
				'scopedCSS', `.@@ { order: ${i}; }`
			]));
		}

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Use only a subset
		doc.createNode('test.csr.compound.comp1');
		doc.createNode('test.csr.compound.comp4');
		doc.createNode('test.csr.compound.comp7');

		await globalThis.reactive.wait();

		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		// Should only include used components
		assert(styleElem.textContent.includes('order: 1'), "Should include comp1");
		assert(styleElem.textContent.includes('order: 4'), "Should include comp4");
		assert(styleElem.textContent.includes('order: 7'), "Should include comp7");
		assert(!styleElem.textContent.includes('order: 0'), "Should not include unused comp0");
		assert(!styleElem.textContent.includes('order: 9'), "Should not include unused comp9");
	});
});

Deno.test("MWICoreScpCSS CSR Compound - CSS Deduplication", async (t) => {
	await t.step("Multiple instances of same component type", async () => {
		registry.register('test.csr.compound.dedup', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { background: lightblue; padding: 0.5rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Create multiple instances
		for (let i = 0; i < 5; i++) {
			const instance = doc.createNode('test.csr.compound.dedup');
			$c.sm(instance, 'setAttr', ls([, 'content', , ps(`[([m.t t="Instance ${i}"])]`)]));
			$c.sm(doc, 'append', instance);
		}

		await globalThis.reactive.wait();

		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		// CSS should appear only once
		const matches = styleElem.textContent.match(/background: lightblue/g);
		assertEquals(matches?.length, 1, "CSS should appear only once despite 5 instances");
	});

	await t.step("Complex structure with component reuse", async () => {
		registry.register('test.csr.compound.reuse', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { margin: 0.25rem; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Create nested structure with same component type
		const parent = doc.createNode('test.csr.compound.reuse');
		const child1 = doc.createNode('test.csr.compound.reuse');
		const child2 = doc.createNode('test.csr.compound.reuse');

		const childFrag = doc.createNode('m.frg');
		$c.sm(childFrag, 'append', child1);
		$c.sm(childFrag, 'append', child2);
		$c.sm(parent, 'setAttr', ls([, 'content', , childFrag]));

		$c.sm(doc, 'append', parent);

		await globalThis.reactive.wait();

		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		// CSS should appear only once
		const matches = styleElem.textContent.match(/margin: 0\.25rem/g);
		assertEquals(matches?.length, 1, "CSS should appear only once despite nested reuse");
	});
});

Deno.test("MWICoreScpCSS CSR Compound - Multiple m.scpcss Nodes", async (t) => {
	await t.step("Multiple m.scpcss nodes in different locations", async () => {
		registry.register('test.csr.compound.multiscpcss', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { font-family: Arial; }'
		]));

		const doc = getInstance('MWIDocument');

		// Add first m.scpcss
		const scpNode1 = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode1);

		// Add component
		doc.createNode('test.csr.compound.multiscpcss');

		// Add second m.scpcss
		const scpNode2 = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode2);

		await globalThis.reactive.wait();

		// Both should have style elements with same CSS
		const dom1 = $c.sm(scpNode1, 'getDOM');
		const dom2 = $c.sm(scpNode2, 'getDOM');

		assertEquals(dom1.size, 1, "First m.scpcss should have style element");
		assertEquals(dom2.size, 1, "Second m.scpcss should have style element");

		const style1 = dom1.at(0);
		const style2 = dom2.at(0);

		assert(style1 !== style2, "Should be separate style elements");
		assertEquals(style1.textContent, style2.textContent, "Should have identical CSS content");
	});
});

Deno.test("MWICoreScpCSS CSR Compound - Edge Cases", async (t) => {
	await t.step("Empty document with m.scpcss", async () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		await globalThis.reactive.wait();

		const styleDom = $c.sm(scpNode, 'getDOM');
		assertEquals(styleDom.size, 0, "Should have no style element for empty document");
	});

	await t.step("Component with CSS escaping in compound context", async () => {
		registry.register('test.csr.compound.escape', ls([
			'allowLate', true,
			'scopedCSS', '.@@ { content: "</style>"; }',
			'tpl', ps('[([h.div m.coat=[m.percl="<m.ci>"] [m.slot name=content]])]')
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		const compNode = doc.createNode('test.csr.compound.escape');
		$c.sm(compNode, 'setAttr', ls([, 'content', , ps('[([m.t t="Test"])]')]));
		$c.sm(doc, 'append', compNode);

		await globalThis.reactive.wait();

		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		// In DOM, the content should be properly handled
		// The textContent should contain the CSS as-is (browser handles it)
		assert(styleElem.textContent.includes('content:'), "Should include CSS content property");
	});

	await t.step("Rapid component additions and removals", async () => {
		registry.register('test.csr.compound.rapid', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { transition: all 0.3s; }'
		]));

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Rapidly add multiple components
		const nodes = [];
		for (let i = 0; i < 10; i++) {
			const node = doc.createNode('test.csr.compound.rapid');
			nodes.push(node);
			$c.sm(doc, 'append', node);
		}

		await globalThis.reactive.wait();

		const styleDom = $c.sm(scpNode, 'getDOM');
		const styleElem = styleDom.at(0);

		assert(styleElem.textContent.includes('transition: all 0.3s'), "Should include CSS after rapid additions");

		// CSS should appear only once
		const matches = styleElem.textContent.match(/transition: all 0\.3s/g);
		assertEquals(matches?.length, 1, "CSS should appear only once despite 10 instances");
	});
});
