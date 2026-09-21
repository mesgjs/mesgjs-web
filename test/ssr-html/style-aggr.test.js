import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

await setupRuntime({
	modules: {
		'mwi/mwi-style-aggr-comp': {
			url: './src/mwi-style-aggr-comp.msjs',
			featpro: 'mwi.comp.MWIStyleAggr',
		},
	},
});

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIStyleAggr');

Deno.test('MWIStyleAggr (m.stag) - SSR-HTML Basic Aggregation & Render', async (t) => {
	await t.step('(getHTML) - collector node returns empty string', () => {
		const doc = getInstance('MWIDocument');
		const collector = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		$c.sm(collector, 'setSubSpec', { subSpec: ls([, ':root', , 'container-name', , 'group1']) });
		const html = $c.sm(collector, 'getHTML');
		assertEquals(html, '', 'collector node should return empty string');
	});

	await t.step('.getHTML() - collector node returns empty string via JS', () => {
		const doc = getInstance('MWIDocument');
		const collector = doc.createNode('m.stag');
		collector.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });
		const html = collector.getHTML();
		assertEquals(html, '', 'collector node should return empty string via JS');
	});

	await t.step('(getHTML) - render node returns buffer placeholder', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		const html = $c.sm(renderNode, 'getHTML');
		assert(/^<\{\d+\}>$/.test(html), 'render node should return placeholder <{id}>');
	});

	await t.step('.getHTML() - render node returns buffer placeholder via JS', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const html = renderNode.getHTML();
		assert(/^<\{\d+\}>$/.test(html), 'render node should return placeholder <{id}> via JS');
	});

	await t.step('(getHTML) - end-to-end basic aggregation via doc.getHTML()', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		const collector = $c.sm(doc, 'createNode', ls([, 'm.stag']));
		$c.sm(collector, 'setSubSpec', { subSpec: ls([, ':root', , 'container-name', , 'group1']) });

		$c.sm(doc, 'append', ls([, renderNode, , collector]));
		const html = $c.sm(doc, 'getHTML');

		assert(html.includes('<style'), 'Should output style element');
		assert(html.includes(':root { container-name: group1; }'), 'Should output aggregated CSS rule');
		assert(html.includes('</style>'), 'Should output closing style tag');
		assert(!html.includes('<{'), 'Should resolve all placeholders');
	});

	await t.step('.getHTML() - end-to-end basic aggregation via JS', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const collector = doc.createNode('m.stag');
		collector.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });

		doc.append(renderNode, collector);
		const html = doc.getHTML();

		assert(html.includes('<style'), 'Should output style element via JS');
		assert(html.includes(':root { container-name: group1; }'), 'Should output aggregated CSS rule via JS');
		assert(!html.includes('<{'), 'Should resolve all placeholders via JS');
	});
});

Deno.test('MWIStyleAggr (m.stag) - SSR-HTML Deduplication', async (t) => {
	await t.step('(getHTML) - deduplicates identical values for the same selector and attribute', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c1 = doc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });
		const c2 = doc.createNode('m.stag');
		c2.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group2']) });
		const c3 = doc.createNode('m.stag');
		c3.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) }); // Duplicate

		doc.append(renderNode, c1, c2, c3);
		const html = doc.getHTML();

		assert(html.includes(':root { container-name: group1 group2; }'), 'Should deduplicate group1 and maintain first-seen order');
	});
});

Deno.test('MWIStyleAggr (m.stag) - SSR-HTML Delimiters', async (t) => {
	await t.step('Space-separated attributes', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');

		const cName = doc.createNode('m.stag');
		cName.setSubSpec({ subSpec: ls([, '.c', , 'container-name', , 'a', , 'b']) });

		const cType = doc.createNode('m.stag');
		cType.setSubSpec({ subSpec: ls([, '.c', , 'container-type', , 'size', , 'normal']) });

		const cInc = doc.createNode('m.stag');
		cInc.setSubSpec({ subSpec: ls([, '.c', , 'counter-increment', , 'page 1', , 'sec 2']) });

		const cReset = doc.createNode('m.stag');
		cReset.setSubSpec({ subSpec: ls([, '.c', , 'counter-reset', , 'page 1', , 'item 5']) });

		const cSet = doc.createNode('m.stag');
		cSet.setSubSpec({ subSpec: ls([, '.c', , 'counter-set', , 'cnt 10']) });

		doc.append(renderNode, cName, cType, cInc, cReset, cSet);
		const html = doc.getHTML();

		assert(html.includes('container-name: a b;'), 'container-name should be space-separated');
		assert(html.includes('container-type: size normal;'), 'container-type should be space-separated');
		assert(html.includes('counter-increment: page 1 sec 2;'), 'counter-increment should be space-separated');
		assert(html.includes('counter-reset: page 1 item 5;'), 'counter-reset should be space-separated');
		assert(html.includes('counter-set: cnt 10;'), 'counter-set should be space-separated');
	});

	await t.step('Comma-separated attributes', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');

		const cAnchor = doc.createNode('m.stag');
		cAnchor.setSubSpec({ subSpec: ls([, '.anchored', , 'anchor-name', , '--first', , '--second']) });

		const cScope = doc.createNode('m.stag');
		cScope.setSubSpec({ subSpec: ls([, '.anchored', , 'anchor-scope', , '--s1', , '--s2']) });

		const cTimeline = doc.createNode('m.stag');
		cTimeline.setSubSpec({ subSpec: ls([, '.anchored', , 'timeline-scope', , '--t1', , '--t2']) });

		const cView = doc.createNode('m.stag');
		cView.setSubSpec({ subSpec: ls([, '.anchored', , 'view-timeline-name', , '--v1', , '--v2']) });

		doc.append(renderNode, cAnchor, cScope, cTimeline, cView);
		const html = doc.getHTML();

		assert(html.includes('anchor-name: --first, --second;'), 'anchor-name should be comma-separated');
		assert(html.includes('anchor-scope: --s1, --s2;'), 'anchor-scope should be comma-separated');
		assert(html.includes('timeline-scope: --t1, --t2;'), 'timeline-scope should be comma-separated');
		assert(html.includes('view-timeline-name: --v1, --v2;'), 'view-timeline-name should be comma-separated');
	});
});

