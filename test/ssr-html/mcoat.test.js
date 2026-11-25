import { describe, it, beforeAll, afterAll } from '@compat/test';
import {
	assert,
	assertEquals,
} from '@std/assert';

import { setupRuntime, renderHTML } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';
const MWI_DOC_RDY_FT = 'MWIDocument'

await setupRuntime();

const { fwait, getInstance, getInterface } = globalThis.$c;
await fwait(REG_READY_FT, MWI_DOC_RDY_FT);

const ps = globalThis.ps;
const ls = globalThis.ls;

// Late-register 'src' component for slotting tests
const registry = getInstance('MWIRegistry');
registry.register('src', ls([
	'allowLate', true,
	'tpl', ps('[([m.slot m.slat=[in=[] in1=[] in2=[] in3=[]]])]')
]));

/*
 * Expected results for conditional/alternative forms (retain for reference):
 * * First test after attribute name:
 * ** <n?set> - "set" if attribute n is "set" (value is NOT undefined / false; ergo "" is *valid*), else ""
 * ** <n??sne> - "sne" if attribute n is set AND not empty (NOT undefined / false / ""), else ""
 * ** <n|uns> - "uns" if attribute n is "unset" (value is undefined / false; N.B. "" is not undefined!), else value of attr n
 * ** <n||uoe> - "uoe" if attribute n is unset / false / empty, else value of attr n
 * * Subsequent | or || tokens (handled identically):
 * ** Toggles between copy and no-copy states
 * *** <uns?off|on|off|on>
 * *** <sne?on|off|on|off>
 *
 * The set and sne forms work a bit like bash ${name+word}. The named attribute only controls whether *word* is rendered.
 * The uns and uoe forms work a bit like bash ${name-word}, where word is a default/fall-back.
 */

console.log(`LEGEND:
SET: value is "set" (not undefined, *includes* empty)
SNE: value is set *and not* the empty string
UNS: value is "unset" (absent or undefined)
UOE: value is unset or the empty string`);

describe("m.coat - Input Unset Cases", () => {
	// SET: F, SNE: F, UNS: T, UOE: T

	it("m.coat=[out=<in>] - unset input", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in>]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<in?a>] - unset input, SET test", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a>]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<in??a>] - unset input, SNE test", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a>]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<in|a>] - unset input, UNS test", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in|a>]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	it("m.coat=[out=<in||a>] - unset input, UOE test", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in||a>]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	it("m.coat=[out=<in?a|b>] - unset input, SET test with toggles", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a|b>]])]'));
		assertEquals(html, '<div out="b"></div>');
	});

	it("m.coat=[out=<in??a||b>] - unset input, SNE test with toggles", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a||b>]])]'));
		assertEquals(html, '<div out="b"></div>');
	});

	it("m.coat=[out=<in?a|b|c|d>] - unset input, SET test with multiple toggles", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a|b|c|d>]])]'));
		assertEquals(html, '<div out="bd"></div>');
	});

	it("m.coat=[out=<in??a|b|c|d>] - unset input, SNE test with multiple toggles", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a|b|c|d>]])]'));
		assertEquals(html, '<div out="bd"></div>');
	});
});

describe("m.coat - Input Empty String Cases", () => {
	// SET: T, SNE: F, UNS: F, UOE: T

	it("m.coat=[out=<in>] in='' - empty input", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in>]]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<in?a>] in='' - empty input, SET test", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a>]]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	it("m.coat=[out=<in??a>] in='' - empty input, SNE test", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a>]]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<in|a>] in='' - empty input, UNS test", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in|a>]]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<in||a>] in='' - empty input, UOE test", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in||a>]]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	it("m.coat=[out=<in?a|b>] in='' - empty input, SET with toggles", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a|b>]]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	it("m.coat=[out=<in??a||b>] in='' - empty input, SNE with toggles", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a||b>]]])]'));
		assertEquals(html, '<div out="b"></div>');
	});

	it("m.coat=[out=<in?a|b|c|d>] in='' - empty input, SET with multiple toggles", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a|b|c|d>]]])]'));
		assertEquals(html, '<div out="ac"></div>');
	});

	it("m.coat=[out=<in??a|b|c|d>] in='' - empty input, SNE with multiple toggles", () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a|b|c|d>]]])]'));
		assertEquals(html, '<div out="bd"></div>');
	});
});

