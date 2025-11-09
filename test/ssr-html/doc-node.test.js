import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

Deno.test("MWIDocNode - Basic HTML Rendering", async (t) => {
	await t.step("(getHTML) - Empty element (no attributes, no children)", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const html = divNode('getHTML');
		assertEquals(html, '<div></div>');
	});

	await t.step(".getHTML() - Empty element via JS", () => {
		const divNode = doc.createNode('h.div');
		const html = divNode.getHTML();
		assertEquals(html, '<div></div>');
	});

	await t.step("(getHTML) - Element with attributes only", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'id', , 'test-id']));
		divNode('setAttr', ls([, 'class', , 'test-class']));
		const html = divNode('getHTML');
		assert(html.includes('<div'));
		assert(html.includes('id="test-id"'));
		assert(html.includes('class="test-class"'));
		assert(html.includes('</div>'));
	});

	await t.step(".getHTML() - Element with attributes only via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-test-id');
		divNode.setAttr('title', 'Test Title');
		const html = divNode.getHTML();
		assert(html.includes('<div'));
		assert(html.includes('id="js-test-id"'));
		assert(html.includes('title="Test Title"'));
		assert(html.includes('</div>'));
	});

	await t.step("(getHTML) - Element with children only", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Child text']));
		divNode('append', ls([, textNode]));
		const html = divNode('getHTML');
		assertEquals(html, '<div>Child text</div>');
	});

	await t.step(".getHTML() - Element with children only via JS", () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child text');
		divNode.append(textNode);
		const html = divNode.getHTML();
		assertEquals(html, '<div>JS Child text</div>');
	});

	await t.step("(getHTML) - Element with both attributes and children", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'id', , 'container']));
		divNode('setAttr', ls([, 'class', , 'wrapper']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Content']));
		divNode('append', ls([, textNode]));
		const html = divNode('getHTML');
		assert(html.includes('<div'));
		assert(html.includes('id="container"'));
		assert(html.includes('class="wrapper"'));
		assert(html.includes('>Content</div>'));
	});

	await t.step(".getHTML() - Element with both attributes and children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-container');
		divNode.setAttr('data-test', 'value');
		divNode.append('JS Content');
		const html = divNode.getHTML();
		assert(html.includes('<div'));
		assert(html.includes('id="js-container"'));
		assert(html.includes('data-test="value"'));
		assert(html.includes('>JS Content</div>'));
	});

	await t.step("(getHTML) - Void element (h.br)", () => {
		const brNode = doc('createNode', ls([, 'h.br']));
		const html = brNode('getHTML');
		// Void elements render without closing tag
		assertEquals(html, '<br>');
	});

	await t.step(".getHTML() - Void element (h.br) via JS", () => {
		const brNode = doc.createNode('h.br');
		const html = brNode.getHTML();
		assertEquals(html, '<br>');
	});
});

