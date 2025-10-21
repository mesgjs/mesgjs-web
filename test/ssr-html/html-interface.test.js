import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;

Deno.test("MWIHTML interface renders standard and void elements", async (t) => {
	const divNode = await doc.createNode('h.div');
	divNode('setAttr', [ 'class', 'test' ]);
	divNode('append', 'Content');
	const divHTML = divNode('getHTML');
	assertEquals(divHTML, '<div class="test">Content</div>', 'standard element rendered');

	const brNode = await doc.createNode('h.br');
	brNode('setAttr', ls([, 'class', , 'break']));
	const brHTML = brNode('getHTML');
	assertEquals(brHTML, '<br class="break">', 'void element rendered');
});

Deno.test("MWIHTMLScript interface renders sanitized content", async (t) => {
	await t.step("h.script sanitizes content", async () => {
		const scriptNode = await doc.createNode('h.script');
		const scriptContent = 'if (1 < 2) { console.log("</script>"); }';
		const expectedHTML = '<script>if (1 < 2) { console.log("</script>';
		scriptNode.setAttr('m.text', scriptContent);
		const scriptHTML = scriptNode.getHTML();
		assertEquals(scriptHTML, expectedHTML, 'script content rendered and sanitized correctly');
	});

	await t.step("h.style sanitizes content", async () => {
		const styleNode = await doc.createNode('h.style');
		const styleContent = 'body { color: red; /* </style> */ }';
		const expectedHTML = '<style>body { color: red; /* </style>';
		styleNode.setAttr('m.text', styleContent);
		const styleHTML = styleNode.getHTML();
		assertEquals(styleHTML, expectedHTML, 'style content rendered and sanitized correctly');
	});
});


Deno.test("MWIHTMLTitle interface renders HTML-escaped content", async (t) => {
	const titleNode = await doc.createNode('h.title');
	const titleContent = 'Title with <unsafe> content';
	const expectedHTML = '<title>Title with &lt;unsafe&gt; content</title>';
	titleNode.setAttr('m.text', titleContent);
	const titleHTML = titleNode.getHTML();
	assertEquals(titleHTML, expectedHTML, 'title content rendered and escaped correctly');
});


Deno.test("MWIHTMLDocType interface renders correctly", async (t) => {
	const doctypeNode = await doc.createNode('h.doctype');
	const doctypeHTML = doctypeNode.getHTML();
	assertEquals(doctypeHTML, '<!DOCTYPE html>', 'doctype rendered correctly');
});
