import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime({
	modules: {
		'mwi/mwi-form-comp': {
			url: './src/mwi-form-comp.msjs',
			featpro: 'mwi.comp.MWIForm',
		}
	}
});

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT, 'mwi.comp.MWIForm');

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWI Form Components - Core Interface Tests", async (t) => {
	await t.step("m.button - core attributes and spec", () => {
		const btnNode = doc.createNode('m.button');
		btnNode.setAttr('type', 'submit');
		btnNode.setAttr('disabled', true);

		assertEquals(btnNode.type, 'm.button');
		assertEquals(btnNode.getAttr('type'), 'submit');
		assertEquals(btnNode.getAttr('disabled'), true);

		const spec = btnNode.getSpec();
		assertEquals(spec.at(0), 'm.button');
		assertEquals(spec.at('type'), 'submit');
		assertEquals(spec.at('disabled'), true);
	});

	await t.step("m.input - core attributes and spec", () => {
		const inputNode = doc.createNode('m.input');
		inputNode.setAttr('value', 'initial');
		inputNode.setAttr('placeholder', 'Enter text');

		assertEquals(inputNode.type, 'm.input');
		assertEquals(inputNode.getAttr('value'), 'initial');
		assertEquals(inputNode.getAttr('placeholder'), 'Enter text');

		const spec = inputNode.getSpec();
		assertEquals(spec.at(0), 'm.input');
		assertEquals(spec.at('value'), 'initial');
		assertEquals(spec.at('placeholder'), 'Enter text');
	});

	await t.step("m.textarea - core attributes and spec", () => {
		const textareaNode = doc.createNode('m.textarea');
		textareaNode.setAttr('rows', 5);

		assertEquals(textareaNode.type, 'm.textarea');
		assertEquals(textareaNode.getAttr('rows'), 5);

		const spec = textareaNode.getSpec();
		assertEquals(spec.at(0), 'm.textarea');
		assertEquals(spec.at('rows'), 5);
	});

	await t.step("m.check - core attributes and spec", () => {
		const checkNode = doc.createNode('m.check');
		checkNode.setAttr('type', 'checkbox');
		checkNode.setAttr('checked', true);

		assertEquals(checkNode.type, 'm.check');
		assertEquals(checkNode.getAttr('type'), 'checkbox');
		assertEquals(checkNode.getAttr('checked'), true);

		const spec = checkNode.getSpec();
		assertEquals(spec.at(0), 'm.check');
		assertEquals(spec.at('type'), 'checkbox');
		assertEquals(spec.at('checked'), true);
	});

	await t.step("m.select - core attributes and spec", () => {
		const selectNode = doc.createNode('m.select');
		selectNode.setAttr('multiple', true);

		assertEquals(selectNode.type, 'm.select');
		assertEquals(selectNode.getAttr('multiple'), true);

		const spec = selectNode.getSpec();
		assertEquals(spec.at(0), 'm.select');
		assertEquals(spec.at('multiple'), true);
	});

	await t.step("m.input - changeValue and inputValue initial values", () => {
		const inputNode = doc.createNode('m.input');
		inputNode.setAttr('value', 'hello');

		assertEquals(inputNode.changeValue, 'hello');
		assertEquals(inputNode.inputValue, 'hello');
	});
});
