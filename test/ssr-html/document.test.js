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

	await t.step('(getHTML) - Delegates to root fragment', () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['item', 'Hello']));
		
		const docHTML = doc('getHTML');
		const root = doc('root');
		const rootHTML = root('getHTML');
		
		assertEquals(docHTML, rootHTML, 'Document HTML should match root HTML');
	});

	await t.step('.getHTML() - Delegates to root fragment', () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['item', 'World']));
		
		const docHTML = doc.getHTML();
		const root = doc.root;
		const rootHTML = root.getHTML();
		
		assertEquals(docHTML, rootHTML, 'Document HTML should match root HTML');
	});

	await t.step('(getHTML) - Empty document', () => {
		const doc = getInstance('MWIDocument');
		const html = doc('getHTML');
		assertEquals(html, '', 'Empty document should produce empty HTML');
	});

	await t.step('(getHTML) - With content', () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([h.div test])]']));
		const html = doc('getHTML');
		assertEquals(html, '<div>test</div>', 'Should render content via root');
	});
});
