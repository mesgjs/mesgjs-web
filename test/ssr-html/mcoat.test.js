import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

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

Deno.test("m.coat - Input Unset Cases", async (t) => {
	// SET: F, SNE: F, UNS: T, UOE: T

	await t.step("m.coat=[out=<in>] - unset input", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in>]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<in?a>] - unset input, SET test", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a>]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<in??a>] - unset input, SNE test", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a>]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<in|a>] - unset input, UNS test", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in|a>]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	await t.step("m.coat=[out=<in||a>] - unset input, UOE test", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in||a>]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	await t.step("m.coat=[out=<in?a|b>] - unset input, SET test with toggles", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a|b>]])]'));
		assertEquals(html, '<div out="b"></div>');
	});

	await t.step("m.coat=[out=<in??a||b>] - unset input, SNE test with toggles", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a||b>]])]'));
		assertEquals(html, '<div out="b"></div>');
	});

	await t.step("m.coat=[out=<in?a|b|c|d>] - unset input, SET test with multiple toggles", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a|b|c|d>]])]'));
		assertEquals(html, '<div out="bd"></div>');
	});

	await t.step("m.coat=[out=<in??a|b|c|d>] - unset input, SNE test with multiple toggles", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a|b|c|d>]])]'));
		assertEquals(html, '<div out="bd"></div>');
	});
});

Deno.test("m.coat - Input Empty String Cases", async (t) => {
	// SET: T, SNE: F, UNS: F, UOE: T

	await t.step("m.coat=[out=<in>] in='' - empty input", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in>]]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<in?a>] in='' - empty input, SET test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a>]]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	await t.step("m.coat=[out=<in??a>] in='' - empty input, SNE test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a>]]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<in|a>] in='' - empty input, UNS test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in|a>]]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<in||a>] in='' - empty input, UOE test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in||a>]]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	await t.step("m.coat=[out=<in?a|b>] in='' - empty input, SET with toggles", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a|b>]]])]'));
		assertEquals(html, '<div out="a"></div>');
	});

	await t.step("m.coat=[out=<in??a||b>] in='' - empty input, SNE with toggles", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a||b>]]])]'));
		assertEquals(html, '<div out="b"></div>');
	});

	await t.step("m.coat=[out=<in?a|b|c|d>] in='' - empty input, SET with multiple toggles", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a|b|c|d>]]])]'));
		assertEquals(html, '<div out="ac"></div>');
	});

	await t.step("m.coat=[out=<in??a|b|c|d>] in='' - empty input, SNE with multiple toggles", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a|b|c|d>]]])]'));
		assertEquals(html, '<div out="bd"></div>');
	});
});

Deno.test("m.coat - Input Non-Empty String Cases", async (t) => {
	await t.step("m.coat=[out=<in>] in=value - non-empty input", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in>]]])]'));
		assertEquals(html, '<div out="value"></div>', 'Should render input value');
	});

	await t.step("m.coat=[out=<in?a>] in=value - non-empty input, SET test", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in?a>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use "a" (in is SET and SNE)');
	});

	await t.step("m.coat=[out=<in??a>] in=value - non-empty input, SNE test", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in??a>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use "a" (in is SNE)');
	});

	await t.step("m.coat=[out=<in|a>] in=value - non-empty input, UNS fallback", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in|a>]]])]'));
		assertEquals(html, '<div out="value"></div>', 'Should copy in value (in is SET and SNE)');
	});

	await t.step("m.coat=[out=<in||a>] in=value - non-empty input, UOE fallback", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in||a>]]])]'));
		assertEquals(html, '<div out="value"></div>', 'Should copy in value (in is not UOE)');
	});

	await t.step("m.coat=[out=<in?a|b>] in=value - non-empty input, SET with toggles", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in?a|b>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use then "a" (in is SET and SNE)');
	});

	await t.step("m.coat=[out=<in??a||b>] in=value - non-empty input, SNE with toggles", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in??a||b>]]])]'));
		assertEquals(html, '<div out="a"></div>', 'Should use then "a" (in is SNE)');
	});

	await t.step("m.coat=[out=<in?a|b|c|d>] in=value - non-empty input, SET with multiple toggles", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in?a|b|c|d>]]])]'));
		assertEquals(html, '<div out="ac"></div>', 'Should use then "a" (in is SET and SNE)');
	});

	await t.step("m.coat=[out=<in??a|b|c|d>] in=value - non-empty input, SNE with multiple toggles", async () => {
		const html = renderHTML(ps('[([src in=value [h.div m.coat=[out=<in??a|b|c|d>]]])]'));
		assertEquals(html, '<div out="ac"></div>', 'Should use then "a" (in is SNE)');
	});
});

