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

Deno.test("MWICoreCom (m.com) - Core Interface Tests", async (t) => {
	const comNode = await doc.createNode('m.com');

	await t.step("(setAttr) - Set comment text attribute", async () => {
		comNode('setAttr', ls([, 't', , 'Comment text']));
		assertEquals(comNode('getAttr', ls([, 't'])), 'Comment text');
	});

	await t.step(".setAttr() - Set comment text attribute via JS", async () => {
		comNode.setAttr('t', 'Updated comment');
		assertEquals(comNode.getAttr('t'), 'Updated comment');
	});

	await t.step("(delAttr) - Delete comment text attribute", async () => {
		comNode('setAttr', ls([, 't', , 'Test']));
		comNode('delAttr', ls([, 't']));
		assertEquals(comNode('hasAttr', ls([, 't'])), false);
	});

	await t.step(".delAttr() - Delete comment text attribute via JS", async () => {
		comNode.setAttr('t', 'Test');
		comNode.delAttr('t');
		assertEquals(comNode.hasAttr('t'), false);
	});

	await t.step("(document) - Get document reference", async () => {
		const docRef = comNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", async () => {
		assertStrictEquals(comNode.document, doc);
	});

	await t.step("(getAttr) - Get comment text attribute", async () => {
		comNode('setAttr', ls([, 't', , 'Sample comment']));
		assertEquals(comNode('getAttr', ls([, 't'])), 'Sample comment');
	});

	await t.step(".getAttr() - Get comment text attribute via JS", async () => {
		comNode.setAttr('t', 'Another sample');
		assertEquals(comNode.getAttr('t'), 'Another sample');
	});

	await t.step("(getSpec) - Get node specification", async () => {
		comNode('setAttr', ls([, 't', , 'Spec comment']));
		const spec = comNode('getSpec');
		assertEquals(spec.at(0), 'm.com');
		assertEquals(spec.at('t'), 'Spec comment');
		// Test using toSLID for string representation
		const slidStr = spec.toSLID();
		assert(slidStr.includes('m.com'));
		assert(slidStr.includes('Spec comment'));
	});

	await t.step(".getSpec() - Get node specification via JS", async () => {
		comNode.setAttr('t', 'JS spec comment');
		const spec = comNode.getSpec();
		assertEquals(spec.at(0), 'm.com');
		assertEquals(spec.at('t'), 'JS spec comment');
	});

	await t.step("(getSubSpec) - Should return empty NANOS", async () => {
		const subSpec = comNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Should return empty NANOS via JS", async () => {
		const subSpec = comNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(hasAttr) - Check attribute existence", async () => {
		comNode('setAttr', ls([, 't', , 'Test']));
		assertEquals(comNode('hasAttr', ls([, 't'])), true);
		assertEquals(comNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check attribute existence via JS", async () => {
		comNode.setAttr('t', 'Test');
		assertEquals(comNode.hasAttr('t'), true);
		assertEquals(comNode.hasAttr('nonexistent'), false);
	});

	await t.step("(setSpec) - Set node specification (async)", async () => {
		const spec = ps('[(m.com t="Spec set comment")]');
		await comNode('setSpec', ls([, spec]));
		assertEquals(comNode('getAttr', ls([, 't'])), 'Spec set comment');
	});

	await t.step(".setSpec() - Set node specification via JS (async)", async () => {
		const spec = ps('[(m.com t="JS spec set comment")]');
		await comNode.setSpec(spec);
		assertEquals(comNode.getAttr('t'), 'JS spec set comment');
	});

	await t.step("(append) - Append content (getSubSpec still empty)", async () => {
		comNode('setAttr', ls([, 't', , 'Base comment']));
		comNode('append', ls([, 'ignored content']));
		const subSpec = comNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Append content via JS (getSubSpec still empty)", async () => {
		comNode.setAttr('t', 'Base comment');
		comNode.append('ignored content');
		const subSpec = comNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(setSubSpec) - Set sub-spec (async, getSubSpec still empty)", async () => {
		const subSpec = ls([, 'child1', , 'child2']);
		await comNode('setSubSpec', ls([, subSpec]));
		const resultSubSpec = comNode('getSubSpec');
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".setSubSpec() - Set sub-spec via JS (async, getSubSpec still empty)", async () => {
		const subSpec = ls([, 'child1', , 'child2']);
		await comNode.setSubSpec(subSpec);
		const resultSubSpec = comNode.getSubSpec();
		assertEquals(resultSubSpec.size, 0);
	});

	await t.step(".jsv - Should return instance", async () => {
		assertStrictEquals(comNode.jsv, comNode);
	});

	await t.step(".valueOf() - Should return instance", async () => {
		assertStrictEquals(comNode.valueOf(), comNode);
	});

	await t.step("(type) - Get node type", async () => {
		assertEquals(comNode('type'), 'm.com');
	});

	await t.step(".type - Get node type via JS", async () => {
		assertEquals(comNode.type, 'm.com');
	});

	await t.step(".msjsType - Get Mesgjs type", async () => {
		assertEquals(comNode.msjsType, 'MWICoreCom');
	});
});