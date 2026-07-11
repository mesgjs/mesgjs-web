import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

Deno.test("MWICoreSource CSR - Basic DOM Rendering", async (t) => {
	await simulateBrowser();

	await t.step("m.src renders children without wrapper", async () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec({ subSpec: ps('[( [h.div id=child1 DIV] [h.span id=child2 SPAN] )]') });

		const dom = $c.sm(srcNode, 'getDOM');

		// Should have 2 child nodes (div and span), no wrapper
		assertEquals(dom.next, 2);
		assertEquals(dom.at(0).tagName, 'DIV');
		assertEquals(dom.at(0).id, 'child1');
		assertEquals(dom.at(1).tagName, 'SPAN');
		assertEquals(dom.at(1).id, 'child2');
	});

	await simulateBrowser();

	await t.step("Empty m.src renders no DOM nodes", () => {
		const srcNode = doc.createNode('m.src');

		const dom = $c.sm(srcNode, 'getDOM');
		assertEquals(dom.next, 0);
	});

	await simulateBrowser();

	await t.step("m.src with single child", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec(ps('[( [h.p id="solo"] )]'));

		const dom = $c.sm(srcNode, 'getDOM');
		assertEquals(dom.next, 1);
		assertEquals(dom.at(0).tagName, 'P');
		assertEquals(dom.at(0).id, 'solo');
	});
});

Deno.test("MWICoreSource CSR - m.ci Pass-Through in DOM", async (t) => {
	await simulateBrowser();

	await t.step("@@ in m.src child uses m.src's slotSrc m.ci", async () => {
		registry.register('test.tpl.srccidom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-ci="@@"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srccidom');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// @@ should resolve to template's CI (passed through m.src)
		assertEquals(divNode.getAttribute('data-ci'), tplCI);
	});

	await simulateBrowser();

	await t.step("@@ in nested m.src resolves to outermost slotSrc m.ci", async () => {
		registry.register('test.tpl.nestedsrcdom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [m.src [h.div m.coat=[data-ci="@@"]]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.nestedsrcdom');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// Both m.src nodes pass through template's CI
		assertEquals(divNode.getAttribute('data-ci'), tplCI);
	});

	await simulateBrowser();

	await t.step("@@ in m.src without slotSrc uses m.src's own CI", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec(ps('[( [h.div m.coat=[data-ci="@@"]] )]'));

		const srcCI = $c.sm(srcNode, 'getAttr', ['m.ci']);
		const dom = $c.sm(srcNode, 'getDOM');
		const divNode = dom.at(0);

		// m.src has no slotSrc, so returns its own CI (registry entry)
		const regEntry = registry.get('m.src');
		const expectedCI = regEntry.at('id');

		assertStrictEquals(srcCI, expectedCI);
		assertEquals(divNode.getAttribute('data-ci'), expectedCI);
	});
});

Deno.test("MWICoreSource CSR - Slotting Boundary in DOM", async (t) => {
	await simulateBrowser();

	await t.step("m.src creates boundary - children can't see template attributes", async () => {
		registry.register('test.tpl.srcbounddom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src myattr="src-value" [h.div m.coat=[data-from="<myattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcbounddom');
		tplNode.setAttr('myattr', 'template-value');

		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// h.div sees m.src as slotSrc (not template)
		// So it gets myattr from m.src, not from template
		assertEquals(divNode.getAttribute('data-from'), 'src-value');
	});

	await simulateBrowser();

	await t.step("Slotting through m.src requires explicit slot-through", async () => {
		registry.register('test.tpl.slotthroughdom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src m.slat=[srcattr=[tplattr]] [h.div m.coat=[data-val="<srcattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.slotthroughdom');
		tplNode.setAttr('tplattr', 'from-template');

		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// m.src slots tplattr from template to srcattr on itself
		// h.div can then access srcattr from m.src
		assertEquals(divNode.getAttribute('data-val'), 'from-template');
	});
});

