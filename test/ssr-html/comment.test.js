import {
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');

Deno.test("MWICoreCom (m.com) - SSR-HTML Tests", async (t) => {
	await t.step("(getHTML) - Simple text comment", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'Simple comment');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--Simple comment-->');
	});

	await t.step(".getHTML() - Simple text comment via JS", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'Another simple comment');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--Another simple comment-->');
	});

	await t.step("(getHTML) - Crazy comment with special sequences", async () => {
		const comNode = await doc.createNode('m.com');
		const commentContent = '-> & <!-- <!--!> crazy comment <!--> --!> --> <!-';
		const expectedHTML = '<!---&gt; &amp; &lt;!-- <!-&#45;!> crazy comment <!-&#45;> --!&gt; --&gt; &lt;!--->';
		
		comNode.setAttr('t', commentContent);
		const html = await comNode.getHTML();
		assertEquals(html, expectedHTML);
	});

	await t.step("(getHTML) - Comment starting with >", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', '>starts with gt');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--&gt;starts with gt-->');
	});

	await t.step("(getHTML) - Comment starting with ->", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', '->starts with arrow');
		const html = await comNode.getHTML();
		assertEquals(html, '<!---&gt;starts with arrow-->');
	});

	await t.step("(getHTML) - Comment with <!-- sequence", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'text <!-- here');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--text &lt;!-- here-->');
	});

	await t.step("(getHTML) - Comment with <!--> sequence", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'text <!--> here');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--text <!-&#45;> here-->');
	});

	await t.step("(getHTML) - Comment with <!--!> sequence", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'text <!--!> here');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--text <!-&#45;!> here-->');
	});

	await t.step("(getHTML) - Comment with --> sequence", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'text --> here');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--text --&gt; here-->');
	});

	await t.step("(getHTML) - Comment with --!> sequence", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'text --!> here');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--text --!&gt; here-->');
	});

	await t.step("(getHTML) - Comment ending with <!-", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'ends with <!-');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--ends with &lt;!--->');
	});

	await t.step("(getHTML) - Comment with & character", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', 'text & more');
		const html = await comNode.getHTML();
		assertEquals(html, '<!--text &amp; more-->');
	});

	await t.step("(getHTML) - Empty comment", async () => {
		const comNode = await doc.createNode('m.com');
		comNode.setAttr('t', '');
		const html = await comNode.getHTML();
		assertEquals(html, '<!---->');
	});
});