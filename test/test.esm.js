import { lex, parse } from '../resources/mesgjs/src/lexparse.esm.js';
import { transpileTree } from '../resources/mesgjs/src/transpile.esm.js';

export let passed = 0, failed = 0;

export function assertEqual (actual, expected) {
    if (actual !== expected) {
	throw new Error(`Expected ${expected}; got ${actual}`);
    }
}

export function assertThrows (fn, msgPart = '') {
    try { fn(); } catch (e) {
	if (msgPart && !e.message.includes(msgPart)) {
	    throw new Error(`Expected error to include "${msgPart}"; got: "${e.message}"`);
	}
	return;
    }
    throw new Error('Expected function to throw an exception');
}

export function deleteGlobals () {
    delete globalThis.$f;
    delete globalThis.$gss;
    delete globalThis.$n;
    delete globalThis.$t;
    delete globalThis.$u;
}

export async function loadModuleCode (code) {
    return await import(`data:application/javascript;base64,${btoa(code)}`);
}

export function test (label, fn) {
    try {
	fn();
	console.log(  `[Passed] ${label}`);
	++passed;
	return true;
    } catch (e) {
	console.error(`[FAILED] ${label}: ${e.message}`);
	++failed;
	return false;
    }
}

export async function testAsync (label, fn) {
    try {
	await fn();
	console.log(  `[Passed] ${label}`);
	++passed;
	return true;
    } catch (e) {
	console.error(`[FAILED] ${label}: ${e.message}`);
	++failed;
	return false;
    }
}

// Transpile a Mesgjs source file, returning the generated JavaScript code string
// (The config SLID is never returned)
export function transpileMesgjs (source) {
    const { tree, errors: parseErrs } = parse(lex(source).tokens);
    if (parseErrs.length) throw new Error('Mesgjs parsing failed');
    const { code, errors: transpErrs } = transpileTree(tree, { debugBlocks: true, enableJS: true });
    if (transpErrs.length) throw new Error('Mesgjs transpilation failed');
    return code;
}

// Test a Mesgjs module (supplied as source text)
export async function testModule (label, source, expectFn = undefined, autoLoad = true) {
    const code = transpileMesgjs(source);
    return testAsync(label, async () => {
	const mod = await loadModuleCode(code);
        if (autoLoad && globalThis.msjsNoSelfLoad && typeof mod?.loadMsjs === 'function') mod.loadMsjs('test');
	if (typeof expectFn === 'function') await expectFn(mod);
    });
}

// Test a Mesgjs module (supplied as a local file path)
export async function testExternalModule (label, path, expectFn = undefined, autoLoad = true) {
    const source = await Deno.readTextFile(path);
    return testModule(label, source, expectFn, autoLoad);
}

export function testRejects (label, fn, expect) {
    return fn().then(_res => {
	console.error(`[FAILED] ${label}: Resolved instead of rejecting`)
	++failed;
	return false;
    }).catch(err => {
	if (err.includes(expect)) {
	    console.log(  `[Passed] ${label}`);
	    ++passed;
	    return true;
	} else {
	    console.error(`[FAILED] ${label}: Wrong rejection: ${err.message} instead of ${expect}`);
	    ++failed;
	    return false;
	}
    });
}

export function testResolves (label, fn, expect) {
    return fn().then(res => {
	const exFn = typeof expect === 'function';
	if (exFn ? expect(res) : (res === expect)) {
	    console.log(  `[Passed] ${label}`);
	    ++passed;
	    return true;
	} else if (exFn) {
	    console.error(`[FAILED] ${label}: Resolved to unexpected value ${res}`);
	    ++failed;
	    return false;
	} else {
	    console.error(`[FAILED] ${label}: Resolved to ${res} but expected ${expect}`);
	    ++failed;
	    return false;
	}
    }).catch(err => {
	console.error(`[FAILED] ${label}: Rejected: ${err.message}`);
	++failed;
	return false;
    });
}

export function testReturns (label, fn, expect) {
    try {
	const res = fn(), exFn = typeof expect === 'function';
	if (exFn ? expect(res) : (res === expect)) {
	    console.log(  `[Passed] ${label}`);
	    ++passed;
	    return true;
	} else if (exFn) {
	    console.error(`[FAILED] ${label}: Got unexpected value ${res}`);
	    ++failed;
	    return false;
	} else {
	    console.error(`[FAILED] ${label}: Got ${res} but expected ${expect}`);
	    ++failed;
	    return false;
	}
    } catch (e) {
	console.error(`[FAILED] ${label}: ${e.message}`);
	++failed;
	return false;
    }
}

export function testSummary () {
    console.log('[****] SUMMARY');
    console.log(`[SUMMARY] Tests run: ${passed+failed} Passed: ${passed} FAILED: ${failed}`);
    if (failed) console.log('[SUMMARY] ******** TEST(S) FAILED ********');
}

export function testThrows (label, fn, expect) {
    try {
	fn();
	console.log(  `[FAILED] ${label}: Expected exception but didn't get one`);
	++failed;
	return false;
    } catch (e) {
	if (e.message.includes(expect)) {
	    console.log(  `[Passed] ${label} (expected exception received)`);
	    ++passed;
	    return true;
	} else {
	    console.error(`[FAILED] ${label}: Wrong exception: $(e.message} instead of ${expect}`);
	    ++failed;
	    return false;
	}
    }
}

export function testTranspile (label, src) {
    const res = transpile(src);
    if (res.parserErrors?.length) {
	console.error(`[FAILED] ${label}: Parsing errors`);
	++failed;
	return;
    }
    if (res.fatal) {
	console.error(`[FAILED] ${label}: Fatal transpilation error`);
	++failed;
	return;
    }
    if (res.transpilerErrors?.length) {
	console.error(`[FAILED] ${label}: Transpilation errors`);
	++failed;
	return;
    }
    console.log(  `[Passed] ${label}: Transpilation succeeded`);
    ++passed;
    return res;
}

export function transpile (src, opts = {}) {
    const { tokens } = lex(src);
    const { shebang, configSLID, tree, errors: parserErrors } = parse(tokens);
    if (parserErrors?.length) return { parserErrors };
    const { code, errors: transpilerErrors, fatal } = transpileTree(tree, { debugBlocks: true, enableJS: true, ...opts });
    return { shebang, configSLID, code, transpilerErrors, fatal };
}

// END
