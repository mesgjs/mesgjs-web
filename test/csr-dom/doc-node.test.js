import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');

Deno.test("MWIDocNode - CSR-DOM Basic Rendering", async (t) => {
	await t.step("(getDOM) - Empty element (no attributes, no children)", async () => {
		const divNode = doc('createNode', ['h.div']);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.attributes.length, 0);
	});

	await t.step(".getDOM() - Empty element via JS", async () => {
		const divNode = doc.createNode('h.div');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.children.length, 0);
	});

	await t.step("(getDOM) - Element with attributes only", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['id', 'test-id']);
		divNode('setAttr', ['class', 'test-class']);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'test-id');
		assertEquals(divElem.className, 'test-class');
	});

	await t.step(".getDOM() - Element with attributes only via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-test-id');
		divNode.setAttr('title', 'Test Title');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'js-test-id');
		assertEquals(divElem.title, 'Test Title');
	});

	await t.step("(getDOM) - Element with children only", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Child text']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Child text');
	});

	await t.step(".getDOM() - Element with children only via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child text');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'JS Child text');
	});

	await t.step("(getDOM) - Element with both attributes and children", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['id', 'container']);
		divNode('setAttr', ['class', 'wrapper']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Content']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'container');
		assertEquals(divElem.className, 'wrapper');
		assertEquals(divElem.textContent, 'Content');
	});

	await t.step(".getDOM() - Element with both attributes and children via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-container');
		divNode.setAttr('data-test', 'value');
		divNode.append('JS Content');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'js-container');
		assertEquals(divElem.getAttribute('data-test'), 'value');
		assertEquals(divElem.textContent, 'JS Content');
	});

	await t.step("(getDOM) - Void element (h.br)", async () => {
		const brNode = doc('createNode', ['h.br']);
		const domNodes = brNode('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const brElem = domNodes.at(0);
		assertEquals(brElem.tagName, 'BR');
		assertEquals(brElem.childNodes.length, 0);
	});

	await t.step(".getDOM() - Void element (h.br) via JS", async () => {
		const brNode = doc.createNode('h.br');
		const domNodes = brNode.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const brElem = domNodes.at(0);
		assertEquals(brElem.tagName, 'BR');
		assertEquals(brElem.childNodes.length, 0);
	});
});

Deno.test("MWIDocNode - CSR-DOM Attribute Rendering", async (t) => {
	await t.step("(getDOM) - Standard HTML attributes", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['id', 'my-id']);
		divNode('setAttr', ['class', 'my-class']);
		divNode('setAttr', ['title', 'My Title']);
		divNode('setAttr', ['data-value', 'test']);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'my-id');
		assertEquals(divElem.className, 'my-class');
		assertEquals(divElem.title, 'My Title');
		assertEquals(divElem.getAttribute('data-value'), 'test');
	});

	await t.step(".getDOM() - Standard HTML attributes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-id');
		divNode.setAttr('aria-label', 'Label');
		divNode.setAttr('data-test', 'value');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'js-id');
		assertEquals(divElem.getAttribute('aria-label'), 'Label');
		assertEquals(divElem.getAttribute('data-test'), 'value');
	});

	await t.step("(getDOM) - Boolean attributes", async () => {
		const inputNode = doc('createNode', ['h.input']);
		inputNode('setAttr', ['disabled', true]);
		inputNode('setAttr', ['readonly', true]);
		const domNodes = inputNode('getDOM');

		await globalThis.reactive.wait();
		const inputElem = domNodes.at(0);
		assertEquals(inputElem.disabled, true);
		assertEquals(inputElem.readOnly, true);
	});

	await t.step(".getDOM() - Boolean attributes via JS", async () => {
		const inputNode = doc.createNode('h.input');
		inputNode.setAttr('disabled', true);
		inputNode.setAttr('checked', true);
		const domNodes = inputNode.getDOM();

		await globalThis.reactive.wait();
		const inputElem = domNodes.at(0);
		assertEquals(inputElem.disabled, true);
		assertEquals(inputElem.checked, true);
	});

	await t.step("(getDOM) - Non-HTML attributes do not render (m.id)", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['id', 'real-id']);
		// Access m.id to ensure it's set
		divNode('getAttr', ['m.id']);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'real-id');
		assertEquals(divElem.hasAttribute('m.id'), false);
	});

	await t.step(".getDOM() - Non-HTML attributes do not render (m.percl)", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm-class');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('m.percl'), false);
		// But the permanent class should appear in the class attribute
		assert(divElem.className.includes('perm-class'));
	});

	await t.step("(getDOM) - List-valued attributes do not render", async () => {
		const divNode = doc('createNode', ['h.div']);
		const listVal = ps('[(item1 item2 item3)]');
		divNode('setAttr', ['c.items', listVal]);
		divNode('setAttr', ['id', 'test-id']);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('c.items'), false);
		assertEquals(divElem.id, 'test-id');
	});

	await t.step(".getDOM() - List-valued attributes do not render via JS", async () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(alpha beta gamma)]');
		divNode.setAttr('c.data', listVal);
		divNode.setAttr('title', 'Test');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('c.data'), false);
		assertEquals(divElem.title, 'Test');
	});
});