Deno.test("m.coat - Multiple Attributes", async (t) => {
	await t.step("Multiple m.coat attributes with different expressions", async () => {
		const html = renderHTML(ps('[([src in1=x in2="" [h.div m.coat=[out1=<in1> out2=<in2??default> out3=<in3||fallback>]]])]'));
		assert(html.includes('out1="x"'));
		assert(html.includes('out2'));
		assert(html.includes('out3="fallback"'));
	});

	await t.step("m.coat with regular attributes", async () => {
		const html = renderHTML(ps('[([src in=val [h.div class=test m.coat=[out=<in>] id=myid]])]'));
		assert(html.includes('class="test"'), 'Should preserve regular attributes');
		assert(html.includes('out="val"'), 'Should render m.coat attribute');
		assert(html.includes('id="myid"'), 'Should preserve attributes after m.coat');
	});
});

Deno.test("m.coat - Edge Cases", async (t) => {
	await t.step("m.coat with numeric input", async () => {
		const html = renderHTML(ps('[([src in=42 [h.div m.coat=[out=<in>]]])]'));
		assertEquals(html, '<div out="42"></div>', 'Should render numeric value as string');
	});

	await t.step("m.coat with zero input, SET test", async () => {
		const html = renderHTML(ps('[([src in=0 [h.div m.coat=[out=<in?zeroisset>]]])]'));
		assertEquals(html, '<div out="zeroisset"></div>');
	});

	await t.step("m.coat with zero input, SNE test", async () => {
		const html = renderHTML(ps('[([src in=0 [h.div m.coat=[out=<in??zeroisset>]]])]'));
		assertEquals(html, '<div out="zeroisset"></div>');
	});

	await t.step("m.coat with boolean true input, SET with toggles", async () => {
		const html = renderHTML(ps('[([src in=@t [h.div m.coat=[out=<in?yes|no>]]])]'));
		assertEquals(html, '<div out="yes"></div>', 'Should use then "yes" (true is SET and SNE)');
	});

	await t.step("m.coat with boolean false input, SET with toggles", async () => {
		const html = renderHTML(ps('[([src in=@f [h.div m.coat=[out=<in?yes|no>]]])]'));
		assertEquals(html, '<div out="no"></div>', 'Should use else "no" (false is SET but empty, no copy)');
	});

	await t.step("m.coat with special characters in values", async () => {
		const html = renderHTML(ps('[([src in="<>&\\"" [h.div m.coat=[out=<in>]]])]'));
		assert(html.includes('out="&lt;&gt;&amp;&quot;"'), 'Should escape special characters');
	});

	await t.step("m.coat with nested element", async () => {
		const html = renderHTML(ps('[([src in=outer [h.div m.coat=[out=<in>] [src in=inner [h.span m.coat=[out=<in>]]]]]])]'));
		assert(html.includes('<div out="outer">'), 'Should render outer m.coat');
		assert(html.includes('<span out="inner">'), 'Should render nested m.coat');
	});
});

Deno.test("m.coat - Complex Expression Chains", async (t) => {
	await t.step("Multiple outputs from same input", async () => {
		const html = renderHTML(ps('[([src in=shared [h.div m.coat=[out1=<in?yes> out2=<in|default> out3=<in>]]])]'));
		assert(html.includes('out1="yes"'));
		assert(html.includes('out2="shared"'));
		assert(html.includes('out3="shared"'));
	});

	await t.step("Different inputs for different outputs", async () => {
		const html = renderHTML(ps('[([src in1=a in2="" [h.div m.coat=[out1=<in1> out2=<in2||default>]]])]'));
		assert(html.includes('out1="a"'));
		assert(html.includes('out2="default'));
	});
});