Deno.test("MWICoreSource CSR - Comparison with m.frg in DOM", async (t) => {
	await simulateBrowser();

	await t.step("m.src passes through slotSrc m.ci, m.frg also passes through", async () => {
		registry.register('test.tpl.srcvsfragdom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-src="@@"]]] [m.frg [h.div m.coat=[data-frg="@@"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcvsfragdom');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const dom = $c.sm(tplNode, 'getDOM');
		const srcDiv = dom.at(0);
		const fragDiv = dom.at(1);

		// m.src passes through template's CI
		assertEquals(srcDiv.getAttribute('data-src'), tplCI);

		// m.frg also passes through template's CI (m.frg is transparent)
		assertEquals(fragDiv.getAttribute('data-frg'), tplCI);
	});

	await simulateBrowser();

	await t.step("m.src creates boundary, m.frg does not", async () => {
		registry.register('test.tpl.boundariesdom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src myattr="src" [h.div m.coat=[data-src="<myattr>"]]] [m.frg myattr="frg" [h.div m.coat=[data-frg="<myattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.boundariesdom');
		tplNode.setAttr('myattr', 'template');

		const dom = $c.sm(tplNode, 'getDOM');
		const srcDiv = dom.at(0);
		const fragDiv = dom.at(1);

		// m.src creates boundary - its children see m.src as slotSrc
		assertEquals(srcDiv.getAttribute('data-src'), 'src');

		// m.frg is transparent - its children see template as slotSrc
		assertEquals(fragDiv.getAttribute('data-frg'), 'template');
	});
});

Deno.test("MWICoreSource CSR - Reactive Behavior", async (t) => {
	await simulateBrowser();

	await t.step("m.src children react to slotSrc attribute changes", async () => {
		registry.register('test.tpl.srcreactive', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src myattr="initial" [h.div m.coat=[data-val="<myattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcreactive');
		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// Get the m.src node
		const subDoc = $c.sm(tplNode, 'getSubDoc');
		const srcNode = subDoc.at(0);

		// Initial value
		assertEquals(divNode.getAttribute('data-val'), 'initial');

		// Change m.src's attribute
		srcNode.setAttr('myattr', 'updated');

		// Should reactively update
		await reactive.wait();
		assertEquals(divNode.getAttribute('data-val'), 'updated');
	});

	await simulateBrowser();

	await t.step("m.src passes through reactive m.ci changes", async () => {
		// This test verifies that if slotSrc's m.ci could change (hypothetically),
		// m.src would pass through the new value. In practice, m.ci is immutable,
		// but the pass-through mechanism should be reactive.

		const parentNode = doc.createNode('h.div');
		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });
		srcNode.setSubSpec(ps('[( [h.div m.coat=[data-ci="@@"]] )]'));

		const parentCI = $c.sm(parentNode, 'getAttr', ['m.ci']);
		const dom = $c.sm(srcNode, 'getDOM');
		const divNode = dom.at(0);

		// m.src passes through parent's CI
		assertEquals(divNode.getAttribute('data-ci'), parentCI);
	});
});

Deno.test("MWICoreSource CSR - Complex Scenarios", async (t) => {
	await simulateBrowser();

	await t.step("Multiple levels of m.src all pass through same m.ci", async () => {
		registry.register('test.tpl.multileveldom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [m.src [m.src [h.div m.coat=[data-ci="@@"]]]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.multileveldom');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// All m.src nodes pass through template's CI
		assertEquals(divNode.getAttribute('data-ci'), tplCI);
	});

	await simulateBrowser();

	await t.step("m.src in slot passes through slot's m.ci", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec(ps('[( [m.src [h.div m.coat=[data-ci="@@"]]] )]'));

		const slotCI = $c.sm(slotNode, 'getAttr', ['m.ci']);
		const dom = $c.sm(slotNode, 'getDOM');
		const divNode = dom.at(0);

		// m.src passes through slot's CI
		assertEquals(divNode.getAttribute('data-ci'), slotCI);
	});

	await simulateBrowser();

	await t.step("@@ with prefix/suffix in m.src child", async () => {
		registry.register('test.tpl.ciprefixdom', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-ci="prefix-@@-suffix"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.ciprefixdom');
		const tplCI = $c.sm(tplNode, 'getAttr', ['m.ci']);

		const dom = $c.sm(tplNode, 'getDOM');
		const divNode = dom.at(0);

		// @@ should be replaced with template's CI
		assertEquals(divNode.getAttribute('data-ci'), `prefix-${tplCI}-suffix`);
	});
});
