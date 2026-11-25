import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';
const MWI_DOC_RDY_FT = 'MWIDocument';

await setupRuntime();

const { fwait, getInstance, getInterface } = globalThis.$c;
const { ls, ps, reactive } = globalThis;

// Wait for registry and MWIDocument to be ready
await fwait(REG_READY_FT, MWI_DOC_RDY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const MWIDocument = getInterface('MWIDocument').proto;

describe("MWIDocNode - CSR-DOM Basic Rendering", () => {
	it("(getDOM) - Empty element (no attributes, no children)", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const domNodes = $c.sm(divNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.attributes.length, 0);
	});

	it(".getDOM() - Empty element via JS", () => {
		const divNode = doc.createNode('h.div');
		const domNodes = divNode.getDOM();

		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.children.length, 0);
	});

	it("(getDOM) - Element with attributes only", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['id', 'test-id']);
		$c.sm(divNode, 'setAttr', ['class', 'test-class']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'test-id');
		assertEquals(divElem.className, 'test-class');
	});

	it(".getDOM() - Element with attributes only via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-test-id');
		divNode.setAttr('title', 'Test Title');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'js-test-id');
		assertEquals(divElem.title, 'Test Title');
	});

	it("(getDOM) - Element with children only", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Child text']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Child text');
	});

	it(".getDOM() - Element with children only via JS", () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child text');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'JS Child text');
	});

	it("(getDOM) - Element with both attributes and children", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['id', 'container']);
		$c.sm(divNode, 'setAttr', ['class', 'wrapper']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Content']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'container');
		assertEquals(divElem.className, 'wrapper');
		assertEquals(divElem.textContent, 'Content');
	});

	it(".getDOM() - Element with both attributes and children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-container');
		divNode.setAttr('data-test', 'value');
		divNode.append('JS Content');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'js-container');
		assertEquals(divElem.getAttribute('data-test'), 'value');
		assertEquals(divElem.textContent, 'JS Content');
	});

	it("(getDOM) - Void element (h.br)", () => {
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		const domNodes = $c.sm(brNode, 'getDOM');

		assertEquals(domNodes.size, 1);
		const brElem = domNodes.at(0);
		assertEquals(brElem.tagName, 'BR');
		assertEquals(brElem.childNodes.length, 0);
	});

	it(".getDOM() - Void element (h.br) via JS", () => {
		const brNode = doc.createNode('h.br');
		const domNodes = brNode.getDOM();

		assertEquals(domNodes.size, 1);
		const brElem = domNodes.at(0);
		assertEquals(brElem.tagName, 'BR');
		assertEquals(brElem.childNodes.length, 0);
	});
});

describe("MWIDocNode - CSR-DOM Attribute Rendering", () => {
	it("(getDOM) - Standard HTML attributes", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['id', 'my-id']);
		$c.sm(divNode, 'setAttr', ['class', 'my-class']);
		$c.sm(divNode, 'setAttr', ['title', 'My Title']);
		$c.sm(divNode, 'setAttr', ['data-value', 'test']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'my-id');
		assertEquals(divElem.className, 'my-class');
		assertEquals(divElem.title, 'My Title');
		assertEquals(divElem.getAttribute('data-value'), 'test');
	});

	it(".getDOM() - Standard HTML attributes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-id');
		divNode.setAttr('aria-label', 'Label');
		divNode.setAttr('data-test', 'value');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'js-id');
		assertEquals(divElem.getAttribute('aria-label'), 'Label');
		assertEquals(divElem.getAttribute('data-test'), 'value');
	});

	it("(getDOM) - Boolean attributes", () => {
		const inputNode = $c.sm(doc, 'createNode', ['h.input']);
		$c.sm(inputNode, 'setAttr', ['disabled', true]);
		$c.sm(inputNode, 'setAttr', ['readonly', true]);
		const domNodes = $c.sm(inputNode, 'getDOM');

		const inputElem = domNodes.at(0);
		assertEquals(inputElem.hasAttribute('disabled'), true);
		assertEquals(inputElem.hasAttribute('readonly'), true);
	});

	it(".getDOM() - Boolean attributes via JS", () => {
		const inputNode = doc.createNode('h.input');
		inputNode.setAttr('disabled', true);
		inputNode.setAttr('checked', true);
		const domNodes = inputNode.getDOM();

		const inputElem = domNodes.at(0);
		assertEquals(inputElem.hasAttribute('disabled'), true);
		assertEquals(inputElem.hasAttribute('checked'), true);
	});

	it("(getDOM) - Non-HTML attributes do not render (m.id)", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['id', 'real-id']);
		// Access m.id to ensure it's set
		$c.sm(divNode, 'getAttr', ['m.id']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'real-id');
		assertEquals(divElem.hasAttribute('m.id'), false);
	});

	it(".getDOM() - Non-HTML attributes do not render (m.percl)", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm-class');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('m.percl'), false);
		// But the permanent class should appear in the class attribute
		assert(divElem.className.includes('perm-class'));
	});

	it("(getDOM) - List-valued attributes do not render", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const listVal = ps('[(item1 item2 item3)]');
		$c.sm(divNode, 'setAttr', ['c.items', listVal]);
		$c.sm(divNode, 'setAttr', ['id', 'test-id']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('c.items'), false);
		assertEquals(divElem.id, 'test-id');
	});

	it(".getDOM() - List-valued attributes do not render via JS", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(alpha beta gamma)]');
		divNode.setAttr('c.data', listVal);
		divNode.setAttr('title', 'Test');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('c.data'), false);
		assertEquals(divElem.title, 'Test');
	});
});

