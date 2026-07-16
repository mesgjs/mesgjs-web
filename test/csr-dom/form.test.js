import {
	assertEquals,
	assert,
	assertExists,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

// Set up browser-like environment for DOM testing
await simulateBrowser();

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

Deno.test("MWI Form Components - CSR-DOM Tests", async (t) => {
	await t.step("m.button - button vs link DOM", () => {
		// Created without href -> renders as <button>
		const btnNode = doc.createNode('m.button');
		btnNode.setAttr('type', 'submit');
		btnNode.append('Submit');
		const btnDOM = btnNode.getDOM().at(0);
		assertEquals(btnDOM.tagName, 'BUTTON');
		assertEquals(btnDOM.getAttribute('type'), 'submit');
		assertEquals(btnDOM.textContent, 'Submit');

		// Created with href -> renders as <a>
		const linkNode = doc.createNode('m.button');
		linkNode.setAttr('href', '/home');
		linkNode.append('Home');
		const linkDOM = linkNode.getDOM().at(0);
		assertEquals(linkDOM.tagName, 'A');
		assertEquals(linkDOM.getAttribute('href'), '/home');
		assertEquals(linkDOM.textContent, 'Home');
		assert(linkDOM.classList.contains('a--button'));
	});

	await t.step("m.button - disabled link DOM", async () => {
		const linkNode = doc.createNode('m.button');
		linkNode.setAttr('href', '/home');
		linkNode.setAttr('disabled', true);
		linkNode.append('Home');
		const linkDOM = linkNode.getDOM().at(0);
		assertEquals(linkDOM.getAttribute('tabindex'), '-1');
		assertEquals(linkDOM.getAttribute('aria-disabled'), 'true');

		// Enable <a> mode
		linkNode.delAttr('disabled');
		await globalThis.reactive.wait();
		assertEquals(linkDOM.hasAttribute('tabindex'), false);
		assertEquals(linkDOM.hasAttribute('aria-disabled'), false);
	});

	await t.step("m.input - DOM and data binding", async () => {
		// Initialize MWIData
		const mwiData = doc.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);
		mwiData.set('user.email', 'test@example.com');

		const inputNode = doc.createNode('m.input');
		inputNode.setAttr('d.changeFrom', 'user.email');

		const inputDOM = inputNode.getDOM().at(0);
		document.body.append(inputDOM);
		assertEquals(inputDOM.value, 'test@example.com');

		// Update from MWIData -> UI
		mwiData.set('user.email', 'updated@example.com');
		await globalThis.reactive.wait();
		assertEquals(inputDOM.value, 'updated@example.com');

		// Update from UI -> MWIData via event
		inputDOM.value = 'user@example.com';
		const event = new window.Event('change', { bubbles: true });
		inputDOM.dispatchEvent(event);
		await globalThis.reactive.wait();
		assertEquals(mwiData.at('user.email'), 'user@example.com');
		assertEquals(inputNode.changeValue, 'user@example.com');

		// Clean up
		globalThis.$gss.delete('MWIData');
	});

	await t.step("m.textarea - DOM and data binding", async () => {
		const mwiData = doc.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);
		mwiData.set('user.bio', 'Hello World');

		const textareaNode = doc.createNode('m.textarea');
		textareaNode.setAttr('d.inputFrom', 'user.bio');

		const textareaDOM = textareaNode.getDOM().at(0);
		document.body.append(textareaDOM);
		assertEquals(textareaDOM.value, 'Hello World');

		// Update from UI -> MWIData via input event
		textareaDOM.value = 'Hello updated';
		const event = new window.Event('input', { bubbles: true });
		textareaDOM.dispatchEvent(event);
		await globalThis.reactive.wait();
		assertEquals(mwiData.at('user.bio'), 'Hello updated');
		assertEquals(textareaNode.inputValue, 'Hello updated');

		// Clean up
		globalThis.$gss.delete('MWIData');
	});

	await t.step("m.check - checkbox and radio DOM", async () => {
		const mwiData = doc.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);

		// Checkbox group (list-valued)
		mwiData.set('user.roles', doc.rxNANOS());

		const checkNode1 = doc.createNode('m.check');
		checkNode1.setAttr('value', 'admin');
		checkNode1.setAttr('d.changeFrom', 'user.roles');

		const checkNode2 = doc.createNode('m.check');
		checkNode2.setAttr('value', 'user');
		checkNode2.setAttr('d.changeFrom', 'user.roles');

		const dom1 = checkNode1.getDOM().at(0);
		const dom2 = checkNode2.getDOM().at(0);

		document.body.append(dom1, dom2);
		assertEquals(dom1.checked, false);
		assertEquals(dom2.checked, false);

		// Check first checkbox
		dom1.checked = true;
		dom1.dispatchEvent(new window.Event('change', { bubbles: true }));
		await globalThis.reactive.wait();

		const roles = mwiData.at('user.roles');
		assert(roles instanceof NANOS);
		assertEquals(roles.keyOf('admin') !== undefined, true);
		assertEquals(roles.keyOf('user') !== undefined, false);

		// Check second checkbox
		dom2.checked = true;
		dom2.dispatchEvent(new window.Event('change', { bubbles: true }));
		await globalThis.reactive.wait();
		assertEquals(roles.keyOf('user') !== undefined, true);

		// Uncheck first checkbox
		dom1.checked = false;
		dom1.dispatchEvent(new window.Event('change', { bubbles: true }));
		await globalThis.reactive.wait();
		assertEquals(roles.keyOf('admin') !== undefined, false);
		assertEquals(roles.keyOf('user') !== undefined, true);

		// Radio buttons (scalar-valued)
		mwiData.set('user.gender', 'male');

		const radioNode1 = doc.createNode('m.check');
		radioNode1.setAttr('type', 'radio');
		radioNode1.setAttr('value', 'male');
		radioNode1.setAttr('d.changeFrom', 'user.gender');

		const radioNode2 = doc.createNode('m.check');
		radioNode2.setAttr('type', 'radio');
		radioNode2.setAttr('value', 'female');
		radioNode2.setAttr('d.changeFrom', 'user.gender');

		const rdom1 = radioNode1.getDOM().at(0);
		const rdom2 = radioNode2.getDOM().at(0);

		document.body.append(rdom1, rdom2);
		assertEquals(rdom1.checked, true);
		assertEquals(rdom2.checked, false);

		// Select female
		rdom2.checked = true;
		rdom2.dispatchEvent(new window.Event('change', { bubbles: true }));
		await globalThis.reactive.wait();
		assertEquals(mwiData.at('user.gender'), 'female');
		assertEquals(rdom1.checked, false);
		assertEquals(rdom2.checked, true);

		// Clean up
		globalThis.$gss.delete('MWIData');
	});

	await t.step("m.select - single and multiple select DOM", async () => {
		const mwiData = doc.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);
		mwiData.set('user.country', 'US');

		const selectNode = doc.createNode('m.select');
		selectNode.setAttr('d.changeFrom', 'user.country');

		const opt1 = doc.createNode('h.option');
		opt1.setAttr('value', 'US');
		opt1.append('United States');

		const opt2 = doc.createNode('h.option');
		opt2.setAttr('value', 'CA');
		opt2.append('Canada');

		selectNode.append(opt1, opt2);

		const selectDOM = selectNode.getDOM().at(0);
		document.body.append(selectDOM);
		assertEquals(selectDOM.value, 'US');

		// Change selection from UI
		selectDOM.value = 'CA';
		selectDOM.dispatchEvent(new window.Event('change', { bubbles: true }));
		await globalThis.reactive.wait();
		assertEquals(mwiData.at('user.country'), 'CA');

		// Clean up
		globalThis.$gss.delete('MWIData');
	});
});