describe("m.coat - Input Non-Empty String Cases", () => {
	it("m.coat=[out=<in>] in=value - non-empty input", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in>]]])]'));
		assertEquals(html, '<div out="value"></div>', 'Should render input value');
	});

	it("m.coat=[out=<in?a>] in=value - non-empty input, SET test", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in?a>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use "a" (in is SET and SNE)');
	});

	it("m.coat=[out=<in??a>] in=value - non-empty input, SNE test", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in??a>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use "a" (in is SNE)');
	});

	it("m.coat=[out=<in|a>] in=value - non-empty input, UNS fallback", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in|a>]]])]'));
		assertEquals(html, '<div out="value"></div>', 'Should copy in value (in is SET and SNE)');
	});

	it("m.coat=[out=<in||a>] in=value - non-empty input, UOE fallback", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in||a>]]])]'));
		assertEquals(html, '<div out="value"></div>', 'Should copy in value (in is not UOE)');
	});

	it("m.coat=[out=<in?a|b>] in=value - non-empty input, SET with toggles", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in?a|b>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use then "a" (in is SET and SNE)');
	});

	it("m.coat=[out=<in??a||b>] in=value - non-empty input, SNE with toggles", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in??a||b>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use then "a" (in is SNE)');
	});

	it("m.coat=[out=<in?a|b|c|d>] in=value - non-empty input, SET with multiple toggles", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in?a|b|c|d>]]])]'));
		assertEquals(html, '<div out="ac"></div>', 'Should use then "a" (in is SET and SNE)');
	});

	it("m.coat=[out=<in??a|b|c|d>] in=value - non-empty input, SNE with multiple toggles", () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in??a|b|c|d>]]])]'));
		assertEquals(html, '<div out="ac"></div>', 'Should use then "a" (in is SNE)');
	});
});

describe("m.coat - Multiple Attributes", () => {
	it("Multiple m.coat attributes with different expressions", () => {
		const html = renderHTML(ps('[([src in1=x in2="" [h.div m.coat=[out1=<in1> out2=<in2??default> out3=<in3||fallback>]]])]'));
		assert(html.includes('out1="x"'));
		assert(html.includes('out2'));
		assert(html.includes('out3="fallback"'));
	});

	it("m.coat with regular attributes", () => {
		const html = renderHTML(ps('[([src in=val [h.div class=test m.coat=[out=<in>] id=myid]])]'));
		assert(html.includes('class="test"'), 'Should preserve regular attributes');
		assert(html.includes('out="val"'), 'Should render m.coat attribute');
		assert(html.includes('id="myid"'), 'Should preserve attributes after m.coat');
	});
});

describe("m.coat - Edge Cases", () => {
	it("m.coat with numeric input", () => {
		const html = renderHTML(ps('[([src in=42 [h.div m.coat=[out=<in>]]])]'));
		assertEquals(html, '<div out="42"></div>', 'Should render numeric value as string');
	});

	it("m.coat with zero input, SET test", () => {
		const html = renderHTML(ps('[([src in=0 [h.div m.coat=[out=<in?zeroisset>]]])]'));
		assertEquals(html, '<div out="zeroisset"></div>');
	});

	it("m.coat with zero input, SNE test", () => {
		const html = renderHTML(ps('[([src in=0 [h.div m.coat=[out=<in??zeroisset>]]])]'));
		assertEquals(html, '<div out="zeroisset"></div>');
	});

	it("m.coat with boolean true input, SET with toggles", () => {
		const html = renderHTML(ps('[([src in=@t [h.div m.coat=[out=<in?yes|no>]]])]'));
		assertEquals(html, '<div out="yes"></div>', 'Should use then "yes" (true is SET and SNE)');
	});

	it("m.coat with boolean false input, SET with toggles", () => {
		const html = renderHTML(ps('[([src in=@f [h.div m.coat=[out=<in?yes|no>]]])]'));
		assertEquals(html, '<div out="no"></div>', 'Should use else "no" (false is SET but empty, no copy)');
	});

	it("m.coat with special characters in values", () => {
		const html = renderHTML(ps('[([src in="<>&\\"" [h.div m.coat=[out=<in>]]])]'));
		assert(html.includes('out="&lt;&gt;&amp;&quot;"'), 'Should escape special characters');
	});

	it("m.coat with nested element", () => {
		const html = renderHTML(ps('[([src in=outer [h.div m.coat=[out=<in>] [src in=inner [h.span m.coat=[out=<in>]]]]]])]'));
		assert(html.includes('<div out="outer">'), 'Should render outer m.coat');
		assert(html.includes('<span out="inner">'), 'Should render nested m.coat');
	});
});

