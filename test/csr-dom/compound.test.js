import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, simulateBrowser, renderDOM } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const ps = globalThis.ps;

Deno.test("Compound CSR - Variety of HTML Tags", async (t) => {
	await t.step("Simple div with text", async () => {
		const domNodes = renderDOM(ps('[([h.div "Hello World"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'Hello World');
	});

	await t.step("Nested divs", async () => {
		const domNodes = renderDOM(ps('[([h.div [h.div "Nested"]])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.tagName, 'DIV');
		assertEquals(outerDiv.children.length, 1);
		assertEquals(outerDiv.children[0].tagName, 'DIV');
		assertEquals(outerDiv.children[0].textContent, 'Nested');
	});

	await t.step("Div with attributes", async () => {
		const domNodes = renderDOM(ps('[([h.div id=test data-index=42 class=container "Content"])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.id, 'test');
		assertEquals(divElem.getAttribute('data-index'), '42');
		assertEquals(divElem.className, 'container');
		assertEquals(divElem.textContent, 'Content');
	});

	await t.step("Paragraph tag", async () => {
		const domNodes = renderDOM(ps('[([h.p "Paragraph text"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).tagName, 'P');
		assertEquals(domNodes.at(0).textContent, 'Paragraph text');
	});

	await t.step("Heading tags (h1-h6)", async () => {
		const domNodes = renderDOM(ps('[([h.h1 "Heading 1"] [h.h2 "Heading 2"] [h.h3 "Heading 3"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'H1');
		assertEquals(domNodes.at(0).textContent, 'Heading 1');
		assertEquals(domNodes.at(1).tagName, 'H2');
		assertEquals(domNodes.at(1).textContent, 'Heading 2');
		assertEquals(domNodes.at(2).tagName, 'H3');
		assertEquals(domNodes.at(2).textContent, 'Heading 3');
	});

	await t.step("Span tag", async () => {
		const domNodes = renderDOM(ps('[([h.span "Inline text"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).tagName, 'SPAN');
		assertEquals(domNodes.at(0).textContent, 'Inline text');
	});

	await t.step("Link (anchor) tag", async () => {
		const domNodes = renderDOM(ps('[([h.a href="https://example.com" "Link text"])]'));
		await globalThis.reactive.wait();
		const anchorElem = domNodes.at(0);
		assertEquals(anchorElem.tagName, 'A');
		assertEquals(anchorElem.href, 'https://example.com/');
		assertEquals(anchorElem.textContent, 'Link text');
	});

	await t.step("Image tag (void element)", async () => {
		const domNodes = renderDOM(ps('[([h.img src=image.jpg alt="Description"])]'));
		await globalThis.reactive.wait();
		const imgElem = domNodes.at(0);
		assertEquals(imgElem.tagName, 'IMG');
		assertEquals(imgElem.src, 'image.jpg');
		assertEquals(imgElem.alt, 'Description');
		assertEquals(imgElem.childNodes.length, 0);
	});

	await t.step("Line break (void element)", async () => {
		const domNodes = renderDOM(ps('[([h.br])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).tagName, 'BR');
	});

	await t.step("Horizontal rule (void element)", async () => {
		const domNodes = renderDOM(ps('[([h.hr])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).tagName, 'HR');
	});

	await t.step("List elements (ul, ol, li)", async () => {
		const domNodes = renderDOM(ps('[([h.ul [h.li "Item 1"] [h.li "Item 2"]])]'));
		await globalThis.reactive.wait();
		const ulElem = domNodes.at(0);
		assertEquals(ulElem.tagName, 'UL');
		assertEquals(ulElem.children.length, 2);
		assertEquals(ulElem.children[0].tagName, 'LI');
		assertEquals(ulElem.children[0].textContent, 'Item 1');
		assertEquals(ulElem.children[1].tagName, 'LI');
		assertEquals(ulElem.children[1].textContent, 'Item 2');
	});

	await t.step("Table elements", async () => {
		const domNodes = renderDOM(ps('[([h.table [h.tr [h.td "Cell"]]])]'));
		await globalThis.reactive.wait();
		const tableElem = domNodes.at(0);
		assertEquals(tableElem.tagName, 'TABLE');
		assertEquals(tableElem.querySelector('tr').tagName, 'TR');
		assertEquals(tableElem.querySelector('td').tagName, 'TD');
		assertEquals(tableElem.querySelector('td').textContent, 'Cell');
	});

	await t.step("Form elements", async () => {
		const domNodes = renderDOM(ps('[([h.form [h.input type=text name=username] [h.button "Submit"]])]'));
		await globalThis.reactive.wait();
		const formElem = domNodes.at(0);
		assertEquals(formElem.tagName, 'FORM');
		const inputElem = formElem.querySelector('input');
		assertEquals(inputElem.type, 'text');
		assertEquals(inputElem.name, 'username');
		const buttonElem = formElem.querySelector('button');
		assertEquals(buttonElem.textContent, 'Submit');
	});

	await t.step("Semantic HTML5 elements", async () => {
		const domNodes = renderDOM(ps('[([h.header "Header"] [h.nav "Nav"] [h.main "Main"] [h.footer "Footer"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 4);
		assertEquals(domNodes.at(0).tagName, 'HEADER');
		assertEquals(domNodes.at(0).textContent, 'Header');
		assertEquals(domNodes.at(1).tagName, 'NAV');
		assertEquals(domNodes.at(1).textContent, 'Nav');
		assertEquals(domNodes.at(2).tagName, 'MAIN');
		assertEquals(domNodes.at(2).textContent, 'Main');
		assertEquals(domNodes.at(3).tagName, 'FOOTER');
		assertEquals(domNodes.at(3).textContent, 'Footer');
	});

	await t.step("Article and section", async () => {
		const domNodes = renderDOM(ps('[([h.article [h.section "Section content"]])]'));
		await globalThis.reactive.wait();
		const articleElem = domNodes.at(0);
		assertEquals(articleElem.tagName, 'ARTICLE');
		assertEquals(articleElem.children.length, 1);
		assertEquals(articleElem.children[0].tagName, 'SECTION');
		assertEquals(articleElem.children[0].textContent, 'Section content');
	});
});

Deno.test("Compound CSR - Complex Document Structures", async (t) => {
	await t.step("Multi-level nesting", async () => {
		const domNodes = renderDOM(ps('[([h.div [h.div [h.div [h.div "Deep"]]]])]'));
		await globalThis.reactive.wait();
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.textContent, 'Deep');
		assertEquals(outerDiv.querySelectorAll('div').length, 3);
	});

	await t.step("Mixed content types", async () => {
		const domNodes = renderDOM(ps('[([h.div "Text" [h.span "Span"] "More text"])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'TextSpanMore text');
		// Text renders as text nodes, span as <span>
		assertEquals(divElem.children.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Text');
		assertEquals(divElem.childNodes[1].tagName, 'SPAN');
		assertEquals(divElem.childNodes[2].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[2].nodeValue, 'More text');
	});

	await t.step("Multiple siblings with attributes", async () => {
		const domNodes = renderDOM(ps('[([h.div id=first class=box "First"] [h.div id=second class=box "Second"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).id, 'first');
		assertEquals(domNodes.at(0).className, 'box');
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).id, 'second');
		assertEquals(domNodes.at(1).className, 'box');
		assertEquals(domNodes.at(1).textContent, 'Second');
	});

	await t.step("Complex form structure", async () => {
		const spec = ps(`[([h.form action='http://localhost/submit' method=post
			[h.label for=name "Name:"]
			[h.input type=text id=name name=name]
			[h.label for=email "Email:"]
			[h.input type=email id=email name=email]
			[h.button type=submit "Submit"]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const formElem = domNodes.at(0);
		assertEquals(formElem.tagName, 'FORM');
		assertEquals(formElem.action, 'http://localhost/submit');
		assertEquals(formElem.method, 'post');

		const labels = formElem.querySelectorAll('label');
		assertEquals(labels.length, 2);
		assertEquals(labels[0].htmlFor, 'name');
		assertEquals(labels[1].htmlFor, 'email');

		const inputs = formElem.querySelectorAll('input');
		assertEquals(inputs.length, 2);
		assertEquals(inputs[0].type, 'text');
		assertEquals(inputs[1].type, 'email');

		const button = formElem.querySelector('button');
		assertEquals(button.type, 'submit');
		assertEquals(button.textContent, 'Submit');
	});

	await t.step("Navigation menu structure", async () => {
		const spec = ps(`[([h.nav class=main-nav
			[h.ul
				[h.li [h.a href=/ "Home"]]
				[h.li [h.a href=/about "About"]]
				[h.li [h.a href=/contact "Contact"]]
			]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const navElem = domNodes.at(0);
		assertEquals(navElem.tagName, 'NAV');
		assertEquals(navElem.className, 'main-nav');

		const links = navElem.querySelectorAll('a');
		assertEquals(links.length, 3);
		assertEquals(links[0].textContent, 'Home');
		assertEquals(links[1].textContent, 'About');
		assertEquals(links[2].textContent, 'Contact');
	});

	await t.step("Article with header and sections", async () => {
		const spec = ps(`[([h.article
			[h.header [h.h1 "Article Title"]]
			[h.section [h.p "First paragraph"]]
			[h.section [h.p "Second paragraph"]]
			[h.footer "Published 2025"]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const articleElem = domNodes.at(0);
		assertEquals(articleElem.tagName, 'ARTICLE');
		assertEquals(articleElem.querySelector('h1').textContent, 'Article Title');

		const sections = articleElem.querySelectorAll('section');
		assertEquals(sections.length, 2);
		assertEquals(sections[0].querySelector('p').textContent, 'First paragraph');
		assertEquals(sections[1].querySelector('p').textContent, 'Second paragraph');

		assertEquals(articleElem.querySelector('footer').textContent, 'Published 2025');
	});
});

Deno.test("Compound CSR - Core Components Integration", async (t) => {
	await t.step("Text nodes (m.t) in HTML", async () => {
		const domNodes = renderDOM(ps('[([h.div [m.t t="Explicit text node"]])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Explicit text node');
		// Text renders as text node
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.childNodes.length, 1);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[0].nodeValue, 'Explicit text node');
	});

	await t.step("Comments (m.com) in HTML", async () => {
		const domNodes = renderDOM(ps('[([h.div [m.com t="This is a comment"] "Content"])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.childNodes.length, 2);
		assertEquals(divElem.childNodes[0].nodeType, 8); // Comment node
		assertEquals(divElem.childNodes[0].textContent, 'This is a comment');
		assertEquals(divElem.childNodes[1].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[1].nodeValue, 'Content');
	});

	await t.step("Fragments (m.frg) flatten into parent", async () => {
		const domNodes = renderDOM(ps('[([h.div [m.frg "Text1" "Text2"]])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, 'Text1Text2');
		// Two text nodes rendered as text nodes (no element children)
		assertEquals(divElem.children.length, 0);
		assertEquals(divElem.childNodes.length, 2);
		assertEquals(divElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[1].nodeType, 3); // Text node
	});

	await t.step("Mixed HTML and core components", async () => {
		const spec = ps(`[([h.div
			[m.com t="Section start"]
			[h.p "Paragraph"]
			[m.frg "Fragment" " content"]
			[m.com t="Section end"]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);

		// Should have: comment, p, 2 text nodes (from fragment), comment
		assertEquals(divElem.childNodes.length, 5);
		assertEquals(divElem.childNodes[0].nodeType, 8);
		assertEquals(divElem.childNodes[0].textContent, 'Section start');
		assertEquals(divElem.childNodes[1].tagName, 'P');
		assertEquals(divElem.childNodes[2].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[2].nodeValue, 'Fragment');
		assertEquals(divElem.childNodes[3].nodeType, 3); // Text node
		assertEquals(divElem.childNodes[3].nodeValue, ' content');
		assertEquals(divElem.childNodes[4].nodeType, 8);
		assertEquals(divElem.childNodes[4].textContent, 'Section end');
	});
});

Deno.test("Compound CSR - Special Attributes", async (t) => {
	await t.step("Boolean attributes", async () => {
		const domNodes = renderDOM(ps('[([h.input type=checkbox checked=@t disabled=@t])]'));
		await globalThis.reactive.wait();
		const inputElem = domNodes.at(0);
		assertEquals(inputElem.type, 'checkbox');
		assertEquals(inputElem.checked, true);
		assertEquals(inputElem.disabled, true);
	});

	await t.step("Data attributes", async () => {
		const domNodes = renderDOM(ps('[([h.div data-id=123 data-name=test "Content"])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('data-id'), '123');
		assertEquals(divElem.getAttribute('data-name'), 'test');
	});

	await t.step("ARIA attributes", async () => {
		const domNodes = renderDOM(ps('[([h.button aria-label="Close" aria-pressed=@t "X"])]'));
		await globalThis.reactive.wait();
		const buttonElem = domNodes.at(0);
		assertEquals(buttonElem.getAttribute('aria-label'), 'Close');
		assertEquals(buttonElem.getAttribute('aria-pressed'), 'true');
	});

	await t.step("Class attribute", async () => {
		const domNodes = renderDOM(ps('[([h.div class="btn btn-primary active" "Button"])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.className, 'btn btn-primary active');
	});

	await t.step("Style attribute", async () => {
		const domNodes = renderDOM(ps('[([h.div style="color: red; margin: 10px" "Styled"])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		// Style is normalized by the browser
		assert(divElem.style.color === 'red' || divElem.getAttribute('style').includes('color'));
		assert(divElem.style.margin === '10px' || divElem.getAttribute('style').includes('margin'));
	});

	await t.step("Multiple attributes on nested elements", async () => {
		const spec = ps(`[([h.div id=outer class=container
			[h.div id=inner class=box data-value=42 "Content"]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.id, 'outer');
		assertEquals(outerDiv.className, 'container');

		const innerDiv = outerDiv.children[0];
		assertEquals(innerDiv.id, 'inner');
		assertEquals(innerDiv.className, 'box');
		assertEquals(innerDiv.getAttribute('data-value'), '42');
	});

	await t.step("Numeric attributes via setAttr with JS numbers", async () => {
		const doc = getInstance('MWIDocument');
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-count', 100);
		divNode.setAttr('data-index', 0);
		divNode.setAttr('tabindex', -1);
		divNode.append('Content');
		const domNodes = divNode.getDOM();

		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.getAttribute('data-count'), '100');
		assertEquals(divElem.getAttribute('data-index'), '0');
		assertEquals(divElem.getAttribute('tabindex'), '-1');
	});

	await t.step("Numeric attributes in nested SLID spec", async () => {
		const spec = ps(`[([h.div data-outer=1
			[h.div data-inner=2 data-zero=0 data-neg=-5 "Nested"]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const outerDiv = domNodes.at(0);
		assertEquals(outerDiv.getAttribute('data-outer'), '1');

		const innerDiv = outerDiv.children[0];
		assertEquals(innerDiv.getAttribute('data-inner'), '2');
		assertEquals(innerDiv.getAttribute('data-zero'), '0');
		assertEquals(innerDiv.getAttribute('data-neg'), '-5');
	});
});

Deno.test("Compound CSR - Edge Cases", async (t) => {
	await t.step("Empty elements", async () => {
		const domNodes = renderDOM(ps('[([h.div])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).tagName, 'DIV');
		assertEquals(domNodes.at(0).childNodes.length, 0);
	});

	await t.step("Element with only whitespace", async () => {
		const domNodes = renderDOM(ps('[([h.div "   "])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.textContent, '   ');
	});

	await t.step("Multiple void elements", async () => {
		const domNodes = renderDOM(ps('[([h.br] [h.hr] [h.br])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'BR');
		assertEquals(domNodes.at(1).tagName, 'HR');
		assertEquals(domNodes.at(2).tagName, 'BR');
	});

	await t.step("Deeply nested with void elements", async () => {
		const domNodes = renderDOM(ps('[([h.div [h.p "Text" [h.br] "More"]])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		const pElem = divElem.children[0];
		assertEquals(pElem.tagName, 'P');
		assertEquals(pElem.textContent, 'TextMore');
		// Should have: text node "Text", <br>, text node "More"
		assertEquals(pElem.childNodes.length, 3);
		assertEquals(pElem.childNodes[0].nodeType, 3); // Text node
		assertEquals(pElem.childNodes[0].nodeValue, 'Text');
		assertEquals(pElem.childNodes[1].tagName, 'BR');
		assertEquals(pElem.childNodes[2].nodeType, 3); // Text node
		assertEquals(pElem.childNodes[2].nodeValue, 'More');
	});

	await t.step("Empty fragment", async () => {
		const domNodes = renderDOM(ps('[([h.div [m.frg]])]'));
		await globalThis.reactive.wait();
		const divElem = domNodes.at(0);
		assertEquals(divElem.childNodes.length, 0);
	});

	await t.step("Multiple empty elements", async () => {
		const domNodes = renderDOM(ps('[([h.div] [h.span] [h.p])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'DIV');
		assertEquals(domNodes.at(1).tagName, 'SPAN');
		assertEquals(domNodes.at(2).tagName, 'P');
	});
});

Deno.test("Compound CSR - Real-World Patterns", async (t) => {
	await t.step("Card component pattern", async () => {
		const spec = ps(`[([h.div class=card
			[h.div class=card-header [h.h3 "Card Title"]]
			[h.div class=card-body [h.p "Card content goes here."]]
			[h.div class=card-footer [h.button "Action"]]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const cardElem = domNodes.at(0);
		assertEquals(cardElem.className, 'card');

		const header = cardElem.querySelector('.card-header');
		assertEquals(header.querySelector('h3').textContent, 'Card Title');

		const body = cardElem.querySelector('.card-body');
		assertEquals(body.querySelector('p').textContent, 'Card content goes here.');

		const footer = cardElem.querySelector('.card-footer');
		assertEquals(footer.querySelector('button').textContent, 'Action');
	});

	await t.step("Hero section pattern", async () => {
		const spec = ps(`[([h.section class=hero
			[h.div class=hero-content
				[h.h1 "Welcome"]
				[h.p "Subtitle text"]
				[h.button class=cta "Get Started"]
			]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const sectionElem = domNodes.at(0);
		assertEquals(sectionElem.className, 'hero');
		assertEquals(sectionElem.querySelector('h1').textContent, 'Welcome');
		assertEquals(sectionElem.querySelector('p').textContent, 'Subtitle text');
		assertEquals(sectionElem.querySelector('.cta').textContent, 'Get Started');
	});

	await t.step("Grid layout pattern", async () => {
		const spec = ps(`[([h.div class=grid
			[h.div class=grid-item "Item 1"]
			[h.div class=grid-item "Item 2"]
			[h.div class=grid-item "Item 3"]
			[h.div class=grid-item "Item 4"]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const gridElem = domNodes.at(0);
		assertEquals(gridElem.className, 'grid');

		const items = gridElem.querySelectorAll('.grid-item');
		assertEquals(items.length, 4);
		assertEquals(items[0].textContent, 'Item 1');
		assertEquals(items[1].textContent, 'Item 2');
		assertEquals(items[2].textContent, 'Item 3');
		assertEquals(items[3].textContent, 'Item 4');
	});

	await t.step("Modal dialog pattern", async () => {
		const spec = ps(`[([h.div class=modal
			[h.div class=modal-overlay]
			[h.div class=modal-content
				[h.div class=modal-header
					[h.h2 "Dialog Title"]
					[h.button class=close "×"]
				]
				[h.div class=modal-body [h.p "Dialog content"]]
				[h.div class=modal-footer
					[h.button "Cancel"]
					[h.button class=primary "Confirm"]
				]
			]
		])]`);
		const domNodes = renderDOM(spec);
		await globalThis.reactive.wait();
		const modalElem = domNodes.at(0);
		assertEquals(modalElem.className, 'modal');
		assertEquals(modalElem.querySelector('.modal-overlay').tagName, 'DIV');
		assertEquals(modalElem.querySelector('h2').textContent, 'Dialog Title');
		assertEquals(modalElem.querySelector('.close').textContent, '×');
		assertEquals(modalElem.querySelector('.modal-body p').textContent, 'Dialog content');

		const buttons = modalElem.querySelectorAll('.modal-footer button');
		assertEquals(buttons.length, 2);
		assertEquals(buttons[0].textContent, 'Cancel');
		assertEquals(buttons[1].textContent, 'Confirm');
	});
});

Deno.test("Compound CSR - Reactive Complex Scenarios", async (t) => {
	await t.step("Reactive updates in nested structure", async () => {
		const doc = getInstance('MWIDocument');
		const outerDiv = doc.createNode('h.div');
		const innerDiv = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'Initial');
		innerDiv.append(textNode);
		outerDiv.append(innerDiv);

		const domNodes = outerDiv.getDOM();
		await globalThis.reactive.wait();
		const outerElem = domNodes.at(0);
		assertEquals(outerElem.textContent, 'Initial');

		// Update nested text
		textNode.setAttr('t', 'Updated');
		await globalThis.reactive.wait();
		assertEquals(outerElem.textContent, 'Updated');
	});

	await t.step("Reactive attribute changes on multiple elements", async () => {
		const doc = getInstance('MWIDocument');
		const div1 = doc.createNode('h.div');
		div1.setAttr('class', 'box-1');
		const div2 = doc.createNode('h.div');
		div2.setAttr('class', 'box-2');
		doc.append(div1, div2);

		const domNodes = doc.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).className, 'box-1');
		assertEquals(domNodes.at(1).className, 'box-2');

		// Update both
		div1.setAttr('class', 'box-1 active');
		div2.setAttr('class', 'box-2 active');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).className, 'box-1 active');
		assertEquals(domNodes.at(1).className, 'box-2 active');
	});

	await t.step("Reactive append to complex structure", async () => {
		const doc = getInstance('MWIDocument');
		const container = doc.createNode('h.div');
		container.setAttr('class', 'container');

		const item1 = doc.createNode('h.div');
		item1.setAttr('class', 'item');
		item1.append('Item 1');
		container.append(item1);

		const domNodes = container.getDOM();
		await globalThis.reactive.wait();
		const containerElem = domNodes.at(0);
		assertEquals(containerElem.children.length, 1);

		// Add more items
		const item2 = doc.createNode('h.div');
		item2.setAttr('class', 'item');
		item2.append('Item 2');
		container.append(item2);

		await globalThis.reactive.wait();
		assertEquals(containerElem.children.length, 2);
		assertEquals(containerElem.children[0].textContent, 'Item 1');
		assertEquals(containerElem.children[1].textContent, 'Item 2');
	});
});
