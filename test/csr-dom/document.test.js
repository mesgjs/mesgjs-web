import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser } from '../harness.esm.js';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { ls } = globalThis;

await fwait('MWIDocument');

// Set up browser-like environment for DOM testing
await simulateBrowser();

Deno.test('MWIDocument - CSR-DOM Rendering Delegation', async (t) => {
	await t.step('(getDOM) - Delegates to root fragment', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['item', 'Hello']));

		const docDOM = doc('getDOM');
		const root = doc('root');
		const rootDOM = root('getDOM');

		await globalThis.reactive.wait();
		assertStrictEquals(docDOM, rootDOM, 'Document DOM should be same as root DOM');
	});

	await t.step('.getDOM() - Delegates to root fragment via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ item: 'World' });

		const docDOM = doc.getDOM();
		const root = doc.root;
		const rootDOM = root.getDOM();

		await globalThis.reactive.wait();
		assertStrictEquals(docDOM, rootDOM, 'Document DOM should be same as root DOM');
	});

	await t.step('(getDOM) - Empty document', async () => {
		const doc = getInstance('MWIDocument');
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Empty document should produce no DOM nodes');
	});

	await t.step('.getDOM() - Empty document via JS', async () => {
		const doc = getInstance('MWIDocument');
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0, 'Empty document should produce no DOM nodes');
	});

	await t.step('(getDOM) - With content', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([h.div test])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'test');
	});

	await t.step('.getDOM() - With content via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.div test])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'test');
	});
});

Deno.test('MWIDocument - CSR-DOM Multiple Content Items', async (t) => {
	await t.step('(getDOM) - Multiple text nodes', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.t t=First] [m.t t=Second] [m.t t=Third])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).tagName, 'OUTPUT');
		assertEquals(domNodes.at(1).textContent, 'Second');
		assertEquals(domNodes.at(2).tagName, 'OUTPUT');
		assertEquals(domNodes.at(2).textContent, 'Third');
	});

	await t.step('.getDOM() - Multiple text nodes via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.t t=A] [m.t t=B] [m.t t=C])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'A');
		assertEquals(domNodes.at(1).textContent, 'B');
		assertEquals(domNodes.at(2).textContent, 'C');
	});

	await t.step('(getDOM) - Multiple HTML elements', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([h.div First] [h.span Second] [h.p Third])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'DIV');
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(1).textContent, 'Second');
		assertEquals(domNodes.at(2).tagName, 'P');
		assertEquals(domNodes.at(2).textContent, 'Third');
	});

	await t.step('.getDOM() - Multiple HTML elements via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.div A] [h.span B] [h.p C])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'DIV');
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(2).tagName, 'P');
	});

	await t.step('(getDOM) - Mixed content types', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.t t=Text] [h.div Element] [m.com t=Comment])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Text');
		assertEquals(domNodes.at(1).tagName, 'DIV');
		assertEquals(domNodes.at(1).textContent, 'Element');
		assertEquals(domNodes.at(2).nodeType, 8); // Comment node
		assertEquals(domNodes.at(2).textContent, 'Comment');
	});

	await t.step('.getDOM() - Mixed content types via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.t t=A] [h.span B] [m.com t=C])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(2).nodeType, 8);
	});
});

Deno.test('MWIDocument - CSR-DOM Reactive Updates', async (t) => {
	await t.step('(getDOM) - Reactive content changes', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial']);
		doc('append', [textNode]);

		const domNodes = doc('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Initial');

		// Change text content
		textNode('setAttr', ['t', 'Updated']);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Updated');
	});

	await t.step('.getDOM() - Reactive content changes via JS', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		doc.append(textNode);

		const domNodes = doc.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Updated');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Updated');
	});

	await t.step('(getDOM) - Reactive append adds nodes', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = doc('createNode', ['m.t']);
		text1('setAttr', ['t', 'First']);
		doc('append', [text1]);

		const domNodes = doc('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);

		// Append another node
		const text2 = doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Second']);
		doc('append', [text2]);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	await t.step('.getDOM() - Reactive append adds nodes via JS', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		doc.append(text1);

		const domNodes = doc.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);

		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		doc.append(text2);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});

	await t.step('(getDOM) - DOM is stable across calls', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['item', 'Test']));
		const dom1 = doc('getDOM');
		const dom2 = doc('getDOM');

		await globalThis.reactive.wait();
		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
	});

	await t.step('.getDOM() - DOM is stable across calls via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ item: 'Test' });
		const dom1 = doc.getDOM();
		const dom2 = doc.getDOM();

		await globalThis.reactive.wait();
		assertStrictEquals(dom1, dom2, 'Should return same NANOS instance');
	});
});