describe("m.coat - Complex Expression Chains", () => {
	it("Multiple outputs from same input", () => {
		const html = renderHTML(ps('[([src in=shared [h.div m.coat=[out1=<in?yes> out2=<in|default> out3=<in>]]])]'));
		assert(html.includes('out1="yes"'));
		assert(html.includes('out2="shared"'));
		assert(html.includes('out3="shared"'));
	});

	it("Different inputs for different outputs", () => {
		const html = renderHTML(ps('[([src in1=a in2="" [h.div m.coat=[out1=<in1> out2=<in2||default>]]])]'));
		assert(html.includes('out1="a"'));
		assert(html.includes('out2="default'));
	});
});

describe("m.coat - Special Return Values (.f, .t, .u, .un)", () => {
	const doc = getInstance('MWIDocument');

	it("m.coat=[out=<.f>] - returns false (attribute stored as false, suppressed in HTML)", () => {
		const node = doc.createNode('h.div');
		node.setAttr('id', 'coat-false-test');
		node.setAttr('m.coat', ps('[(out=<.f>)]'));
		const html = node.getHTML();
		// false is not a string or true, so the attribute should not appear in HTML
		assertEquals(html, '<div id="coat-false-test"></div>');
		// Confirm the actual attribute value stored is false
		assertEquals(node.getAttr('out'), false, 'Attribute should store false');
	});

	it("m.coat=[out=<.t>] - returns true (stored as true, boolean attribute in HTML)", () => {
		const node = doc.createNode('h.div');
		node.setAttr('m.coat', ps('[(out=<.t>)]'));
		const html = node.getHTML();
		// true is a boolean, so it renders as a boolean attribute (no value)
		assertEquals(html, '<div out></div>');
		// Confirm the actual attribute value stored is true
		assertEquals(node.getAttr('out'), true, 'Attribute should store true');
	});

	it("m.coat=[out=<.u>] - returns undefined (attribute suppressed)", () => {
		const node = doc.createNode('h.div');
		node.setAttr('m.coat', ps('[(out=<.u>)]'));
		const html = node.getHTML();
		// undefined is not rendered
		assertEquals(html, '<div></div>');
		assertEquals(node.getAttr('out'), undefined, 'Attribute should store undefined');
	});

	it("m.coat=[out=<.un>] - returns undefined via .un alias (attribute suppressed)", () => {
		const node = doc.createNode('h.div');
		node.setAttr('m.coat', ps('[(out=<.un>)]'));
		const html = node.getHTML();
		// undefined is not rendered
		assertEquals(html, '<div></div>');
		assertEquals(node.getAttr('out'), undefined, 'Attribute should store undefined via .un alias');
	});

	it("m.coat - multiple attributes: .t for one, .f for another, .u for another", () => {
		const html = renderHTML(ps('[([h.div m.coat=[enabled=<.t> disabled=<.f> custom=<.u>]])]'));
		// 'enabled' → true → boolean attribute
		// 'disabled' → false → no attribute
		// 'custom' → undefined → no attribute
		assert(html.includes('enabled'), 'boolean true renders as attribute');
		assert(!html.includes('disabled'), 'false does not render');
		assert(!html.includes('custom'), 'undefined does not render');
	});

	it("m.coat=[disabled=<controller?<.t>|<.f>>] - derive boolean from slot source attribute", () => {
		// When controller is set (truthy), disabled = true (boolean attribute);
		// when controller is not set, disabled = false (not rendered)
		const nodeOn = doc.createNode('h.div');
		const srcOn = doc.createNode('m.frg');
		srcOn.setAttr('controller', 'on');
		const nodeOnWithSrc = doc.createNode('h.div', { slotSrc: srcOn });
		nodeOnWithSrc.setAttr('m.coat', ps('[(disabled=<controller?<.t>|<.f>>)]'));
		assertEquals(nodeOnWithSrc.getAttr('disabled'), true, 'disabled should be true when controller is set');

		const srcOff = doc.createNode('m.frg');
		// controller is not set
		const nodeOffWithSrc = doc.createNode('h.div', { slotSrc: srcOff });
		nodeOffWithSrc.setAttr('m.coat', ps('[(disabled=<controller?<.t>|<.f>>)]'));
		assertEquals(nodeOffWithSrc.getAttr('disabled'), false, 'disabled should be false when controller is not set');
	});
});

