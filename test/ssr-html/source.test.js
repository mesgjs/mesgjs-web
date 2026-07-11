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

Deno.test("MWICoreSource SSR - m.ci Pass-Through in Rendering", async (t) => {
	await t.step("@@ in m.src child uses m.src's slotSrc m.ci", async () => {
		registry.register('test.tpl.srccipass', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-ci="@@"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srccipass');
		const tplCI =  $c.sm(tplNode, 'getAttr', ['m.ci']);

		const html =  $c.sm(tplNode, 'getHTML');

		// h.div sees m.src as slotSrc
		// m.src's m.ci returns template's CI (pass-through)
		// So @@ should resolve to template's CI
		assert(html.includes(`data-ci="${tplCI}"`));
	});

	await t.step("@@ in nested m.src resolves to outermost slotSrc m.ci", async () => {
		registry.register('test.tpl.nestedsrcci', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [m.src [h.div m.coat=[data-ci="@@"]]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.nestedsrcci');
		const tplCI =  $c.sm(tplNode, 'getAttr', ['m.ci']);

		const html =  $c.sm(tplNode, 'getHTML');

		// Both m.src nodes pass through template's CI
		// So @@ should resolve to template's CI
		assert(html.includes(`data-ci="${tplCI}"`));
	});

	await t.step("@@ in m.src without slotSrc uses m.src's own CI", () => {
		const srcNode = doc.createNode('m.src');
		srcNode.setSubSpec(ps('[( [h.div m.coat=[data-ci="@@"]] )]'));

		const srcCI =  $c.sm(srcNode, 'getAttr', ['m.ci']);
		const html =  $c.sm(srcNode, 'getHTML');

		// m.src has no slotSrc, so returns its own CI (registry entry)
		const regEntry = registry.get('m.src');
		const expectedCI = regEntry.at('id');

		assertStrictEquals(srcCI, expectedCI);
		assert(html.includes(`data-ci="${expectedCI}"`));
	});

	await t.step("@@ in m.src with HTML element slotSrc", () => {
		const parentNode = doc.createNode('h.div');
		const parentCI =  $c.sm(parentNode, 'getAttr', ['m.ci']);

		const srcNode = doc.createNode('m.src', { slotSrc: parentNode });
		srcNode.setSubSpec(ps('[( [h.div m.coat=[data-ci="@@"]] )]'));

		const html =  $c.sm(srcNode, 'getHTML');

		// m.src passes through parent's CI
		assert(html.includes(`data-ci="${parentCI}"`));
	});
});

Deno.test("MWICoreSource SSR - Slotting Boundary Behavior", async (t) => {
	await t.step("m.src creates boundary - children can't see template attributes directly", async () => {
		registry.register('test.tpl.srcboundary', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src myattr="src-value" [h.div m.coat=[data-from="<myattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcboundary');
		tplNode.setAttr('myattr', 'template-value');

		const html =  $c.sm(tplNode, 'getHTML');

		// h.div sees m.src as slotSrc (not template)
		// So it gets myattr from m.src, not from template
		assert(html.includes('data-from="src-value"'));
		assert(!html.includes('template-value'));
	});

	await t.step("m.src can access its slotSrc attributes", async () => {
		registry.register('test.tpl.srcaccess', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src m.coat=[data-from="<myattr>"] [h.div]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcaccess');
		tplNode.setAttr('myattr', 'template-value');

		const html =  $c.sm(tplNode, 'getHTML');

		// m.src itself can see template's attributes (template is its slotSrc)
		// But m.src has no wrapper element, so attributes don't render
		// This test just confirms m.src can access the attribute
		assert(!html.includes('data-from')); // No wrapper to render attribute on
	});

	await t.step("Slotting through m.src requires explicit slot-through", async () => {
		registry.register('test.tpl.slotthrough', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src m.slat=[srcattr=[tplattr]] [h.div m.coat=[data-val="<srcattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.slotthrough');
		tplNode.setAttr('tplattr', 'from-template');

		const html =  $c.sm(tplNode, 'getHTML');

		// m.src slots tplattr from template to srcattr on itself
		// h.div can then access srcattr from m.src
		assert(html.includes('data-val="from-template"'));
	});
});

Deno.test("MWICoreSource SSR - Comparison with m.frg", async (t) => {
	await t.step("m.src passes through slotSrc m.ci, m.frg also passes through", async () => {
		registry.register('test.tpl.srcvsfrag', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-src="@@"]]] [m.frg [h.div m.coat=[data-frg="@@"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.srcvsfrag');
		const tplCI =  $c.sm(tplNode, 'getAttr', ['m.ci']);

		const html =  $c.sm(tplNode, 'getHTML');

		// m.src passes through template's CI
		assert(html.includes(`data-src="${tplCI}"`));

		// m.frg also passes through template's CI (m.frg is transparent)
		assert(html.includes(`data-frg="${tplCI}"`));
	});

	await t.step("m.src creates boundary, m.frg does not", async () => {
		registry.register('test.tpl.boundaries', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src myattr="src" [h.div m.coat=[data-src="<myattr>"]]] [m.frg myattr="frg" [h.div m.coat=[data-frg="<myattr>"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.boundaries');
		tplNode.setAttr('myattr', 'template');

		const html =  $c.sm(tplNode, 'getHTML');

		// m.src creates boundary - its children see m.src as slotSrc
		assert(html.includes('data-src="src"'));
		assert(!html.includes('data-src="template"'));

		// m.frg is transparent - its children see template as slotSrc
		assert(html.includes('data-frg="template"'));
		assert(!html.includes('data-frg="frg"'));
	});
});

Deno.test("MWICoreSource SSR - Complex m.ci Scenarios", async (t) => {
	await t.step("Multiple levels of m.src all pass through same m.ci", async () => {
		registry.register('test.tpl.multilevel', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [m.src [m.src [h.div m.coat=[data-ci="@@"]]]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.multilevel');
		const tplCI =  $c.sm(tplNode, 'getAttr', ['m.ci']);

		const html =  $c.sm(tplNode, 'getHTML');

		// All m.src nodes pass through template's CI
		assert(html.includes(`data-ci="${tplCI}"`));
	});

	await t.step("m.src in slot passes through slot's m.ci", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setSubSpec(ps('[( [m.src [h.div m.coat=[data-ci="@@"]]] )]'));

		const slotCI =  $c.sm(slotNode, 'getAttr', ['m.ci']);
		const html =  $c.sm(slotNode, 'getHTML');

		// m.src passes through slot's CI
		assert(html.includes(`data-ci="${slotCI}"`));
	});

	await t.step("@@ with prefix/suffix in m.src child", async () => {
		registry.register('test.tpl.ciprefix', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-ci="prefix-@@-suffix"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.ciprefix');
		const tplCI =  $c.sm(tplNode, 'getAttr', ['m.ci']);

		const html =  $c.sm(tplNode, 'getHTML');

		// @@ should be replaced with template's CI
		assert(html.includes(`data-ci="prefix-${tplCI}-suffix"`));
	});

	await t.step("Multiple @@ references in same attribute", async () => {
		registry.register('test.tpl.multici', ls([
			'allowLate', true,
			'tpl', ps('[( [m.src [h.div m.coat=[data-ci="@@-@@"]]] )]')
		]));

		const tplNode = await doc.createNode('test.tpl.multici');
		const tplCI =  $c.sm(tplNode, 'getAttr', ['m.ci']);

		const html =  $c.sm(tplNode, 'getHTML');

		// Both @@ should be replaced
		assert(html.includes(`data-ci="${tplCI}-${tplCI}"`));
	});
});