Deno.test("MWIDocNode - CSR-DOM Child Content Rendering", async (t) => {
	await t.step("(getDOM) - Single text child", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Single child']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Single child');
	});

	await t.step(".getDOM() - Single text child via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('JS single child');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'JS single child');
	});

	await t.step("(getDOM) - Multiple text children", async () => {
		const divNode = doc('createNode', ['h.div']);
		const text1 = doc('createNode', ['m.t']);
		text1('setAttr', ['t', 'First']);
		const text2 = doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Second']);
		const text3 = doc('createNode', ['m.t']);
		text3('setAttr', ['t', 'Third']);
		divNode('append', [text1, text2, text3]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'FirstSecondThird');
	});

	await t.step(".getDOM() - Multiple text children via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('First', 'Second', 'Third');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'FirstSecondThird');
	});

	await t.step("(getDOM) - Mixed content (text and element children)", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Text']);
		const spanNode = doc('createNode', ['h.span']);
		spanNode('append', ['Span']);
		divNode('append', [textNode, spanNode]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'TextSpan');
		// Text renders as text node, so we have 1 element child (<span>) and 1 text node child
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Text');
		assertEquals(divElem.children[0].tagName, 'SPAN');
		assertEquals(divElem.children[0].textContent, 'Span');
	});

	await t.step(".getDOM() - Mixed content via JS", async () => {
		const divNode = doc.createNode('h.div');
		const spanNode = doc.createNode('h.span');
		spanNode.append('Span content');
		divNode.append('Before', spanNode, 'After');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'BeforeSpan contentAfter');
		// Text renders as text nodes, so we have 1 element child (<span>) and 2 text node children
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Before');
		assertEquals(divElem.childNodes[1].tagName, 'SPAN');
		assertEquals(divElem.childNodes[1].textContent, 'Span content');
		assertEquals(divElem.childNodes[2].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[2].nodeValue, 'After');
	});

	await t.step("(getDOM) - Nested elements", async () => {
		const outerDiv = doc('createNode', ['h.div']);
		const innerDiv = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Nested']);
		innerDiv('append', [textNode]);
		outerDiv('append', [innerDiv]);
		const domNodes = outerDiv('getDOM');

		await globalThis.reactive.wait();
		const outerElem = domNodes.at(0);
		assertEquals(outerElem.textContent, 'Nested');
		assertEquals(outerElem.children.length, 1);
		assertEquals(outerElem.children[0].tagName, 'DIV');
	});

	await t.step(".getDOM() - Nested elements via JS", async () => {
		const outerDiv = doc.createNode('h.div');
		const innerDiv = doc.createNode('h.div');
		innerDiv.append('Inner content');
		outerDiv.append(innerDiv);
		const domNodes = outerDiv.getDOM();

		await globalThis.reactive.wait();
		const outerElem = domNodes.at(0);
		assertEquals(outerElem.textContent, 'Inner content');
		assertEquals(outerElem.children.length, 1);
	});

	await t.step("(getDOM) - Void element has no children in output", async () => {
		const brNode = doc('createNode', ['h.br']);
		// Try to append (should be ignored)
		brNode('append', ['text']);
		const domNodes = brNode('getDOM');

		await globalThis.reactive.wait();
		const brElem = domNodes.at(0);
		assertEquals(brElem.childNodes.length, 0);
	});

	await t.step(".getDOM() - Void element has no children in output via JS", async () => {
		const brNode = doc.createNode('h.br');
		brNode.append('ignored text');
		const domNodes = brNode.getDOM();

		await globalThis.reactive.wait();
		const brElem = domNodes.at(0);
		assertEquals(brElem.childNodes.length, 0);
	});
});