describe("m.coat - MWIData Global Store Access (<d:name>)", () => {
	let MWIDocument, mwiData;

	beforeAll(() => {
		// Set up MWIData reactive NANOS in global shared storage
		MWIDocument = getInterface('MWIDocument').proto;
		mwiData = MWIDocument.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);
	});

	it("m.coat=[out=<d:key>] - reads from MWIData store", () => {
		mwiData.set('theme', 'dark');
		const html = renderHTML(ps('[([h.div m.coat=[data-theme=<d:theme>]])]'));
		assertEquals(html, '<div data-theme="dark"></div>');
	});

	it("m.coat=[out=<d:missing>] - missing MWIData key returns empty string", () => {
		// 'missing' key is not set
		const html = renderHTML(ps('[([h.div m.coat=[out=<d:missing>]])]'));
		assertEquals(html, '<div out></div>');
	});

	it("m.coat=[out=<d:key|fallback>] - UNS fallback for missing MWIData key", () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<d:notset|fallback>]])]'));
		assertEquals(html, '<div out="fallback"></div>');
	});

	it("m.coat=[out=<d:key?set>] - SET test for existing MWIData key", () => {
		mwiData.set('mode', 'active');
		const html = renderHTML(ps('[([h.div m.coat=[out=<d:mode?isSet>]])]'));
		assertEquals(html, '<div out="isSet"></div>');
	});

	it("m.coat with multiple <d:...> references", () => {
		mwiData.set('lang', 'en');
		mwiData.set('dir', 'ltr');
		const html = renderHTML(ps('[([h.div m.coat=[lang=<d:lang> dir=<d:dir>]])]'));
		assert(html.includes('lang="en"'), 'lang attribute should be "en"');
		assert(html.includes('dir="ltr"'), 'dir attribute should be "ltr"');
	});

	afterAll(() => {
		// Clean up
		globalThis.$gss.delete('MWIData');
	});
});