Deno.test("m.coat - Special Return Values (.f, .t, .u, .un)", async (t) => {
	const doc = getInstance('MWIDocument');

	await t.step("m.coat=[out=<.f>] - returns false (attribute stored as false, suppressed in HTML)", async () => {
		const node = doc.createNode('h.div');
		node.setAttr('id', 'coat-false-test');
		node.setAttr('m.coat', ps('[(out=<.f>)]'));
		const html = node.getHTML();
		// false is not a string or true, so the attribute should not appear in HTML
		assertEquals(html, '<div id="coat-false-test"></div>');
		// Confirm the actual attribute value stored is false
		assertEquals(node.getAttr('out'), false, 'Attribute should store false');
	});

	await t.step("m.coat=[out=<.t>] - returns true (stored as true, boolean attribute in HTML)", async () => {
		const node = doc.createNode('h.div');
		node.setAttr('m.coat', ps('[(out=<.t>)]'));
		const html = node.getHTML();
		// true is a boolean, so it renders as a boolean attribute (no value)
		assertEquals(html, '<div out></div>');
		// Confirm the actual attribute value stored is true
		assertEquals(node.getAttr('out'), true, 'Attribute should store true');
	});

	await t.step("m.coat=[out=<.u>] - returns undefined (attribute suppressed)", async () => {
		const node = doc.createNode('h.div');
		node.setAttr('m.coat', ps('[(out=<.u>)]'));
		const html = node.getHTML();
		// undefined is not rendered
		assertEquals(html, '<div></div>');
		assertEquals(node.getAttr('out'), undefined, 'Attribute should store undefined');
	});

	await t.step("m.coat=[out=<.un>] - returns undefined via .un alias (attribute suppressed)", async () => {
		const node = doc.createNode('h.div');
		node.setAttr('m.coat', ps('[(out=<.un>)]'));
		const html = node.getHTML();
		// undefined is not rendered
		assertEquals(html, '<div></div>');
		assertEquals(node.getAttr('out'), undefined, 'Attribute should store undefined via .un alias');
	});

	await t.step("m.coat - multiple attributes: .t for one, .f for another, .u for another", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[enabled=<.t> disabled=<.f> custom=<.u>]])]'));
		// 'enabled' → true → boolean attribute
		// 'disabled' → false → no attribute
		// 'custom' → undefined → no attribute
		assert(html.includes('enabled'), 'boolean true renders as attribute');
		assert(!html.includes('disabled'), 'false does not render');
		assert(!html.includes('custom'), 'undefined does not render');
	});

	await t.step("m.coat=[disabled=<controller?<.t>|<.f>>] - derive boolean from slot source attribute", async () => {
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

Deno.test("m.coat - MWIData Global Store Access (<d:name>)", async (t) => {
	// Set up MWIData reactive NANOS in global shared storage
	const MWIDocument = getInterface('MWIDocument').proto;
	const mwiData = MWIDocument.rxNANOS();
	globalThis.$gss.set('MWIData', mwiData);

	await t.step("m.coat=[out=<d:key>] - reads from MWIData store", async () => {
		mwiData.set('theme', 'dark');
		const html = renderHTML(ps('[([h.div m.coat=[data-theme=<d:theme>]])]'));
		assertEquals(html, '<div data-theme="dark"></div>');
	});

	await t.step("m.coat=[out=<d:missing>] - missing MWIData key returns empty string", async () => {
		// 'missing' key is not set
		const html = renderHTML(ps('[([h.div m.coat=[out=<d:missing>]])]'));
		assertEquals(html, '<div out></div>');
	});

	await t.step("m.coat=[out=<d:key|fallback>] - UNS fallback for missing MWIData key", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<d:notset|fallback>]])]'));
		assertEquals(html, '<div out="fallback"></div>');
	});

	await t.step("m.coat=[out=<d:key?set>] - SET test for existing MWIData key", async () => {
		mwiData.set('mode', 'active');
		const html = renderHTML(ps('[([h.div m.coat=[out=<d:mode?isSet>]])]'));
		assertEquals(html, '<div out="isSet"></div>');
	});

	await t.step("m.coat with multiple <d:...> references", async () => {
		mwiData.set('lang', 'en');
		mwiData.set('dir', 'ltr');
		const html = renderHTML(ps('[([h.div m.coat=[lang=<d:lang> dir=<d:dir>]])]'));
		assert(html.includes('lang="en"'), 'lang attribute should be "en"');
		assert(html.includes('dir="ltr"'), 'dir attribute should be "ltr"');
	});

	// Clean up
	globalThis.$gss.delete('MWIData');
});

