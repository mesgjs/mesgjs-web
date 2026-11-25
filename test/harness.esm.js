import { readTextFile } from '@compat/file';
import { lex, parse } from "mesgjs/src/lexparse.esm.js";
import { transpileTree } from "mesgjs/src/transpile.esm.js";
import { parseHTML } from 'linkedom';

// Set up the Mesgjs runtime. May only be called once per process.
// Previously transpiled modules will be loaded normally by the runtime.
// Mesgjs source modules will be transpiled and side-loaded.
export async function setupRuntime ({ modules, standard = true, extended = false, features = [] } = {}) {
	await import('./runtime-loader.esm.js');
	const { fwait, getModMeta, setModMeta } = globalThis.$c;
	globalThis.ls = (pairs) => (new NANOS()).fromPairs(pairs);
	globalThis.ps = (str) => NANOS.parseSLID(str);
	if (getModMeta()) throw new Error('setupRuntime: The Mesgjs runtime is not reconfigurable');
	const stdMods = {
		'mwi/mwi-registry': {
			url: './src/mwi-registry.msjs',
			featpro: 'mwi.compRegOpen mwi.compRegReady',
		},
		'mwi/mwi-document': {
			url: './src/mwi-document.msjs',
			featpro: 'MWIDocument',
		},
		'mwi/mwi-doc-node': {
			url: './src/mwi-doc-node.msjs',
			featpro: 'MWIDocNode MWIDOMSync',
		},
		'mwi/mwi-html-comp': {
			url: './src/mwi-html-comp.msjs',
			featpro: 'mwi.comp.MWIHTML',
		},
		'mwi/mwi-core-comp': {
			url: './src/mwi-core-comp.msjs',
			featpro: 'mwi.comp.MWICore',
		},
	};
	if (standard) modules = Object.assign({}, stdMods, modules);
	const extMods = {
		'mwi/mwi-aggr-comp.msjs': {
			url: './src/mwi-aggr-comp.msjs',
			featpro: 'mwi.comp.MWIAGGR',
		},
	};
	if (extended) modules = Object.assign({}, extMods, modules);
	const modMeta = {
		testMode: true,
		modules,
		features
	};
	const mesgjsModURLs = {};

	for (const [modPath, modInfo] of Object.entries(modules || {})) {
		const url = modInfo.url;
		if (url?.endsWith('.msjs')) {
			// Not JS - the runtime can't load this directly.
			modInfo.deferLoad = true;
			modInfo.integrity = 'DISABLED';
			mesgjsModURLs[modPath] = url;
		}
	}

	setModMeta(modMeta);

	// Transpile and load any Mesgjs modules we found.
	const loaders = [];
	for (const [modPath, url] of Object.entries(mesgjsModURLs)) {
		loaders.push(loadMesgjsModulePath(url, modPath));
	}
	if (loaders.length) await Promise.all(loaders);

	// Make sure any modules auto-loaded per modMeta are also ready.
	await fwait('@loaded');
}

// Render a new MWIDocument with the specified spec-list content and return the DOM
export function renderDOM (content) {
	const { fwait, getInstance, sm } = globalThis.$c;
	const doc = getInstance('MWIDocument');
	const nodes = sm(doc, 'from', ls(['list', content]));
	sm(doc, 'append', nodes);
	return doc.getDOM();
}

// Render a new MWIDocument with the specified spec-list content and return the HTML
export function renderHTML (content) {
	const { fwait, getInstance, sm } = globalThis.$c;
	const doc = getInstance('MWIDocument');
	const nodes = sm(doc, 'from', ls(['list', content]));
	sm(doc, 'append', nodes);
	// console.log('HTML (debug):', sm(doc, 'getHTML'));
	return doc.getHTML();
}