Deno.test('MWIDocument - CSR-DOM Complex Structures', async (t) => {
	await t.step('(getDOM) - Nested HTML structure', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([h.div class=container [h.h1 Title] [h.p Content]])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
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

	await t.step('.getDOM() - Nested HTML structure via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.section [h.h2 Heading] [h.div Text]])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const sectionElem = domNodes.at(0);
		assertEquals(sectionElem.tagName, 'SECTION');
		assertEquals(sectionElem.children.length, 2);
		assertEquals(sectionElem.children[0].tagName, 'H2');
		assertEquals(sectionElem.children[1].tagName, 'DIV');
	});

	await t.step('(getDOM) - Multiple top-level elements', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([h.header Header] [h.main Main] [h.footer Footer])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'HEADER');
		assertEquals(domNodes.at(0).textContent, 'Header');
		assertEquals(domNodes.at(1).tagName, 'MAIN');
		assertEquals(domNodes.at(1).textContent, 'Main');
		assertEquals(domNodes.at(2).tagName, 'FOOTER');
		assertEquals(domNodes.at(2).textContent, 'Footer');
	});

	await t.step('.getDOM() - Multiple top-level elements via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.nav Nav] [h.article Article] [h.aside Aside])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'NAV');
		assertEquals(domNodes.at(1).tagName, 'ARTICLE');
		assertEquals(domNodes.at(2).tagName, 'ASIDE');
	});
});

Deno.test('MWIDocument - CSR-DOM Fragments', async (t) => {
	await t.step('(getDOM) - Fragment children are flattened', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.frg [m.t t=A] [m.t t=B]] [m.t t=C])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		// Fragment is transparent, so we get 3 text nodes at top level
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'A');
		assertEquals(domNodes.at(1).textContent, 'B');
		assertEquals(domNodes.at(2).textContent, 'C');
	});

	await t.step('.getDOM() - Fragment children are flattened via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.frg [m.t t=X] [m.t t=Y]] [m.t t=Z])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'X');
		assertEquals(domNodes.at(1).textContent, 'Y');
		assertEquals(domNodes.at(2).textContent, 'Z');
	});

	await t.step('(getDOM) - Nested fragments are flattened', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.frg [m.frg [m.t t=Deep]]])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Deep');
	});

	await t.step('.getDOM() - Nested fragments are flattened via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.frg [m.frg [m.t t=Nested]]])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Nested');
	});
});

Deno.test('MWIDocument - CSR-DOM Reactive Document Updates', async (t) => {
	await t.step('(getDOM) - Reactive changes to document content', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial']);
		doc('append', [textNode]);

		const domNodes = doc('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Initial');

		// Modify existing content
		textNode('setAttr', ['t', 'Modified']);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Modified');
	});

	await t.step('.getDOM() - Reactive changes to document content via JS', async () => {
		const doc = getInstance('MWIDocument');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial');
		doc.append(textNode);

		const domNodes = doc.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Initial');

		textNode.setAttr('t', 'JS Modified');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Modified');
	});

	await t.step('(getDOM) - Reactive append to document', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = doc('createNode', ['m.t']);
		text1('setAttr', ['t', 'First']);
		doc('append', [text1]);

		const domNodes = doc('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);

		// Append more content
		const text2 = doc('createNode', ['m.t']);
		text2('setAttr', ['t', 'Second']);
		doc('append', [text2]);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	await t.step('.getDOM() - Reactive append to document via JS', async () => {
		const doc = getInstance('MWIDocument');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		doc.append(text1);

		const domNodes = doc.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);

		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		doc.append(text2);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});
});

Deno.test('MWIDocument - CSR-DOM Special Cases', async (t) => {
	await t.step('(getDOM) - Empty text nodes are removed', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.t t=""] [m.t t=Content] [m.t t=""])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		// Empty text nodes should not appear in DOM
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Content');
	});

	await t.step('.getDOM() - Empty text nodes are removed via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([m.t t=""] [m.t t=Content] [m.t t=""])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Content');
	});

	await t.step('(getDOM) - Deeply nested structure', async () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([h.div [h.div [h.div [h.div Deep]]]])]']));
		const domNodes = doc('getDOM');

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.textContent, 'Deep');
		assertEquals(outerDiv.querySelectorAll('div').length, 3);
	});

	await t.step('.getDOM() - Deeply nested structure via JS', async () => {
		const doc = getInstance('MWIDocument');
		doc.append({ list: '[([h.div [h.div [h.div Content]]])]' });
		const domNodes = doc.getDOM();

		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.textContent, 'Content');
		assertEquals(outerDiv.querySelectorAll('div').length, 2);
	});
});
