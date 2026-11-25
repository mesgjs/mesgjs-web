import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();
await simulateBrowser();

const { fwait, getInstance } = globalThis.$c;
const { ls, ps, reactive } = globalThis;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const registry = getInstance('MWIRegistry');

describe("MWICoreScpCSS CSR - Basic DOM Rendering", () => {
	it("Create empty style element", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		const dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 0, "Empty document should return empty NANOS");
	});

	it("Create style element with CSS", () => {
		registry.register('test.csr.scpcss.basic', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.basic');
		const scpNode = doc.createNode('m.scpcss');
		const dom = $c.sm(scpNode, 'getDOM');

		assertEquals(dom.size, 1, "Should return NANOS with one element");
		const styleElem = dom.at(0);
		assert(styleElem instanceof globalThis.window.HTMLStyleElement, "Should be style element");
		assert(styleElem.textContent.includes('color: blue'), "Should contain CSS");
		assert(styleElem.textContent.includes('_MO_'), "Should contain component ID");
	});

	it("Style element properties", () => {
		registry.register('test.csr.scpcss.props', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { margin: 0; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.props');
		const scpNode = doc.createNode('m.scpcss');
		const dom = $c.sm(scpNode, 'getDOM');

		const styleElem = dom.at(0);
		assertEquals(styleElem.tagName, 'STYLE', "Should be STYLE tag");
		assert(styleElem.textContent, "Should have textContent");
	});
});

describe("MWICoreScpCSS CSR - Reactive Behavior", () => {
	it("Add component after m.scpcss creation", () => {
		registry.register('test.csr.scpcss.reactive1', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Initially empty
		let dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 0, "Should be empty initially");

		// Add component
		doc.createNode('test.csr.scpcss.reactive1');

		// Should now have style element
		dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 1, "Should have style element after component added");
		const styleElem = dom.at(0);
		assert(styleElem.textContent.includes('color: red'), "Should include CSS");
	});

	it("Add multiple components reactively", () => {
		registry.register('test.csr.scpcss.reactive2a', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: red; }'
		]));
		registry.register('test.csr.scpcss.reactive2b', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: green; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Add first component
		doc.createNode('test.csr.scpcss.reactive2a');

		let dom = $c.sm(scpNode, 'getDOM');
		let styleElem = dom.at(0);
		assert(styleElem.textContent.includes('color: red'), "Should include first CSS");
		assert(!styleElem.textContent.includes('color: green'), "Should not include second CSS yet");

		// Add second component
		doc.createNode('test.csr.scpcss.reactive2b');

		dom = $c.sm(scpNode, 'getDOM');
		styleElem = dom.at(0);
		assert(styleElem.textContent.includes('color: red'), "Should still include first CSS");
		assert(styleElem.textContent.includes('color: green'), "Should now include second CSS");
	});

	it("Reactive consistency - stable element reference", () => {
		registry.register('test.csr.scpcss.stable', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { color: blue; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.stable');
		const scpNode = doc.createNode('m.scpcss');

		const dom1 = $c.sm(scpNode, 'getDOM');
		const styleElem1 = dom1.at(0);

		// Get DOM again
		const dom2 = $c.sm(scpNode, 'getDOM');
		const styleElem2 = dom2.at(0);

		assertStrictEquals(styleElem1, styleElem2, "Should return same style element");
		assertStrictEquals(dom1, dom2, "Should return same NANOS instance");
	});

	it("Style element content updates reactively", async () => {
		registry.register('test.csr.scpcss.update', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { padding: 1rem; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Initially empty
		let dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 0, "Should be empty initially");

		// Add component
		doc.createNode('test.csr.scpcss.update');

		// Get the style element
		dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);
		const initialContent = styleElem.textContent;

		assert(initialContent.includes('padding: 1rem'), "Should have initial CSS");

		// The element reference should remain stable even if content changes
		// (though in this test we're not changing it, just verifying stability)
		await reactive.wait();
		assertStrictEquals(dom.at(0), styleElem, "Element reference should remain stable");
	});
});

