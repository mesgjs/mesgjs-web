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
	const textNode = await doc.createNode('m.t');

	await t.step("(setAttr) - Set text attribute", async () => {
		textNode('setAttr', ls([, 't', , 'Hello World']));
		assertEquals(textNode('getAttr', ls([, 't'])), 'Hello World');
	});

	await t.step(".setAttr() - Set text attribute via JS", async () => {
		textNode.setAttr('t', 'Updated Text');
		assertEquals(textNode.getAttr('t'), 'Updated Text');
	});

	await t.step("(delAttr) - Delete text attribute", async () => {
		textNode('setAttr', ls([, 't', , 'Test']));
		textNode('delAttr', ls([, 't']));
		assertEquals(textNode('hasAttr', ls([, 't'])), false);
	});

	await t.step(".delAttr() - Delete text attribute via JS", async () => {
		textNode.setAttr('t', 'Test');
		textNode.delAttr('t');
		assertEquals(textNode.hasAttr('t'), false);
	});

	await t.step("(document) - Get document reference", async () => {
		const docRef = textNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", async () => {
		assertStrictEquals(textNode.document, doc);
	});

	await t.step("(getAttr) - Get text attribute", async () => {
		textNode('setAttr', ls([, 't', , 'Sample Text']));
		assertEquals(textNode('getAttr', ls([, 't'])), 'Sample Text');
	});

	await t.step(".getAttr() - Get text attribute via JS", async () => {
		textNode.setAttr('t', 'Another Sample');
		assertEquals(textNode.getAttr('t'), 'Another Sample');
	});

	await t.step("(getSpec) - Get node specification", async () => {
		textNode('setAttr', ls([, 't', , 'Spec Test']));
		const spec = textNode('getSpec');
		assertEquals(spec.at(0), 'm.t');
		assertEquals(spec.at('t'), 'Spec Test');
		// Test using toSLID for string representation
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.t'));
		assert(slidStr.includes('Spec Test'));
	});

	await t.step(".getSpec() - Get node specification via JS", async () => {
		textNode.setAttr('t', 'JS Spec Test');
		const spec = textNode.getSpec();
		assertEquals(spec.at(0), 'm.t');
		assertEquals(spec.at('t'), 'JS Spec Test');
	});

	await t.step("(getSubSpec) - Should return empty NANOS", async () => {
		const subSpec = textNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Should return empty NANOS via JS", async () => {
		const subSpec = textNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(hasAttr) - Check attribute existence", async () => {
		textNode('setAttr', ls([, 't', , 'Test']));
		assertEquals(textNode('hasAttr', ls([, 't'])), true);
		assertEquals(textNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", async () => {
		textNode.setAttr('t', 'Test');
		assertEquals(textNode.hasAttr('t'), true);
		assertEquals(textNode.hasAttr('nonexistent'), false);
	});

	await t.step("(setSpec) - Set node specification (async)", async () => {
		const spec = ps('[(m.t t="Spec Set Test")]');
		await textNode('setSpec', ls([, spec]));
		assertEquals(textNode('getAttr', ls([, 't'])), 'Spec Set Test');
	});

	await t.step(".setSpec() - Set node specification via JS (async)", async () => {
		const spec = ps('[(m.t t="JS Spec Set Test")]');
		await textNode.setSpec(spec);
		assertEquals(textNode.getAttr('t'), 'JS Spec Set Test');
	});

	await t.step("(append) - Append content (getSubSpec still empty)", async () => {
		textNode('setAttr', ls([, 't', , 'Base Text']));
		textNode('append', ls([, 'ignored content']));
		const subSpec = textNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Append content via JS (getSubSpec still empty)", async () => {
		textNode.setAttr('t', 'Base Text');
		textNode.append('ignored content');
		const subSpec = textNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(setSubSpec) - Set sub-spec (async, getSubSpec still empty)", async () => {
		const subSpec = ls([, 'child1', , 'child2']);
		await textNode('setSubSpec', ls([, subSpec]));
		const resultSubSpec = textNode('getSubSpec');
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".setSubSpec() - Set sub-spec via JS (async, getSubSpec still empty)", async () => {
		const subSpec = ls([, 'child1', , 'child2']);
		await textNode.setSubSpec(subSpec);
		const resultSubSpec = textNode.getSubSpec();
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".jsv - Should return instance", async () => {
		assertStrictEquals(textNode.jsv, textNode);
	});

	await t.step(".valueOf() - Should return instance", async () => {
		assertStrictEquals(textNode.valueOf(), textNode);
	});

	await t.step("(type) - Get node type", async () => {
		assertEquals(textNode('type'), 'm.t');
	});

	await t.step(".type - Get node type via JS", async () => {
		assertEquals(textNode.type, 'm.t');
	});

	await t.step(".msjsType - Get Mesgjs type", async () => {
		assertEquals(textNode.msjsType, 'MWICoreText');
	});
});
