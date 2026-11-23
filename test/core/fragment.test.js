import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

describe("MWICoreFrag (m.frg) - Basic Interface Tests", () => {
	const fragNode = doc.createNode('m.frg');

	it("(type) - Get node type", () => {
		assertEquals($c.sm(fragNode, 'type'), 'm.frg');
	});

	it(".type - Get node type via JS", () => {
		assertEquals(fragNode.type, 'm.frg');
	});

	it(".msjsType - Get Mesgjs type", () => {
		assertEquals(fragNode.msjsType, 'MWICoreFrag');
	});

	it(".jsv - Should return instance", () => {
		assertStrictEquals(fragNode.jsv, fragNode);
	});

	it(".valueOf() - Should return instance", () => {
		assertStrictEquals(fragNode.valueOf(), fragNode);
	});

	it("(document) - Get document reference", () => {
		const docRef = $c.sm(fragNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	it(".document - Get document reference via JS", () => {
		assertStrictEquals(fragNode.document, doc);
	});
});

describe("MWICoreFrag (m.frg) - Inherited MWIDocNode Operations", () => {
	const fragNode = doc.createNode('m.frg');

	it("(setAttr) - Set basic attribute", () => {
		$c.sm(fragNode, 'setAttr', ls([, 'data-test', , 'value123']));
		assertEquals($c.sm(fragNode, 'getAttr', ls([, 'data-test'])), 'value123');
	});

	it(".setAttr() - Set basic attribute via JS", () => {
		fragNode.setAttr('data-id', 'frag-001');
		assertEquals(fragNode.getAttr('data-id'), 'frag-001');
	});

	it("(getAttr) - Get attribute", () => {
		$c.sm(fragNode, 'setAttr', ls([, 'title', , 'Fragment Title']));
		assertEquals($c.sm(fragNode, 'getAttr', ls([, 'title'])), 'Fragment Title');
	});

	it(".getAttr() - Get attribute via JS", () => {
		fragNode.setAttr('aria-label', 'Test Fragment');
		assertEquals(fragNode.getAttr('aria-label'), 'Test Fragment');
	});

	it("(hasAttr) - Check attribute existence", () => {
		$c.sm(fragNode, 'setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals($c.sm(fragNode, 'hasAttr', ls([, 'test-attr'])), true);
		assertEquals($c.sm(fragNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	it(".hasAttr() - Check attribute existence via JS", () => {
		fragNode.setAttr('another-attr', 'value');
		assertEquals(fragNode.hasAttr('another-attr'), true);
		assertEquals(fragNode.hasAttr('missing-attr'), false);
	});

	it("(delAttr) - Delete attribute", () => {
		$c.sm(fragNode, 'setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals($c.sm(fragNode, 'hasAttr', ls([, 'temp-attr'])), true);
		$c.sm(fragNode, 'delAttr', ls([, 'temp-attr']));
		assertEquals($c.sm(fragNode, 'hasAttr', ls([, 'temp-attr'])), false);
	});

	it(".delAttr() - Delete attribute via JS", () => {
		fragNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(fragNode.hasAttr('temp-js-attr'), true);
		fragNode.delAttr('temp-js-attr');
		assertEquals(fragNode.hasAttr('temp-js-attr'), false);
	});

	it("(hasClass) - Basic class check", () => {
		$c.sm(fragNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(fragNode, 'hasClass', ls([, 'test-class'])), true);
		assertEquals($c.sm(fragNode, 'hasClass', ls([, 'missing-class'])), false);
	});

	it(".hasClass() - Basic class check via JS", () => {
		fragNode.setAttr('class', 'js-class another-class');
		assertEquals(fragNode.hasClass('js-class'), true);
		assertEquals(fragNode.hasClass('another-class'), true);
		assertEquals(fragNode.hasClass('not-there'), false);
	});
});

describe("MWICoreFrag (m.frg) - Spec Management", () => {
	it("(getSpec) - Get spec with no attributes", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = $c.sm(fragNode, 'getSpec');
		assertEquals(spec.at(0), 'm.frg');
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.frg'));
	});

	it(".getSpec() - Get spec with no attributes via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = fragNode.getSpec();
		assertEquals(spec.at(0), 'm.frg');
	});

	it("(getSpec) - Get spec with attributes", () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'id', , 'frag-123']));
		$c.sm(fragNode, 'setAttr', ls([, 'data-role', , 'container']));
		const spec = $c.sm(fragNode, 'getSpec');
		assertEquals(spec.at(0), 'm.frg');
		assertEquals(spec.at('id'), 'frag-123');
		assertEquals(spec.at('data-role'), 'container');
	});

	it(".getSpec() - Get spec with attributes via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'js-frag-456');
		fragNode.setAttr('class', 'fragment-class');
		const spec = fragNode.getSpec();
		assertEquals(spec.at(0), 'm.frg');
		assertEquals(spec.at('id'), 'js-frag-456');
		assert(spec.at('class').includes('fragment-class'));
	});

	it("(getSubSpec) - Empty fragment returns empty NANOS", () => {
		const fragNode = doc.createNode('m.frg');
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 0);
	});

	it(".getSubSpec() - Empty fragment returns empty NANOS via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 0);
	});

	it("(getAttr m.rns) - Fragment with appended children returns child specs via m.rns", async () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Child text']));
		$c.sm(fragNode, 'append', ls([, textNode]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Child text'); // Simplified text spec
	});

	it(".getAttr('m.rns') - Fragment with appended children returns child specs via m.rns via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS child text');
		fragNode.append(textNode);
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'JS child text'); // Simplified text spec
	});

	it("(setSpec) - Set attributes from spec", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg id=spec-frag data-test=value)]');
		$c.sm(fragNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(fragNode, 'getAttr', ls([, 'id'])), 'spec-frag');
		assertEquals($c.sm(fragNode, 'getAttr', ls([, 'data-test'])), 'value');
	});

	it(".setSpec() - Set attributes from spec via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg id=js-spec-frag class=spec-class)]');
		fragNode.setSpec(spec);
		assertEquals(fragNode.getAttr('id'), 'js-spec-frag');
		assert(fragNode.getAttr('class').includes('spec-class'));
	});

	it("(setSpec) - Set children from spec", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg "Child 1" "Child 2")]');
		$c.sm(fragNode, 'setSpec', ls([, spec]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'Child 1');
		assertEquals(subSpec.at(1), 'Child 2');
	});

	it(".setSpec() - Set children from spec via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const spec = ps('[(m.frg "JS Child 1" "JS Child 2")]');
		fragNode.setSpec(spec);
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'JS Child 1');
		assertEquals(subSpec.at(1), 'JS Child 2');
	});

	it("(setSubSpec) - Set children with NANOS list", () => {
		const fragNode = doc.createNode('m.frg');
		const subList = ps('[("Sub 1" "Sub 2")]');
		$c.sm(fragNode, 'setSubSpec', ls(['subSpec', subList]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'Sub 1');
		assertEquals(subSpec.at(1), 'Sub 2');
	});

	it(".setSubSpec() - Set children with NANOS list via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const subList = ps('[("JS Sub 1" "JS Sub 2")]');
		fragNode.setSubSpec({ subSpec: subList });
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'JS Sub 1');
		assertEquals(subSpec.at(1), 'JS Sub 2');
	});

	it("(setSubSpec) - Set children with spec parameter", () => {
		const fragNode = doc.createNode('m.frg');
		const fullSpec = ps('[(m.frg "Spec Child")]');
		$c.sm(fragNode, 'setSubSpec', ls(['spec', fullSpec]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Spec Child');
	});

	it(".setSubSpec() - Set children with spec parameter via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const fullSpec = ps('[(m.frg "JS Spec Child")]');
		fragNode.setSubSpec({ spec: fullSpec });
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'JS Spec Child');
	});
});

