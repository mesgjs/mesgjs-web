import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

Deno.test("MWICoreTpl (template handler) - Basic HTML Rendering", async (t) => {
	await t.step("(getHTML) - Renders simple template content", async () => {
		registry.register('test.tpl.simple', ls(['allowLate', true, 'tpl', ps('[([m.t t="Simple template"])]')]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.simple']));
		const html = await tplNode('getHTML');
		assertEquals(html, 'Simple template', 'template content rendered');
	});

	await t.step(".getHTML() - Renders simple template content via JS", async () => {
		registry.register('test.tpl.simple2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Simple template 2"])]')]));
		const tplNode = await doc.createNode('test.tpl.simple2');
		const html = await tplNode.getHTML();
		assertEquals(html, 'Simple template 2', 'template content rendered');
	});

	await t.step("(getHTML) - Renders empty template", async () => {
		registry.register('test.tpl.empty', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.empty']));
		const html = await tplNode('getHTML');
		assertEquals(html, '', 'empty template renders empty string');
	});

	await t.step(".getHTML() - Renders empty template via JS", async () => {
		registry.register('test.tpl.empty2', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = await doc.createNode('test.tpl.empty2');
		const html = await tplNode.getHTML();
		assertEquals(html, '', 'empty template renders empty string');
	});
});

Deno.test("MWICoreTpl (template handler) - Multiple Items", async (t) => {
	await t.step("(getHTML) - Renders multiple text items", async () => {
		registry.register('test.tpl.multi', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="First"] [m.t t="Second"] [m.t t="Third"])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.multi']));
		const html = await tplNode('getHTML');
		assertEquals(html, 'FirstSecondThird', 'all items rendered in sequence');
	});

	await t.step(".getHTML() - Renders multiple text items via JS", async () => {
		registry.register('test.tpl.multi2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="A"] [m.t t="B"] [m.t t="C"])]')
		]));
		const tplNode = await doc.createNode('test.tpl.multi2');
		const html = await tplNode.getHTML();
		assertEquals(html, 'ABC', 'all items rendered in sequence');
	});
});