Deno.test("MWIDocNode - CSR-DOM Reactive Updates", async (t) => {
	await t.step("(getDOM) - Reactive attribute changes", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['title', 'Initial']);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Initial');

		// Change attribute
		divNode('setAttr', ['title', 'Updated']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Updated');
		assertStrictEquals(domNodes.at(0), divElem, 'Should be same element');
	});

	await t.step(".getDOM() - Reactive attribute changes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', 'JS Initial');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Initial');

		divNode.setAttr('title', 'JS Updated');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JS Updated');
	});

	await t.step("(getDOM) - Reactive child content changes", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Initial');

		// Change text content
		textNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();
		assertEquals(divElem.textContent, 'Updated');
	});

	await t.step(".getDOM() - Reactive child content changes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await globalThis.reactive.wait();
		assertEquals(divElem.textContent, 'JS Updated');
	});

	await t.step("(getDOM) - DOM is stable across calls", async () => {
		const divNode = doc('createNode', ['h.div']);
		const dom1 = divNode('getDOM');
		const dom2 = divNode('getDOM');

		await globalThis.reactive.wait();
		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
		assertStrictEquals(dom1.at(0), dom2.at(0), 'Should return same DOM element');
	});

	await t.step(".getDOM() - DOM is stable across calls via JS", async () => {
		const divNode = doc.createNode('h.div');
		const dom1 = divNode.getDOM();
		const dom2 = divNode.getDOM();

		await globalThis.reactive.wait();
		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
		assertStrictEquals(dom1.at(0), dom2.at(0), 'Should return same DOM element');
	});
});

Deno.test("MWIDocNode - CSR-DOM Edge Cases", async (t) => {
	await t.step("(getDOM) - Element with only whitespace text children", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', '   ']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, '   ');
	});

	await t.step(".getDOM() - Element with only whitespace text children via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('   ');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, '   ');
	});

	await t.step("(getDOM) - Element with empty text nodes", async () => {
		const divNode = doc('createNode', ['h.div']);
		const text1 = doc('createNode', ['m.t']);
		text1('setAttr', ['t', '']);
		const text2 = doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Content']);
		const text3 = doc('createNode', ['m.t']);
		text3('setAttr', ['t', '']);
		divNode('append', [text1, text2, text3]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Content');
	});

	await t.step(".getDOM() - Element with empty text nodes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('', 'Content', '');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Content');
	});

	await t.step("(getDOM) - Deeply nested structure", async () => {
		const level1 = doc('createNode', ['h.div']);
		const level2 = doc('createNode', ['h.div']);
		const level3 = doc('createNode', ['h.div']);
		const level4 = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Deep']);
		level4('append', [textNode]);
		level3('append', [level4]);
		level2('append', [level3]);
		level1('append', [level2]);
		const domNodes = level1('getDOM');

		await globalThis.reactive.wait();
		const level1Elem = domNodes.at(0);
		assertEquals(level1Elem.textContent, 'Deep');
		assertEquals(level1Elem.querySelectorAll('div').length, 3);
	});

	await t.step(".getDOM() - Deeply nested structure via JS", async () => {
		const level1 = doc.createNode('h.div');
		const level2 = doc.createNode('h.div');
		const level3 = doc.createNode('h.div');
		level3.append('Deep content');
		level2.append(level3);
		level1.append(level2);
		const domNodes = level1.getDOM();

		await globalThis.reactive.wait();
		const level1Elem = domNodes.at(0);
		assertEquals(level1Elem.textContent, 'Deep content');
		assertEquals(level1Elem.querySelectorAll('div').length, 2);
	});
});

Deno.test("MWIDocNode - CSR-DOM Slotting Without Slot Source", async (t) => {
	await t.step("(getDOM) - m.slat with no slot source uses else default", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['m.slat', ps('[(title=[missing else=DefaultValue])]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'DefaultValue');
	});

	await t.step(".getDOM() - m.slat with no slot source uses else default via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[missing else="JS DefaultValue"])]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS DefaultValue');
	});

	await t.step("(getDOM) - Multiple m.slat targets with no slot source", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['m.slat', ps('[(title=[src1 else=Default1] data-info=[src2 else=Default2])]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default1');
		assertEquals(divElem.getAttribute('data-info'), 'Default2');
	});

	await t.step(".getDOM() - Multiple m.slat targets with no slot source via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[src1 else="JS Default1"] data-info=[src2 else="JS Default2"])]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Default1');
		assertEquals(divElem.getAttribute('data-info'), 'JS Default2');
	});
});

Deno.test("MWIDocNode - CSR-DOM m.coat Rendering", async (t) => {
	await t.step("(getDOM) - m.coat with slot source renders computed attribute", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		fragNode('setAttr', ['name', 'World']);

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.coat', ps('[(title=<name>)]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'World');
	});

	await t.step(".getDOM() - m.coat with slot source renders computed attribute via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS World');
	});

	await t.step("(getDOM) - m.coat with default fallback renders default", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		// name is not set

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.coat', ps('[(title=<name|Default>)]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default');
	});

	await t.step(".getDOM() - m.coat with default fallback renders default via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// name is not set

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name|Fallback>)]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Fallback');
	});
});

