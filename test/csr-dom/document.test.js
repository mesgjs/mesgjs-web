import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
} from '@std/assert';

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { ls, reactive } = globalThis;

await fwait('MWIDocument');

// Set up browser-like environment for DOM testing
await simulateBrowser();

describe('MWIDocument - CSR-DOM Rendering Delegation', () => {
	it('(getDOM) - Delegates to root fragment', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['item', 'Hello']));

		const docDOM = $c.sm(doc, 'getDOM');
		const root = $c.sm(doc, 'root');
		const rootDOM = $c.sm(root, 'getDOM');

		assertStrictEquals(docDOM, rootDOM, 'Document DOM should be same as root DOM');
	});

	it('.getDOM() - Delegates to root fragment via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ item: 'World' });

		const docDOM = doc.getDOM();
		const root = doc.root;
		const rootDOM = root.getDOM();

		assertStrictEquals(docDOM, rootDOM, 'Document DOM should be same as root DOM');
	});

	it('(getDOM) - Empty document', () => {
		const doc = getInstance('MWIDocument');
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 0, 'Empty document should produce no DOM nodes');
	});

	it('.getDOM() - Empty document via JS', () => {
		const doc = getInstance('MWIDocument');
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 0, 'Empty document should produce no DOM nodes');
	});

	it('(getDOM) - With content', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.div test])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'test');
	});

	it('.getDOM() - With content via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.div test])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'test');
	});
});

describe('MWIDocument - CSR-DOM Multiple Content Items', () => {
	it('(getDOM) - Multiple text nodes', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.t t=First] [m.t t=Second] [m.t t=Third])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'First');
		assertEquals(domNodes.at(1).nodeType, 3); // Text node
		assertEquals(domNodes.at(1).nodeValue, 'Second');
		assertEquals(domNodes.at(2).nodeType, 3); // Text node
		assertEquals(domNodes.at(2).nodeValue, 'Third');
	});

	it('.getDOM() - Multiple text nodes via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.t t=A] [m.t t=B] [m.t t=C])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).nodeValue, 'A');
		assertEquals(domNodes.at(1).nodeValue, 'B');
		assertEquals(domNodes.at(2).nodeValue, 'C');
	});

	it('(getDOM) - Multiple HTML elements', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.div First] [h.span Second] [h.p Third])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'DIV');
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(1).textContent, 'Second');
		assertEquals(domNodes.at(2).tagName, 'P');
		assertEquals(domNodes.at(2).textContent, 'Third');
	});

	it('.getDOM() - Multiple HTML elements via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.div A] [h.span B] [h.p C])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'DIV');
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(2).tagName, 'P');
	});

	it('(getDOM) - Mixed content types', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.t t=Text] [h.div Element] [m.com t=Comment])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(0).nodeValue, 'Text');
		assertEquals(domNodes.at(1).tagName, 'DIV');
		assertEquals(domNodes.at(1).textContent, 'Element');
		assertEquals(domNodes.at(2).nodeType, 8); // Comment node
		assertEquals(domNodes.at(2).textContent, 'Comment');
	});

	it('.getDOM() - Mixed content types via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.t t=A] [h.span B] [m.com t=C])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).nodeType, 3); // Text node
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(2).nodeType, 8);
	});
});

describe('MWIDocument - CSR-DOM Reactive Updates', () => {
	it('(getDOM) - Reactive content changes', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial']);
		$c.sm(doc, 'append', [textNode]);

		const domNodes = $c.sm(doc, 'getDOM');
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Initial');

		// Change text content
		$c.sm(textNode, 'setAttr', ['t', 'Updated']);
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Updated');
	});

	it('.getDOM() - Reactive content changes via JS', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		doc.append(textNode);

		const domNodes = doc.getDOM();
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Updated');
	});

	it('(getDOM) - Reactive append adds nodes', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', 'First']);
		$c.sm(doc, 'append', [text1]);

		const domNodes = $c.sm(doc, 'getDOM');
		await reactive.wait();
		assertEquals(domNodes.size, 1);

		// Append another node
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Second']);
		$c.sm(doc, 'append', [text2]);
		await reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	it('.getDOM() - Reactive append adds nodes via JS', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		doc.append(text1);

		const domNodes = doc.getDOM();
		await reactive.wait();
		assertEquals(domNodes.size, 1);

		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		doc.append(text2);
		await reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});

	it('(getDOM) - DOM is stable across calls', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['item', 'Test']));
		const dom1 = $c.sm(doc, 'getDOM');
		const dom2 = $c.sm(doc, 'getDOM');

		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
	});

	it('.getDOM() - DOM is stable across calls via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ item: 'Test' });
		const dom1 = doc.getDOM();
		const dom2 = doc.getDOM();

		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
	});
});