Deno.test("MWICoreTpl (template handler) - Nested Structure", async (t) => {
	await t.step("(getHTML) - Renders nested fragments", async () => {
		registry.register('test.tpl.nested', ls([
			'allowLate', true,
			'tpl', ps('[([m.frg [m.t t="Outer"] [m.frg [m.t t="Inner"]]])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.nested']));
		const html = await tplNode('getHTML');
		assertEquals(html, 'OuterInner', 'nested content rendered correctly');
	});

	await t.step(".getHTML() - Renders nested fragments via JS", async () => {
		registry.register('test.tpl.nested2', ls([
			'allowLate', true,
			'tpl', ps('[([m.frg [m.t t="Level1"] [m.frg [m.t t="Level2"]]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.nested2');
		const html = await tplNode.getHTML();
		assertEquals(html, 'Level1Level2', 'nested content rendered correctly');
	});
});

Deno.test("MWICoreTpl (template handler) - Mixed Content Types", async (t) => {
	await t.step("(getHTML) - Renders text, comment, and fragment", async () => {
		registry.register('test.tpl.mixed', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Text"] [m.com t="Comment"] [m.frg [m.t t="Fragment"]])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.mixed']));
		const html = await tplNode('getHTML');
		assertEquals(html, 'Text<!--Comment-->Fragment', 'mixed content rendered correctly');
	});

	await t.step(".getHTML() - Renders text, comment, and fragment via JS", async () => {
		registry.register('test.tpl.mixed2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="A"] [m.com t="B"] [m.frg [m.t t="C"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.mixed2');
		const html = await tplNode.getHTML();
		assertEquals(html, 'A<!--B-->C', 'mixed content rendered correctly');
	});
});

Deno.test("MWICoreTpl (template handler) - Slot Integration (Template as SlotSrc)", async (t) => {
	await t.step("(getHTML) - Template with named slot renders empty when template has no matching attribute", async () => {
		registry.register('test.tpl.slot', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.slot']));
		const html = await tplNode('getHTML');
		assertEquals(html, '', 'named slot without matching template attribute renders empty');
	});

	await t.step(".getHTML() - Template with named slot renders empty when template has no matching attribute via JS", async () => {
		registry.register('test.tpl.slot2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=data])]')
		]));
		const tplNode = await doc.createNode('test.tpl.slot2');
		const html = await tplNode.getHTML();
		assertEquals(html, '', 'named slot without matching template attribute renders empty');
	});

	await t.step("(getHTML) - Template with default slot content", async () => {
		registry.register('test.tpl.slot.default', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Default content"]])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.slot.default']));
		const html = await tplNode('getHTML');
		assertEquals(html, 'Default content', 'default slot content rendered');
	});

	await t.step(".getHTML() - Template with default slot content via JS", async () => {
		registry.register('test.tpl.slot.default2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Fallback"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.slot.default2');
		const html = await tplNode.getHTML();
		assertEquals(html, 'Fallback', 'default slot content rendered');
	});

	await t.step("(getHTML) - Template acts as slotSrc for its content - named slots filled from template attributes", async () => {
		registry.register('test.tpl.slot.named', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=header] [m.t t="Body"] [m.slot name=footer])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.slot.named']));
		// The template itself is the slotSrc for its content
		// Set attributes on the template that its slots will reference
		tplNode('setAttr', ls([, 'header', , ps('[([m.t t="Header content"])]')]));
		tplNode('setAttr', ls([, 'footer', , ps('[([m.t t="Footer content"])]')]));
		const html = await tplNode('getHTML');
		assertEquals(html, 'Header contentBodyFooter content', 'named slots filled from template attributes');
	});

	await t.step(".getHTML() - Template acts as slotSrc for its content - named slots filled from template attributes via JS", async () => {
		registry.register('test.tpl.slot.named2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=top] [m.t t="Middle"] [m.slot name=bottom])]')
		]));
		const tplNode = await doc.createNode('test.tpl.slot.named2');
		// The template itself is the slotSrc for its content
		tplNode.setAttr('top', ps('[([m.t t="Top content"])]'));
		tplNode.setAttr('bottom', ps('[([m.t t="Bottom content"])]'));
		const html = await tplNode.getHTML();
		assertEquals(html, 'Top contentMiddleBottom content', 'named slots filled from template attributes');
	});

	await t.step("(getHTML) - Template with default slot and natural children", async () => {
		registry.register('test.tpl.slot.children', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Default"]])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.slot.children']));
		// The template itself is the slotSrc for its content
		// Add natural children to the template
		tplNode('append', ls([, 'Natural child content']));
		const html = await tplNode('getHTML');
		assertEquals(html, 'Natural child content', 'default slot filled from template natural children');
	});

	await t.step(".getHTML() - Template with default slot and natural children via JS", async () => {
		registry.register('test.tpl.slot.children2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Fallback"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.slot.children2');
		// The template itself is the slotSrc for its content
		tplNode.append('Child content');
		const html = await tplNode.getHTML();
		assertEquals(html, 'Child content', 'default slot filled from template natural children');
	});
});

Deno.test("MWICoreTpl (template handler) - HTML Elements", async (t) => {
	await t.step("(getHTML) - Template with HTML div", async () => {
		registry.register('test.tpl.html', ls([
			'allowLate', true,
			'tpl', ps('[([h.div [m.t t="Template with HTML"]])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.html']));
		const html = await tplNode('getHTML');
		assertEquals(html, '<div>Template with HTML</div>', 'HTML element rendered correctly');
	});

	await t.step(".getHTML() - Template with HTML div via JS", async () => {
		registry.register('test.tpl.html2', ls([
			'allowLate', true,
			'tpl', ps('[([h.span [m.t t="Span content"]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.html2');
		const html = await tplNode.getHTML();
		assertEquals(html, '<span>Span content</span>', 'HTML element rendered correctly');
	});

	await t.step("(getHTML) - Template with complex HTML structure", async () => {
		registry.register('test.tpl.complex', ls([
			'allowLate', true,
			'tpl', ps('[([h.div class=container [h.h1 [m.t t="Title"]] [h.p [m.t t="Content"]]])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.complex']));
		const html = await tplNode('getHTML');
		assertEquals(html, '<div class="container"><h1>Title</h1><p>Content</p></div>', 'complex HTML rendered correctly');
	});

	await t.step(".getHTML() - Template with complex HTML structure via JS", async () => {
		registry.register('test.tpl.complex2', ls([
			'allowLate', true,
			'tpl', ps('[([h.section [h.h2 [m.t t="Heading"]] [h.div [m.t t="Text"]]])]')
		]));
		const tplNode = await doc.createNode('test.tpl.complex2');
		const html = await tplNode.getHTML();
		assertEquals(html, '<section><h2>Heading</h2><div>Text</div></section>', 'complex HTML rendered correctly');
	});
});

Deno.test("MWICoreTpl (template handler) - Template Attributes Don't Render", async (t) => {
	await t.step("(getHTML) - Template attributes used for slotting don't appear in output", async () => {
		registry.register('test.tpl.noattr', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=header] [m.t t="Body"] [m.slot name=footer])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.noattr']));
		tplNode('setAttr', ls([, 'header', , ps('[([m.t t="Header"])]')]));
		tplNode('setAttr', ls([, 'footer', , ps('[([m.t t="Footer"])]')]));
		tplNode('setAttr', ls([, 'id', , 'tpl-id']));
		tplNode('setAttr', ls([, 'class', , 'tpl-class']));
		const html = await tplNode('getHTML');
		// The template's attributes are used for slotting but don't render as HTML attributes
		assertEquals(html, 'HeaderBodyFooter', 'template content rendered');
		assert(!html.includes('tpl-id'), 'template id not in output');
		assert(!html.includes('tpl-class'), 'template class not in output');
	});

	await t.step(".getHTML() - Template attributes used for slotting don't appear in output via JS", async () => {
		registry.register('test.tpl.noattr2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=a] [m.t t="B"] [m.slot name=c])]')
		]));
		const tplNode = await doc.createNode('test.tpl.noattr2');
		tplNode.setAttr('a', ps('[([m.t t="A"])]'));
		tplNode.setAttr('c', ps('[([m.t t="C"])]'));
		tplNode.setAttr('id', 'js-tpl-id');
		tplNode.setAttr('data-test', 'test-value');
		const html = await tplNode.getHTML();
		assertEquals(html, 'ABC', 'template content rendered');
		assert(!html.includes('js-tpl-id'), 'template id not in output');
		assert(!html.includes('test-value'), 'template data attribute not in output');
	});
});

Deno.test("MWICoreTpl (template handler) - Attribute Slotting with m.slat", async (t) => {
	await t.step("(getHTML) - Template can use m.slat to remap attributes for its content", async () => {
		// Register a template with a slot that expects 'title' attribute
		registry.register('test.tpl.slat', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=title])]')
		]));

		// Create an external node with c.title attribute
		const externalNode = await doc('createNode', ls([, 'h.div']));
		externalNode('setAttr', ls([, 'c.title', , ps('[([m.t t="Custom Title"])]')]));

		// Create the template with slotSrc and m.slat to remap c.title -> title
		const tplNode = await doc('createNode', ls([, 'test.tpl.slat', 'slotSrc', externalNode]));
		tplNode('setAttr', ls([, 'm.slat', , ps('[(title=[c.title])]')]));

		const html = await tplNode('getHTML');
		// The slot looks for 'title' and m.slat remaps c.title from slotSrc -> title on template
		assertEquals(html, 'Custom Title', 'attribute slotting works correctly');
	});

	await t.step(".getHTML() - Template can use m.slat to remap attributes for its content via JS", async () => {
		registry.register('test.tpl.slat2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));

		// Create an external node with c.body attribute
		const externalNode = await doc.createNode('h.div');
		externalNode.setAttr('c.body', ps('[([m.t t="Body Text"])]'));

		// Create the template with slotSrc and m.slat to remap c.body -> content
		const tplNode = await doc.createNode('test.tpl.slat2', { slotSrc: externalNode });
		tplNode.setAttr('m.slat', ps('[(content=[c.body])]'));

		const html = await tplNode.getHTML();
		assertEquals(html, 'Body Text', 'attribute slotting works correctly');
	});
});

