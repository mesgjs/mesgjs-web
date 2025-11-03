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

Deno.test("MWICoreFrag (m.frg) - Basic Interface Tests", async (t) => {
	const fragNode = doc.createNode('m.frg');

	await t.step("(type) - Get node type", () => {
		assertEquals(fragNode('type'), 'm.frg');
	});

	await t.step(".type - Get node type via JS", () => {
		assertEquals(fragNode.type, 'm.frg');
	});

	await t.step(".msjsType - Get Mesgjs type", () => {
		assertEquals(fragNode.msjsType, 'MWICoreFrag');
	});

	await t.step(".jsv - Should return instance", () => {
		assertStrictEquals(fragNode.jsv, fragNode);
	});

	await t.step(".valueOf() - Should return instance", () => {
		assertStrictEquals(fragNode.valueOf(), fragNode);
	});

	await t.step("(document) - Get document reference", () => {
		const docRef = fragNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(fragNode.document, doc);
	});
});

Deno.test("MWICoreFrag (m.frg) - Inherited MWIDocNode Operations", async (t) => {
	const fragNode = doc.createNode('m.frg');

	await t.step("(setAttr) - Set basic attribute", () => {
		fragNode('setAttr', ls([, 'data-test', , 'value123']));
		assertEquals(fragNode('getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set basic attribute via JS", () => {
		fragNode.setAttr('data-id', 'frag-001');
		assertEquals(fragNode.getAttr('data-id'), 'frag-001');
	});

	await t.step("(getAttr) - Get attribute", () => {
		fragNode('setAttr', ls([, 'title', , 'Fragment Title']));
		assertEquals(fragNode('getAttr', ls([, 'title'])), 'Fragment Title');
	});

	await t.step(".getAttr() - Get attribute via JS", () => {
		fragNode.setAttr('aria-label', 'Test Fragment');
		assertEquals(fragNode.getAttr('aria-label'), 'Test Fragment');
	});

	await t.step("(hasAttr) - Check attribute existence", () => {
		fragNode('setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals(fragNode('hasAttr', ls([, 'test-attr'])), true);
		assertEquals(fragNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", () => {
		fragNode.setAttr('another-attr', 'value');
		assertEquals(fragNode.hasAttr('another-attr'), true);
		assertEquals(fragNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete attribute", () => {
		fragNode('setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals(fragNode('hasAttr', ls([, 'temp-attr'])), true);
		fragNode('delAttr', ls([, 'temp-attr']));
		assertEquals(fragNode('hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete attribute via JS", () => {
		fragNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(fragNode.hasAttr('temp-js-attr'), true);
		fragNode.delAttr('temp-js-attr');
		assertEquals(fragNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(hasClass) - Basic class check", () => {
		fragNode('setAttr', ls([, 'class', , 'test-class']));
		assertEquals(fragNode('hasClass', ls([, 'test-class'])), true);
		assertEquals(fragNode('hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Basic class check via JS", () => {
		fragNode.setAttr('class', 'js-class another-class');
		assertEquals(fragNode.hasClass('js-class'), true);
		assertEquals(fragNode.hasClass('another-class'), true);
		assertEquals(fragNode.hasClass('not-there'), false);
	});
});

Deno.test("MWICoreFrag (m.frg) - Spec Management", async (t) => {
	await t.step("(getSpec) - Get spec with no attributes", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = fragNode('getSpec');
		assertEquals(spec.at(0), 'm.frg');
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.frg'));
	});

	await t.step(".getSpec() - Get spec with no attributes via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = fragNode.getSpec();
		assertEquals(spec.at(0), 'm.frg');
	});

	await t.step("(getSpec) - Get spec with attributes", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode('setAttr', ls([, 'id', , 'frag-123']));
		fragNode('setAttr', ls([, 'data-role', , 'container']));
		const spec = fragNode('getSpec');
		assertEquals(spec.at(0), 'm.frg');
		assertEquals(spec.at('id'), 'frag-123');
		assertEquals(spec.at('data-role'), 'container');
	});

	await t.step(".getSpec() - Get spec with attributes via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'js-frag-456');
		fragNode.setAttr('class', 'fragment-class');
		const spec = fragNode.getSpec();
		assertEquals(spec.at(0), 'm.frg');
		assertEquals(spec.at('id'), 'js-frag-456');
		assert(spec.at('class').includes('fragment-class'));
	});

	await t.step("(getSubSpec) - Empty fragment returns empty NANOS", () => {
		const fragNode = doc.createNode('m.frg');
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Empty fragment returns empty NANOS via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(getSubSpec) - Fragment with children returns child specs", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Child text']));
		fragNode('append', ls([, textNode]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
	});

	await t.step(".getSubSpec() - Fragment with children returns child specs via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS child text');
		fragNode.append(textNode);
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
	});

	await t.step("(setSpec) - Set attributes from spec", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg id=spec-frag data-test=value)]');
		fragNode('setSpec', ls([, spec]));
		assertEquals(fragNode('getAttr', ls([, 'id'])), 'spec-frag');
		assertEquals(fragNode('getAttr', ls([, 'data-test'])), 'value');
	});

	await t.step(".setSpec() - Set attributes from spec via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg id=js-spec-frag class=spec-class)]');
		fragNode.setSpec(spec);
		assertEquals(fragNode.getAttr('id'), 'js-spec-frag');
		assert(fragNode.getAttr('class').includes('spec-class'));
	});

	await t.step("(setSpec) - Set children from spec", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg [m.t t="Child 1"] [m.t t="Child 2"])]');
		fragNode('setSpec', ls([, spec]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'Child 1');
		assertEquals(subSpec.at([1, 't']), 'Child 2');
	});

	await t.step(".setSpec() - Set children from spec via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg [m.t t="JS Child 1"] [m.t t="JS Child 2"])]');
		fragNode.setSpec(spec);
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS Child 1');
		assertEquals(subSpec.at([1, 't']), 'JS Child 2');
	});

	await t.step("(setSubSpec) - Set children with NANOS list", () => {
		const fragNode = doc.createNode('m.frg');
		const subList = ps('[([m.t t="Sub 1"] [m.t t="Sub 2"])]');
		fragNode('setSubSpec', ls(['subSpec', subList]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'Sub 1');
		assertEquals(subSpec.at([1, 't']), 'Sub 2');
	});

	await t.step(".setSubSpec() - Set children with NANOS list via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const subList = ps('[([m.t t="JS Sub 1"] [m.t t="JS Sub 2"])]');
		fragNode.setSubSpec({ subSpec: subList });
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS Sub 1');
		assertEquals(subSpec.at([1, 't']), 'JS Sub 2');
	});

	await t.step("(setSubSpec) - Set children with spec parameter", () => {
		const fragNode = doc.createNode('m.frg');
		const fullSpec = ps('[(m.frg [m.t t="Spec Child"])]');
		fragNode('setSubSpec', ls(['spec', fullSpec]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Spec Child');
	});

	await t.step(".setSubSpec() - Set children with spec parameter via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const fullSpec = ps('[(m.frg [m.t t="JS Spec Child"])]');
		fragNode.setSubSpec({ spec: fullSpec });
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'JS Spec Child');
	});
});

Deno.test("MWICoreFrag (m.frg) - Content Aggregation", async (t) => {
	await t.step("(append) - Append text string (auto-converts to m.t)", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode('append', ls([, 'Plain text']));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
		assertEquals(subSpec.at([0, 't']), 'Plain text');
	});

	await t.step(".append() - Append text string via JS (auto-converts to m.t)", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.append('JS plain text');
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
		assertEquals(subSpec.at([0, 't']), 'JS plain text');
	});

	await t.step("(append) - Append doc-node", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Appended node']));
		fragNode('append', ls([, textNode]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Appended node');
	});

	await t.step(".append() - Append doc-node via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS appended node');
		fragNode.append(textNode);
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'JS appended node');
	});

	await t.step("(append) - Append multiple items at once", () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1('setAttr', ls([, 't', , 'First']));
		const text2 = doc.createNode('m.t');
		text2('setAttr', ls([, 't', , 'Second']));
		fragNode('append', ls([, text1, , text2]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'First');
		assertEquals(subSpec.at([1, 't']), 'Second');
	});

	await t.step(".append() - Append multiple items at once via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		fragNode.append(text1, text2);
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS First');
		assertEquals(subSpec.at([1, 't']), 'JS Second');
	});

	await t.step("(append) - Append mixed text and nodes", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Node text']));
		fragNode('append', ls([, 'String text', , textNode]));
		const subSpec = fragNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'String text');
		assertEquals(subSpec.at([1, 't']), 'Node text');
	});

	await t.step(".append() - Append mixed text and nodes via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Node text');
		fragNode.append('JS String text', textNode);
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS String text');
		assertEquals(subSpec.at([1, 't']), 'JS Node text');
	});

	await t.step("(append) - Returns fragment for chaining", () => {
		const fragNode = doc.createNode('m.frg');
		const result = fragNode('append', ls([, 'text']));
		assertStrictEquals(result, fragNode);
	});

	await t.step(".append() - Returns fragment for chaining via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const result = fragNode.append('text');
		assertStrictEquals(result, fragNode);
	});
});

