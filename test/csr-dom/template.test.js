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
const ls = globalThis.ls;
const ps = globalThis.ps;

// Wait for registry to be ready
await fwait(REG_READY_FT);

// Set up browser-like environment for DOM testing
await simulateBrowser();

const doc = getInstance('MWIDocument');
const registry = getInstance('MWIRegistry');

Deno.test("MWICoreTpl (template handler) - CSR-DOM Basic Rendering", async (t) => {
	await t.step("(getDOM) - Renders simple template content", async () => {
		registry.register('test.tpl.csr.simple', ls(['allowLate', true, 'tpl', ps('[([m.t t="Simple template"])]')]));
		const tplNode = doc('createNode', ['test.tpl.csr.simple']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const outputElem = domNodes.at(0);
		assertEquals(outputElem.tagName, 'OUTPUT');
		assertEquals(outputElem.textContent, 'Simple template');
	});

	await t.step(".getDOM() - Renders simple template content via JS", async () => {
		registry.register('test.tpl.csr.simple2', ls(['allowLate', true, 'tpl', ps('[([m.t t="Simple template 2"])]')]));
		const tplNode = doc.createNode('test.tpl.csr.simple2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Simple template 2');
	});

	await t.step("(getDOM) - Renders empty template", async () => {
		registry.register('test.tpl.csr.empty', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = doc('createNode', ['test.tpl.csr.empty']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);
	});

	await t.step(".getDOM() - Renders empty template via JS", async () => {
		registry.register('test.tpl.csr.empty2', ls(['allowLate', true, 'tpl', ps('[()]')]));
		const tplNode = doc.createNode('test.tpl.csr.empty2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Multiple Items", async (t) => {
	await t.step("(getDOM) - Renders multiple text items", async () => {
		registry.register('test.tpl.csr.multi', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="First"] [m.t t="Second"] [m.t t="Third"])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.multi']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'First');
		assertEquals(domNodes.at(1).textContent, 'Second');
		assertEquals(domNodes.at(2).textContent, 'Third');
	});

	await t.step(".getDOM() - Renders multiple text items via JS", async () => {
		registry.register('test.tpl.csr.multi2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="A"] [m.t t="B"] [m.t t="C"])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.multi2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'A');
		assertEquals(domNodes.at(1).textContent, 'B');
		assertEquals(domNodes.at(2).textContent, 'C');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Nested Structure", async (t) => {
	await t.step("(getDOM) - Renders nested fragments", async () => {
		registry.register('test.tpl.csr.nested', ls([
			'allowLate', true,
			'tpl', ps('[([m.frg [m.t t="Outer"] [m.frg [m.t t="Inner"]]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.nested']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'Outer');
		assertEquals(domNodes.at(1).textContent, 'Inner');
	});

	await t.step(".getDOM() - Renders nested fragments via JS", async () => {
		registry.register('test.tpl.csr.nested2', ls([
			'allowLate', true,
			'tpl', ps('[([m.frg [m.t t="Level1"] [m.frg [m.t t="Level2"]]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.nested2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'Level1');
		assertEquals(domNodes.at(1).textContent, 'Level2');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Mixed Content Types", async (t) => {
	await t.step("(getDOM) - Renders text, comment, and fragment", async () => {
		registry.register('test.tpl.csr.mixed', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Text"] [m.com t="Comment"] [m.frg [m.t t="Fragment"]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.mixed']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).tagName, 'OUTPUT');
		assertEquals(domNodes.at(0).textContent, 'Text');
		assertEquals(domNodes.at(1).nodeType, 8); // Comment node
		assertEquals(domNodes.at(1).textContent, 'Comment');
		assertEquals(domNodes.at(2).tagName, 'OUTPUT');
		assertEquals(domNodes.at(2).textContent, 'Fragment');
	});

	await t.step(".getDOM() - Renders text, comment, and fragment via JS", async () => {
		registry.register('test.tpl.csr.mixed2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="A"] [m.com t="B"] [m.frg [m.t t="C"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.mixed2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'A');
		assertEquals(domNodes.at(1).nodeType, 8);
		assertEquals(domNodes.at(2).textContent, 'C');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Slot Integration", async (t) => {
	await t.step("(getDOM) - Template with named slot renders empty when template has no matching attribute", async () => {
		registry.register('test.tpl.csr.slot', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.slot']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);
	});

	await t.step(".getDOM() - Template with named slot renders empty when template has no matching attribute via JS", async () => {
		registry.register('test.tpl.csr.slot2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=data])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.slot2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 0);
	});

	await t.step("(getDOM) - Template with default slot content", async () => {
		registry.register('test.tpl.csr.slot.default', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Default content"]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.slot.default']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Default content');
	});

	await t.step(".getDOM() - Template with default slot content via JS", async () => {
		registry.register('test.tpl.csr.slot.default2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Fallback"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.slot.default2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Fallback');
	});

	await t.step("(getDOM) - Template acts as slotSrc - named slots filled from template attributes", async () => {
		registry.register('test.tpl.csr.slot.named', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=header] [m.t t="Body"] [m.slot name=footer])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.slot.named']);
		tplNode('setAttr', ['header', ps('[([m.t t="Header content"])]')]);
		tplNode('setAttr', ['footer', ps('[([m.t t="Footer content"])]')]);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'Header content');
		assertEquals(domNodes.at(1).textContent, 'Body');
		assertEquals(domNodes.at(2).textContent, 'Footer content');
	});

	await t.step(".getDOM() - Template acts as slotSrc - named slots filled from template attributes via JS", async () => {
		registry.register('test.tpl.csr.slot.named2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=top] [m.t t="Middle"] [m.slot name=bottom])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.slot.named2');
		tplNode.setAttr('top', ps('[([m.t t="Top content"])]'));
		tplNode.setAttr('bottom', ps('[([m.t t="Bottom content"])]'));
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 3);
		assertEquals(domNodes.at(0).textContent, 'Top content');
		assertEquals(domNodes.at(1).textContent, 'Middle');
		assertEquals(domNodes.at(2).textContent, 'Bottom content');
	});

	await t.step("(getDOM) - Template with default slot and natural children", async () => {
		registry.register('test.tpl.csr.slot.children', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Default"]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.slot.children']);
		tplNode('append', ['Natural child content']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Natural child content');
	});

	await t.step(".getDOM() - Template with default slot and natural children via JS", async () => {
		registry.register('test.tpl.csr.slot.children2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Fallback"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.slot.children2');
		tplNode.append('Child content');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Child content');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM HTML Elements", async (t) => {
	await t.step("(getDOM) - Template with HTML div", async () => {
		registry.register('test.tpl.csr.html', ls([
			'allowLate', true,
			'tpl', ps('[([h.div [m.t t="Template with HTML"]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.html']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const divElem = domNodes.at(0);
		assertEquals(divElem.tagName, 'DIV');
		assertEquals(divElem.textContent, 'Template with HTML');
	});

	await t.step(".getDOM() - Template with HTML div via JS", async () => {
		registry.register('test.tpl.csr.html2', ls([
			'allowLate', true,
			'tpl', ps('[([h.span [m.t t="Span content"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.html2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const spanElem = domNodes.at(0);
		assertEquals(spanElem.tagName, 'SPAN');
		assertEquals(spanElem.textContent, 'Span content');
	});

	await t.step("(getDOM) - Template with complex HTML structure", async () => {
		registry.register('test.tpl.csr.complex', ls([
			'allowLate', true,
			'tpl', ps('[([h.div class=container [h.h1 [m.t t="Title"]] [h.p [m.t t="Content"]]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.complex']);
		const domNodes = tplNode('getDOM');
		
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

	await t.step(".getDOM() - Template with complex HTML structure via JS", async () => {
		registry.register('test.tpl.csr.complex2', ls([
			'allowLate', true,
			'tpl', ps('[([h.section [h.h2 [m.t t="Heading"]] [h.div [m.t t="Text"]]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.complex2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		const sectionElem = domNodes.at(0);
		assertEquals(sectionElem.tagName, 'SECTION');
		assertEquals(sectionElem.children.length, 2);
		assertEquals(sectionElem.children[0].tagName, 'H2');
		assertEquals(sectionElem.children[1].tagName, 'DIV');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Reactive Updates", async (t) => {
	await t.step("(getDOM) - Reactive update to template slot content", async () => {
		registry.register('test.tpl.csr.reactive', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.reactive']);
		
		// Initially set content
		tplNode('setAttr', ['content', ps('[([m.t])]')]);
		const contentList = tplNode('getAttr', ['content']);
		$toMsjs(contentList)('rxt');
		contentList.at(0).set('t', 'Initial');
		
		const domNodes = tplNode('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Initial');
		
		// Update content
		contentList.at(0).set('t', 'Updated');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive update to template slot content via JS", async () => {
		registry.register('test.tpl.csr.reactive2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=data])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.reactive2');
		
		tplNode.setAttr('data', ps('[([m.t])]'));
		const dataList = tplNode.getAttr('data');
		$toMsjs(dataList)('rxt');
		dataList.at(0).set('t', 'JS Initial');
		
		const domNodes = tplNode.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Initial');
		
		dataList.at(0).set('t', 'JS Updated');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Updated');
		assertEquals(domNodes.size, 1);
	});

	await t.step("(getDOM) - Reactive update to template natural children", async () => {
		registry.register('test.tpl.csr.reactive.children', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Default"]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.reactive.children']);
		
		const textNode = doc('createNode', ['m.t']);
		textNode('setAttr', ['t', 'Initial child']);
		tplNode('append', [textNode]);
		
		const domNodes = tplNode('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Initial child');
		
		textNode('setAttr', ['t', 'Updated child']);
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'Updated child');
		assertEquals(domNodes.size, 1);
	});

	await t.step(".getDOM() - Reactive update to template natural children via JS", async () => {
		registry.register('test.tpl.csr.reactive.children2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Fallback"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.reactive.children2');
		
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Initial child');
		tplNode.append(textNode);
		
		const domNodes = tplNode.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Initial child');
		
		textNode.setAttr('t', 'JS Updated child');
		await globalThis.reactive.wait();
		assertEquals(domNodes.at(0).textContent, 'JS Updated child');
		assertEquals(domNodes.size, 1);
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Reactive Slotting Cases", async (t) => {
	await t.step("(getDOM) - Reactive change to attribute on template node", async () => {
		registry.register('test.tpl.csr.reactive.attr', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=header] [m.t t="Body"])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.reactive.attr']);
		
		// Set initial attribute
		tplNode('setAttr', ['header', ps('[([m.t t="Initial Header"])]')]);
		const domNodes = tplNode('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'Initial Header');
		assertEquals(domNodes.at(1).textContent, 'Body');
		
		// Change the attribute on the template node
		tplNode('setAttr', ['header', ps('[([m.t t="Updated Header"])]')]);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'Updated Header');
		assertEquals(domNodes.at(1).textContent, 'Body');
	});

	await t.step(".getDOM() - Reactive change to attribute on template node via JS", async () => {
		registry.register('test.tpl.csr.reactive.attr2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=title] [m.t t="Content"])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.reactive.attr2');
		
		tplNode.setAttr('title', ps('[([m.t t="JS Initial"])]'));
		const domNodes = tplNode.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS Initial');
		
		tplNode.setAttr('title', ps('[([m.t t="JS Changed"])]'));
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS Changed');
	});

	await t.step("(getDOM) - Reactive change to attribute within template's sub-spec", async () => {
		registry.register('test.tpl.csr.reactive.subspec', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.reactive.subspec']);
		
		// Set attribute with reactive sub-spec
		tplNode('setAttr', ['content', ps('[([m.t])]')]);
		const contentList = tplNode('getAttr', ['content']);
		$toMsjs(contentList)('rxt');
		const textNode = contentList.at(0);
		textNode.set('t', 'Initial Text');
		
		const domNodes = tplNode('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Initial Text');
		
		// Change attribute within the sub-spec
		textNode.set('t', 'Modified Text');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Modified Text');
	});

	await t.step(".getDOM() - Reactive change to attribute within template's sub-spec via JS", async () => {
		registry.register('test.tpl.csr.reactive.subspec2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=data])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.reactive.subspec2');
		
		tplNode.setAttr('data', ps('[([m.t])]'));
		const dataList = tplNode.getAttr('data');
		$toMsjs(dataList)('rxt');
		const textNode = dataList.at(0);
		textNode.set('t', 'JS Start');
		
		const domNodes = tplNode.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Start');
		
		textNode.set('t', 'JS Modified');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS Modified');
	});

	await t.step("(getDOM) - Reactive change to template's sub-doc using append", async () => {
		registry.register('test.tpl.csr.reactive.subdoc', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Default"]])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.reactive.subdoc']);
		
		// Append initial child
		const textNode1 = doc('createNode', ['m.t']);
		textNode1('setAttr', ['t', 'First Child']);
		tplNode('append', [textNode1]);
		
		const domNodes = tplNode('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'First Child');
		
		// Append another child
		const textNode2 = doc('createNode', ['m.t']);
		textNode2('setAttr', ['t', 'Second Child']);
		tplNode('append', [textNode2]);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'First Child');
		assertEquals(domNodes.at(1).textContent, 'Second Child');
		
		// Modify first child
		textNode1('setAttr', ['t', 'Modified First']);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'Modified First');
		assertEquals(domNodes.at(1).textContent, 'Second Child');
	});

	await t.step(".getDOM() - Reactive change to template's sub-doc using append via JS", async () => {
		registry.register('test.tpl.csr.reactive.subdoc2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot [m.t t="Fallback"]])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.reactive.subdoc2');
		
		const textNode1 = doc.createNode('m.t');
		textNode1.setAttr('t', 'JS First');
		tplNode.append(textNode1);
		
		const domNodes = tplNode.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		
		const textNode2 = doc.createNode('m.t');
		textNode2.setAttr('t', 'JS Second');
		tplNode.append(textNode2);
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
		
		textNode1.setAttr('t', 'JS Modified First');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 2);
		assertEquals(domNodes.at(0).textContent, 'JS Modified First');
		assertEquals(domNodes.at(1).textContent, 'JS Second');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Attribute Slotting", async (t) => {
	await t.step("(getDOM) - Template with m.slat remaps attributes", async () => {
		registry.register('test.tpl.csr.slat', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=title])]')
		]));
		
		const externalNode = doc('createNode', ['h.div']);
		externalNode('setAttr', ['c.title', ps('[([m.t t="Custom Title"])]')]);
		
		const tplNode = doc('createNode', ls([, 'test.tpl.csr.slat', 'slotSrc', externalNode]));
		tplNode('setAttr', ['m.slat', ps('[(title=[c.title])]')]);
		
		const domNodes = tplNode('getDOM');
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Custom Title');
	});

	await t.step(".getDOM() - Template with m.slat remaps attributes via JS", async () => {
		registry.register('test.tpl.csr.slat2', ls([
			'allowLate', true,
			'tpl', ps('[([m.slot name=content])]')
		]));
		
		const externalNode = doc.createNode('h.div');
		externalNode.setAttr('c.body', ps('[([m.t t="Body Text"])]'));
		
		const tplNode = doc.createNode('test.tpl.csr.slat2', { slotSrc: externalNode });
		tplNode.setAttr('m.slat', ps('[(content=[c.body])]'));
		
		const domNodes = tplNode.getDOM();
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Body Text');
	});
});

Deno.test("MWICoreTpl (template handler) - CSR-DOM Special Characters", async (t) => {
	await t.step("(getDOM) - Template with special characters", async () => {
		registry.register('test.tpl.csr.special', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="<>&\\"\'"])]')
		]));
		const tplNode = doc('createNode', ['test.tpl.csr.special']);
		const domNodes = tplNode('getDOM');
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		// DOM text content doesn't need escaping
		assertEquals(domNodes.at(0).textContent, '<>&"\'');
	});

	await t.step(".getDOM() - Template with special characters via JS", async () => {
		registry.register('test.tpl.csr.special2', ls([
			'allowLate', true,
			'tpl', ps('[([m.t t="Test & <test>"])]')
		]));
		const tplNode = doc.createNode('test.tpl.csr.special2');
		const domNodes = tplNode.getDOM();
		
		await globalThis.reactive.wait();
		assertEquals(domNodes.size, 1);
		assertEquals(domNodes.at(0).textContent, 'Test & <test>');
	});
});
