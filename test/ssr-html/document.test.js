import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { ls } = globalThis;

Deno.test('MWIDocument - HTML Rendering Delegation', async (t) => {
	await fwait('MWIDocument');

	await t.step('(getHTML) - Delegates to root fragment', async () => {
		const doc = getInstance('MWIDocument');
		await doc('append', ls(['item', 'Hello']));
		
		const docHTML = await doc('getHTML');
		const root = await doc('root');
		const rootHTML = await root('getHTML');
		
		assertEquals(docHTML, rootHTML, 'Document HTML should match root HTML');
	});

	await t.step('.getHTML() - Delegates to root fragment', async () => {
		const doc = getInstance('MWIDocument');
		await doc('append', ls(['item', 'World']));
		
		const docHTML = await doc('getHTML');
		const root = await doc.root();
		const rootHTML = await root('getHTML');
		
		assertEquals(docHTML, rootHTML, 'Document HTML should match root HTML');
	});

	await t.step('(getHTML) - Empty document', async () => {
		const doc = getInstance('MWIDocument');
		const html = await doc('getHTML');
		assertEquals(html, '', 'Empty document should produce empty HTML');
	});

	await t.step('(getHTML) - With content', async () => {
		const doc = getInstance('MWIDocument');
		await doc('append', ls(['list', '[([h.div test])]']));
		const html = await doc('getHTML');
		assertEquals(html, '<div>test</div>', 'Should render content via root');
	});
});