Deno.test("MWIDocNode - CSR-DOM m.coat Reactivity", async (t) => {
	await t.step("(getDOM) - DOM updates when slot source attribute changes", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		fragNode('setAttr', ['name', 'Initial']);

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.coat', ps('[(title=<name>)]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Initial');

		// Change the source attribute - DOM should reactively update
		fragNode('setAttr', ['name', 'Updated']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Updated');
	});

	await t.step(".getDOM() - DOM updates when slot source attribute changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Initial');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Initial');

		// Change the source attribute - DOM should reactively update
		fragNode.setAttr('name', 'JS Updated');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JS Updated');
	});

	await t.step("(getDOM) - DOM updates when m.coat spec changes", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		fragNode('setAttr', ['name', 'World']);
		fragNode('setAttr', ['greeting', 'Hello']);

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.coat', ps('[(title=<name>)]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'World');

		// Change the m.coat spec - DOM should reactively update
		divNode('setAttr', ['m.coat', ps('[(title=<greeting>)]')]);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Hello');
	});

	await t.step(".getDOM() - DOM updates when m.coat spec changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');
		fragNode.setAttr('greeting', 'JS Hello');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS World');

		// Change the m.coat spec - DOM should reactively update
		divNode.setAttr('m.coat', ps('[(title=<greeting>)]'));
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JS Hello');
	});

	await t.step("(getDOM) - DOM updates when conditional expression changes", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		// name is not set initially

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.coat', ps('[(title=<name|Default>)]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default');

		// Set the source attribute - DOM should update
		fragNode('setAttr', ['name', 'SetValue']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'SetValue');

		// Clear the source attribute - DOM should revert to default
		fragNode('delAttr', ['name']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Default');
	});

	await t.step(".getDOM() - DOM updates when conditional expression changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// name is not set initially

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name|Fallback>)]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Fallback');

		// Set the source attribute - DOM should update
		fragNode.setAttr('name', 'JSSetValue');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JSSetValue');

		// Clear the source attribute - DOM should revert to fallback
		fragNode.delAttr('name');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Fallback');
	});
});

Deno.test("MWIDocNode - CSR-DOM m.slat Reactivity", async (t) => {
	await t.step("(getDOM) - DOM updates when slot source attribute changes", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		fragNode('setAttr', ['title', 'Initial']);

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.slat', ps('[(title=[])]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Initial');

		// Change the source attribute - DOM should reactively update
		fragNode('setAttr', ['title', 'Updated']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Updated');
	});

	await t.step(".getDOM() - DOM updates when slot source attribute changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('title', 'JS Initial');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[])]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Initial');

		// Change the source attribute - DOM should reactively update
		fragNode.setAttr('title', 'JS Updated');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JS Updated');
	});

	await t.step("(getDOM) - DOM updates when m.slat spec changes", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		fragNode('setAttr', ['src1', 'Value1']);
		fragNode('setAttr', ['src2', 'Value2']);

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.slat', ps('[(title=[src1])]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Value1');

		// Change the m.slat spec - DOM should reactively update
		divNode('setAttr', ['m.slat', ps('[(title=[src2])]')]);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Value2');
	});

	await t.step(".getDOM() - DOM updates when m.slat spec changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('src1', 'JS Value1');
		fragNode.setAttr('src2', 'JS Value2');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[src1])]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Value1');

		// Change the m.slat spec - DOM should reactively update
		divNode.setAttr('m.slat', ps('[(title=[src2])]'));
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JS Value2');
	});

	await t.step("(getDOM) - DOM updates when else fallback changes", async () => {
		const fragNode = doc('createNode', ['m.frg']);
		// source attribute not set initially

		const divNode = doc('createNode', { 0: 'h.div', slotSrc: fragNode });
		divNode('setAttr', ['m.slat', ps('[(title=[missing else=Default])]')]);
		const domNodes = divNode('getDOM');

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default');

		// Set the source attribute - DOM should update
		fragNode('setAttr', ['missing', 'Found']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Found');

		// Clear the source attribute - DOM should revert to else default
		fragNode('delAttr', ['missing']);
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Default');
	});

	await t.step(".getDOM() - DOM updates when else fallback changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// source attribute not set initially

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[missing else=Fallback])]'));
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Fallback');

		// Set the source attribute - DOM should update
		fragNode.setAttr('missing', 'JSFound');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'JSFound');

		// Clear the source attribute - DOM should revert to else fallback
		fragNode.delAttr('missing');
		await globalThis.reactive.wait();
		assertEquals(divElem.title, 'Fallback');
	});
});