Deno.test("MWIDocNode - Attribute Rendering", async (t) => {
	await t.step("(getHTML) - Standard HTML attributes", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'id', , 'my-id']));
		divNode('setAttr', ls([, 'class', , 'my-class']));
		divNode('setAttr', ls([, 'title', , 'My Title']));
		divNode('setAttr', ls([, 'data-value', , 'test']));
		const html = divNode('getHTML');
		assert(html.includes('id="my-id"'));
		assert(html.includes('class="my-class"'));
		assert(html.includes('title="My Title"'));
		assert(html.includes('data-value="test"'));
	});

	await t.step(".getHTML() - Standard HTML attributes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-id');
		divNode.setAttr('aria-label', 'Label');
		divNode.setAttr('data-test', 'value');
		const html = divNode.getHTML();
		assert(html.includes('id="js-id"'));
		assert(html.includes('aria-label="Label"'));
		assert(html.includes('data-test="value"'));
	});

	await t.step("(getHTML) - Boolean attributes", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'disabled', , true]));
		divNode('setAttr', ls([, 'hidden', , true]));
		const html = divNode('getHTML');
		// Boolean attributes should render without value
		assert(html.includes(' disabled'));
		assert(html.includes(' hidden'));
		assert(!html.includes('disabled="'));
		assert(!html.includes('hidden="'));
	});

	await t.step(".getHTML() - Boolean attributes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('disabled', true);
		divNode.setAttr('readonly', true);
		const html = divNode.getHTML();
		assert(html.includes(' disabled'));
		assert(html.includes(' readonly'));
		assert(!html.includes('disabled="'));
		assert(!html.includes('readonly="'));
	});

	await t.step("(getHTML) - String attributes are quoted", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'title', , 'Test Value']));
		const html = divNode('getHTML');
		assert(html.includes('title="Test Value"'));
	});

	await t.step(".getHTML() - String attributes are quoted via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-info', 'Information');
		const html = divNode.getHTML();
		assert(html.includes('data-info="Information"'));
	});

	await t.step("(getHTML) - Non-HTML attributes do not render (m.id)", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'id', , 'real-id']));
		// Access m.id to ensure it's set
		divNode('getAttr', ls([, 'm.id']));
		const html = divNode('getHTML');
		assert(html.includes('id="real-id"'));
		assert(!html.includes('m.id'));
	});

	await t.step(".getHTML() - Non-HTML attributes do not render (m.percl)", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm-class');
		const html = divNode.getHTML();
		assert(!html.includes('m.percl'));
		// But the permanent class should appear in the class attribute
		assert(html.includes('class="perm-class"'));
	});

	await t.step("(getHTML) - Non-HTML attributes do not render (m.slat)", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[])]')]));
		const html = divNode('getHTML');
		assert(!html.includes('m.slat'));
	});

	await t.step(".getHTML() - Non-HTML attributes do not render (m.coat)", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));
		const html = divNode.getHTML();
		assert(!html.includes('m.coat'));
	});

	await t.step("(getHTML) - Uppercase attributes do not render", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'ID', , 'uppercase-id']));
		divNode('setAttr', ls([, 'id', , 'lowercase-id']));
		const html = divNode('getHTML');
		assert(!html.includes('ID='));
		assert(html.includes('id="lowercase-id"'));
	});

	await t.step(".getHTML() - Dot-prefixed attributes do not render", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('.private', 'value');
		divNode.setAttr('id', 'public-id');
		const html = divNode.getHTML();
		assert(!html.includes('.private'));
		assert(html.includes('id="public-id"'));
	});

	await t.step("(getHTML) - List-valued attributes do not render", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const listVal = ps('[(item1 item2 item3)]');
		divNode('setAttr', ls([, 'c.items', , listVal]));
		divNode('setAttr', ls([, 'id', , 'test-id']));
		const html = divNode('getHTML');
		assert(!html.includes('c.items'));
		assert(html.includes('id="test-id"'));
	});

	await t.step(".getHTML() - List-valued attributes do not render via JS", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(alpha beta gamma)]');
		divNode.setAttr('c.data', listVal);
		divNode.setAttr('title', 'Test');
		const html = divNode.getHTML();
		assert(!html.includes('c.data'));
		assert(html.includes('title="Test"'));
	});
});