describe("MWICoreFrag (m.frg) - Content Aggregation", () => {
	it("(append) - Append text string (auto-converts to m.t)", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'append', ls([, 'Plain text']));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Plain text'); // Simplified text spec
	});

	it(".append() - Append text string via JS (auto-converts to m.t)", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.append('JS plain text');
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'JS plain text'); // Simplified text spec
	});

	it("(append) - Append doc-node", async () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Appended node']));
		$c.sm(fragNode, 'append', ls([, textNode]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Appended node'); // Simplified text spec
	});

	it(".append() - Append doc-node via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS appended node');
		fragNode.append(textNode);
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'JS appended node'); // Simplified text spec
	});

	it("(append) - Append multiple items at once", async () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		$c.sm(text1, 'setAttr', ls([, 't', , 'First']));
		const text2 = doc.createNode('m.t');
		$c.sm(text2, 'setAttr', ls([, 't', , 'Second']));
		$c.sm(fragNode, 'append', ls([, text1, , text2]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'First'); // Simplified text spec
		assertEquals(subSpec.at(1), 'Second'); // Simplified text spec
	});

	it(".append() - Append multiple items at once via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		fragNode.append(text1, text2);
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'JS First'); // Simplified text spec
		assertEquals(subSpec.at(1), 'JS Second'); // Simplified text spec
	});

	it("(append) - Append mixed text and nodes", async () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Node text']));
		$c.sm(fragNode, 'append', ls([, 'String text', , textNode]));
		const subSpec = $c.sm(fragNode, 'getSubSpec');
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'String text'); // Simplified text spec
		assertEquals(subSpec.at(1), 'Node text'); // Simplified text spec
	});

	it(".append() - Append mixed text and nodes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Node text');
		fragNode.append('JS String text', textNode);
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at(0), 'JS String text'); // Simplified text spec
		assertEquals(subSpec.at(1), 'JS Node text'); // Simplified text spec
	});

	it("(append) - Returns fragment for chaining", () => {
		const fragNode = doc.createNode('m.frg');
		const result = $c.sm(fragNode, 'append', ls([, 'text']));
		assertStrictEquals(result, fragNode);
	});

	it(".append() - Returns fragment for chaining via JS", () => {
		const fragNode = doc.createNode('m.frg');
		const result = fragNode.append('text');
		assertStrictEquals(result, fragNode);
	});
});