describe("MWIDocNode - CSR-DOM Child Content Rendering", () => {
	it("(getDOM) - Single text child", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Single child']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Single child');
	});

	it(".getDOM() - Single text child via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('JS single child');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'JS single child');
	});

	it("(getDOM) - Multiple text children", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', 'First']);
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Second']);
		const text3 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text3, 'setAttr', ['t', 'Third']);
		$c.sm(divNode, 'append', [text1, text2, text3]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'FirstSecondThird');
	});

	it(".getDOM() - Multiple text children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('First', 'Second', 'Third');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'FirstSecondThird');
	});

	it("(getDOM) - Mixed content (text and element children)", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Text']);
		const spanNode = $c.sm(doc, 'createNode', ['h.span']);
		$c.sm(spanNode, 'append', ['Span']);
		$c.sm(divNode, 'append', [textNode, spanNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'TextSpan');
		// Text renders as text node, so we have 1 element child (<span>) and 1 text node child
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Text');
		assertEquals(divElem.children[0].tagName, 'SPAN');
		assertEquals(divElem.children[0].textContent, 'Span');
	});

	it(".getDOM() - Mixed content via JS", () => {
		const divNode = doc.createNode('h.div');
		const spanNode = doc.createNode('h.span');
		spanNode.append('Span content');
		divNode.append('Before', spanNode, 'After');
		const domNodes = divNode.getDOM();

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

	it("(getDOM) - Nested elements", () => {
		const outerDiv = $c.sm(doc, 'createNode', ['h.div']);
		const innerDiv = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Nested']);
		$c.sm(innerDiv, 'append', [textNode]);
		$c.sm(outerDiv, 'append', [innerDiv]);
		const domNodes = $c.sm(outerDiv, 'getDOM');

		const outerElem = domNodes.at(0);
		assertEquals(outerElem.textContent, 'Nested');
		assertEquals(outerElem.children.length, 1);
		assertEquals(outerElem.children[0].tagName, 'DIV');
	});

	it(".getDOM() - Nested elements via JS", () => {
		const outerDiv = doc.createNode('h.div');
		const innerDiv = doc.createNode('h.div');
		innerDiv.append('Inner content');
		outerDiv.append(innerDiv);
		const domNodes = outerDiv.getDOM();

		const outerElem = domNodes.at(0);
		assertEquals(outerElem.textContent, 'Inner content');
		assertEquals(outerElem.children.length, 1);
	});

	it("(getDOM) - Void element has no children in output", () => {
		const brNode = $c.sm(doc, 'createNode', ['h.br']);
		// Try to append (should be ignored)
		$c.sm(brNode, 'append', ['text']);
		const domNodes = $c.sm(brNode, 'getDOM');

		const brElem = domNodes.at(0);
		assertEquals(brElem.childNodes.length, 0);
	});

	it(".getDOM() - Void element has no children in output via JS", () => {
		const brNode = doc.createNode('h.br');
		brNode.append('ignored text');
		const domNodes = brNode.getDOM();

		const brElem = domNodes.at(0);
		assertEquals(brElem.childNodes.length, 0);
	});
});

