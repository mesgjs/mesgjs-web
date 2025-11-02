import {
	assert,
	assertEquals,
	assertExists,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;

Deno.test("MWIHTML (h.*) - CSR-DOM Basic Element Rendering", async (t) => {
	await t.step("(getDOM) - Simple div element", () => {
		const divNode = doc('createNode', ['h.div']);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertExists(divElem);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Simple div element via JS", () => {
		const divNode = doc.createNode('h.div');
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Div with class attribute", () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['class', 'test-class']);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'test-class');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Div with class attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-test-class');
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'js-test-class');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Div with multiple attributes", () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['class', 'container']);
		divNode('setAttr', ['id', 'main']);
		divNode('setAttr', ['data-test', 'value']);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'container');
		assertEquals(divElem.id, 'main');
		assertEquals(divElem.getAttribute('data-test'), 'value');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Div with multiple attributes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'wrapper');
		divNode.setAttr('id', 'content');
		divNode.setAttr('aria-label', 'Main content');
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'wrapper');
		assertEquals(divElem.id, 'content');
		assertEquals(divElem.getAttribute('aria-label'), 'Main content');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM Element with Children", async (t) => {
	await t.step("(getDOM) - Div with text child", () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Hello World']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		// The div should contain an <output> element from the text node
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.children[0].tagName, 'OUTPUT');
		assertEquals(divElem.children[0].textContent, 'Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Div with text child via JS", () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Hello');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.children[0].textContent, 'JS Hello');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Div with multiple children", () => {
		const divNode = doc('createNode', ['h.div']);
		const text1 = doc('createNode', ['m.t']);
		text1('setAttr', ['t', 'First']);
		const text2 = doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Second']);
		divNode('append', [text1, text2]);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.children.length, 2);
		assertEquals(divElem.children[0].textContent, 'First');
		assertEquals(divElem.children[1].textContent, 'Second');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Div with multiple children via JS", () => {
		const divNode = doc.createNode('h.div');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		divNode.append(text1, text2);
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.children.length, 2);
		assertEquals(divElem.children[0].textContent, 'JS First');
		assertEquals(divElem.children[1].textContent, 'JS Second');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Nested div elements", () => {
		const outerDiv = doc('createNode', ['h.div']);
		outerDiv('setAttr', ['class', 'outer']);
		const innerDiv = doc('createNode', ['h.div']);
		innerDiv('setAttr', ['class', 'inner']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Nested content']);
		innerDiv('append', [textNode]);
		outerDiv('append', [innerDiv]);
		const domNodes = outerDiv('getDOM');
		
		const outerElem = domNodes.at(0);
		assertEquals(outerElem.className, 'outer');
		assertEquals(outerElem.children.length, 1);
		const innerElem = outerElem.children[0];
		assertEquals(innerElem.tagName, 'DIV');
		assertEquals(innerElem.className, 'inner');
		assertEquals(innerElem.children[0].textContent, 'Nested content');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Nested div elements via JS", () => {
		const outerDiv = doc.createNode('h.div');
		outerDiv.setAttr('class', 'js-outer');
		const innerDiv = doc.createNode('h.div');
		innerDiv.setAttr('class', 'js-inner');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Nested');
		innerDiv.append(textNode);
		outerDiv.append(innerDiv);
		const domNodes = outerDiv.getDOM();
		
		const outerElem = domNodes.at(0);
		assertEquals(outerElem.className, 'js-outer');
		const innerElem = outerElem.children[0];
		assertEquals(innerElem.className, 'js-inner');
		assertEquals(innerElem.children[0].textContent, 'JS Nested');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM Void Elements", async (t) => {
	await t.step("(getDOM) - Void element (br)", () => {
		const brNode = doc('createNode', ['h.br']);
		const domNodes = brNode('getDOM');
		
		const brElem = domNodes.at(0);
		assertEquals(brElem.tagName, 'BR');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Void element (br) via JS", () => {
		const brNode = doc.createNode('h.br');
		const domNodes = brNode.getDOM();
		
		const brElem = domNodes.at(0);
		assertEquals(brElem.tagName, 'BR');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Void element with attributes", () => {
		const brNode = doc('createNode', ['h.br']);
		brNode('setAttr', ['class', 'line-break']);
		const domNodes = brNode('getDOM');
		
		const brElem = domNodes.at(0);
		assertEquals(brElem.className, 'line-break');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Void element with attributes via JS", () => {
		const brNode = doc.createNode('h.br');
		brNode.setAttr('class', 'js-break');
		const domNodes = brNode.getDOM();
		
		const brElem = domNodes.at(0);
		assertEquals(brElem.className, 'js-break');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Void element ignores children", () => {
		const brNode = doc('createNode', ['h.br']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Ignored']);
		brNode('append', [textNode]);
		const domNodes = brNode('getDOM');
		
		const brElem = domNodes.at(0);
		// Void elements should not have children
		assertEquals(brElem.childNodes.length, 0);
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Void element ignores children via JS", () => {
		const brNode = doc.createNode('h.br');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Ignored');
		brNode.append(textNode);
		const domNodes = brNode.getDOM();
		
		const brElem = domNodes.at(0);
		assertEquals(brElem.childNodes.length, 0);
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM Reactive Updates", async (t) => {
	await t.step("(getDOM) - Reactive attribute update", async () => {
		const divNode = doc('createNode', ['h.div']);
		divNode('setAttr', ['class', 'initial']);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'initial');
		
		// Update attribute
		divNode('setAttr', ['class', 'updated']);
		await globalThis.reactive.wait();
		
		// Same element, updated attribute
		assertEquals(divElem.className, 'updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive attribute update via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-initial');
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'js-initial');
		
		divNode.setAttr('class', 'js-updated');
		await globalThis.reactive.wait();
		
		assertEquals(divElem.className, 'js-updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive child content update", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.children[0].textContent, 'Initial');
		
		// Update child text
		textNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();
		
		// Same div, updated child content
		assertEquals(divElem.children[0].textContent, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive child content update via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		assertEquals(divElem.children[0].textContent, 'JS Initial');
		
		textNode.setAttr('t', 'JS Updated');
		await globalThis.reactive.wait();
		
		assertEquals(divElem.children[0].textContent, 'JS Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive child empty to non-empty", async () => {
		const divNode = doc('createNode', ['h.div']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', '']);
		divNode('append', [textNode]);
		const domNodes = divNode('getDOM');
		
		const divElem = domNodes.at(0);
		// Initially empty - no children
		await globalThis.reactive.wait();
		assertEquals(divElem.children.length, 0);
		
		// Update to non-empty
		textNode('setAttr', ['t', 'Now has text']);
		await globalThis.reactive.wait();
		
		// Should now have one child
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.children[0].textContent, 'Now has text');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive child empty to non-empty via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();
		
		const divElem = domNodes.at(0);
		await globalThis.reactive.wait();
		assertEquals(divElem.children.length, 0);
		
		textNode.setAttr('t', 'Now has text');
		await globalThis.reactive.wait();
		
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.children[0].textContent, 'Now has text');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM Various Element Types", async (t) => {
	await t.step("(getDOM) - Paragraph element", () => {
		const pNode = doc('createNode', ['h.p']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Paragraph text']);
		pNode('append', [textNode]);
		const domNodes = pNode('getDOM');
		
		const pElem = domNodes.at(0);
		assertEquals(pElem.tagName, 'P');
		assertEquals(pElem.children[0].textContent, 'Paragraph text');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Paragraph element via JS", () => {
		const pNode = doc.createNode('h.p');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Paragraph');
		pNode.append(textNode);
		const domNodes = pNode.getDOM();
		
		const pElem = domNodes.at(0);
		assertEquals(pElem.tagName, 'P');
		assertEquals(pElem.children[0].textContent, 'JS Paragraph');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Span element", () => {
		const spanNode = doc('createNode', ['h.span']);
		spanNode('setAttr', ['class', 'highlight']);
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Highlighted']);
		spanNode('append', [textNode]);
		const domNodes = spanNode('getDOM');
		
		const spanElem = domNodes.at(0);
		assertEquals(spanElem.tagName, 'SPAN');
		assertEquals(spanElem.className, 'highlight');
		assertEquals(spanElem.children[0].textContent, 'Highlighted');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Span element via JS", () => {
		const spanNode = doc.createNode('h.span');
		spanNode.setAttr('class', 'js-highlight');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Highlighted');
		spanNode.append(textNode);
		const domNodes = spanNode.getDOM();
		
		const spanElem = domNodes.at(0);
		assertEquals(spanElem.tagName, 'SPAN');
		assertEquals(spanElem.className, 'js-highlight');
		assertEquals(spanElem.children[0].textContent, 'JS Highlighted');
		assertEquals(domNodes.size, 1);
	});
});