Deno.test("MWICoreTpl (template handler) - Special Characters in Template", async (t) => {
	await t.step("(getHTML) - Template with HTML entities", async () => {
		registry.register('test.tpl.entities', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="<>&\\"\'"])]')
		]));
		const tplNode = await doc('createNode', ls([, 'test.tpl.entities']));
		const html = await tplNode('getHTML');
		assertEquals(html, '&lt;&gt;&amp;"\'', 'HTML entities escaped correctly');
	});

	await t.step(".getHTML() - Template with HTML entities via JS", async () => {
		registry.register('test.tpl.entities2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Test & <test>"])]')
		]));
		const tplNode = await doc.createNode('test.tpl.entities2');
		const html = await tplNode.getHTML();
		assertEquals(html, 'Test &amp; &lt;test&gt;', 'HTML entities escaped correctly');
	});
});

Deno.test("MWICoreTpl (template handler) - Template with External SlotSrc", async (t) => {
	await t.step("(getHTML) - Template's slotSrc property is for the template itself, not its content", async () => {
		// Create an external node to act as slotSrc for the template
		const externalNode = await doc('createNode', ls([, 'h.div']));
		externalNode('setAttr', ls([, 'external-attr', , ps('[([m.t t="External"])]')]));

		// Create a template with a slot that references an attribute
		registry.register('test.tpl.external', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));

		// Create the template with the external slotSrc
		const tplNode = await doc('createNode', ls([, 'test.tpl.external', 'slotSrc', externalNode]));

		// The template's content slots from the template itself, not from externalNode
		// So setting 'content' on the template should work
		tplNode('setAttr', ls([, 'content', , ps('[([m.t t="Template Content"])]')]));
		const html = await tplNode('getHTML');
		assertEquals(html, 'Template Content', 'template content slots from template, not external slotSrc');
	});

	await t.step(".getHTML() - Template's slotSrc property is for the template itself, not its content via JS", async () => {
		const externalNode = await doc.createNode('h.div');
		externalNode.setAttr('external-attr', ps('[([m.t t="External"])]'));

		registry.register('test.tpl.external2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=data])]')
		]));

		const tplNode = await doc.createNode('test.tpl.external2', { slotSrc: externalNode });
		tplNode.setAttr('data', ps('[([m.t t="Template Data"])]'));
		const html = await tplNode.getHTML();
		assertEquals(html, 'Template Data', 'template content slots from template, not external slotSrc');
	});
});