describe("MWICoreScpCSS CSR - Integration with Document", () => {
	it("m.scpcss in document head pattern", () => {
		registry.register('test.csr.scpcss.head', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { font-size: 16px; }'
		]));
		const doc = getInstance('MWIDocument');

		// Add m.scpcss to root
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Add body content with styled component
		doc.createNode('test.csr.scpcss.head');

		const docDOM = $c.sm(doc, 'getDOM');
		assert(docDOM.size > 0, "Document should have DOM nodes");

		// The style element should be in the document
		const scpDOM = $c.sm(scpNode, 'getDOM');
		assertEquals(scpDOM.size, 1, "m.scpcss should have style element");
	});

	it("Multiple m.scpcss nodes in DOM", () => {
		registry.register('test.csr.scpcss.multi', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { border: 1px; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.multi');

		const scpNode1 = doc.createNode('m.scpcss');
		const scpNode2 = doc.createNode('m.scpcss');

		const dom1 = $c.sm(scpNode1, 'getDOM');
		const dom2 = $c.sm(scpNode2, 'getDOM');

		assertEquals(dom1.size, 1, "First m.scpcss should have style element");
		assertEquals(dom2.size, 1, "Second m.scpcss should have style element");

		const style1 = dom1.at(0);
		const style2 = dom2.at(0);

		// Should be separate elements
		assert(style1 !== style2, "Should create separate style elements");

		// But with same CSS content
		assertEquals(style1.textContent, style2.textContent, "Should have same CSS content");
	});
});

describe("MWICoreScpCSS CSR - Edge Cases", () => {
	it("Rapid component additions", () => {
		// Register multiple components
		for (let i = 0; i < 5; i++) {
			registry.register(`test.csr.scpcss.rapid${i}`, ls([
				'allowLate', true,
				'if', 'MWIHTML',
				'scopedCSS', `.@@ { order: ${i}; }`
			]));
		}

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Add all components rapidly
		for (let i = 0; i < 5; i++) {
			doc.createNode(`test.csr.scpcss.rapid${i}`);
		}

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		// All CSS should be present
		for (let i = 0; i < 5; i++) {
			assert(styleElem.textContent.includes(`order: ${i}`), `Should include CSS for component ${i}`);
		}
	});

	it("Component type reuse", () => {
		registry.register('test.csr.scpcss.reuse', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { width: 100%; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Create multiple instances of same type
		doc.createNode('test.csr.scpcss.reuse');
		doc.createNode('test.csr.scpcss.reuse');
		doc.createNode('test.csr.scpcss.reuse');

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		// CSS should only appear once
		const matches = styleElem.textContent.match(/width: 100%/g);
		assertEquals(matches?.length, 1, "CSS should only appear once despite multiple instances");
	});

	it("Late component registration (test mode)", () => {
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Initially empty
		let dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 0, "Should be empty initially");

		// Register new component late (in test mode)
		registry.register('test.csr.scpcss.late', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { height: 100vh; }'
		]));

		// Use the new component
		doc.createNode('test.csr.scpcss.late');

		// Should now include the late component's CSS
		dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 1, "Should have style element");
		const styleElem = dom.at(0);
		assert(styleElem.textContent.includes('height: 100vh'), "Should include late component CSS");
	});
});

