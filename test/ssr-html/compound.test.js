import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, renderHTML } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const ps = globalThis.ps;

Deno.test("Compound SSR - Variety of HTML Tags", async (t) => {
	await t.step("Simple div with text", () => {
		const html = renderHTML(ps('[([h.div "Hello World"])]'));
		assertEquals(html, '<div>Hello World</div>');
	});

	await t.step("Nested divs", () => {
		const html = renderHTML(ps('[([h.div [h.div "Nested"]])]'));
		assertEquals(html, '<div><div>Nested</div></div>');
	});

	await t.step("Div with attributes", () => {
		const html = renderHTML(ps('[([h.div id=test data-index=42 class=container "Content"])]'));
		assert(html.includes('<div'));
		assert(html.includes('id="test"'));
		assert(html.includes('data-index="42"'));
		assert(html.includes('class="container"'));
		assert(html.includes('>Content</div>'));
	});

	await t.step("Paragraph tag", () => {
		const html = renderHTML(ps('[([h.p "Paragraph text"])]'));
		assertEquals(html, '<p>Paragraph text</p>');
	});

	await t.step("Heading tags (h1-h6)", () => {
		const html = renderHTML(ps('[([h.h1 "Heading 1"] [h.h2 "Heading 2"] [h.h3 "Heading 3"])]'));
		assert(html.includes('<h1>Heading 1</h1>'));
		assert(html.includes('<h2>Heading 2</h2>'));
		assert(html.includes('<h3>Heading 3</h3>'));
	});

	await t.step("Span tag", () => {
		const html = renderHTML(ps('[([h.span "Inline text"])]'));
		assertEquals(html, '<span>Inline text</span>');
	});

	await t.step("Link (anchor) tag", () => {
		const html = renderHTML(ps('[([h.a href="https://example.com" "Link text"])]'));
		assert(html.includes('<a'));
		assert(html.includes('href="https://example.com"'));
		assert(html.includes('>Link text</a>'));
	});

	await t.step("Image tag (void element)", () => {
		const html = renderHTML(ps('[([h.img src=image.jpg alt="Description"])]'));
		assert(html.includes('<img'));
		assert(html.includes('src="image.jpg"'));
		assert(html.includes('alt="Description"'));
		assert(html.includes('>'));
		assert(!html.includes('</img>'));
	});

	await t.step("Line break (void element)", () => {
		const html = renderHTML(ps('[([h.br])]'));
		assertEquals(html, '<br>');
	});

	await t.step("Horizontal rule (void element)", () => {
		const html = renderHTML(ps('[([h.hr])]'));
		assertEquals(html, '<hr>');
	});

	await t.step("List elements (ul, ol, li)", () => {
		const html = renderHTML(ps('[([h.ul [h.li "Item 1"] [h.li "Item 2"]])]'));
		assert(html.includes('<ul>'));
		assert(html.includes('<li>Item 1</li>'));
		assert(html.includes('<li>Item 2</li>'));
		assert(html.includes('</ul>'));
	});

	await t.step("Table elements", () => {
		const html = renderHTML(ps('[([h.table [h.tr [h.td "Cell"]]])]'));
		assert(html.includes('<table>'));
		assert(html.includes('<tr>'));
		assert(html.includes('<td>Cell</td>'));
		assert(html.includes('</tr>'));
		assert(html.includes('</table>'));
	});

	await t.step("Form elements", () => {
		const html = renderHTML(ps('[([h.form [h.input type=text name=username] [h.button "Submit"]])]'));
		assert(html.includes('<form>'));
		assert(html.includes('<input'));
		assert(html.includes('type="text"'));
		assert(html.includes('name="username"'));
		assert(html.includes('<button>Submit</button>'));
		assert(html.includes('</form>'));
	});

	await t.step("Semantic HTML5 elements", () => {
		const html = renderHTML(ps('[([h.header "Header"] [h.nav "Nav"] [h.main "Main"] [h.footer "Footer"])]'));
		assert(html.includes('<header>Header</header>'));
		assert(html.includes('<nav>Nav</nav>'));
		assert(html.includes('<main>Main</main>'));
		assert(html.includes('<footer>Footer</footer>'));
	});

	await t.step("Article and section", () => {
		const html = renderHTML(ps('[([h.article [h.section "Section content"]])]'));
		assert(html.includes('<article>'));
		assert(html.includes('<section>Section content</section>'));
		assert(html.includes('</article>'));
	});
});

