export async function loadMsjs(mid){const{d,ls,m,na}=$modScope(),{mp,sm}=d;0&&await 0;

	if (!mid) throw new Error('MWIDocNode requires Mesgjs module management to be active');

	const SCHEMA = 'schema';
	const VOID = 'void';
	const AUTO_DOC = 'autoDoc';

	const IF_NAME = 'MWIDocNode';
	const READY_FT = IF_NAME;
	const DOC_IF = 'MWIDocument';

	const ATTR_LOW_FLUX = 3; 

	const { fready, fwait, getInstance, getInterface, getModMeta, setRO, typeChains } = globalThis.$c;

	
	
	
	function domAppendAfter (parent, node, after = null) {
		if (!after && (node.parentNode !== parent || node.previousSibling)) {
			
			const curFirst = parent.firstChild;
			if (curFirst) parent.insertBefore(node, curFirst);
			else parent.append(node);
		} else if (after && (node.parentNode !== parent || node.previousSibling !== after)) {
			
			const next = after.nextSibling;
			if (next) parent.insertBefore(node, next);
			else parent.append(node);
		}
		
	}

	
	function domSyncChildren (parent, children) {
		let prev = null, child = null;
		for (child of children.values()) {
			domAppendAfter(parent, child, prev);
			prev = child;
		}
		
		
		if (prev) while (child = prev.nextSibling) parent.removeChild(child);
		
		else while (child = parent.firstChild) parent.removeChild(child);
	}

	
	function setDOMAttrs (node, attrs, schema = null) {
		const flux = {};
		const allowAttr = ((set) => set?.jsv || set)(schema?.at('htmlAllowAttr'));  
		getInstance('@reactive')('set', {
			eager: true, def: () => {
				
				
				const extra = new Set(node.getAttributeNames());
				for (const name of attrs.namedKeys()) {
					
					if (!/^[0-9a-z:_-]*$/.test(name)) continue;
					
					if (allowAttr && !allowAttr.has(name)) continue;
					flux[name] ||= 0; 
					extra.delete(name); 
					const update = (_, chg = 0) => { 
						const curValue = node.getAttribute(name), newValue = attrs.at(name);
						if (curValue !== newValue) {
							flux[name] += chg;
							if (newValue === undefined) node.removeAttribute(name);
							else node.setAttribute(name, newValue);
						}
					};
					
					
					if (flux[name] > ATTR_LOW_FLUX) getInstance('@reactive')('set', {
						eager: true, def: update, 
					})('rv'); 
					else update(0, 1);
				}
				
				for (const name of extra.values()) node.removeAttribute(name);
			},
		})('rv'); 
	}

	
	function textToHTML (str, { lt = true, amp = true, gt = true, sq = false, dq = false } = {}) {
		if (typeof str === 'function') {
			
			const d = str, m = d.mp;
			str = m.at(0);
			lt = m.at('lt', true);
			amp = m.at('amp', true);
			gt = m.at('gt', true);
			sq = m.at('sq', false);
			dq = m.at('dq', false);
		}
		
		return String(str).replace(/[\x00-\x1f&'"<>\\\x7f-\uffff]/g, (match) => {
			switch (match) {
			case '<': return (lt ? '&lt;' : '<');
			case '&': return (amp ? '&amp;' : '&');
			case '>': return (gt ? '&gt;' : '>');
			case "'": return (sq ? '&#39;' : "'");
			case '"': return (dq ? '&quot;' : '"');
			default:
				
				return `&#${match.charCodeAt()};`;
			}
		});
	}

	
	const docNodeProto = Object.setPrototypeOf({
		append (...content) { return this('append', content); },
		get compId () { return this('compId'); },
		[globalThis.$c.symbols.convert] () { return this; },
		delAttr (name) { return this('delAttr', [ name ]); },
		get document () { return this('document'); },
		domAppendAfter,
		domSyncChildren,
		getAttr (name) { return this('getAttr', [ name ]); },
		getDOM () { return this('getDOM'); },
		getHTML () { return this('getHTML'); },
		getSpec () { return this('getSpec'); },
		getSubDoc () { return this('getSubDoc'); },
		getSubSpec () { return this('getSubSpec'); },
		hasAttr (name) { return this('hasAttr', [ name ]); },
		hasClass (name) { return this('hasClass', [ name ]); },
		get jsv () { return this; },
		setAttr (name, value, options = {}) { return this('setAttr', new NANOS([ name, value ], options)); },
		setDOMAttrs,
		setSpec (spec) { return this('setSpec', [ spec ]); },
		setSubSpec (...params) { return this('setSubSpec', (params.length === 1) ? params[0] : params); },
		get slotSrc () { return this('slotSrc'); }, 
		get subSlotSrc () { return this('subSlotSrc'); },
		textToHTML,
		get type () { return this('type'); },
		valueOf () { return this; },
	}, Function.prototype);

	
	function opInit (d) {
		const p = d.p, m = d.mp, doc = d.sr;
		if (typeof doc !== 'function' || d.st !== DOC_IF) {
			const type = m.at('type', d.rt);
			throw new Error(`Use ${DOC_IF}(createNode) to create a new ${type} node`);
		}
		p.push({
			slotSrc: undefined, 
			}, m, {
			doc, 
			attrs: doc.rxNANOS(), 
			permClasses: new Set(), 
			classes: new Set(), 
			subDoc: doc.rxNANOS(), 
			subSpec: doc.rxNANOS(), 
		});
		if (!p.has('type')) throw new TypeError(`${IF_NAME} requires a node type`);
		
		Object.setPrototypeOf(d.rr, docNodeProto);
	}

	
	function applyCoat (d, value) {
		if (!(value instanceof NANOS)) return;
		const p = d.p, attrs = p.at('attrs');
		attrs.set('m.coat', value);
		for (const [target, spec] of value.namedEntries()) {
			const value = computeAttr(d, spec);
			d.rr('setAttr', ls([, target, , value, 'coat', false ]));
		}
	}

	
	
	function applySlat (d, value) {
		if (!(value instanceof NANOS)) return;
		const p = d.p, attrs = p.at('attrs'), slotSrc = p.at('slotSrc');
		attrs.set('m.slat', value);
		for (const [target, spec] of value.namedEntries()) {
			const source = spec.at(0, target);
			const value = slotSrc?.('getAttr', [ source ]) ?? spec.at('else');
			d.rr('setAttr', ls([, target, , value, 'coat', false ]));
		}
	}

	
	
	function opAppend (d) {
		const p = d.p;
		if (p.at([ SCHEMA, VOID ])) return d.rr;
		const m = d.mp, subDoc = p.at('subDoc');
		const docNodes = [...m.values()].filter((n) => typeof n === 'string' || typeChains(n?.msjsType, IF_NAME));
		subDoc.set('live', true); 
		if (docNodes.length) {
			const doc = p.at('doc');
			subDoc.push([...docNodes.map(orig => {
				if (typeof orig !== 'string') return orig;
				const node = doc.createNode('m.t');
				node.setAttr('t', orig);
				return node;
			})]);
		}
		return d.rr;
	}

	
	function computeAttr (d, spec) {
		const slotSrc = d.p.at('slotSrc');
		
		
		if (typeof spec === 'number') spec = String(spec);
		spec = spec.replace(/@@|@#/g, (match) => {
			switch (match) {
			case '@@': return slotSrc?.('getAttr', 'm.ci') || '';
			case '@#': return slotSrc?.('getAttr', 'm.id') || '';
			default: return match;
			}
		});
		let retUndef = false;
		const getVal = (name) => {
			switch (name) { 
			case '.aa': return '@@'; 
			case '.ap': return '@#'; 
			case '.gt': return '>'; 
			case '.lt': return '<'; 
			case '.qm': return '?'; 
			case '.un': retUndef = true; return; 
			case '.vb': return '|'; 
			}
			if (slotSrc) return slotSrc('getAttr', [ name ]);
		};
		const isUns = (v) => v === undefined || v === false; 
		const isUOE = (v) => v === undefined || v === "" || v === false; 
		
		const tokens = String(spec).match(/<|>|\?\??|\|\|?|[^<>?|]+/g) || [];
		const output = [];
		const outStr = (v) => {
			if (typeof v === 'string' || typeof v === 'number') {
				const str = String(v);
				if (str) output.push(str);
			}
		};
		let token;
		const parseExpr = () => { 
			const name = tokens.shift(), value = getVal(name);
			const then = tokens.shift();
			if (then === '>') { 
				outStr(value);
				return;
			}
			let copy = false;
			switch (then) {
			
			case '?': copy = !isUns(value); break;
			case '??': copy = !isUOE(value); break;
			
			case '|':
			case '||':
				copy = (then === '|') ? isUns(value) : isUOE(value);
				if (!copy) outStr(value);
				break;
			}
			
			while (!retUndef && (token = tokens.shift())) {
				switch (token) {
				case '<': parseExpr(); break; 
				case '>': return; 
				case '|': case '||': copy = !copy; break; 
				default: if (copy) outStr(token); break; 
				}
			}
		};
		
		while (!retUndef && (token = tokens.shift())) {
			if (token === '<') parseExpr(); 
			else outStr(token); 
		}
		if (!retUndef) return output.join('');
	}

	
	function updateIdIndex (d, oldId, newId) {
		const doc = d.p.at('doc');
		d.sm(doc, 'updIdIndex', ls([, oldId, , newId]));
	}

	
	function opDelAttr (d) {
		const p = d.p, m = d.mp;
		const name = m.at(0);
		switch (name) {
		case 'm.percl':
			p.at('permClasses').clear();
			setClass(d, '+');
			break;
		case 'class':
			p.at('classes').clear();
			setClass(d, '+');
			break;
		case 'id':
			{
			const attrs = p.at('attrs');
			const oldId = attrs.at('id');
			attrs.set('id', undefined);
			
			updateIdIndex(d, oldId, undefined);
			}
			break;
		case 'style':
			setStyle(d, '==');
			break;
		default:
			{
			const attrs = p.at('attrs');
			attrs.delete(name);
			}
			break;
		}
	}

	
	function opGetAttr (d) {
		const p = d.p, m = d.mp;
		const name = m.at(0), attrs = p.at('attrs');
		switch (name) {
		case 'm.ci': 
			return p.at('id');
		case 'm.id': 
			if (!attrs.has('id')) {
				
				const doc = p.at('doc'), mid = doc('nextId');
				attrs.set('id', mid);
				return mid;
			}
			return attrs.at('id');
		}
		return attrs.at(name);
	}

	
	function opGetAttrHTML (d) {
		const p = d.p, HTML = [], schema = p.at(SCHEMA);
		const allowAttr = ((set) => set?.jsv || set)(schema?.at('htmlAllowAttr'));  
		for (const [name, value] of p.at('attrs').namedEntries()) {
			if (!/^[0-9a-z:_-]*$/.test(name)) continue; 
			if (allowAttr && !allowAttr.has(name)) continue; 
			if (value === true) HTML.push(` ${name}`);
			else if (typeof value === 'string' || typeof value === 'number') {
				HTML.push(` ${name}="${textToHTML(String(value), { dq: true })}"`);
			}
		}
		return HTML.join('');
	}

	
	function opGetHTML (d) {
		const p = d.p, m = d.mp;
		const hasIn = m.has('in'), html = m.at('in', []);
		const subDoc = p.at('subDoc');
		for (const node of subDoc.values()) {
			node('getHTML', { in: html });
		}
		if (!hasIn) return html.join('');
	}

	
	function opGetSpec (d) {
		const p = d.p, doc = p.at('doc'), type = p.at('type'), spec = doc.rxNANOS();
		const relay = getInstance('@reactive');
		relay('set', {
			eager: true, def: () => {
				const attrs = p.at('attrs').namedEntries();
				const subSpec = d.rr('getSubSpec');
				relay('unbatch', () => {
					spec.clear();
					spec.push(type);
					spec.fromEntries(attrs);
					spec.push(subSpec);
				});
			},
		});
		relay('rv');
		return spec;
	}

	
	function opGetSubDOM (d) {
		const p = d.p;
		if (p.has('subDom')) return p.at('subDom');
		const doc = p.at('doc'), subDoc = p.at('subDoc'), nodes = doc.rxNANOS();
		p.set('subDom', nodes);
		const relay = getInstance('@reactive', {
			eager: true, def: () => {
				let newNodes = [];
				if (!subDoc.at('live')) {
					
					const slotSrc = d.rr('subSlotSrc'), frag = doc.createNode('m.frg', { slotSrc });
					frag('setSubSpec', d.rr('getSubSpec'));
					newNodes = [...frag('getDOM').values()];
				} else for (const node of subDoc.values()) {
					
					const subDOM = node('getDOM');
					newNodes.push(...subDOM.values());
				}
				relay('unbatch', () => {
					nodes.clear();
					nodes.push(newNodes);
				});
			}
		});
		relay('rv');
		return nodes;
	}

	
	function opGetSubSpec (d) {
		const p = d.p, doc = p.at('doc'), subDoc = p.at('subDoc'), result = doc.rxNANOS();
		const relay = getInstance('@reactive', {
			eager: true, def: () => {
				let newSpec;
				
				if (!subDoc.at('live')) {
					newSpec = [...p.at('subSpec').values()];
				} else {
					newSpec = [];
					for (const node of subDoc.values()) {
						newSpec.push(node('getSpec'));
					}
				}
				relay('unbatch', () => {
					result.clear();
					result.push(newSpec);
				});
			}
		});
		relay('rv'); 
		return result;
	}

	
	function opHasAttr (d) {
		const p = d.p, m = d.mp, name = m.at(0);
		const attrs = p.at('attrs');
		return attrs.has(name);
	}

	function opHasChildren (d) {
		const p = d.p, subDoc = p.at('subDoc'), subSpec = p.at('subSpec');
		return !!(subDoc.at('live') ? subDoc.next : subSpec.next);
	}

	
	function opHasClass (d) {
		const p = d.p, m = d.mp, classes = p.at('classes');
		return classes.has(m.at(0));
	}

	
	function joinStyles (styleMap) {
		return [...styleMap.entries()].map(([name, value]) => name + ':' + value).join(';');
	}

	
	function opSetAttr (d) {
		const p = d.p, m = d.mp;
		const name = m.at(0), coat = m.at('coat');
		let value = m.at(1);
		switch (name) {
		case 'm.coat':
			applyCoat(d, value);
			break;
		case 'm.percl':
			if (coat !== false) value = computeAttr(d, value);
			setPermClass(d, value);
			setClass(d, '+');
			break;
		case 'm.slat':
			applySlat(d, value);
			break;
		case 'class':
			if (coat !== false) value = computeAttr(d, value);
			setClass(d, value);
			break;
		case 'id':
			
			if (typeof value === 'string' || typeof value === 'number') {
				if (coat !== false) value = computeAttr(d, value);
				value = String(value); 
				const attrs = p.at('attrs');
				const oldId = attrs.at('id');
				attrs.set('id', value);
				
				updateIdIndex(d, oldId, value);
			} else if (value === undefined || value === null || value === false) {
				
				const attrs = p.at('attrs');
				const oldId = attrs.at('id');
				attrs.set('id', undefined);
				
				updateIdIndex(d, oldId, undefined);
			}
			
			break;
		case 'style':
			setStyle(d, value);
			break;
		
		case 'm.ci': 
		case 'm.id': 
			break;
		default:
			{
			const attrs = p.at('attrs');
			attrs.set(name, value);
			}
			break;
		}
		return d.rr; 
	}

	
	
	
	
	
	
	function setClass (d, classStr) {
		if (typeof classStr !== 'string') return;
		const p = d.p, attrs = p.at('attrs'), classes = p.at('classes');

		
		let condClear = true; 
		if (/^\s*$/.test(classStr)) classes.clear();
		else for (const [, token, mod, cls] of classStr.matchAll(/([+]|={1,2})|([!~]?)\s*([-_a-z][-_a-z0-9]*)/gi)) {
			if (token === '=') condClear = true; 
			else if (token === '+') condClear = false; 
			else if (token === '==' || condClear) {
				condClear = false;
				classes.clear();
			}
			if (cls) {
				if (mod === '!' || (mod === '~' && classes.has(cls))) classes.delete(cls);
				else classes.add(cls);
			}
		}

		
		const permClasses = p.at('permClasses');
		for (const cls of permClasses.values()) classes.add(cls);

		
		if (classes.size) {
			attrs.set('class', [...classes.values()].join(' '));
		} else if (attrs.has('class')) {
			attrs.set('class', undefined);
		}
	}

	
	function setPermClass (d, classStr) {
		const p = d.p, attrs = p.at('attrs'), classes = new Set();
		if (typeof classStr === 'string') for (const [cls] of classStr.matchAll(/[-_a-z][-_a-z0-9]*/gi)) classes.add(cls);
		p.set('permClasses', classes);
		if (classes.size) attrs.set('m.percl', [...classes.values()].join(''));
		else attrs.set('m.percl', undefined);
	}

	
	function opSetSpec (d) {
		const p = d.p, m = d.mp, spec = m.at(0);
		reactive.batch(() => {
			
			for (const attr of spec.namedEntries()) d.rr('setAttr', attr);
			
			d.rr('setSubSpec', { spec });
		});
		return d.rr;
	}

	
	
	
	function opSetSubSpec (d) {
		const m = d.mp, p = d.p, subSpec = p.at('subSpec'), schema = p.at(SCHEMA);
		if (schema?.at(VOID)) return;
		const subList = m.at('subSpec', m), spec = m.at('spec'), subDoc = p.at('subDoc');
		reactive.batch(() => {
			subSpec.clear();
			if (spec instanceof NANOS) {
				const copy = new NANOS([...spec.values()]);
				copy.shift();
				subSpec.push(copy);
			} else subSpec.push([...subList.values()]);
			subDoc.set('live', false);
			subDoc.clear();
			if (schema?.at(AUTO_DOC) !== false) {
				
				
				const doc = p.at('doc');
				if (subSpec?.size) {
					const slotSrc = d.rr('subSlotSrc');
					const nodes = doc('from', { list: subSpec, slotSrc });
					d.rr('append', nodes);
				}
				
				subDoc.set('live', true);
			}
		});
		return d.rr;
	}

	
	
	
	
	
	function setStyle (d, styleStr) {
		if (typeof styleStr !== 'string') return;
		const p = d.p, attrs = p.get('attrs'), styles = new Map();

		
		const current = attrs.get('style', '');
		if (typeof current === 'string') {
			for (const [name, value] of splitStyles(current)) styles.set(name, value);
		}

		let condClear = true; 
		if (/^\s*$/.test(styleStr)) styles.clear();
		else for (const [name, value, token] of splitStyles(styleStr)) {
			if (token === '=') condClear = true; 
			else if (token === '+') condClear = false; 
			else if (token === '==' || condClear) {
				condClear = false;
				styles.clear();
			}
			if (name) {
				if (value) styles.set(name, value);
				else styles.delete(name);
			}
		}

		
		if (styles.size) {
			attrs.set('style', joinStyles(styles));
		} else if (attrs.has('style')) {
			attrs.set('style', undefined);
		}
	}

	
	function* splitStyles (styleStr) {
		for (const [, token, name, value] of styleStr.matchAll(/([+]|={1,2})|([-_a-z][-_a-z0-9]*)\s*:\s*((?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[^;])*?)\s*(?:;|$)/gi)) yield [name, value, token];
	}

	const emptyList = (new NANOS()).freeze();

	
	getInterface(IF_NAME).set({
		pristine: true, lock: true, abstract: true,
		
		
		handlers: {
			'@init': opInit,
			append: opAppend,
			compId: (d) => d.p.at('id'), 
			delAttr: opDelAttr,
			document: (d) => d.p.at('doc'),
			getAttr: opGetAttr,
			getAttrHTML: opGetAttrHTML,
			getDOM: opGetSubDOM, 
			getHTML: opGetHTML,
			getSpec: opGetSpec,
			getSubDoc: (d) => d.p.at('subDoc'),
			getSubDOM: opGetSubDOM,
			getSubSpec: opGetSubSpec,
			hasAttr: opHasAttr,
			hasChildren: opHasChildren,
			hasClass: opHasClass,
			setAttr: opSetAttr,
			slotSrc: (d) => d.p.at('slotSrc'), 
			
			subSlotSrc: (d) => d.rr,
			textToHTML,
			setSpec: opSetSpec,
			setSubSpec: opSetSubSpec,
			type: (d) => d.p.at('type'),
		}
	});

	fready(mid, READY_FT);
}if(!globalThis.msjsNoSelfLoad)loadMsjs();

//# sourceMappingURL=mwi-doc-node@0.5.0.esm.js.map
