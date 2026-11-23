import { describe, it } from '@compat/test';
import {
	assertEquals,
	assert,
} from '@std/assert';

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

describe("MWI Form Components - SSR-HTML Tests", () => {
	it("m.button - button vs link HTML", () => {
		// Created without href -> renders as <button>
		const btnNode = doc.createNode('m.button');
		btnNode.setAttr('type', 'submit');
		btnNode.append('Submit');
		const btnHTML = btnNode.getHTML();
		assertEquals(btnHTML, '<button type="submit">Submit</button>');

		// Created with href -> renders as <a>
		const linkNode = doc.createNode('m.button');
		linkNode.setAttr('href', '/home');
		linkNode.append('Home');
		const linkHTML = linkNode.getHTML();
		assertEquals(linkHTML, '<a href="/home" class="a--button">Home</a>');
	});

	it("m.button - disabled link HTML", () => {
		const linkNode = doc.createNode('m.button');
		linkNode.setAttr('href', '/home');
		linkNode.setAttr('disabled', true);
		linkNode.append('Home');
		const linkHTML = linkNode.getHTML();
		assertEquals(linkHTML.includes('disabled'), true);
		assertEquals(linkHTML.includes('tabindex="-1"'), true);
		assertEquals(linkHTML.includes('aria-disabled="true"'), true);
	});

	it("m.input - HTML", () => {
		const inputNode = doc.createNode('m.input');
		inputNode.setAttr('type', 'email');
		inputNode.setAttr('value', 'test@example.com');
		const html = inputNode.getHTML();
		assertEquals(html, '<input type="email" value="test@example.com">');
	});

	it("m.textarea - HTML", () => {
		const textareaNode = doc.createNode('m.textarea');
		textareaNode.setAttr('rows', 5);
		textareaNode.append('Hello World');
		const html = textareaNode.getHTML();
		assertEquals(html, '<textarea rows="5">Hello World</textarea>');
	});

	it("m.check - checkbox HTML", () => {
		const checkNode = doc.createNode('m.check');
		checkNode.setAttr('value', 'admin');
		checkNode.setAttr('checked', true);
		const html = checkNode.getHTML();
		assertEquals(html.includes('type="checkbox"'), true);
		assertEquals(html.includes('value="admin"'), true);
		assertEquals(html.includes('checked'), true);
	});

	it("m.check - radio HTML", () => {
		const checkNode = doc.createNode('m.check');
		checkNode.setAttr('type', 'radio');
		checkNode.setAttr('value', 'male');
		checkNode.setAttr('checked', true);
		const html = checkNode.getHTML();
		assertEquals(html, '<input type="radio" value="male" checked>');
	});

	it("m.select - HTML with options", () => {
		const selectNode = doc.createNode('m.select');

		const opt1 = doc.createNode('h.option');
		opt1.setAttr('value', 'US');
		opt1.append('United States');

		const opt2 = doc.createNode('h.option');
		opt2.setAttr('value', 'CA');
		opt2.setAttr('selected', true);
		opt2.append('Canada');

		selectNode.append(opt1, opt2);

		const html = selectNode.getHTML();
		assertEquals(html, '<select><option value="US">United States</option><option value="CA" selected>Canada</option></select>');
	});
});
