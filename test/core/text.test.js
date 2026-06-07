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

Deno.test("MWICoreText (m.t) - Core Interface Tests", async (t) => {
	const textNode = doc.createNode('m.t');

	await t.step("(setAttr) - Set text attribute", () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Hello World']));
		assertEquals(textNode('getAttr', ls([, 't'])), 'Hello World');
	});

	await t.step(".setAttr() - Set text attribute via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Updated Text');
		assertEquals(textNode.getAttr('t'), 'Updated Text');
	});

	await t.step("(delAttr) - Delete text attribute", () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Test']));
		textNode('delAttr', ls([, 't']));
		assertEquals(textNode('hasAttr', ls([, 't'])), false);
	});

	await t.step(".delAttr() - Delete text attribute via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Test');
		textNode.delAttr('t');
		assertEquals(textNode.hasAttr('t'), false);
	});

	await t.step("(document) - Get document reference", () => {
		const docRef = textNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(textNode.document, doc);
	});

	await t.step("(getAttr) - Get text attribute", () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Sample Text']));
		assertEquals(textNode('getAttr', ls([, 't'])), 'Sample Text');
	});

	await t.step(".getAttr() - Get text attribute via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Another Sample');
		assertEquals(textNode.getAttr('t'), 'Another Sample');
	});

	await t.step("(getSpec) - Get simplified spec (text only)", () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Spec Test']));
		const spec = textNode('getSpec');
		// When spec only has type and text, it's simplified to just the text string
		assertEquals(spec, 'Spec Test');
	});

	await t.step(".getSpec() - Get simplified spec via JS (text only)", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Spec Test');
		const spec = textNode.getSpec();
		// When spec only has type and text, it's simplified to just the text string
		assertEquals(spec, 'JS Spec Test');
	});

	await t.step("(getSpec) - Get full spec with additional attributes", () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Full Spec']));
		textNode('setAttr', ls([, 'custom', , 'attr']));
		const spec = textNode('getSpec');
		// With additional attributes, should return full NANOS spec
		assertEquals(spec.at(0), 'm.t');
		assertEquals(spec.at('t'), 'Full Spec');
		assertEquals(spec.at('custom'), 'attr');
	});

	await t.step(".getSpec() - Get full spec with additional attributes via JS", () => {
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

	await t.step("(getSubSpec) - Should return empty NANOS", () => {
		const subSpec = textNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Should return empty NANOS via JS", () => {
		const subSpec = textNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(hasAttr) - Check attribute existence", () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Test']));
		assertEquals(textNode('hasAttr', ls([, 't'])), true);
		assertEquals(textNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Test');
		assertEquals(textNode.hasAttr('t'), true);
		assertEquals(textNode.hasAttr('nonexistent'), false);
	});

	await t.step("(setSpec) - Set node specification", () => {
		const textNode = doc.createNode('m.t');
		const spec = ps('[(m.t t="Spec Set Test")]');
		textNode('setSpec', ls([, spec]));
		assertEquals(textNode('getAttr', ls([, 't'])), 'Spec Set Test');
	});

	await t.step(".setSpec() - Set node specification via JS", () => {
		const textNode = doc.createNode('m.t');
		const spec = ps('[(m.t t="JS Spec Set Test")]');
		textNode.setSpec(spec);
		assertEquals(textNode.getAttr('t'), 'JS Spec Set Test');
	});

	await t.step("(append) - Append content (getSubDoc still empty)", async () => {
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Base Text']));
		textNode('append', ls([, 'ignored content']));
		const subDoc = textNode('getSubDoc');
		assertEquals(subDoc.size, 0);
	});

	await t.step(".append() - Append content via JS (getSubDoc still empty)", async () => {
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Base Text');
		textNode.append('ignored content');
		const subDoc = textNode.getSubDoc();
		assertEquals(subDoc.size, 0);
	});

	await t.step("(setSubSpec) - Set sub-spec (getSubSpec still empty)", () => {
		const textNode = doc.createNode('m.t');
		const subSpec = ls([, 'child1', , 'child2']);
		textNode('setSubSpec', ls(['subSpec', subSpec]));
		const resultSubSpec = textNode('getSubSpec');
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".setSubSpec() - Set sub-spec via JS (getSubSpec still empty)", () => {
		const textNode = doc.createNode('m.t');
		const subSpec = ls([, 'child1', , 'child2']);
		textNode.setSubSpec({ subSpec });
		const resultSubSpec = textNode.getSubSpec();
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".jsv - Should return instance", () => {
		assertStrictEquals(textNode.jsv, textNode);
	});

	await t.step(".valueOf() - Should return instance", () => {
		assertStrictEquals(textNode.valueOf(), textNode);
	});

	await t.step("(type) - Get node type", () => {
		assertEquals(textNode('type'), 'm.t');
	});

	await t.step(".type - Get node type via JS", () => {
		assertEquals(textNode.type, 'm.t');
	});

	await t.step(".msjsType - Get Mesgjs type", () => {
		assertEquals(textNode.msjsType, 'MWICoreText');
	});
});