describe("MWIDocNode - CSR-DOM Reactive Updates", () => {
	it("(getDOM) - Reactive attribute changes", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['title', 'Initial']);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Initial');

		// Change attribute
		$c.sm(divNode, 'setAttr', ['title', 'Updated']);
		await reactive.wait();
		assertEquals(divElem.title, 'Updated');
		assertStrictEquals(domNodes.at(0), divElem, 'Should be same element');
	});

	it(".getDOM() - Reactive attribute changes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', 'JS Initial');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Initial');

		divNode.setAttr('title', 'JS Updated');
		await reactive.wait();
		assertEquals(divElem.title, 'JS Updated');
	});

	it("(getDOM) - Reactive child content changes", async () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Initial');

		// Change text content
		$c.sm(textNode, 'setAttr', ['t', 'Updated']);
		await reactive.wait();
		assertEquals(divElem.textContent, 'Updated');
	});

	it(".getDOM() - Reactive child content changes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		divNode.append(textNode);
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await reactive.wait();
		assertEquals(divElem.textContent, 'JS Updated');
	});

	it("(getDOM) - DOM is stable across calls", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const dom1 = $c.sm(divNode, 'getDOM');
		const dom2 = $c.sm(divNode, 'getDOM');

		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
		assertStrictEquals(dom1.at(0), dom2.at(0), 'Should return same DOM element');
	});

	it(".getDOM() - DOM is stable across calls via JS", () => {
		const divNode = doc.createNode('h.div');
		const dom1 = divNode.getDOM();
		const dom2 = divNode.getDOM();

		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
		assertStrictEquals(dom1.at(0), dom2.at(0), 'Should return same DOM element');
	});
});

describe("MWIDocNode - CSR-DOM Edge Cases", () => {
	it("(getDOM) - Element with only whitespace text children", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', '   ']);
		$c.sm(divNode, 'append', [textNode]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, '   ');
	});

	it(".getDOM() - Element with only whitespace text children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('   ');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, '   ');
	});

	it("(getDOM) - Element with empty text nodes", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', '']);
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Content']);
		const text3 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text3, 'setAttr', ['t', '']);
		$c.sm(divNode, 'append', [text1, text2, text3]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Content');
	});

	it(".getDOM() - Element with empty text nodes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('', 'Content', '');
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Content');
	});

	it("(getDOM) - Deeply nested structure", () => {
		const level1 = $c.sm(doc, 'createNode', ['h.div']);
		const level2 = $c.sm(doc, 'createNode', ['h.div']);
		const level3 = $c.sm(doc, 'createNode', ['h.div']);
		const level4 = $c.sm(doc, 'createNode', ['h.div']);
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Deep']);
		$c.sm(level4, 'append', [textNode]);
		$c.sm(level3, 'append', [level4]);
		$c.sm(level2, 'append', [level3]);
		$c.sm(level1, 'append', [level2]);
		const domNodes = $c.sm(level1, 'getDOM');

		const level1Elem = domNodes.at(0);
		assertEquals(level1Elem.textContent, 'Deep');
		assertEquals(level1Elem.querySelectorAll('div').length, 3);
	});

	it(".getDOM() - Deeply nested structure via JS", () => {
		const level1 = doc.createNode('h.div');
		const level2 = doc.createNode('h.div');
		const level3 = doc.createNode('h.div');
		level3.append('Deep content');
		level2.append(level3);
		level1.append(level2);
		const domNodes = level1.getDOM();

		const level1Elem = domNodes.at(0);
		assertEquals(level1Elem.textContent, 'Deep content');
		assertEquals(level1Elem.querySelectorAll('div').length, 2);
	});
});