describe("MWICoreScpCSS CSR - Real-World Integration", () => {
	it("Dynamic page with scoped CSS", () => {
		registry.register('test.csr.scpcss.dynamic', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { background: #f0f0f0; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');
		$c.sm(doc, 'append', scpNode);

		// Initially no components
		let dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 0, "Should be empty initially");

		// Dynamically add styled component
		doc.createNode('test.csr.scpcss.dynamic');

		// Style element should update
		dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 1, "Should have style element");
		const styleElem = dom.at(0);
		assert(styleElem.textContent.includes('background: #f0f0f0'), "Should include CSS");
	});

	it("Card component with scoped styles", () => {
		registry.register('test.csr.scpcss.card', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; } .@@ .header { font-weight: bold; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.card');
		const scpNode = doc.createNode('m.scpcss');

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		assert(styleElem.textContent.includes('border: 1px solid #ccc'), "Should include card border");
		assert(styleElem.textContent.includes('padding: 1rem'), "Should include padding");
		assert(styleElem.textContent.includes('.header'), "Should include nested selector");
		assert(styleElem.textContent.includes('font-weight: bold'), "Should include header style");
	});

	it("Component library with selective loading", () => {
		// Register component library
		for (let i = 0; i < 10; i++) {
			registry.register(`test.csr.scpcss.complib${i}`, ls([
				'allowLate', true,
				'if', 'MWIHTML',
				'scopedCSS', `.@@ { flex: ${i}; }`
			]));
		}

		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Use only subset
		doc.createNode('test.csr.scpcss.complib2');
		doc.createNode('test.csr.scpcss.complib5');
		doc.createNode('test.csr.scpcss.complib8');

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		// Should only include used components
		assert(styleElem.textContent.includes('flex: 2'), "Should include complib2");
		assert(styleElem.textContent.includes('flex: 5'), "Should include complib5");
		assert(styleElem.textContent.includes('flex: 8'), "Should include complib8");
		assert(!styleElem.textContent.includes('flex: 0'), "Should not include unused complib0");
		assert(!styleElem.textContent.includes('flex: 9'), "Should not include unused complib9");
	});
});

describe("MWICoreScpCSS CSR - Empty to Non-Empty Transitions", () => {
	it("Transition from empty to non-empty", () => {
		registry.register('test.csr.scpcss.transition', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { display: block; }'
		]));
		const doc = getInstance('MWIDocument');
		const scpNode = doc.createNode('m.scpcss');

		// Start empty
		let dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 0, "Should start empty");

		// Add component
		doc.createNode('test.csr.scpcss.transition');

		// Should now have element
		dom = $c.sm(scpNode, 'getDOM');
		assertEquals(dom.size, 1, "Should have element after transition");
		assert(dom.at(0).textContent.includes('display: block'), "Should have CSS content");
	});

	it("Empty state with whitespace-only CSS", () => {
		registry.register('test.csr.scpcss.whitespace', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '   \n  '
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.whitespace');
		const scpNode = doc.createNode('m.scpcss');

		const dom = $c.sm(scpNode, 'getDOM');
		// Whitespace-only CSS should still create a style element
		assertEquals(dom.size, 1, "Should have style element for whitespace CSS");
	});
});

describe("MWICoreScpCSS CSR - CSS Content in DOM", () => {
	it("CSS with newlines preserved", () => {
		registry.register('test.csr.scpcss.newlines', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ {\n  color: red;\n  margin: 0;\n}'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.newlines');
		const scpNode = doc.createNode('m.scpcss');

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		assert(styleElem.textContent.includes('color: red'), "Should preserve CSS");
		assert(styleElem.textContent.includes('margin: 0'), "Should preserve all rules");
	});

	it("CSS with media queries", () => {
		registry.register('test.csr.scpcss.media', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '.@@ { width: 100%; } @media (min-width: 768px) { .@@ { width: 50%; } }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.media');
		const scpNode = doc.createNode('m.scpcss');

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		assert(styleElem.textContent.includes('@media'), "Should include media query");
		assert(styleElem.textContent.includes('min-width: 768px'), "Should include condition");
	});

	it("CSS with keyframes", () => {
		registry.register('test.csr.scpcss.keyframes', ls([
			'allowLate', true,
			'if', 'MWIHTML',
			'scopedCSS', '@keyframes fade { from { opacity: 0; } to { opacity: 1; } } .@@ { animation: fade 1s; }'
		]));
		const doc = getInstance('MWIDocument');
		doc.createNode('test.csr.scpcss.keyframes');
		const scpNode = doc.createNode('m.scpcss');

		const dom = $c.sm(scpNode, 'getDOM');
		const styleElem = dom.at(0);

		assert(styleElem.textContent.includes('@keyframes'), "Should include keyframes");
		assert(styleElem.textContent.includes('fade'), "Should include animation name");
		assert(styleElem.textContent.includes('animation: fade 1s'), "Should include animation property");
	});
});