Deno.test("MWIDocNode - HTML Escaping", async (t) => {
	await t.step("(getHTML) - Escape < in attribute value", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'title', , 'Value with < character']));
		const html = divNode('getHTML');
		assert(html.includes('title="Value with &lt; character"'));
	});

	await t.step(".getHTML() - Escape > in attribute value via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', 'Value with > character');
		const html = divNode.getHTML();
		assert(html.includes('title="Value with &gt; character"'));
	});

	await t.step("(getHTML) - Escape & in attribute value", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'title', , 'Value with & character']));
		const html = divNode('getHTML');
		assert(html.includes('title="Value with &amp; character"'));
	});

	await t.step(".getHTML() - Escape \" in attribute value via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', 'Value with " quotes');
		const html = divNode.getHTML();
		assert(html.includes('title="Value with &quot; quotes"'));
	});

	await t.step("(getHTML) - Escape all special characters in attribute", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'title', , '<tag> & "quotes"']));
		const html = divNode('getHTML');
		assert(html.includes('title="&lt;tag&gt; &amp; &quot;quotes&quot;"'));
	});

	await t.step(".getHTML() - Escape Unicode characters in attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', 'Text\u0100here');
		const html = divNode.getHTML();
		assert(html.includes('&#256;'));
	});

	await t.step("(getHTML) - Escape control characters in attribute", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'title', , 'Text\x01here']));
		const html = divNode('getHTML');
		assert(html.includes('&#1;'));
	});

	await t.step(".getHTML() - Complex escaping in attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('title', '<script>alert("XSS")</script>');
		const html = divNode.getHTML();
		assert(html.includes('&lt;script&gt;'));
		assert(html.includes('&quot;XSS&quot;'));
		assert(html.includes('&lt;/script&gt;'));
	});
});

Deno.test("MWIDocNode - Child Content Rendering", async (t) => {
	await t.step("(getHTML) - Single text child", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Single child']));
		divNode('append', ls([, textNode]));
		const html = divNode('getHTML');
		assertEquals(html, '<div>Single child</div>');
	});

	await t.step(".getHTML() - Single text child via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('JS single child');
		const html = divNode.getHTML();
		assertEquals(html, '<div>JS single child</div>');
	});

	await t.step("(getHTML) - Multiple text children", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const text1 = doc('createNode', ls([, 'm.t']));
		text1('setAttr', ls([, 't', , 'First']));
		const text2 = doc('createNode', ls([, 'm.t']));
		text2('setAttr', ls([, 't', , 'Second']));
		const text3 = doc('createNode', ls([, 'm.t']));
		text3('setAttr', ls([, 't', , 'Third']));
		divNode('append', ls([, text1, , text2, , text3]));
		const html = divNode('getHTML');
		assertEquals(html, '<div>FirstSecondThird</div>');
	});

	await t.step(".getHTML() - Multiple text children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('First', 'Second', 'Third');
		const html = divNode.getHTML();
		assertEquals(html, '<div>FirstSecondThird</div>');
	});

	await t.step("(getHTML) - Mixed content (text and element children)", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Text']));
		const spanNode = doc('createNode', ls([, 'h.span']));
		spanNode('append', ls([, 'Span']));
		divNode('append', ls([, textNode, , spanNode]));
		const html = divNode('getHTML');
		assertEquals(html, '<div>Text<span>Span</span></div>');
	});

	await t.step(".getHTML() - Mixed content via JS", () => {
		const divNode = doc.createNode('h.div');
		const spanNode = doc.createNode('h.span');
		spanNode.append('Span content');
		divNode.append('Before', spanNode, 'After');
		const html = divNode.getHTML();
		assertEquals(html, '<div>Before<span>Span content</span>After</div>');
	});

	await t.step("(getHTML) - Nested elements", () => {
		const outerDiv = doc('createNode', ls([, 'h.div']));
		const innerDiv = doc('createNode', ls([, 'h.div']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Nested']));
		innerDiv('append', ls([, textNode]));
		outerDiv('append', ls([, innerDiv]));
		const html = outerDiv('getHTML');
		assertEquals(html, '<div><div>Nested</div></div>');
	});

	await t.step(".getHTML() - Nested elements via JS", () => {
		const outerDiv = doc.createNode('h.div');
		const innerDiv = doc.createNode('h.div');
		innerDiv.append('Inner content');
		outerDiv.append(innerDiv);
		const html = outerDiv.getHTML();
		assertEquals(html, '<div><div>Inner content</div></div>');
	});

	await t.step("(getHTML) - Void element has no children in output", () => {
		const brNode = doc('createNode', ls([, 'h.br']));
		// Try to append (should be ignored)
		brNode('append', ls([, 'text']));
		const html = brNode('getHTML');
		assertEquals(html, '<br>');
		assert(!html.includes('text'));
	});

	await t.step(".getHTML() - Void element has no children in output via JS", () => {
		const brNode = doc.createNode('h.br');
		brNode.append('ignored text');
		const html = brNode.getHTML();
		assertEquals(html, '<br>');
		assert(!html.includes('ignored'));
	});
});