Deno.test('MWIStyleAggr (m.stag) - SSR-HTML Multiple values & selectors', async (t) => {
	await t.step('Multiple values in a single collector node', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c = doc.createNode('m.stag');
		c.setSubSpec({ subSpec: ls([, '#node', , 'counter-reset', , 'page 1', , 'paragraph 1']) });

		doc.append(renderNode, c);
		const html = doc.getHTML();
		assert(html.includes('#node { counter-reset: page 1 paragraph 1; }'), 'Should combine values in single node');
	});

	await t.step('Multiple selectors and grouping properties', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');

		const c1 = doc.createNode('m.stag');
		c1.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'main']) });

		const c2 = doc.createNode('m.stag');
		c2.setSubSpec({ subSpec: ls([, 'aside', , 'container-name', , 'sidebar']) });

		const c3 = doc.createNode('m.stag');
		c3.setSubSpec({ subSpec: ls([, ':root', , 'counter-reset', , 'total 0']) });

		doc.append(renderNode, c1, c2, c3);
		const html = doc.getHTML();

		// :root should come first (seen first), aside second
		const rootIdx = html.indexOf(':root {');
		const asideIdx = html.indexOf('aside {');
		assert(rootIdx >= 0 && asideIdx >= 0, 'Both selectors should be present');
		assert(rootIdx < asideIdx, ':root should precede aside based on first-seen order');

		// :root should group container-name and counter-reset
		assert(html.includes(':root { container-name: main; counter-reset: total 0; }'), 'Properties under :root should be grouped in single block');
		assert(html.includes('aside { container-name: sidebar; }'), 'Properties under aside should be correctly formatted');
	});

	await t.step('Special syntax reverse(name) in counter-reset', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c = doc.createNode('m.stag');
		c.setSubSpec({ subSpec: ls([, 'ol', , 'counter-reset', , 'reversed(section) 10']) });

		doc.append(renderNode, c);
		const html = doc.getHTML();
		assert(html.includes('ol { counter-reset: reversed(section) 10; }'), 'Should support reversed(section) syntax');
	});
});

Deno.test('MWIStyleAggr (m.stag) - SSR-HTML Error Handling & Sanitization', async (t) => {
	await t.step('Unsupported attribute logs error and is omitted', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const cInvalid = doc.createNode('m.stag');
		cInvalid.setSubSpec({ subSpec: ls([, ':root', , 'scroll-timeline-name', , 'myTimeline']) });

		doc.append(renderNode, cInvalid);
		const html = doc.getHTML();

		// style tag should be empty or contain nothing for scroll-timeline-name
		assert(!html.includes('scroll-timeline-name'), 'Unsupported attribute should not be emitted');
	});

	await t.step('Sanitization of </style> closing tags in values', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const cMalicious = doc.createNode('m.stag');
		cMalicious.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , '</style><script>alert(1)</script>']) });

		doc.append(renderNode, cMalicious);
		const html = doc.getHTML();

		// Verify internal closing style tag is sanitized
		assert(!html.includes('</style><script>'), 'Raw closing tag should not appear inside style content');
		assert(html.includes('\\3c /style>'), 'Closing tag should be escaped as \\3c /style>');
		assert(html.endsWith('</style>'), 'Outer closing tag should be present');
	});
});

Deno.test('MWIStyleAggr (m.stag) - SSR-HTML Lifecycle & Suppression', async (t) => {
	await t.step('clearAggr cleans up style aggregation state', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		const c = doc.createNode('m.stag');
		c.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });

		doc.append(renderNode, c);
		doc.getHTML(); // Register and populate

		// Verify buffer mapping and data reset
		const aggrData = doc.getAggr({ clear: true });
		assertEquals(aggrData.size, 0, 'aggrData should be empty after clearAggr');
	});

	await t.step('m.csr on render node suppresses SSR output', () => {
		const doc = getInstance('MWIDocument');
		const renderNode = doc.createNode('m.stag');
		renderNode.setAttr('m.csr', true);
		const c = doc.createNode('m.stag');
		c.setSubSpec({ subSpec: ls([, ':root', , 'container-name', , 'group1']) });

		doc.append(renderNode, c);
		const html = doc.getHTML();

		assertEquals(html, '', 'm.csr on render node should suppress HTML output');
	});
});