describe("MWIDocNode - CSR-DOM Slotting Without Slot Source", () => {
	it("(getDOM) - m.slat with no slot source uses else default", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.slat', ps('[(title=[missing else=DefaultValue])]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'DefaultValue');
	});

	it(".getDOM() - m.slat with no slot source uses else default via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[missing else="JS DefaultValue"])]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS DefaultValue');
	});

	it("(getDOM) - Multiple m.slat targets with no slot source", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.slat', ps('[(title=[src1 else=Default1] data-info=[src2 else=Default2])]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default1');
		assertEquals(divElem.getAttribute('data-info'), 'Default2');
	});

	it(".getDOM() - Multiple m.slat targets with no slot source via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[src1 else="JS Default1"] data-info=[src2 else="JS Default2"])]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Default1');
		assertEquals(divElem.getAttribute('data-info'), 'JS Default2');
	});
});

describe("MWIDocNode - CSR-DOM m.coat Rendering", () => {
	it("(getDOM) - m.coat with slot source renders computed attribute", () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		$c.sm(fragNode, 'setAttr', ['name', 'World']);

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(title=<name>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'World');
	});

	it(".getDOM() - m.coat with slot source renders computed attribute via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS World');
	});

	it("(getDOM) - m.coat with default fallback renders default", () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		// name is not set

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(title=<name|Default>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default');
	});

	it(".getDOM() - m.coat with default fallback renders default via JS", () => {
		const fragNode = doc.createNode('m.frg');
		// name is not set

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name|Fallback>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Fallback');
	});
});

describe("MWIDocNode - CSR-DOM m.coat Reactivity", () => {
	it("(getDOM) - DOM updates when slot source attribute changes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		$c.sm(fragNode, 'setAttr', ['name', 'Initial']);

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(title=<name>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Initial');

		// Change the source attribute - DOM should reactively update
		$c.sm(fragNode, 'setAttr', ['name', 'Updated']);
		await reactive.wait();
		assertEquals(divElem.title, 'Updated');
	});

	it(".getDOM() - DOM updates when slot source attribute changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Initial');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Initial');

		// Change the source attribute - DOM should reactively update
		fragNode.setAttr('name', 'JS Updated');
		await reactive.wait();
		assertEquals(divElem.title, 'JS Updated');
	});

	it("(getDOM) - DOM updates when m.coat spec changes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		$c.sm(fragNode, 'setAttr', ['name', 'World']);
		$c.sm(fragNode, 'setAttr', ['greeting', 'Hello']);

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(title=<name>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'World');

		// Change the m.coat spec - DOM should reactively update
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(title=<greeting>)]')]);
		await reactive.wait();
		assertEquals(divElem.title, 'Hello');
	});

	it(".getDOM() - DOM updates when m.coat spec changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');
		fragNode.setAttr('greeting', 'JS Hello');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS World');

		// Change the m.coat spec - DOM should reactively update
		divNode.setAttr('m.coat', ps('[(title=<greeting>)]'));
		await reactive.wait();
		assertEquals(divElem.title, 'JS Hello');
	});

	it("(getDOM) - DOM updates when conditional expression changes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		// name is not set initially

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(title=<name|Default>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default');

		// Set the source attribute - DOM should update
		$c.sm(fragNode, 'setAttr', ['name', 'SetValue']);
		await reactive.wait();
		assertEquals(divElem.title, 'SetValue');

		// Clear the source attribute - DOM should revert to default
		$c.sm(fragNode, 'delAttr', ['name']);
		await reactive.wait();
		assertEquals(divElem.title, 'Default');
	});

	it(".getDOM() - DOM updates when conditional expression changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// name is not set initially

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name|Fallback>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Fallback');

		// Set the source attribute - DOM should update
		fragNode.setAttr('name', 'JSSetValue');
		await reactive.wait();
		assertEquals(divElem.title, 'JSSetValue');

		// Clear the source attribute - DOM should revert to fallback
		fragNode.delAttr('name');
		await reactive.wait();
		assertEquals(divElem.title, 'Fallback');
	});
});