Deno.test("MWIDocNode - Edge Cases", async (t) => {
	await t.step("(getHTML) - Element with only whitespace text children", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , '   ']));
		divNode('append', ls([, textNode]));
		const html = divNode('getHTML');
		assertEquals(html, '<div>   </div>');
	});

	await t.step(".getHTML() - Element with only whitespace text children via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('   ');
		const html = divNode.getHTML();
		assertEquals(html, '<div>   </div>');
	});

	await t.step("(getHTML) - Element with empty text nodes", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const text1 = doc('createNode', ls([, 'm.t']));
		text1('setAttr', ls([, 't', , '']));
		const text2 = doc('createNode', ls([, 'm.t']));
		text2('setAttr', ls([, 't', , 'Content']));
		const text3 = doc('createNode', ls([, 'm.t']));
		text3('setAttr', ls([, 't', , '']));
		divNode('append', ls([, text1, , text2, , text3]));
		const html = divNode('getHTML');
		assertEquals(html, '<div>Content</div>');
	});

	await t.step(".getHTML() - Element with empty text nodes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.append('', 'Content', '');
		const html = divNode.getHTML();
		assertEquals(html, '<div>Content</div>');
	});

	await t.step("(getHTML) - Deeply nested structure", () => {
		const level1 = doc('createNode', ls([, 'h.div']));
		const level2 = doc('createNode', ls([, 'h.div']));
		const level3 = doc('createNode', ls([, 'h.div']));
		const level4 = doc('createNode', ls([, 'h.div']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Deep']));
		level4('append', ls([, textNode]));
		level3('append', ls([, level4]));
		level2('append', ls([, level3]));
		level1('append', ls([, level2]));
		const html = level1('getHTML');
		assertEquals(html, '<div><div><div><div>Deep</div></div></div></div>');
	});

	await t.step(".getHTML() - Deeply nested structure via JS", () => {
		const level1 = doc.createNode('h.div');
		const level2 = doc.createNode('h.div');
		const level3 = doc.createNode('h.div');
		level3.append('Deep content');
		level2.append(level3);
		level1.append(level2);
		const html = level1.getHTML();
		assertEquals(html, '<div><div><div>Deep content</div></div></div>');
	});

	await t.step("(getHTML) - Void element with attempted children (should ignore)", () => {
		const brNode = doc('createNode', ls([, 'h.br']));
		const textNode = doc('createNode', ls([, 'm.t']));
		textNode('setAttr', ls([, 't', , 'Should not appear']));
		brNode('append', ls([, textNode]));
		const html = brNode('getHTML');
		assertEquals(html, '<br>');
		assert(!html.includes('Should not appear'));
	});

	await t.step(".getHTML() - Void element with attempted children via JS", () => {
		const brNode = doc.createNode('h.br');
		brNode.append('Should not appear');
		const html = brNode.getHTML();
		assertEquals(html, '<br>');
		assert(!html.includes('Should not appear'));
	});

	await t.step("(getHTML) - List-valued attributes preserved but not rendered", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		const listVal = ps('[(item1 item2 item3)]');
		divNode('setAttr', ls([, 'c.items', , listVal]));
		divNode('append', ls([, 'Content']));
		const html = divNode('getHTML');
		// List attribute should not appear in HTML
		assert(!html.includes('c.items'));
		assert(!html.includes('item1'));
		// But content should render
		assert(html.includes('Content'));
	});

	await t.step(".getHTML() - List-valued attributes preserved but not rendered via JS", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(alpha beta gamma)]');
		divNode.setAttr('c.data', listVal);
		divNode.append('Content');
		const html = divNode.getHTML();
		assert(!html.includes('c.data'));
		assert(!html.includes('alpha'));
		assert(html.includes('Content'));
	});
});