describe("m.coat - Ancestral Lookups (<a:name>, <A:name>)", () => {
	it("m.coat=[out=<a:attr>] - inherits attribute strictly from ancestor", () => {
		const html = renderHTML(ps('[([h.div theme="dark" [h.span m.coat=[data-theme=<a:theme>]]])]'));
		assertEquals(html, '<div theme="dark"><span data-theme="dark"></span></div>');
	});

	it("m.coat=[out=<a:attr>] - ignores child's own attribute", () => {
		const html = renderHTML(ps('[([h.div theme="parent-val" [h.span theme="child-val" m.coat=[data-theme=<a:theme>]]])]'));
		assertEquals(html, '<div theme="parent-val"><span theme="child-val" data-theme="parent-val"></span></div>');
	});

	it("m.coat=[out=<a:attr|fallback>] - fallback when ancestor does not define attribute", () => {
		const html = renderHTML(ps('[([h.div [h.span m.coat=[data-theme=<a:theme|light>]]])]'));
		assertEquals(html, '<div><span data-theme="light"></span></div>');
	});

	it("m.coat=[out=<A:attr>] - uses local attribute when present", () => {
		const html = renderHTML(ps('[([h.div theme="parent-val" [h.span theme="child-val" m.coat=[data-theme=<A:theme>]]])]'));
		assertEquals(html, '<div theme="parent-val"><span theme="child-val" data-theme="child-val"></span></div>');
	});

	it("m.coat=[out=<A:attr>] - falls back to ancestor when local attribute unset", () => {
		const html = renderHTML(ps('[([h.div theme="parent-val" [h.span m.coat=[data-theme=<A:theme>]]])]'));
		assertEquals(html, '<div theme="parent-val"><span data-theme="parent-val"></span></div>');
	});

	it("m.coat=[out=<A:attr|fallback>] - falls back to fallback when neither local nor ancestor is set", () => {
		const html = renderHTML(ps('[([h.div [h.span m.coat=[data-theme=<A:theme|default-theme>]]])]'));
		assertEquals(html, '<div><span data-theme="default-theme"></span></div>');
	});

	it("Multi-level scoped accordion hierarchy: navDet.name with <a:navDet.name>-lvl and <A:navDet.name>", () => {
		// Root nav sets navDet.name="_M_navDet"
		// Level 1 sets navDet.name="<a:navDet.name>-lvl" and name="<A:navDet.name>"
		// Level 2 sets navDet.name="<a:navDet.name>-lvl" and name="<A:navDet.name>"
		// Level 3 sets navDet.name="<a:navDet.name>-lvl" and name="<A:navDet.name>"
		const spec = ps(`[(
			[h.nav m.coat=[navDet.name=<name|_M_navDet>]
				[h.details m.coat=[navDet.name=<a:navDet.name>-lvl name=<A:navDet.name>]
					[h.summary "Level 1"]
					[h.details m.coat=[navDet.name=<a:navDet.name>-lvl name=<A:navDet.name>]
						[h.summary "Level 2"]
						[h.details m.coat=[navDet.name=<a:navDet.name>-lvl name=<A:navDet.name>]
							[h.summary "Level 3"]
						]
					]
				]
			]
		)]`);
		const html = renderHTML(spec);
		assert(html.includes('<details name="_M_navDet-lvl">'), 'Level 1 details has _M_navDet-lvl');
		assert(html.includes('<details name="_M_navDet-lvl-lvl">'), 'Level 2 details has _M_navDet-lvl-lvl');
		assert(html.includes('<details name="_M_navDet-lvl-lvl-lvl">'), 'Level 3 details has _M_navDet-lvl-lvl-lvl');
	});

	it("Multi-level scoped accordion hierarchy with custom root name", () => {
		const spec = ps(`[(
			[m.src name="siteNav"
				[h.nav m.coat=[navDet.name=<name|_M_navDet>]
					[h.details m.coat=[navDet.name=<a:navDet.name>-lvl name=<A:navDet.name>]
						[h.summary "Level 1"]
						[h.details m.coat=[navDet.name=<a:navDet.name>-lvl name=<A:navDet.name>]
							[h.summary "Level 2"]
						]
					]
				]
			]
		)]`);
		const html = renderHTML(spec);
		assert(html.includes('<details name="siteNav-lvl">'), 'Level 1 details has siteNav-lvl');
		assert(html.includes('<details name="siteNav-lvl-lvl">'), 'Level 2 details has siteNav-lvl-lvl');
	});
});

describe("m.slat - Domain-Qualified Lookups (a:, A:, d:)", () => {
	it("m.slat with d: prefix passes MWIData to element", () => {
		const MWIDocument = getInterface('MWIDocument').proto;
		const mwiData = MWIDocument.rxNANOS();
		globalThis.$gss.set('MWIData', mwiData);
		mwiData.set('globalTheme', 'ocean');

		const html = renderHTML(ps(`[([h.div m.slat=[data-theme=[d:globalTheme]]])]`));
		assert(html.includes('data-theme="ocean"'));

		globalThis.$gss.delete('MWIData');
	});

	it("m.slat with a: prefix passes ancestor attribute to element", () => {
		const html = renderHTML(ps(`[(
			[h.div data.level=top
				[h.div data.level=ignored-by-a m.slat=[data-level=[a:data.level]]]
			]
		)]`));
		assert(html.includes('data-level="top"'));
	});

	it("m.slat with A: prefix passes local or ancestral attribute to element", () => {
		const html = renderHTML(ps(`[(
			[h.div data.level=top
				[h.div data.level=local-variant m.slat=[data-level=[A:data.level]]]
			]
		)]`));
		assert(html.includes('data-level="local-variant"'));
	});
});