describe("MWICoreFrag (m.frg) - Transparent Container Behavior", () => {
	it("Fragment can hold multiple children", async () => {
		const fragNode = doc.createNode('m.frg');
		for (let i = 0; i < 5; i++) {
			const textNode = doc.createNode('m.t');
			textNode.setAttr('t', `Child ${i}`);
			fragNode.append(textNode);
		}
		// doc-spec captures live doc state after append
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 5);
		for (let i = 0; i < 5; i++) {
			assertEquals(subSpec.at(i), `Child ${i}`); // Simplified text spec
		}
	});

	it("Fragment maintains child order", async () => {
		const fragNode = doc.createNode('m.frg');
		const children = ['First', 'Second', 'Third', 'Fourth'];
		for (const text of children) {
			fragNode.append(text);
		}
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, children.length);
		for (let i = 0; i < children.length; i++) {
			assertEquals(subSpec.at(i), children[i]); // Simplified text spec
		}
	});

	it("Fragment containing fragments (nested)", async () => {
		const outerFrag = doc.createNode('m.frg');
		const innerFrag = doc.createNode('m.frg');
		innerFrag.append('Inner text');
		outerFrag.append(innerFrag);
		const outerSpec = outerFrag.getSubSpec();
		assert(outerSpec instanceof NANOS, 'Outer sub-spec should be a NANOS list');
		assertEquals(outerSpec.size, 1);
		assertEquals(outerSpec.at([0, 0]), 'm.frg');
		const innerSpec = outerSpec.at(0);
		assert(innerSpec instanceof NANOS, 'Inner sub-spec should be a NANOS list');
		assertEquals(innerSpec.size, 2);
		assertEquals(innerSpec.at(1), 'Inner text'); // Simplified text spec
	});

	it("Fragment attributes don't interfere with children", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'frag-id');
		fragNode.setAttr('class', 'frag-class');
		fragNode.setAttr('data-test', 'value');
		fragNode.append('Child text');
		const subSpec = fragNode.getSubSpec();
		assert(subSpec instanceof NANOS, 'Sub-spec should be a NANOS list');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Child text'); // Simplified text spec
		// Fragment's own attributes exist
		assertEquals(fragNode.getAttr('id'), 'frag-id');
		assert(fragNode.getAttr('class').includes('frag-class'));
	});
});