Deno.test("MWIDocNode - Slotting Without Slot Source", async (t) => {
	await t.step("(getHTML) - m.slat with no slot source uses else default", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[missing else=DefaultValue])]')]));
		const html = divNode('getHTML');
		assert(html.includes('title="DefaultValue"'));
	});

	await t.step(".getHTML() - m.slat with no slot source uses else default via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[missing else="JS DefaultValue"])]'));
		const html = divNode.getHTML();
		assert(html.includes('title="JS DefaultValue"'));
	});

	await t.step("(getHTML) - Multiple m.slat targets with no slot source", () => {
		const divNode = doc('createNode', ls([, 'h.div']));
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[src1 else=Default1] data-info=[src2 else=Default2])]')]));
		const html = divNode('getHTML');
		assert(html.includes('title="Default1"'));
		assert(html.includes('data-info="Default2"'));
	});

	await t.step(".getHTML() - Multiple m.slat targets with no slot source via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[src1 else="JS Default1"] data-info=[src2 else="JS Default2"])]'));
		const html = divNode.getHTML();
		assert(html.includes('title="JS Default1"'));
		assert(html.includes('data-info="JS Default2"'));
	});
});

Deno.test("MWIDocNode - Computed Attributes: m.percl with @@", async (t) => {
	await t.step("(getHTML) - m.percl with @@ expands to m.ci from template", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.percl.aa1', ls([
			'allowLate', true,
			'tpl', ps('[([h.div m.percl="@@" id=test1])]')
		]));
		const tplNode = doc.createNode('test.ssr.percl.aa1');
		const html = tplNode.getHTML();
		
		// Get the component ID
		const compId = tplNode.getAttr('m.ci');
		
		// HTML should contain the component ID as a class
		assert(html.includes(`class="${compId}"`), 'Should have component ID as class');
	});

	await t.step(".getHTML() - m.percl with @@ expands to m.ci from template via JS", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.percl.aa2', ls([
			'allowLate', true,
			'tpl', ps('[([h.div m.percl="@@" id=test2])]')
		]));
		const tplNode = doc.createNode('test.ssr.percl.aa2');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(`class="${compId}"`), 'Should have component ID as class');
	});

	await t.step("(getHTML) - m.percl with @@ prefix", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.percl.aa3', ls([
			'allowLate', true,
			'tpl', ps('[([h.div m.percl="@@__custom" id=test3])]')
		]));
		const tplNode = doc.createNode('test.ssr.percl.aa3');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(`class="${compId}__custom"`), 'Should have component ID with suffix');
	});

	await t.step(".getHTML() - m.percl with @@ suffix via JS", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.percl.aa4', ls([
			'allowLate', true,
			'tpl', ps('[([h.div m.percl="@@__suffix" id=test4])]')
		]));
		const tplNode = doc.createNode('test.ssr.percl.aa4');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(`class="${compId}__suffix"`), 'Should have component ID with suffix');
	});

});

Deno.test("MWIDocNode - Computed Attributes: class with @@", async (t) => {
	await t.step("(getHTML) - class with @@ expands to m.ci from template", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.class.aa1', ls([
			'allowLate', true,
			'tpl', ps('[([h.div class="@@" id=test5])]')
		]));
		const tplNode = doc.createNode('test.ssr.class.aa1');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(`class="${compId}"`), 'Should have component ID as class');
	});

	await t.step(".getHTML() - class with @@ expands to m.ci from template via JS", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.class.aa2', ls([
			'allowLate', true,
			'tpl', ps('[([h.div class="@@" id=test6])]')
		]));
		const tplNode = doc.createNode('test.ssr.class.aa2');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(`class="${compId}"`), 'Should have component ID as class');
	});

	await t.step("(getHTML) - class with @@ and additional classes", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.class.aa3', ls([
			'allowLate', true,
			'tpl', ps('[([h.div class="@@ extra-class" id=test7])]')
		]));
		const tplNode = doc.createNode('test.ssr.class.aa3');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(compId), 'Should include component ID');
		assert(html.includes('extra-class'), 'Should include extra class');
	});

	await t.step(".getHTML() - class with @@ and additional classes via JS", () => {
		const registry = getInstance('MWIRegistry');
		registry.register('test.ssr.class.aa4', ls([
			'allowLate', true,
			'tpl', ps('[([h.div class="@@ js-extra" id=test8])]')
		]));
		const tplNode = doc.createNode('test.ssr.class.aa4');
		const html = tplNode.getHTML();
		
		const compId = tplNode.getAttr('m.ci');
		assert(html.includes(compId), 'Should include component ID');
		assert(html.includes('js-extra'), 'Should include extra class');
	});
});

