import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, renderHTML } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

Deno.test("MWICore - m.t (text) component renders", async (t) => {
	const textHTML = await renderHTML(ps('[(item="Hello World")]'));
	assertEquals(textHTML, 'Hello World', 'auto-text content rendered');

	const nodeHTML = await renderHTML(ps('[(item=[m.t t="Hello World"])]'));
	assertEquals(nodeHTML, 'Hello World', 'node text content rendered');
});

Deno.test("MWICore - m.frg (fragment) component renders", async (t) => {
	const html = await renderHTML(ps('[(item=[m.frg id=test "Fragment " [m.t t=content]])]'));
	assertEquals(html, 'Fragment content', 'fragment rendered correctly');
});

Deno.test("MWICore - m.com (comment) component renders", async (t) => {
	const html = await renderHTML(ps('[(item=[m.com t="This is a comment"])]'));
	assertEquals(html, '<!--This is a comment-->', 'comment rendered correctly');
});