describe("MWIDocNode - CSR-DOM m.slat Reactivity", () => {
	it("(getDOM) - DOM updates when slot source attribute changes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		$c.sm(fragNode, 'setAttr', ['title', 'Initial']);

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.slat', ps('[(title=[])]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Initial');

		// Change the source attribute - DOM should reactively update
		$c.sm(fragNode, 'setAttr', ['title', 'Updated']);
		await reactive.wait();
		assertEquals(divElem.title, 'Updated');
	});

	it(".getDOM() - DOM updates when slot source attribute changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('title', 'JS Initial');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[])]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Initial');

		// Change the source attribute - DOM should reactively update
		fragNode.setAttr('title', 'JS Updated');
		await reactive.wait();
		assertEquals(divElem.title, 'JS Updated');
	});

	it("(getDOM) - DOM updates when m.slat spec changes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		$c.sm(fragNode, 'setAttr', ['src1', 'Value1']);
		$c.sm(fragNode, 'setAttr', ['src2', 'Value2']);

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.slat', ps('[(title=[src1])]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Value1');

		// Change the m.slat spec - DOM should reactively update
		$c.sm(divNode, 'setAttr', ['m.slat', ps('[(title=[src2])]')]);
		await reactive.wait();
		assertEquals(divElem.title, 'Value2');
	});

	it(".getDOM() - DOM updates when m.slat spec changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('src1', 'JS Value1');
		fragNode.setAttr('src2', 'JS Value2');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[src1])]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'JS Value1');

		// Change the m.slat spec - DOM should reactively update
		divNode.setAttr('m.slat', ps('[(title=[src2])]'));
		await reactive.wait();
		assertEquals(divElem.title, 'JS Value2');
	});

	it("(getDOM) - DOM updates when else fallback changes", async () => {
		const fragNode = $c.sm(doc, 'createNode', ['m.frg']);
		// source attribute not set initially

		const divNode = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ['m.slat', ps('[(title=[missing else=Default])]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Default');

		// Set the source attribute - DOM should update
		$c.sm(fragNode, 'setAttr', ['missing', 'Found']);
		await reactive.wait();
		assertEquals(divElem.title, 'Found');

		// Clear the source attribute - DOM should revert to else default
		$c.sm(fragNode, 'delAttr', ['missing']);
		await reactive.wait();
		assertEquals(divElem.title, 'Default');
	});

	it(".getDOM() - DOM updates when else fallback changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// source attribute not set initially

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[missing else=Fallback])]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.title, 'Fallback');

		// Set the source attribute - DOM should update
		fragNode.setAttr('missing', 'JSFound');
		await reactive.wait();
		assertEquals(divElem.title, 'JSFound');

		// Clear the source attribute - DOM should revert to else fallback
		fragNode.delAttr('missing');
		await reactive.wait();
		assertEquals(divElem.title, 'Fallback');
	});
});

describe("MWIDocNode - CSR-DOM m.coat Special Return Values (.f, .t, .u)", () => {
	it("(getDOM) - m.coat=[out=<.t>] stores true, renders as boolean attribute", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(out=<.t>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		// true attribute value stores as boolean true on the node
		assertEquals(divNode.getAttr('out'), true, 'Attribute should store true');
		// In DOM, boolean attributes are present (value is empty string or attribute name)
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('out'), true, 'Boolean true renders as attribute in DOM');
	});

	it(".getDOM() - m.coat=[out=<.t>] stores true, renders as boolean attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(out=<.t>)]'));
		const domNodes = divNode.getDOM();

		assertEquals(divNode.getAttr('out'), true, 'Attribute should store true');
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('out'), true, 'Boolean true renders as attribute in DOM');
	});

	it("(getDOM) - m.coat=[out=<.f>] stores false, not rendered in DOM", () => {
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(out=<.f>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		assertEquals(divNode.getAttr('out'), false, 'Attribute should store false');
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('out'), false, 'false does not render as DOM attribute');
	});

	it(".getDOM() - m.coat=[out=<.u>] stores undefined, not rendered in DOM via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(out=<.u>)]'));
		const domNodes = divNode.getDOM();

		assertEquals(divNode.getAttr('out'), undefined, 'Attribute should store undefined');
		const divElem = domNodes.at(0);
		assertEquals(divElem.hasAttribute('out'), false, 'undefined does not render as DOM attribute');
	});

	it("(getDOM) - m.coat=[disabled=<controller?<.t>|<.f>>] - derive boolean from slot source", async () => {
		const srcOn = $c.sm(doc, 'createNode', ['m.frg']);
		$c.sm(srcOn, 'setAttr', ['controller', 'on']);

		const nodeOn = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: srcOn });
		$c.sm(nodeOn, 'setAttr', ['m.coat', ps('[(disabled=<controller?<.t>|<.f>>)]')]);
		const domOn = $c.sm(nodeOn, 'getDOM');

		assertEquals(nodeOn.getAttr('disabled'), true, 'disabled should be true when controller is set');
		assertEquals(domOn.at(0).hasAttribute('disabled'), true, 'disabled boolean attribute present in DOM');

		const srcOff = $c.sm(doc, 'createNode', ['m.frg']);
		// controller not set

		const nodeOff = $c.sm(doc, 'createNode', { 0: 'h.div', slotSrc: srcOff });
		$c.sm(nodeOff, 'setAttr', ['m.coat', ps('[(disabled=<controller?<.t>|<.f>>)]')]);
		const domOff = $c.sm(nodeOff, 'getDOM');

		await reactive.wait();
		assertEquals(nodeOff.getAttr('disabled'), false, 'disabled should be false when controller is not set');
		assertEquals(domOff.at(0).hasAttribute('disabled'), false, 'disabled attribute absent in DOM');
	});
});

