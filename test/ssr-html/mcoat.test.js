import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime, renderHTML } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

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
		assertEquals(html, '<div out=""></div>');
	});

	await t.step("m.coat=[out=<in?a>] - unset input, SET test", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in?a>]])]'));
		assertEquals(html, '<div out=""></div>');
	});

	await t.step("m.coat=[out=<in??a>] - unset input, SNE test", async () => {
		const html = renderHTML(ps('[([h.div m.coat=[out=<in??a>]])]'));
		assertEquals(html, '<div out=""></div>');
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
		assertEquals(html, '<div out=""></div>');
	});

	await t.step("m.coat=[out=<in?a>] in='' - empty input, SET test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in?a>]]])]'));
		console.log(html);
		assertEquals(html, '<div out="a"></div>');
	});

	await t.step("m.coat=[out=<in??a>] in='' - empty input, SNE test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in??a>]]])]'));
		assertEquals(html, '<div out=""></div>');
	});

	await t.step("m.coat=[out=<in|a>] in='' - empty input, UNS test", async () => {
		const html = renderHTML(ps('[([src in="" [h.div m.coat=[out=<in|a>]]])]'));
		assertEquals(html, '<div out=""></div>');
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
		assert(html.includes('out2=""'));
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
