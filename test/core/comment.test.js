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

describe("MWICoreCom (m.com) - Core Interface Tests", () => {
	const comNode = doc.createNode('m.com');

	it("(setAttr) - Set comment text attribute", () => {
		$c.sm(comNode, 'setAttr', ls([, 't', , 'Comment text']));
		assertEquals($c.sm(comNode, 'getAttr', ls([, 't'])), 'Comment text');
	});

	it(".setAttr() - Set comment text attribute via JS", () => {
		comNode.setAttr('t', 'Updated comment');
		assertEquals(comNode.getAttr('t'), 'Updated comment');
	});

	it("(delAttr) - Delete comment text attribute", () => {
		$c.sm(comNode, 'setAttr', ls([, 't', , 'Test']));
		$c.sm(comNode, 'delAttr', ls([, 't']));
		assertEquals($c.sm(comNode, 'hasAttr', ls([, 't'])), false);
	});

	it(".delAttr() - Delete comment text attribute via JS", () => {
		comNode.setAttr('t', 'Test');
		comNode.delAttr('t');
		assertEquals(comNode.hasAttr('t'), false);
	});

	it("(document) - Get document reference", () => {
		const docRef = $c.sm(comNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	it(".document - Get document reference via JS", () => {
		assertStrictEquals(comNode.document, doc);
	});

	it("(getAttr) - Get comment text attribute", () => {
		$c.sm(comNode, 'setAttr', ls([, 't', , 'Sample comment']));
		assertEquals($c.sm(comNode, 'getAttr', ls([, 't'])), 'Sample comment');
	});

	it(".getAttr() - Get comment text attribute via JS", () => {
		comNode.setAttr('t', 'Another sample');
		assertEquals(comNode.getAttr('t'), 'Another sample');
	});

	it("(getSpec) - Get node specification", () => {
		$c.sm(comNode, 'setAttr', ls([, 't', , 'Spec comment']));
		const spec = $c.sm(comNode, 'getSpec');
		assertEquals(spec.at(0), 'm.com');
		assertEquals(spec.at('t'), 'Spec comment');
		// Test using toSLID for string representation
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.com'));
		assert(slidStr.includes('Spec comment'));
	});

	it(".getSpec() - Get node specification via JS", async () => {
		comNode.setAttr('t', 'JS spec comment');
		const spec = comNode.getSpec();
		assertEquals(spec.at(0), 'm.com');
		assertEquals(spec.at('t'), 'JS spec comment');
	});

	it("(getSubSpec) - Should return empty NANOS", () => {
		const subSpec = $c.sm(comNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	it(".getSubSpec() - Should return empty NANOS via JS", () => {
		const subSpec = comNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	it("(hasAttr) - Check attribute existence", () => {
		$c.sm(comNode, 'setAttr', ls([, 't', , 'Test']));
		assertEquals($c.sm(comNode, 'hasAttr', ls([, 't'])), true);
		assertEquals($c.sm(comNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	it(".hasAttr() - Check attribute existence via JS", () => {
		comNode.setAttr('t', 'Test');
		assertEquals(comNode.hasAttr('t'), true);
		assertEquals(comNode.hasAttr('nonexistent'), false);
	});

	it("(setSpec) - Set node specification", () => {
		const spec = ps('[(m.com t="Spec set comment")]');
		$c.sm(comNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(comNode, 'getAttr', ls([, 't'])), 'Spec set comment');
	});

	it(".setSpec() - Set node specification via JS", () => {
		const spec = ps('[(m.com t="JS spec set comment")]');
		comNode.setSpec(spec);
		assertEquals(comNode.getAttr('t'), 'JS spec set comment');
	});

	it("(append) - Append content (getSubSpec still empty)", async () => {
		$c.sm(comNode, 'setAttr', ls([, 't', , 'Base comment']));
		$c.sm(comNode, 'append', ls([, 'ignored content']));
		const subSpec = $c.sm(comNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	it(".append() - Append content via JS (getSubSpec still empty)", async () => {
		comNode.setAttr('t', 'Base comment');
		comNode.append('ignored content');
		const subSpec = comNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	it("(setSubSpec) - Set sub-spec (getSubSpec still empty)", () => {
		const subSpec = ls([, 'child1', , 'child2']);
		$c.sm(comNode, 'setSubSpec', ls(['subSpec', subSpec]));
		const resultSubSpec = $c.sm(comNode, 'getSubSpec');
		assertEquals(resultSubSpec.size, 0);
	});

	it(".setSubSpec() - Set sub-spec via JS (getSubSpec still empty)", () => {
		const subSpec = ls([, 'child1', , 'child2']);
		comNode.setSubSpec({ subSpec });
		const resultSubSpec = comNode.getSubSpec();
		assertEquals(resultSubSpec.size, 0);
	});

	it(".jsv - Should return instance", () => {
		assertStrictEquals(comNode.jsv, comNode);
	});

	it(".valueOf() - Should return instance", () => {
		assertStrictEquals(comNode.valueOf(), comNode);
	});

	it("(type) - Get node type", () => {
		assertEquals($c.sm(comNode, 'type'), 'm.com');
	});

	it(".type - Get node type via JS", () => {
		assertEquals(comNode.type, 'm.com');
	});

	it(".msjsType - Get Mesgjs type", () => {
		assertEquals(comNode.msjsType, 'MWICoreCom');
	});
});