describe("MWIDocNode - CSR-DOM m.coat MWIData Reactivity (<d:name>)", () => {
	let mwiData;

	it("(getDOM) - m.coat=[out=<d:key>] renders from MWIData store", () => {
		mwiData = MWIDocument.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);
		mwiData.set('theme', 'dark');
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(data-theme=<d:theme>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('data-theme'), 'dark');
	});

	it(".getDOM() - m.coat=[out=<d:key>] renders from MWIData store via JS", () => {
		mwiData.set('locale', 'en-US');
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(lang=<d:locale>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('lang'), 'en-US');
	});

	it("(getDOM) - DOM updates reactively when MWIData entry changes", async () => {
		mwiData.set('color', 'red');
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(data-color=<d:color>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('data-color'), 'red');

		// Change MWIData entry - DOM should reactively update
		mwiData.set('color', 'blue');
		await reactive.wait();
		assertEquals(divElem.getAttribute('data-color'), 'blue', 'DOM should update when MWIData changes');
		assertStrictEquals(domNodes.at(0), divElem, 'Should be same element');
	});

	it(".getDOM() - DOM updates reactively when MWIData entry changes via JS", async () => {
		mwiData.set('size', 'small');
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(data-size=<d:size>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('data-size'), 'small');

		// Change MWIData entry - DOM should reactively update
		mwiData.set('size', 'large');
		await reactive.wait();
		assertEquals(divElem.getAttribute('data-size'), 'large', 'DOM should update when MWIData changes');
	});

	it("(getDOM) - MWIData key added reactively updates DOM from missing to value", async () => {
		// 'new-key' not yet in mwiData
		const divNode = $c.sm(doc, 'createNode', ['h.div']);
		$c.sm(divNode, 'setAttr', ['m.coat', ps('[(data-val=<d:new-key||absent>)]')]);
		const domNodes = $c.sm(divNode, 'getDOM');

		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('data-val'), 'absent', 'Should use fallback when key missing');

		// Add the key to MWIData
		mwiData.set('new-key', 'present');
		await reactive.wait();
		assertEquals(divElem.getAttribute('data-val'), 'present', 'DOM should update when key is added to MWIData');
	});

	it(".getDOM() - multiple <d:...> references in one m.coat, all reactive via JS", async () => {
		mwiData.set('dir', 'ltr');
		mwiData.set('lang2', 'fr');
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(dir=<d:dir> lang=<d:lang2>)]'));
		const domNodes = divNode.getDOM();

		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('dir'), 'ltr');
		assertEquals(divElem.getAttribute('lang'), 'fr');

		// Change both MWIData entries
		mwiData.set('dir', 'rtl');
		mwiData.set('lang2', 'ar');
		await reactive.wait();
		assertEquals(divElem.getAttribute('dir'), 'rtl', 'dir should update');
		assertEquals(divElem.getAttribute('lang'), 'ar', 'lang should update');
	});

	// Clean up
	globalThis.$gss.delete('MWIData');
});