Deno.test("MWICoreFrag (m.frg) - Transparent Container Behavior", async (t) => {
	await t.step("Fragment can hold multiple children", () => {
		const fragNode = doc.createNode('m.frg');
		for (let i = 0; i < 5; i++) {
			const textNode = doc.createNode('m.t');
			textNode.setAttr('t', `Child ${i}`);
			fragNode.append(textNode);
		}
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 5);
		for (let i = 0; i < 5; i++) {
			assertEquals(subSpec.at(i).at('t'), `Child ${i}`);
		}
	});

	await t.step("Fragment maintains child order", () => {
		const fragNode = doc.createNode('m.frg');
		const children = ['First', 'Second', 'Third', 'Fourth'];
		for (const text of children) {
			fragNode.append(text);
		}
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, children.length);
		for (let i = 0; i < children.length; i++) {
			assertEquals(subSpec.at(i).at('t'), children[i]);
		}
	});

	await t.step("Fragment containing fragments (nested)", () => {
		const outerFrag = doc.createNode('m.frg');
		const innerFrag = doc.createNode('m.frg');
		innerFrag.append('Inner text');
		outerFrag.append(innerFrag);
		const subSpec = outerFrag.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.frg');
		const innerSubSpec = subSpec.at(0);
		assertEquals(innerSubSpec.at([1, 't']), 'Inner text');
	});

	await t.step("Fragment attributes don't interfere with children", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'frag-id');
		fragNode.setAttr('class', 'frag-class');
		fragNode.setAttr('data-test', 'value');
		fragNode.append('Child text');
		const subSpec = fragNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Child text');
		// Fragment's own attributes exist
		assertEquals(fragNode.getAttr('id'), 'frag-id');
		assert(fragNode.getAttr('class').includes('frag-class'));
	});
});
