import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { ls } = globalThis;

await fwait('MWIDocument');

describe('MWIDocument - HTML Rendering Delegation', () => {

	it('(getHTML) - Delegates to root fragment', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['item', 'Hello']));

		const docHTML =  $c.sm(doc, 'getHTML');
		const root = doc.root;
		const rootHTML =  $c.sm(root, 'getHTML');

		assertEquals(docHTML, rootHTML, 'Document HTML should match root HTML');
	});

	it('.getHTML() - Delegates to root fragment', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['item', 'World']));

		const docHTML = doc.getHTML();
		const root = doc.root;
		const rootHTML = root.getHTML();

		assertEquals(docHTML, rootHTML, 'Document HTML should match root HTML');
	});

	it('(getHTML) - Empty document', () => {
		const doc = getInstance('MWIDocument');
		const html =  $c.sm(doc, 'getHTML');
		assertEquals(html, '', 'Empty document should produce empty HTML');
	});

	it('(getHTML) - With content', () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([h.div test])]']));
		const html =  $c.sm(doc, 'getHTML');
		assertEquals(html, '<div>test</div>', 'Should render content via root');
	});
});