Deno.test("Compound SSR - Complex Document Structures", async (t) => {
	await t.step("Multi-level nesting", () => {
		const html = renderHTML(ps('[([h.div [h.div [h.div [h.div "Deep"]]]])]'));
		assertEquals(html, '<div><div><div><div>Deep</div></div></div></div>');
	});

	await t.step("Mixed content types", () => {
		const html = renderHTML(ps('[([h.div "Text" [h.span "Span"] "More text"])]'));
		assert(html.includes('<div>'));
		assert(html.includes('Text'));
		assert(html.includes('<span>Span</span>'));
		assert(html.includes('More text'));
		assert(html.includes('</div>'));
	});

	await t.step("Multiple siblings with attributes", () => {
		const html = renderHTML(ps('[([h.div id=first class=box "First"] [h.div id=second class=box "Second"])]'));
		assert(html.includes('id="first"'));
		assert(html.includes('id="second"'));
		assert(html.includes('class="box"'));
		assert(html.includes('>First</div>'));
		assert(html.includes('>Second</div>'));
	});

	await t.step("Complex form structure", () => {
		const spec = ps(`[([h.form action=/submit method=post
			[h.label for=name "Name:"]
			[h.input type=text id=name name=name]
			[h.label for=email "Email:"]
			[h.input type=email id=email name=email]
			[h.button type=submit "Submit"]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('<form'));
		assert(html.includes('action="/submit"'));
		assert(html.includes('method="post"'));
		assert(html.includes('<label'));
		assert(html.includes('for="name"'));
		assert(html.includes('<input'));
		assert(html.includes('type="text"'));
		assert(html.includes('type="email"'));
		assert(html.includes('<button'));
		assert(html.includes('type="submit"'));
	});

	await t.step("Navigation menu structure", () => {
		const spec = ps(`[([h.nav class=main-nav
			[h.ul
				[h.li [h.a href=/ "Home"]]
				[h.li [h.a href=/about "About"]]
				[h.li [h.a href=/contact "Contact"]]
			]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('<nav'));
		assert(html.includes('class="main-nav"'));
		assert(html.includes('<ul>'));
		assert(html.includes('<li>'));
		assert(html.includes('<a'));
		assert(html.includes('href="/"'));
		assert(html.includes('>Home</a>'));
		assert(html.includes('href="/about"'));
		assert(html.includes('href="/contact"'));
	});

	await t.step("Article with header and sections", () => {
		const spec = ps(`[([h.article
			[h.header [h.h1 "Article Title"]]
			[h.section [h.p "First paragraph"]]
			[h.section [h.p "Second paragraph"]]
			[h.footer "Published 2025"]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('<article>'));
		assert(html.includes('<header>'));
		assert(html.includes('<h1>Article Title</h1>'));
		assert(html.includes('<section>'));
		assert(html.includes('<p>First paragraph</p>'));
		assert(html.includes('<p>Second paragraph</p>'));
		assert(html.includes('<footer>Published 2025</footer>'));
	});
});

Deno.test("Compound SSR - Core Components Integration", async (t) => {
	await t.step("Text nodes (m.t) in HTML", () => {
		const html = renderHTML(ps('[([h.div [m.t t="Explicit text node"]])]'));
		assertEquals(html, '<div>Explicit text node</div>');
	});

	await t.step("Comments (m.com) in HTML", () => {
		const html = renderHTML(ps('[([h.div [m.com t="This is a comment"] "Content"])]'));
		assert(html.includes('<!--This is a comment-->'));
		assert(html.includes('Content'));
	});

	await t.step("Fragments (m.frg) flatten into parent", () => {
		const html = renderHTML(ps('[([h.div [m.frg "Text1" "Text2"]])]'));
		assertEquals(html, '<div>Text1Text2</div>');
	});

	await t.step("Mixed HTML and core components", () => {
		const spec = ps(`[([h.div
			[m.com t="Section start"]
			[h.p "Paragraph"]
			[m.frg "Fragment" " content"]
			[m.com t="Section end"]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('<!--Section start-->'));
		assert(html.includes('<p>Paragraph</p>'));
		assert(html.includes('Fragment content'));
		assert(html.includes('<!--Section end-->'));
	});
});

Deno.test("Compound SSR - Special Attributes", async (t) => {
	await t.step("Boolean attributes", () => {
		const html = renderHTML(ps('[([h.input type=checkbox checked=@t disabled=@t])]'));
		assert(html.includes('<input'));
		assert(html.includes('type="checkbox"'));
		assert(html.includes(' checked'));
		assert(html.includes(' disabled'));
		assert(!html.includes('checked="'));
		assert(!html.includes('disabled="'));
	});

	await t.step("Data attributes", () => {
		const html = renderHTML(ps('[([h.div data-id=123 data-name=test "Content"])]'));
		assert(html.includes('data-id="123"'));
		assert(html.includes('data-name="test"'));
	});

	await t.step("ARIA attributes", () => {
		const html = renderHTML(ps('[([h.button aria-label="Close" aria-pressed=@t "X"])]'));
		assert(html.includes('aria-label="Close"'));
		assert(html.includes(' aria-pressed'));
	});

	await t.step("Class attribute", () => {
		const html = renderHTML(ps('[([h.div class="btn btn-primary active" "Button"])]'));
		assert(html.includes('class="btn btn-primary active"'));
	});

	await t.step("Style attribute", () => {
		const html = renderHTML(ps('[([h.div style="color: red; margin: 10px" "Styled"])]'));
		assert(html.includes('style="color:red;margin:10px"'));
	});

	await t.step("Multiple attributes on nested elements", () => {
		const spec = ps(`[([h.div id=outer class=container
			[h.div id=inner class=box data-value=42 "Content"]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('id="outer"'));
		assert(html.includes('class="container"'));
		assert(html.includes('id="inner"'));
		assert(html.includes('class="box"'));
		assert(html.includes('data-value="42"'));
	});

	await t.step("Numeric attributes via setAttr with JS numbers", () => {
		const doc = getInstance('MWIDocument');
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-count', 100);
		divNode.setAttr('data-index', 0);
		divNode.setAttr('tabindex', -1);
		divNode.append('Content');
		const html = divNode.getHTML();

		assert(html.includes('data-count="100"'), 'Should render positive number');
		assert(html.includes('data-index="0"'), 'Should render zero');
		assert(html.includes('tabindex="-1"'), 'Should render negative number');
	});

	await t.step("Numeric attributes in nested SLID spec", () => {
		const spec = ps(`[([h.div data-outer=1
			[h.div data-inner=2 data-zero=0 data-neg=-5 "Nested"]
		])]`);
		const html = renderHTML(spec);

		assert(html.includes('data-outer="1"'), 'Should render number on outer element');
		assert(html.includes('data-inner="2"'), 'Should render number on inner element');
		assert(html.includes('data-zero="0"'), 'Should render zero');
		assert(html.includes('data-neg="-5"'), 'Should render negative number');
	});
});

Deno.test("Compound SSR - Edge Cases", async (t) => {
	await t.step("Empty elements", () => {
		const html = renderHTML(ps('[([h.div])]'));
		assertEquals(html, '<div></div>');
	});

	await t.step("Element with only whitespace", () => {
		const html = renderHTML(ps('[([h.div "   "])]'));
		assertEquals(html, '<div>   </div>');
	});

	await t.step("Multiple void elements", () => {
		const html = renderHTML(ps('[([h.br] [h.hr] [h.br])]'));
		assertEquals(html, '<br><hr><br>');
	});

	await t.step("Deeply nested with void elements", () => {
		const html = renderHTML(ps('[([h.div [h.p "Text" [h.br] "More"]])]'));
		assert(html.includes('<div>'));
		assert(html.includes('<p>'));
		assert(html.includes('Text'));
		assert(html.includes('<br>'));
		assert(html.includes('More'));
		assert(html.includes('</p>'));
		assert(html.includes('</div>'));
	});

	await t.step("Empty fragment", () => {
		const html = renderHTML(ps('[([h.div [m.frg]])]'));
		assertEquals(html, '<div></div>');
	});

	await t.step("Multiple empty elements", () => {
		const html = renderHTML(ps('[([h.div] [h.span] [h.p])]'));
		assertEquals(html, '<div></div><span></span><p></p>');
	});
});

Deno.test("Compound SSR - Real-World Patterns", async (t) => {
	await t.step("Card component pattern", () => {
		const spec = ps(`[([h.div class=card
			[h.div class=card-header [h.h3 "Card Title"]]
			[h.div class=card-body [h.p "Card content goes here."]]
			[h.div class=card-footer [h.button "Action"]]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('class="card"'));
		assert(html.includes('class="card-header"'));
		assert(html.includes('class="card-body"'));
		assert(html.includes('class="card-footer"'));
		assert(html.includes('<h3>Card Title</h3>'));
		assert(html.includes('<p>Card content goes here.</p>'));
		assert(html.includes('<button>Action</button>'));
	});

	await t.step("Hero section pattern", () => {
		const spec = ps(`[([h.section class=hero
			[h.div class=hero-content
				[h.h1 "Welcome"]
				[h.p "Subtitle text"]
				[h.button class=cta "Get Started"]
			]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('<section'));
		assert(html.includes('class="hero"'));
		assert(html.includes('<h1>Welcome</h1>'));
		assert(html.includes('class="cta"'));
	});

	await t.step("Grid layout pattern", () => {
		const spec = ps(`[([h.div class=grid
			[h.div class=grid-item "Item 1"]
			[h.div class=grid-item "Item 2"]
			[h.div class=grid-item "Item 3"]
			[h.div class=grid-item "Item 4"]
		])]`);
		const html = renderHTML(spec);
		assert(html.includes('class="grid"'));
		const itemCount = (html.match(/class="grid-item"/g) || []).length;
		assertEquals(itemCount, 4);
	});

	await t.step("Modal dialog pattern", () => {
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
		const html = renderHTML(spec);
		assert(html.includes('class="modal"'));
		assert(html.includes('class="modal-overlay"'));
		assert(html.includes('class="modal-content"'));
		assert(html.includes('<h2>Dialog Title</h2>'));
		assert(html.includes('class="close"'));
	});
});
