import {
	assert,
	assertEquals,
	assertExists,
	assertStrictEquals,
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
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const domNodes = $c.sm(divNode, 'getDOM');

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
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['class', 'test-class']);
		const domNodes = $c.sm(divNode, 'getDOM');

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
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['class', 'container']);
		$c.sm(divNode, 'setAttr', ['id', 'main']);
		$c.sm(divNode, 'setAttr', ['data-test', 'value']);
		const domNodes = $c.sm(divNode, 'getDOM');

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
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Hello World']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		// The div should contain a text node from the text node
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.childNodes.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Hello World');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Div with text child via JS", () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Hello');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.childNodes.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'JS Hello');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Div with multiple children", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', 'First']);
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Second']);
		$c.sm(divNode, 'append', [text1, text2]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.childNodes.length, 2);
		assertEquals(divElem.childNodes[0].nodeValue, 'First');
		assertEquals(divElem.childNodes[1].nodeValue, 'Second');
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
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.childNodes.length, 2);
		assertEquals(divElem.childNodes[0].nodeValue, 'JS First');
		assertEquals(divElem.childNodes[1].nodeValue, 'JS Second');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Nested div elements", () => {
		const outerDiv = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(outerDiv, 'setAttr', ['class', 'outer']);
		const innerDiv = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(innerDiv, 'setAttr', ['class', 'inner']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Nested content']);
		$c.sm(innerDiv, 'append', [textNode]);
		$c.sm(outerDiv, 'append', [innerDiv]);
		const domNodes = $c.sm(outerDiv, 'getDOM');

		const outerElem = domNodes.at(0);
		assertEquals(outerElem.className, 'outer');
		assertEquals(outerElem.children.length, 1);
		const innerElem = outerElem.children[0];
		assertEquals(innerElem.tagName, 'DIV');
		assertEquals(innerElem.className, 'inner');
		assertEquals(innerElem.childNodes[0].nodeValue, 'Nested content');
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
		assertEquals(innerElem.childNodes[0].nodeValue, 'JS Nested');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM Void Elements", async (t) => {
	await t.step("(getDOM) - Void element (br)", () => {
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		const domNodes = $c.sm(brNode, 'getDOM');

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
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		$c.sm(brNode, 'setAttr', ['class', 'line-break']);
		const domNodes = $c.sm(brNode, 'getDOM');

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
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Ignored']);
		$c.sm(brNode, 'append', [textNode]);
		const domNodes = $c.sm(brNode, 'getDOM');

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
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['class', 'initial']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'initial');

		// Update attribute
		$c.sm(divNode, 'setAttr', ['class', 'updated']);
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
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.childNodes[0].nodeValue, 'Initial');

		// Update child text
		$c.sm(textNode, 'setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();

		// Same div, updated child content
		assertEquals(divElem.childNodes[0].nodeValue, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive child content update via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.childNodes[0].nodeValue, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await globalThis.reactive.wait();

		assertEquals(divElem.childNodes[0].nodeValue, 'JS Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive child empty to non-empty", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		// Initially empty - no children
		assertEquals(divElem.childNodes.length, 0);

		// Update to non-empty
		$c.sm(textNode, 'setAttr', ['t', 'Now has text']);
		await globalThis.reactive.wait();

		// Should now have one text node child
		assertEquals(divElem.childNodes.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Now has text');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive child empty to non-empty via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', '');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.childNodes.length, 0);

		textNode.setAttr('t', 'Now has text');
		await globalThis.reactive.wait();

		assertEquals(divElem.childNodes.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Now has text');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM Various Element Types", async (t) => {
	await t.step("(getDOM) - Paragraph element", () => {
		const pNode = $c.sm(doc, 'createNode', ['h.p']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Paragraph text']);
		$c.sm(pNode, 'append', [textNode]);
		const domNodes = $c.sm(pNode, 'getDOM');

		const pElem = domNodes.at(0);
		assertEquals(pElem.tagName, 'P');
		assertEquals(pElem.childNodes[0].nodeValue, 'Paragraph text');
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
		assertEquals(pElem.childNodes[0].nodeValue, 'JS Paragraph');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Span element", () => {
		const spanNode = $c.sm(doc, 'createNode', ['h.span']);
		$c.sm(spanNode, 'setAttr', ['class', 'highlight']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Highlighted']);
		$c.sm(spanNode, 'append', [textNode]);
		const domNodes = $c.sm(spanNode, 'getDOM');

		const spanElem = domNodes.at(0);
		assertEquals(spanElem.tagName, 'SPAN');
		assertEquals(spanElem.className, 'highlight');
		assertEquals(spanElem.childNodes[0].nodeValue, 'Highlighted');
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
		assertEquals(spanElem.childNodes[0].nodeValue, 'JS Highlighted');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWIHTML (h.*) - CSR-DOM HTMLElement[MWINode] back-reference", async (t) => {
	const NODE_SYM = Symbol.for('MWINode');

	await t.step("(getDOM) - DOM element has MWINode back-reference", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const domNodes = $c.sm(divNode, 'getDOM');

		assertStrictEquals(domNodes.at(0)[NODE_SYM], divNode);
	});

	await t.step(".getDOM() - DOM element has MWINode back-reference via JS", () => {
		const divNode = doc.createNode('h.div');
		const domNodes = divNode.getDOM();

		assertStrictEquals(domNodes.at(0)[NODE_SYM], divNode);
	});

	await t.step("(getDOM) - Each element has its own MWINode back-reference", () => {
		const outerDiv = $c.sm(doc, 'createNode', ['h.div']);
		const innerSpan = $c.sm(doc, 'createNode', ['h.span']);
		$c.sm(outerDiv, 'append', [innerSpan]);
		const domNodes = $c.sm(outerDiv, 'getDOM');

		const outerElem = domNodes.at(0);
		assertStrictEquals(outerElem[NODE_SYM], outerDiv);
		assertStrictEquals(outerElem.children[0][NODE_SYM], innerSpan);
	});

	await t.step(".getDOM() - Each element has its own MWINode back-reference via JS", () => {
		const outerDiv = doc.createNode('h.div');
		const innerSpan = doc.createNode('h.span');
		outerDiv.append(innerSpan);
		const domNodes = outerDiv.getDOM();

		const outerElem = domNodes.at(0);
		assertStrictEquals(outerElem[NODE_SYM], outerDiv);
		assertStrictEquals(outerElem.children[0][NODE_SYM], innerSpan);
	});

	await t.step("(getDOM) - MWINode back-reference stable across reactive updates", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['title', 'Initial']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		$c.sm(divNode, 'setAttr', ['title', 'Updated']);
		await globalThis.reactive.wait();

		assertStrictEquals(divElem[NODE_SYM], divNode);
	});

	await t.step(".getDOM() - MWINode back-reference stable across reactive updates via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', 'JS Initial');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		divNode.setAttr('title', 'JS Updated');
		await globalThis.reactive.wait();

		assertStrictEquals(divElem[NODE_SYM], divNode);
	});

	await t.step("(getDOM) - Void element also has MWINode back-reference", () => {
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		const domNodes = $c.sm(brNode, 'getDOM');

		assertStrictEquals(domNodes.at(0)[NODE_SYM], brNode);
	});

	await t.step(".getDOM() - Void element also has MWINode back-reference via JS", () => {
		const brNode = doc.createNode('h.br');
		const domNodes = brNode.getDOM();

		assertStrictEquals(domNodes.at(0)[NODE_SYM], brNode);
	});
});