Deno.test("MWIDocNode - Computed Attributes: id with @#", async (t) => {
	await t.step("(getHTML) - id with @# expands to m.id", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'parent-id');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#');
		const html = divNode.getHTML();
		
		assert(html.includes('id="parent-id"'), 'Should have parent id');
	});

	await t.step(".getHTML() - id with @# expands to m.id via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'js-parent-id');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#');
		const html = divNode.getHTML();
		
		assert(html.includes('id="js-parent-id"'), 'Should have parent id');
	});

	await t.step("(getHTML) - id with @# for hierarchical id pattern", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'parent-id');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#-child-id');
		const html = divNode.getHTML();
		
		assert(html.includes('id="parent-id-child-id"'), 'Should have hierarchical id');
	});

	await t.step(".getHTML() - id with @# for hierarchical id pattern via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'js-parent');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#-sub-id');
		const html = divNode.getHTML();
		
		assert(html.includes('id="js-parent-sub-id"'), 'Should have hierarchical id');
	});

	await t.step("(getHTML) - id with <.ap> escape for literal @#", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', '<.ap>');
		const html = divNode.getHTML();
		
		assert(html.includes('id="@#"'), 'Should have literal @# as id');
	});

	await t.step(".getHTML() - id with <.ap> escape for literal @# via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', '<.ap>');
		const html = divNode.getHTML();
		
		assert(html.includes('id="@#"'), 'Should have literal @# as id');
	});

	await t.step("(getHTML) - id with coat:false disables computation", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'parent-id');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#', { coat: false });
		const html = divNode.getHTML();
		
		assert(html.includes('id="@#"'), 'Should not compute when coat:false');
	});

	await t.step(".getHTML() - id with coat:false disables computation via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'js-parent-id');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#', { coat: false });
		const html = divNode.getHTML();
		
		assert(html.includes('id="@#"'), 'Should not compute when coat:false');
	});

	await t.step(".getHTML() - id with coat:false disables computation via JS", () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('id', 'js-parent-id');
		
		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('id', '@#', { coat: false });
		const html = divNode.getHTML();
		
		assert(html.includes('id="@#"'), 'Should not compute when coat:false');
	});
});

Deno.test("MWIDocNode - Computed Attributes: m.coat with escapes", async (t) => {
	await t.step("(getHTML) - m.coat with <.aa> escape for literal @@", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(data-test="<.aa>")]'));
		const html = divNode.getHTML();
		
		assert(html.includes('data-test="@@"'), 'Should have literal @@ in attribute');
	});

	await t.step(".getHTML() - m.coat with <.aa> escape for literal @@ via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(data-test="<.aa>")]'));
		const html = divNode.getHTML();
		
		assert(html.includes('data-test="@@"'), 'Should have literal @@ in attribute');
	});

	await t.step("(getHTML) - m.coat with <.ap> escape for literal @#", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(data-test="<.ap>")]'));
		const html = divNode.getHTML();
		
		assert(html.includes('data-test="@#"'), 'Should have literal @# in attribute');
	});

	await t.step(".getHTML() - m.coat with <.ap> escape for literal @# via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.coat', ps('[(data-test="<.ap>")]'));
		const html = divNode.getHTML();
		
		assert(html.includes('data-test="@#"'), 'Should have literal @# in attribute');
	});
});
