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

describe("MWICoreText (m.t) - Core Interface Tests", () => {
	const textNode = doc.createNode('m.t');

	it("(setAttr) - Set text attribute", () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Hello World']));
		assertEquals($c.sm(textNode, 'getAttr', ls([, 't'])), 'Hello World');
	});

	it(".setAttr() - Set text attribute via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Updated Text');
		assertEquals(textNode.getAttr('t'), 'Updated Text');
	});

	it("(delAttr) - Delete text attribute", () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Test']));
		$c.sm(textNode, 'delAttr', ls([, 't']));
		assertEquals($c.sm(textNode, 'hasAttr', ls([, 't'])), false);
	});

	it(".delAttr() - Delete text attribute via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Test');
		textNode.delAttr('t');
		assertEquals(textNode.hasAttr('t'), false);
	});

	it("(document) - Get document reference", () => {
		const docRef = $c.sm(textNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	it(".document - Get document reference via JS", () => {
		assertStrictEquals(textNode.document, doc);
	});

	it("(getAttr) - Get text attribute", () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Sample Text']));
		assertEquals($c.sm(textNode, 'getAttr', ls([, 't'])), 'Sample Text');
	});

	it(".getAttr() - Get text attribute via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Another Sample');
		assertEquals(textNode.getAttr('t'), 'Another Sample');
	});

	it("(getSpec) - Get simplified spec (text only)", () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Spec Test']));
		const spec = $c.sm(textNode, 'getSpec');
		// When spec only has type and text, it's simplified to just the text string
		assertEquals(spec, 'Spec Test');
	});

	it(".getSpec() - Get simplified spec via JS (text only)", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Spec Test');
		const spec = textNode.getSpec();
		// When spec only has type and text, it's simplified to just the text string
		assertEquals(spec, 'JS Spec Test');
	});

	it("(getSpec) - Get full spec with additional attributes", () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Full Spec']));
		$c.sm(textNode, 'setAttr', ls([, 'custom', , 'attr']));
		const spec = $c.sm(textNode, 'getSpec');
		// With additional attributes, should return full NANOS spec
		assertEquals(spec.at(0), 'm.t');
		assertEquals(spec.at('t'), 'Full Spec');
		assertEquals(spec.at('custom'), 'attr');
	});

	it(".getSpec() - Get full spec with additional attributes via JS", () => {
		const textNode = doc.createNode('m.t');
		const textNode2 = doc.createNode('m.t');
		textNode2.setAttr('t', 'JS Full Spec');
		textNode2.setAttr('custom', 'value');
		const spec = textNode2.getSpec();
		// With additional attributes, should return full NANOS spec
		assertEquals(spec.at(0), 'm.t');
		assertEquals(spec.at('t'), 'JS Full Spec');
		assertEquals(spec.at('custom'), 'value');
	});

	it("(getSubSpec) - Should return empty NANOS", () => {
		const subSpec = $c.sm(textNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	it(".getSubSpec() - Should return empty NANOS via JS", () => {
		const subSpec = textNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	it("(hasAttr) - Check attribute existence", () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Test']));
		assertEquals($c.sm(textNode, 'hasAttr', ls([, 't'])), true);
		assertEquals($c.sm(textNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	it(".hasAttr() - Check attribute existence via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Test');
		assertEquals(textNode.hasAttr('t'), true);
		assertEquals(textNode.hasAttr('nonexistent'), false);
	});

	it("(setSpec) - Set node specification", () => {
		const textNode = doc.createNode('m.t');
		const spec = ps('[(m.t t="Spec Set Test")]');
		$c.sm(textNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(textNode, 'getAttr', ls([, 't'])), 'Spec Set Test');
	});

	it(".setSpec() - Set node specification via JS", () => {
		const textNode = doc.createNode('m.t');
		const spec = ps('[(m.t t="JS Spec Set Test")]');
		textNode.setSpec(spec);
		assertEquals(textNode.getAttr('t'), 'JS Spec Set Test');
	});

	it("(append) - Append content (getSubDoc still empty)", async () => {
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Base Text']));
		$c.sm(textNode, 'append', ls([, 'ignored content']));
		const subDoc = $c.sm(textNode, 'getSubDoc');
		assertEquals(subDoc.size, 0);
	});

	it(".append() - Append content via JS (getSubDoc still empty)", async () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Base Text');
		textNode.append('ignored content');
		const subDoc = textNode.getSubDoc();
		assertEquals(subDoc.size, 0);
	});

	it("(setSubSpec) - Set sub-spec (getSubSpec still empty)", () => {
		const textNode = doc.createNode('m.t');
		const subSpec = ls([, 'child1', , 'child2']);
		$c.sm(textNode, 'setSubSpec', ls(['subSpec', subSpec]));
		const resultSubSpec = $c.sm(textNode, 'getSubSpec');
		assertEquals(resultSubSpec.size, 0);
	});

	it(".setSubSpec() - Set sub-spec via JS (getSubSpec still empty)", () => {
		const textNode = doc.createNode('m.t');
		const subSpec = ls([, 'child1', , 'child2']);
		textNode.setSubSpec({ subSpec });
		const resultSubSpec = textNode.getSubSpec();
		assertEquals(resultSubSpec.size, 0);
	});

	it(".jsv - Should return instance", () => {
		assertStrictEquals(textNode.jsv, textNode);
	});

	it(".valueOf() - Should return instance", () => {
		assertStrictEquals(textNode.valueOf(), textNode);
	});

	it("(type) - Get node type", () => {
		assertEquals($c.sm(textNode, 'type'), 'm.t');
	});

	it(".type - Get node type via JS", () => {
		assertEquals(textNode.type, 'm.t');
	});

	it(".msjsType - Get Mesgjs type", () => {
		assertEquals(textNode.msjsType, 'MWICoreText');
	});
});