describe("MWIDocNode - CSR-DOM m.coat Ancestral Reactivity (<a:name>, <A:name>)", () => {
	it("(getDOM) - Descendant with <a:name> reactively updates DOM when ancestor attribute changes", async () => {
		const parent = doc.createNode('h.div');
		parent.setAttr('theme', 'dark');
		const child = doc.createNode('h.span');
		child.setAttr('m.coat', ps('[(data-theme=<a:theme>)]'));
		parent.append(child);

		const domNodes = parent.getDOM();
		await reactive.wait();

		const parentElem = domNodes.at(0);
		const spanElem = parentElem.children[0];
		assertEquals(spanElem.getAttribute('data-theme'), 'dark');

		// Mutate ancestor attribute
		parent.setAttr('theme', 'light');
		await reactive.wait();

		assertEquals(spanElem.getAttribute('data-theme'), 'light', 'Descendant DOM should update when ancestor attribute changes');
	});

	it(".getDOM() - Descendant with <a:name> reactively updates DOM when ancestor attribute changes via JS", async () => {
		const parent = doc.createNode('h.div');
		parent.setAttr('mode', 'edit');
		const child = doc.createNode('h.span');
		child.setAttr('m.coat', ps('[(data-mode=<a:mode>)]'));
		parent.append(child);

		const domNodes = parent.getDOM();
		await reactive.wait();

		const parentElem = domNodes.at(0);
		const spanElem = parentElem.children[0];
		assertEquals(spanElem.getAttribute('data-mode'), 'edit');

		// Mutate ancestor attribute
		parent.setAttr('mode', 'view');
		await reactive.wait();

		assertEquals(spanElem.getAttribute('data-mode'), 'view', 'Descendant DOM should update when ancestor attribute changes');
	});

	it("(getDOM) - <A:name> prefers local attribute, falls back to ancestor reactively", async () => {
		const parent = doc.createNode('h.div');
		parent.setAttr('color', 'blue');
		const child = doc.createNode('h.span');
		child.setAttr('color', 'red');
		child.setAttr('m.coat', ps('[(data-color=<A:color>)]'));
		parent.append(child);

		const domNodes = parent.getDOM();
		await reactive.wait();

		const parentElem = domNodes.at(0);
		const spanElem = parentElem.children[0];
		assertEquals(spanElem.getAttribute('data-color'), 'red');

		// Delete local attribute -> should reactively fall back to parent's 'blue'
		child.delAttr('color');
		await reactive.wait();

		assertEquals(spanElem.getAttribute('data-color'), 'blue', 'Should fall back to ancestor when local attribute deleted');

		// Mutate parent attribute -> should reactively update to parent's new value
		parent.setAttr('color', 'green');
		await reactive.wait();

		assertEquals(spanElem.getAttribute('data-color'), 'green', 'Should follow ancestor changes when local is unset');
	});

	it(".getDOM() - Multi-level hierarchy reactively propagates ancestral updates to grandchild", async () => {
		const root = doc.createNode('h.div');
		root.setAttr('navDet.name', '_M_navDet');
		const child = doc.createNode('h.div');
		child.setAttr('m.coat', ps('[(navDet.name=<a:navDet.name>-lvl)]'));
		const grandchild = doc.createNode('h.div');
		grandchild.setAttr('m.coat', ps('[(navDet.name=<a:navDet.name>-lvl data-name=<A:navDet.name>)]'));

		root.append(child);
		child.append(grandchild);

		const domNodes = root.getDOM();
		await reactive.wait();

		const rootElem = domNodes.at(0);
		const childElem = rootElem.children[0];
		const grandchildElem = childElem.children[0];

		assertEquals(grandchildElem.getAttribute('data-name'), '_M_navDet-lvl-lvl');

		// Update root navDet.name
		root.setAttr('navDet.name', 'siteNav');
		await reactive.wait();

		assertEquals(grandchildElem.getAttribute('data-name'), 'siteNav-lvl-lvl', 'Grandchild should update to siteNav-lvl-lvl');
	});
});
