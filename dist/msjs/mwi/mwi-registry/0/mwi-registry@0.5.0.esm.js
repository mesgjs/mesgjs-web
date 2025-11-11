export async function loadMsjs(mid){const{d,ls,m,na}=$modScope(),{mp,sm}=d;0&&await 0;

	if (!mid) throw new Error('MWIRegistry requires Mesgjs module management to be active');

	const IF_NAME = 'MWIRegistry';
	const COMP_PRE = 'mwi.comp.';
	const REG_OPEN_FT = 'mwi.compRegOpen';
	const REG_READY_FT = 'mwi.compRegReady';

	const INTERFACE = 'if';
	const TEMPLATE = 'tpl';
	const FEATURE = 'ftr';

	const SERVER_ID_PRE = '_MS_';
	const CLIENT_ID_PRE = '_ML_';
	const COMP_ID_PRE = '_MO_';

	const { fready, fwait, getInstance, getInterface, getModMeta, setRO, modHasCap } = globalThis.$c;

	function opInit (d) {
		const g = globalThis, p = d.p;
		p.push({
			isBrowser: typeof g.document === 'object' && typeof g.window === 'object',
			components: new NANOS(),
			compId: 0, 
			instId: 0, 
			isReady: false,
		});
		if (g.mwiServer) {
			loadServerComps(d, g.mwiServer.at('components'));
		}

		
		Object.setPrototypeOf(d.rr, Object.setPrototypeOf({
			get (name) { return this('get', [ name ]); },
			 getWait (name) { return this('getWait', [ name ]); },
			get jsv () { return this; },
			nextId () { return this('nextId'); },
			register (name, entry) { return this('register', new NANOS([ name, entry ])); },
			valueOf () { return this; },
		}, Function.prototype));

		
		
		fready(mid, REG_OPEN_FT);
		
		const modMeta = getModMeta(), allFt = modMeta.at('allFeatures'), testMode = modMeta.at('testMode');
		const preloadFt = (testMode ?
		  () => {
			
			return [...allFt.values()].filter((k) => k.startsWith(COMP_PRE));
		  } :
		  () => {
			
			const preload = [...allFt.namedEntries()].filter(([k, v]) => k.startsWith(COMP_PRE) && v.has('preload'));
			return preload.map(([k]) => k);
		  })();
		fwait(preloadFt).then(() => {
			
			p.set('isReady', true);
			fready(mid, REG_READY_FT);
		});
	}

	
	function opGet (d) {
		const name = d.mp.at(0), p = d.p;
		const comp = p.at(['components', name]);
		return comp;
	}

	
	async function opGetWait (d) {
		const name = d.mp.at(0), p = d.p;
		if (!p.at('isReady')) await fwait(REG_READY_FT);
		const comp = p.at(['components', name]);
		if (comp && !comp.has(INTERFACE) && !comp.has(TEMPLATE)) {
			
			const feature = comp.at(FEATURE);
			if (feature) await fwait(feature);
		}
		return comp;
	}

	
	function opNextId (d) {
		const p = d.p;
		const isBrowser = p.at('isBrowser'), instId = p.at('instId');
		p.set('instId', instId + 1);
		return ((isBrowser ? CLIENT_ID_PRE : SERVER_ID_PRE) + instId.toString(36));
	}

	
	function loadServerComps(d, comps) {
		if (!comps) return;
		const p = d.p, c = p.at('components');
		let maxId = -1;
		for (const [idNum, name] of comps.entries()) {
			const id = COMP_ID_PRE + idNum.toString(36);
			c.set(name, new NANOS({ id }));
			maxId = idNum;
		}
		p.set('compId', maxId + 1);
	}

	
	
	function opRegister (d) {
		const mp = d.mp, name = mp.at(0), p = d.p;
		const comps = p.at('components');
		let entry = comps.at(name);
		if (p.at('ready') && !entry) {
			const meta = getModMeta();
			if (!meta?.at('testMode') || !entry.at('allowLate')) throw new Error(`${IF_NAME}: Late "${name}" component registration prohibited`);
		}
		if (!entry) {
			const idNum = p.at('compId'), id = COMP_ID_PRE + idNum.toString(36);
			entry = new NANOS({ id });
			p.set('compId', idNum + 1);
			comps.set(name, entry);
		}
		entry.fromEntries(mp.at(1)?.namedEntries() || []);

		
		const tpl = entry.at('tpl');
		if (typeof tpl === 'string') entry.set('tpl', NANOS.parseSLID(tpl));

		return d.rr; 
	}

	
	getInterface(IF_NAME).set({
		pristine: true, 
		lock: true,		
		singleton: true,
		final: true,
		
		handlers: {
			'@init': opInit,
			'@jsv': (d) => d.rr,
			dump: (d) => console.log(d.p.toSLID({ compact: true })),
			
			get: opGet,
			getWait: opGetWait,
			nextId: opNextId,
			register: opRegister,
		}
	}).instance();
}if(!globalThis.msjsNoSelfLoad)loadMsjs();

//# sourceMappingURL=mwi-registry@0.5.0.esm.js.map
