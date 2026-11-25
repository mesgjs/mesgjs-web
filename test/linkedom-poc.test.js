import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertExists,
	assertStrictEquals,
} from '@std/assert';
import { parseHTML } from 'linkedom';

function setupLinkedomBrowser (html = '<!DOCTYPE html><html><head></head><body></body></html>') {
	const dom = parseHTML(html);
	globalThis.window = dom.window;
	globalThis.document = dom.document;
	globalThis.customElements = dom.customElements;
	globalThis.HTMLElement = dom.HTMLElement;
	globalThis.Element = dom.Element;
	globalThis.Node = dom.Node;
	globalThis.Text = dom.Text;
	globalThis.Comment = dom.Comment;
	globalThis.DocumentFragment = dom.DocumentFragment;
	globalThis.Event = dom.Event;
	globalThis.CustomEvent = dom.CustomEvent;
	return dom;
}

describe("LinkeDOM Proof of Concept - DOM Capabilities", () => {
	it("initializes window and document globals", () => {
		setupLinkedomBrowser();
		assertExists(globalThis.window);
		assertExists(globalThis.document);
		assertExists(globalThis.document.documentElement);
		assertExists(globalThis.document.head);
		assertExists(globalThis.document.body);
	});

	it("creates elements, text, and comments", () => {
		setupLinkedomBrowser();
		const div = document.createElement('div');
		const text = document.createTextNode('Sample Text');
		const comment = document.createComment('m.com');

		div.appendChild(text);
		div.appendChild(comment);
		document.body.appendChild(div);

		assertEquals(div.tagName, 'DIV');
		assertEquals(div.firstChild.nodeType, 3); // Node.TEXT_NODE
		assertEquals(div.lastChild.nodeType, 8); // Node.COMMENT_NODE
		assertEquals(div.textContent, 'Sample Text');
	});

	it("supports attributes, classList, and dataset", () => {
		setupLinkedomBrowser();
		const script = document.createElement('script');
		script.type = 'x';
		script.dataset.mwi = 'begin';
		script.setAttribute('id', 'boundary-marker');

		assertEquals(script.getAttribute('type'), 'x');
		assertEquals(script.dataset.mwi, 'begin');
		assertEquals(script.getAttribute('data-mwi'), 'begin');

		const div = document.createElement('div');
		div.classList.add('c1', 'c2');
		assert(div.classList.contains('c1'));
		div.classList.remove('c1');
		assert(!div.classList.contains('c1'));
		assert(div.classList.contains('c2'));
	});

	it("supports innerHTML and tree queries", () => {
		setupLinkedomBrowser();
		document.body.innerHTML = '<section id="main"><p class="intro">Hello <strong>World</strong></p></section>';

		const main = document.getElementById('main');
		assertExists(main);
		assertEquals(main.tagName, 'SECTION');

		const strong = document.querySelector('.intro strong');
		assertExists(strong);
		assertEquals(strong.textContent, 'World');
		assertEquals(strong.closest('section'), main);
	});

	it("supports event listeners and dispatch", () => {
		setupLinkedomBrowser();
		let triggered = false;
		const button = document.createElement('button');
		button.addEventListener('click', (e) => {
			triggered = true;
		});

		const evt = new globalThis.Event('click', { bubbles: true });
		button.dispatchEvent(evt);
		assert(triggered, "Click event listener should have been triggered");
	});
});