// Use LinkeDOM to simulate browser-like environment with pure ESM support
// Note: this will rebind window, document, and core DOM constructors on each call!
export function simulateBrowser (html = '<!DOCTYPE html><html><head></head><body></body></html>') {
	const dom = parseHTML(html);

	globalThis.window = dom.window;
	globalThis.document = dom.document;
	globalThis.customElements = dom.customElements;
	globalThis.HTMLElement = dom.HTMLElement;
	globalThis.Element = dom.Element;
	globalThis.Node = dom.Node;
	globalThis.Text = dom.Text;
	globalThis.Comment = dom.Comment;
	globalThis.DocumentFragment = dom.DocumentFragment;
	globalThis.Event = dom.Event;
	globalThis.CustomEvent = dom.CustomEvent;

	// Ensure standard HTML IDL getter/setter for HTMLSelectElement.value
	// and getter for .selectedOptions
	const selectProto = dom.HTMLSelectElement?.prototype || dom.window.HTMLSelectElement?.prototype;
	if (selectProto && !selectProto.__mwiPolyfilled) {
		selectProto.__mwiPolyfilled = true;
		const valSym = Symbol.for('mwi.selectValue');
		Object.defineProperty(selectProto, 'value', {
			get () {
				const targetVal = this[valSym];
				if (targetVal !== undefined) {
					for (const opt of this.options) {
						opt.selected = (opt.value === targetVal);
					}
					return targetVal;
				}
				for (const opt of this.options) {
					if (opt.selected) return opt.value;
				}
				return this.options[0]?.value || '';
			},
			set (val) {
				const strVal = String(val);
				this[valSym] = strVal;
				for (const opt of this.options) {
					opt.selected = (opt.value === strVal);
				}
			},
			configurable: true,
			enumerable: true,
		});
		Object.defineProperty(selectProto, 'selectedOptions', {
			get () {
				const selected = [];
				for (const opt of this.options) {
					if (opt.selected) selected.push(opt);
				}
				return selected;
			},
			configurable: true,
			enumerable: true,
		});
	}

	// Ensure standard HTML IDL getter/setter for HTMLTextAreaElement.value
	const taProto = dom.HTMLTextAreaElement?.prototype || dom.window.HTMLTextAreaElement?.prototype;
	if (taProto && !taProto.__mwiPolyfilled) {
		taProto.__mwiPolyfilled = true;
		const valSym = Symbol.for('mwi.taValue');
		Object.defineProperty(taProto, 'value', {
			get () {
				if (this[valSym] !== undefined) return this[valSym];
				return this.textContent;
			},
			set (val) {
				this[valSym] = String(val);
			},
			configurable: true,
			enumerable: true,
		});
	}

	return dom;
}

// Transpile a Mesgjs source file, returning the generated JavaScript code string.
// (The config SLID is never returned.)
export function transpileMesgjs (source, module = 'anonymous') {
	const { tree, errors: parseErrs } = parse(lex(source).tokens);
	if (parseErrs.length) throw new Error(`${module}: Mesgjs parsing failed`);
	const { code, errors: transpErrs, fatal } = transpileTree(tree, { debugBlocks: true, enableJS: true, stripJSEC: false });
	if (transpErrs.length) throw new Error(`${module}: Mesgjs transpilation failed`);
	if (fatal) throw new Error(`${module}: Mesgjs transpilation fatal error`);
	return code;
}

// Dynamically load a Mesgjs module's transpiled JavaScript code.
export async function loadMesgjsModuleJS (code) {
	const mod = await import(`data:application/javascript;base64,${btoa(code)}`);
	if (typeof mod?.loadMsjs === 'function') {
		await mod.loadMsjs('test'); // Call the module's loadMsjs function
	}
	return mod;
}

// Load a module supplied as Mesgjs source code.
export async function loadMesgjsModuleSource (source, module = 'anonymous') {
	const code = transpileMesgjs(source, module);
	return loadMesgjsModuleJS(code);
}

// Load a Mesgjs module from an actual .msjs file.
// (Any internal or external SLID configuration is ignored.)
export async function loadMesgjsModulePath (path, module = path) {
	const source = await readTextFile(path);
	return loadMesgjsModuleSource(source, module);
}