describe('MWIDocument - CSR-DOM Complex Structures', () => {
	it('(getDOM) - Nested HTML structure', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.div class=container [h.h1 Title] [h.p Content]])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.className, 'container');
		assertEquals(divElem.children.length, 2);
		assertEquals(divElem.children[0].tagName, 'H1');
		assertEquals(divElem.children[0].textContent, 'Title');
		assertEquals(divElem.children[1].tagName, 'P');
		assertEquals(divElem.children[1].textContent, 'Content');
	});

	it('.getDOM() - Nested HTML structure via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.section [h.h2 Heading] [h.div Text]])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 1);
		const sectionElem = domNodes.at(0);
		assertEquals(sectionElem.tagName, 'SECTION');
		assertEquals(sectionElem.children.length, 2);
		assertEquals(sectionElem.children[0].tagName, 'H2');
		assertEquals(sectionElem.children[1].tagName, 'DIV');
	});

	it('(getDOM) - Multiple top-level elements', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.header Header] [h.main Main] [h.footer Footer])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'HEADER');
		assertEquals(domNodes.at(0).textContent, 'Header');
		assertEquals(domNodes.at(1).tagName, 'MAIN');
		assertEquals(domNodes.at(1).textContent, 'Main');
		assertEquals(domNodes.at(2).tagName, 'FOOTER');
		assertEquals(domNodes.at(2).textContent, 'Footer');
	});

	it('.getDOM() - Multiple top-level elements via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.nav Nav] [h.article Article] [h.aside Aside])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'NAV');
		assertEquals(domNodes.at(1).tagName, 'ARTICLE');
		assertEquals(domNodes.at(2).tagName, 'ASIDE');
	});
});

describe('MWIDocument - CSR-DOM Fragments', () => {
	it('(getDOM) - Fragment children are flattened', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.frg [m.t t=A] [m.t t=B]] [m.t t=C])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		// Fragment is transparent, so we get 3 text nodes at top level
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'A');
		assertEquals(domNodes.at(1).textContent, 'B');
		assertEquals(domNodes.at(2).textContent, 'C');
	});

	it('.getDOM() - Fragment children are flattened via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.frg [m.t t=X] [m.t t=Y]] [m.t t=Z])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'X');
		assertEquals(domNodes.at(1).textContent, 'Y');
		assertEquals(domNodes.at(2).textContent, 'Z');
	});

	it('(getDOM) - Nested fragments are flattened', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.frg [m.frg [m.t t=Deep]]])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Deep');
	});

	it('.getDOM() - Nested fragments are flattened via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.frg [m.frg [m.t t=Nested]]])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Nested');
	});
});

describe('MWIDocument - CSR-DOM Reactive Document Updates', () => {
	it('(getDOM) - Reactive changes to document content', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(textNode, 'setAttr', ['t', 'Initial']);
		$c.sm(doc, 'append', [textNode]);

		const domNodes = $c.sm(doc, 'getDOM');
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Initial');

		// Modify existing content
		$c.sm(textNode, 'setAttr', ['t', 'Modified']);
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Modified');
	});

	it('.getDOM() - Reactive changes to document content via JS', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		doc.append(textNode);

		const domNodes = doc.getDOM();
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Modified');
		await reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Modified');
	});

	it('(getDOM) - Reactive append to document', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text1, 'setAttr', ['t', 'First']);
		$c.sm(doc, 'append', [text1]);

		const domNodes = $c.sm(doc, 'getDOM');
		await reactive.wait();
		assertEquals(domNodes.size, 1);

		// Append more content
		const text2 = $c.sm(doc, 'createNode', ['m.t']);
		$c.sm(text2, 'setAttr', ['t', 'Second']);
		$c.sm(doc, 'append', [text2]);
		await reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	it('.getDOM() - Reactive append to document via JS', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		doc.append(text1);

		const domNodes = doc.getDOM();
		await reactive.wait();
		assertEquals(domNodes.size, 1);

		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		doc.append(text2);
		await reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});
});

describe('MWIDocument - CSR-DOM Special Cases', () => {
	it('(getDOM) - Empty text nodes are removed', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.t t=""] [m.t t=Content] [m.t t=""])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		// Empty text nodes should not appear in DOM
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Content');
	});

	it('.getDOM() - Empty text nodes are removed via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.t t=""] [m.t t=Content] [m.t t=""])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Content');
	});

	it('(getDOM) - Deeply nested structure', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.div [h.div [h.div [h.div Deep]]]])]']));
		const domNodes = $c.sm(doc, 'getDOM');

		assertEquals(domNodes.size, 1);
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.textContent, 'Deep');
		assertEquals(outerDiv.querySelectorAll('div').length, 3);
	});

	it('.getDOM() - Deeply nested structure via JS', () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.div [h.div [h.div Content]]])]' });
		const domNodes = doc.getDOM();

		assertEquals(domNodes.size, 1);
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.textContent, 'Content');
		assertEquals(outerDiv.querySelectorAll('div').length, 2);
	});
});
