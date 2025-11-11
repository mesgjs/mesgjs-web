export async function loadMsjs(mid){const{d,ls,m,na}=$modScope(),{mp,sm}=d;0&&await 0;

	if (!mid) throw new Error('MWICore requires Mesgjs module management to be active');

	const INTERFACE = 'if';
	const SCHEMA = 'schema';
	const AUTO_DOC = 'autoDoc';
	const VOID = 'void';

	const REG_IF = 'MWIRegistry';
	const REG_OPEN_FT = 'mwi.compRegOpen';
	const BASE_IF = 'MWIDocNode';
	const BASE_FT = BASE_IF;
	const CORE_IF = 'MWICore';
	const HTML_IF = 'MWIHTML';
	const HTML_FT = 'mwi.comp.' + HTML_IF;
	const READY_FT = 'mwi.comp.' + CORE_IF;

	const COM_IF = CORE_IF + 'Com';
	const COM_TYPE = 'm.com';
	const DEFER_IF = CORE_IF + 'Defer';
	const DEFER_TYPE = 'm.defer';
	const FRAG_IF = CORE_IF + 'Frag';
	const FRAG_TYPE = 'm.frg';
	const TEXT_IF = CORE_IF + 'Text';
	const TEXT_TYPE = 'm.t';
	const TPL_IF = CORE_IF + 'Tpl';
	const SLOT_IF = CORE_IF + 'Slot';
	const SLOT_TYPE = 'm.slot';
	const SCPCSS_IF = CORE_IF + 'ScpCSS';
	const SCPCSS_TYPE = 'm.scpcss';

	const { fready, fwait, getInstance, getInterface, getModMeta, setRO, modHasCap } = globalThis.$c;

	const coreConfig = {
		[COM_TYPE]: ls([INTERFACE, COM_IF, SCHEMA, ls([VOID, true])]),
		[DEFER_TYPE]: ls([INTERFACE, DEFER_IF, SCHEMA, ls([AUTO_DOC, false, 'htmlAllowAttr', new Set(['id', 'data-mwi-defer'])])]),
		[FRAG_TYPE]: ls([INTERFACE, FRAG_IF]),
		[SCPCSS_TYPE]: ls([INTERFACE, SCPCSS_IF, SCHEMA, ls([VOID, true])]),
		[SLOT_TYPE]: ls([INTERFACE, SLOT_IF]),
		[TEXT_TYPE]: ls([INTERFACE, TEXT_IF, SCHEMA, ls([VOID, true])]),
	}

	await fwait(BASE_FT, HTML_FT); 

	
	
	(() => {
		
		
		function escapeComment (d, text) {
			const comment = text.
			  replace(/&/g, '&amp;').
			  replace(/^>/, '&gt;').
			  replace(/^->/, '-&gt;').
			  replace(/<!--(!?)>/g, '<!-&#45;$1>').
			  replace(/--(!?)>/g, '--$1&gt;').
			  replace(/<!--/g, '&lt;!--').
			  replace(/<!-$/, '&lt;!-');
			return d.rr.textToHTML(comment, { lt: false, amp: false, gt: false, sq: false, dq: false });
		}

		function opGetDOM (d) {
			if (typeof document !== 'object' || typeof document.createComment !== 'function') return new NANOS();
			const p = d.p;
			if (p.has('dom')) return p.at('dom'); 
			
			const comment = document.createComment(''), doc = p.at('doc'), nodes = new NANOS(comment);
			p.set('dom', nodes);
			const track = getInstance('@reactive', {
				eager: true, def: () => {
					const text = d.rr('getAttr', [ 't' ]) || '';
					comment.data = text;
				}
			});
			track('rv');
			return nodes;
		}

		function opGetHTML (d) {
			const m = d.mp, output = m.at('in');;
			const text = d.rr('getAttr', [ 't' ]) || '';
			const html = `<!--${escapeComment(d, text)}-->`;
			if (output) output.push(html);
			return html;
		}

		getInterface(COM_IF).set({
			pristine: true, lock: true,
			chain: [ BASE_IF ],
			handlers: {
				getDOM: opGetDOM,
				getHTML: opGetHTML,
				getSubSpec: (_d) => new NANOS(),
				setSubSpec: (d) => d.rr,
			}
		});
	})();

	
	
	
	
	(() => {
		function opInit (d) {
			const p = d.p, m = d.mp;
			
			const deferType = m.at('type');
			
			d.sm(d, 'redis');
			
			p.set('type', 'h.slot');
			
			d.rr('setAttr', ['m.deferType', deferType]);
			d.rr('setAttr', ['data-mwi-defer', deferType]);
		}

		function opGetDOM (d) {
			
			d.rr('getAttr', ['m.id']); 
			
			return d.sm(d, 'redis');
		}

		function opGetHTML (d) {
			
			d.rr('getAttr', ['m.id']); 
			
			return d.sm(d, 'redis');
		}

		getInterface(DEFER_IF).set({
			pristine: true, lock: true,
			chain: [ HTML_IF ],  
			handlers: {
				'@init': opInit,
				append: (d) => d.rr, 
				getDOM: opGetDOM,
				getHTML: opGetHTML,
				getSubSpec: (_d) => new NANOS(),
				setSubSpec: (d) => d.rr,
			}
		});
	})();

	
	
	
	(() => {
		
		getInterface(FRAG_IF).set({
			pristine: true, lock: true,
			chain: [ BASE_IF ],
			handlers: {
				subSlotSrc: (d) => d.p.at('slotSrc'), 
			}
		});
	})();

	
	
	
	(() => {
		function aggregateCSS (d) {
			const doc = d.p.at('doc'), registry = doc('registry');
			const typesUsed = doc('typesUsed');
			const cssBlocks = [];

			for (const type of typesUsed) {
				const entry = registry.get(type);
				if (entry && entry.has('scopedCSS')) {
					const scopedCSS = entry.at('scopedCSS');
					const id = entry.at('id');
					
					const processedCSS = scopedCSS.replace(/@@/g, id);
					cssBlocks.push(processedCSS);
				}
			}

			return cssBlocks.join('\n');
		}

		function opGetDOM (d) {
			if (typeof document !== 'object' || typeof document.createElement !== 'function') return new NANOS();
			const p = d.p;
			if (p.has('dom')) return p.at('dom');
			const styleElem = document.createElement('style'), doc = p.at('doc'), nodes = doc.rxNANOS();
			p.set('dom', nodes);
			const relay = getInstance('@reactive', {
				eager: true, def: () => {
					const css = aggregateCSS(d);
					relay('untr', () => {
						if (css !== '') {
							styleElem.textContent = css;
							if (!nodes.has(0)) nodes.set(0, styleElem);
						} else {
							if (nodes.has(0)) nodes.clear();
						}
					});
				}
			});
			relay('rv');
			return nodes;
		}

		function opGetHTML (d) {
			const m = d.mp, output = m.at('in');
			const css = aggregateCSS(d);
			if (css !== '') {
				
				const sanzd = css.replace(/<(?=\s*\/\s*style)/gi, '\\3c ');
				const html = `<style>${sanzd}</style>`;
				if (output) output.push(html);
				return html;
			}
			return '';
		}

		getInterface(SCPCSS_IF).set({
			pristine: true, lock: true,
			chain: [ BASE_IF ],
			handlers: {
				getDOM: opGetDOM,
				getHTML: opGetHTML,
				getSubSpec: (_d) => new NANOS(),
				setSubSpec: (d) => d.rr,
			}
		});
	})();

	
	
	
	(() => {
		
		
		

		
		function getFrag (d) {
			const p = d.p, doc = p.at('doc'), frag = doc.createNode('m.frg', { slotSrc: d.rr });
			return frag;
		}

		function opGetDOM (d) {
			if (typeof document !== 'object') return new NANOS();
			const p = d.p, slotSrc = p.at('slotSrc');
			if (!slotSrc) return d.sm(d, 'redis'); 
			
			if (p.has('slotDOM')) return p.at('slotDOM'); 
			const doc = p.at('doc'), nodes = doc.rxNANOS();
			p.set('slotDOM', nodes);
			const relay = getInstance('@reactive', {
				eager: true, def: () => {
					const name = d.rr('getAttr', [ 'name' ]);
					
					const slotAttr = name && slotSrc('getAttr', [name]);
					const attrOK = slotAttr instanceof NANOS;
					
					const subOK = !name && slotSrc('hasChildren');

					if (attrOK) {
						
						const frag = getFrag(d);
						frag('setSubSpec', slotAttr);
						const newNodes = [...frag('getDOM').values()];
						relay('unbatch', () => {
							nodes.clear();
							nodes.push(newNodes);
						});
					}
					else {
						
						const src = subOK ? slotSrc('getSubDOM') : d.rr('getSubDOM');
						const newNodes = [...src.values()];
						relay('unbatch', () => {
							nodes.clear();
							nodes.push(newNodes);
						});
					}
				}
			});
			relay('rv');
			return nodes;
		}

		function opGetHTML (d) {
			const p = d.p, m = d.mp;
			const slotSrc = p.at('slotSrc'), name = d.rr('getAttr', [ 'name' ]);
			const hasIn = m.has('in'), html = m.at('in', []);
			
			const slotAttr = slotSrc && name && slotSrc('getAttr', [name]), attrOK = slotAttr instanceof NANOS;
			
			const subOK = slotSrc && !name && slotSrc('hasChildren');
			const specHTML = (spec) => {
				const frag = getFrag(d);
				frag('setSubSpec', spec);
				frag('getHTML', { in: html });
				if (!hasIn) return html.join('');
			};
			if (attrOK) return specHTML(slotAttr);
			if (subOK) return specHTML(slotSrc('getSubSpec'));
			return d.sm(d, 'redis'); 
		}

		function opHasChildren (d) {
			const p = d.p, slotSrc = p.at('slotSrc'), name = d.rr('getAttr', [ 'name ']);
			if (!slotSrc) return d.sm(d, 'redis'); 
			if (!name) return slotSrc('hasChildren'); 
			return !!slotSrc('getAttr', [name]).next;
		}

		getInterface(SLOT_IF).set({
			pristine: true, lock: true,
			chain: [ BASE_IF ],
			handlers: {
				getDOM: opGetDOM,
				getHTML: opGetHTML,
				hasChildren: opHasChildren,
			}
		});
	})();

	
	
	(() => {
		function opGetDOM (d) {
			if (typeof document !== 'object' || typeof document.createElement !== 'function') return new NANOS();
			const p = d.p;
			if (p.has('dom')) return p.at('dom');
			const output = document.createElement('output'), doc = p.at('doc'), nodes = doc.rxNANOS();
			p.set('dom', nodes);
			const relay = getInstance('@reactive', {
				eager: true, def: () => {
					const text = d.rr('getAttr', [ 't' ]) || '';
					relay('untr', () => {
						if (text !== '') {
							output.textContent = text;
							if (!nodes.has(0)) nodes.set(0, output);
						} else {
							if (nodes.has(0)) nodes.clear();
						}
					});
				}
			});
			relay('rv');
			return nodes;
		}

		function opGetHTML (d) {
			const m = d.mp, output = m.at('in');;
			const text = d.rr('getAttr', [ 't' ]) || '';
			const html = d.rr.textToHTML(text);
			if (html !== '' && output) output.push(html);
			return html;
		}

		getInterface(TEXT_IF).set({
			pristine: true, lock: true,
			chain: [ BASE_IF ],
			handlers: {
				getDOM: opGetDOM,
				getHTML: opGetHTML,
				getSubSpec: (_d) => new NANOS(),
				setSubSpec: (d) => d.rr,
			}
		});
	})();

	
	
	(() => {
		function opInit (d) {
			const p = d.p;
			d.sm(d, 'redis'); 
			
			if (!p.has(SCHEMA)) p.set(SCHEMA, new NANOS());
			const schema = p.at(SCHEMA);
			schema.set(AUTO_DOC, false);
		}

		function opGetDOM (d) {
			if (typeof document !== 'object') return new NANOS();
			const p = d.p;
			if (p.has('dom')) return p.at('dom');
			const doc = p.at('doc'), nodes = doc.rxNANOS(), frag = tplFrag(d);
			p.set('dom', nodes);
			const relay = getInstance('@reactive', {
				eager: true, def: () => {
					const newNodes = [...frag('getDOM').values()];
					relay('unbatch', () => {
						nodes.clear();
						nodes.push(newNodes);
					});
				}
			});
			relay('rv');
			return nodes;
		}

		function opGetHTML (d) {
			const frag = tplFrag(d);
			return frag('getHTML', d.mp);
		}

		function tplFrag (d) {
			const p = d.p;
			if (!p.has('frag')) {
				const doc = p.at('doc'), slotSrc = d.rr, frag = doc.createNode('m.frg', { slotSrc }), list = p.at('tpl');
				frag('setSubSpec', list); 
				p.set('frag', frag);
			}
			return p.at('frag');
		}

		getInterface(TPL_IF).set({
			pristine: true, lock: true,
			chain: [ BASE_IF ],
			handlers: {
				'@init': opInit,
				getDOM: opGetDOM,
				getHTML: opGetHTML,
			}
		});
	})();

	await fwait(REG_OPEN_FT); 
	const registry = getInstance(REG_IF);
	for (const [name, entry] of Object.entries(coreConfig)) {
		registry.register(name, entry);
	}

	fready(mid, READY_FT);
}if(!globalThis.msjsNoSelfLoad)loadMsjs();

//# sourceMappingURL=mwi-core-comp@0.5.0.esm.js.map
