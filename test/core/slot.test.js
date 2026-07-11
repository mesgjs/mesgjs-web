import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWICoreSlot (m.slot) - Basic Interface Tests", async (t) => {
	const slotNode = doc.createNode('m.slot');

	await t.step("(type) - Get node type", () => {
		assertEquals($c.sm(slotNode, 'type'), 'm.slot');
	});

	await t.step(".type - Get node type via JS", () => {
		assertEquals(slotNode.type, 'm.slot');
	});

	await t.step(".msjsType - Get Mesgjs type", () => {
		assertEquals(slotNode.msjsType, 'MWICoreSlot');
	});

	await t.step(".jsv - Should return instance", () => {
		assertStrictEquals(slotNode.jsv, slotNode);
	});

	await t.step(".valueOf() - Should return instance", () => {
		assertStrictEquals(slotNode.valueOf(), slotNode);
	});

	await t.step("(document) - Get document reference", () => {
		const docRef = $c.sm(slotNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(slotNode.document, doc);
	});
});

Deno.test("MWICoreSlot (m.slot) - Inherited MWIDocNode Operations", async (t) => {
	const slotNode = doc.createNode('m.slot');

	await t.step("(setAttr) - Set basic attribute", () => {
		$c.sm(slotNode, 'setAttr', ls([, 'data-test', , 'value123']));
		assertEquals($c.sm(slotNode, 'getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set basic attribute via JS", () => {
		slotNode.setAttr('data-id', 'slot-001');
		assertEquals(slotNode.getAttr('data-id'), 'slot-001');
	});

	await t.step("(getAttr) - Get attribute", () => {
		$c.sm(slotNode, 'setAttr', ls([, 'title', , 'Slot Title']));
		assertEquals($c.sm(slotNode, 'getAttr', ls([, 'title'])), 'Slot Title');
	});

	await t.step(".getAttr() - Get attribute via JS", () => {
		slotNode.setAttr('aria-label', 'Test Slot');
		assertEquals(slotNode.getAttr('aria-label'), 'Test Slot');
	});

	await t.step("(hasAttr) - Check attribute existence", () => {
		$c.sm(slotNode, 'setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'test-attr'])), true);
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", () => {
		slotNode.setAttr('another-attr', 'value');
		assertEquals(slotNode.hasAttr('another-attr'), true);
		assertEquals(slotNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete attribute", () => {
		$c.sm(slotNode, 'setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'temp-attr'])), true);
		$c.sm(slotNode, 'delAttr', ls([, 'temp-attr']));
		assertEquals($c.sm(slotNode, 'hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete attribute via JS", () => {
		slotNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(slotNode.hasAttr('temp-js-attr'), true);
		slotNode.delAttr('temp-js-attr');
		assertEquals(slotNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(hasClass) - Basic class check", () => {
		$c.sm(slotNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(slotNode, 'hasClass', ls([, 'test-class'])), true);
		assertEquals($c.sm(slotNode, 'hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Basic class check via JS", () => {
		slotNode.setAttr('class', 'js-class another-class');
		assertEquals(slotNode.hasClass('js-class'), true);
		assertEquals(slotNode.hasClass('another-class'), true);
		assertEquals(slotNode.hasClass('not-there'), false);
	});
});

Deno.test("MWICoreSlot (m.slot) - Spec Management", async (t) => {
	await t.step("(getSpec) - Get spec with no attributes", () => {
		const slotNode = doc.createNode('m.slot');
		const spec = $c.sm(slotNode, 'getSpec');
		assertEquals(spec.at(0), 'm.slot');
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.slot'));
	});

	await t.step(".getSpec() - Get spec with no attributes via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const spec = slotNode.getSpec();
		assertEquals(spec.at(0), 'm.slot');
	});

	await t.step("(getSpec) - Get spec with name attribute", () => {
		const slotNode = doc.createNode('m.slot');
		$c.sm(slotNode, 'setAttr', ls([, 'name', , 'header']));
		const spec = $c.sm(slotNode, 'getSpec');
		assertEquals(spec.at(0), 'm.slot');
		assertEquals(spec.at('name'), 'header');
	});

	await t.step(".getSpec() - Get spec with name attribute via JS", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setAttr('name', 'footer');
		const spec = slotNode.getSpec();
		assertEquals(spec.at(0), 'm.slot');
		assertEquals(spec.at('name'), 'footer');
	});

	await t.step("(setSpec) - Set attributes from spec", () => {
		const slotNode = doc.createNode('m.slot');
		const spec = ps('[(m.slot name=content data-test=value)]');
		$c.sm(slotNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(slotNode, 'getAttr', ls([, 'name'])), 'content');
		assertEquals($c.sm(slotNode, 'getAttr', ls([, 'data-test'])), 'value');
	});

	await t.step(".setSpec() - Set attributes from spec via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const spec = ps('[(m.slot name=sidebar class=slot-class)]');
		slotNode.setSpec(spec);
		assertEquals(slotNode.getAttr('name'), 'sidebar');
		assert(slotNode.getAttr('class').includes('slot-class'));
	});

	await t.step("(setSpec) - Set default content from spec", () => {
		const slotNode = doc.createNode('m.slot');
		const spec = ps('[(m.slot "Default content")]');
		$c.sm(slotNode, 'setSpec', ls([, spec]));
		const subSpec = $c.sm(slotNode, 'getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Default content');
	});

	await t.step(".setSpec() - Set default content from spec via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const spec = ps('[(m.slot "JS Default content")]');
		slotNode.setSpec(spec);
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'JS Default content');
	});
});

Deno.test("MWICoreSlot (m.slot) - Default Content Management", async (t) => {
	await t.step("(append) - Append text string (auto-converts to m.t)", () => {
		const slotNode = doc.createNode('m.slot');
		$c.sm(slotNode, 'append', ls([, 'Default text']));
		const subDoc = $c.sm(slotNode, 'getSubDoc');
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals($c.sm(textNode, 'type'), 'm.t');
		assertEquals($c.sm(textNode, 'getAttr', 't'), 'Default text');
	});

	await t.step(".append() - Append text string via JS (auto-converts to m.t)", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.append('JS default text');
		const subDoc = slotNode.getSubDoc();
		assert(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'JS default text');
	});

	await t.step("(append) - Append doc-node", () => {
		const slotNode = doc.createNode('m.slot');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Appended node']));
		$c.sm(slotNode, 'append', ls([, textNode]));
		// Appended nodes are live, not spec - check m.rns
		const rns = $c.sm(slotNode, 'getAttr', ls([, 'm.rns']));
		assertEquals(rns.size, 1);
		// Text node getSpec is simplified to just the string
		assertEquals(rns.at(0), 'Appended node');
		// getSubSpec returns original sub-spec (empty in this case)
		const subSpec = $c.sm(slotNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Append doc-node via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS appended node');
		slotNode.append(textNode);
		// Appended nodes are live, not spec - check m.rns
		const rns = slotNode.getAttr('m.rns');
		assertEquals(rns.size, 1);
		// Text node getSpec is simplified to just the string
		assertEquals(rns.at(0), 'JS appended node');
		// getSubSpec returns original sub-spec (empty in this case)
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(append) - Append multiple default content items", () => {
		const slotNode = doc.createNode('m.slot');
		const text1 = doc.createNode('m.t');
		$c.sm(text1, 'setAttr', ls([, 't', , 'First']));
		const text2 = doc.createNode('m.t');
		$c.sm(text2, 'setAttr', ls([, 't', , 'Second']));
		$c.sm(slotNode, 'append', ls([, text1, , text2]));
		// Appended nodes are live, not spec - check m.rns
		const rns = $c.sm(slotNode, 'getAttr', ls([, 'm.rns']));
		assertEquals(rns.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(rns.at(0), 'First');
		assertEquals(rns.at(1), 'Second');
		// getSubSpec returns original sub-spec (empty in this case)
		const subSpec = $c.sm(slotNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Append multiple default content items via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		slotNode.append(text1, text2);
		// Appended nodes are live, not spec - check m.rns
		const rns = slotNode.getAttr('m.rns');
		assertEquals(rns.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(rns.at(0), 'JS First');
		assertEquals(rns.at(1), 'JS Second');
		// getSubSpec returns original sub-spec (empty in this case)
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(setSubSpec) - Set default content with NANOS list", () => {
		const slotNode = doc.createNode('m.slot');
		const subList = ps('[("Sub 1" "Sub 2")]');
		$c.sm(slotNode, 'setSubSpec', ls(['subSpec', subList]));
		const subSpec = $c.sm(slotNode, 'getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'Sub 1');
		assertEquals(subSpec.at(1), 'Sub 2');
	});

	await t.step(".setSubSpec() - Set default content with NANOS list via JS", () => {
		const slotNode = doc.createNode('m.slot');
		const subList = ps('[("JS Sub 1" "JS Sub 2")]');
		slotNode.setSubSpec({ subSpec: subList });
		const subSpec = slotNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'JS Sub 1');
		assertEquals(subSpec.at(1), 'JS Sub 2');
	});
});

Deno.test("MWICoreSlot (m.slot) - SlotSrc Property", async (t) => {
	await t.step("(slotSrc) - Get slotSrc when not set", () => {
		const slotNode = doc.createNode('m.slot');
		assertEquals($c.sm(slotNode, 'slotSrc'), undefined);
	});

	await t.step(".slotSrc - Get slotSrc when not set via JS", () => {
		const slotNode = doc.createNode('m.slot');
		assertEquals(slotNode.slotSrc, undefined);
	});

	await t.step("Create slot with slotSrc option", () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		assertStrictEquals(slotNode.slotSrc, divNode);
	});

	await t.step("(slotSrc) - Get slotSrc when set", () => {
		const divNode = doc.createNode('h.div');
		const slotNode = $c.sm(doc, 'createNode', ls([, 'm.slot', 'slotSrc', divNode]));
		assertStrictEquals($c.sm(slotNode, 'slotSrc'), divNode);
	});

	await t.step(".slotSrc - Get slotSrc when set via JS", () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		assertStrictEquals(slotNode.slotSrc, divNode);
	});
});

Deno.test("MWICoreSlot (m.slot) - Name Attribute Behavior", async (t) => {
	await t.step("(setAttr) - Set name attribute for named slot", () => {
		const slotNode = doc.createNode('m.slot');
		$c.sm(slotNode, 'setAttr', ls([, 'name', , 'header']));
		assertEquals($c.sm(slotNode, 'getAttr', ls([, 'name'])), 'header');
	});

	await t.step(".setAttr() - Set name attribute for named slot via JS", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setAttr('name', 'footer');
		assertEquals(slotNode.getAttr('name'), 'footer');
	});

	await t.step("Named slot without slotSrc has default content", () => {
		const slotNode = doc.createNode('m.slot');
		slotNode.setAttr('name', 'sidebar');
		slotNode.setSubSpec('Default sidebar');
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Default sidebar');
	});

	await t.step("Unnamed (default) slot without SlotSrc has default content", () => {
		const slotNode = doc.createNode('m.slot');
		// No name attribute set - this is the default slot
		assertEquals(slotNode.hasAttr('name'), false);
		slotNode.setSubSpec('Default slot content');
		// Appended nodes are live, not spec - check m.rns
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Default slot content');
	});
});

Deno.test("MWICoreSlot (m.slot) - Slot Source Integration", async (t) => {
	await t.step("Slot with void element as slotSrc", () => {
		const brNode = doc.createNode('h.br');
		const slotNode = doc.createNode('m.slot', { slotSrc: brNode });
		slotNode.setSubSpec('Fallback content');
		assertStrictEquals(slotNode.slotSrc, brNode);
		// Void elements have no children, so slot should use fallback
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Fallback content');
	});

	await t.step("Slot with empty container as slotSrc", () => {
		const divNode = doc.createNode('h.div');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.append('Fallback for empty');
		assertStrictEquals(slotNode.slotSrc, divNode);
		// Empty container has no children, so slot should use fallback
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Fallback for empty');
	});

	await t.step("Slot with non-empty container as slotSrc", () => {
		const divNode = doc.createNode('h.div');
		divNode.setSubSpec('Source content');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setSubSpec('Fallback content');
		assertStrictEquals(slotNode.slotSrc, divNode);
		// Non-empty container has children, so default slot should use them
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Source content');
	});

	await t.step("Named slot with matching attribute in slotSrc", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('header-slot', ps('[([m.t t="Header from attr"])]'));
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'header-slot');
		slotNode.setSubSpec('Fallback header');
		assertStrictEquals(slotNode.slotSrc, divNode);
		assertEquals(slotNode.getAttr('name'), 'header-slot');
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Header from attr');
	});

	await t.step("Named slot without matching attribute in slotSrc", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('other-attr', 'value');
		const slotNode = doc.createNode('m.slot', { slotSrc: divNode });
		slotNode.setAttr('name', 'missing-slot');
		slotNode.setSubSpec('Fallback for missing');
		assertStrictEquals(slotNode.slotSrc, divNode);
		// No matching attribute, so slot should use fallback
		const subDoc = slotNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'Fallback for missing');
	});
});
