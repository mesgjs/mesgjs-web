
	import * as escape from 'escape-js/src/escape.esm.js';
export async function loadMsjs(mid){const{d,ls,m,na}=$modScope(),{mp,sm}=d;await null;

	if (!mid) throw new Error('MWIRegistry requires Mesgjs module management to be active');

	const IF_NAME = 'MWIVendor';
	const READY_FT = IF_NAME;

	const { fready, fwait, getInstance, getInterface, getModMeta, setRO, modHasCap } = globalThis.$c;

	function opInit (d) {
		setRO(d.rr, {
			get jsv () { return d. rr; },
			valueOf () { return d. rr; },
			escape,
		});
		fready(mid, READY_FT);
	}

	// With dependencies loaded, configure *my* module interface, and instantiate singleton instance
	getInterface(IF_NAME).set({
		pristine: true, // Anti-tamper: no configuration before
		lock: true,		// ... or after
		singleton: true,
		// abstract, chains, final, once, private, etc.
		handlers: {
			'@init': opInit,
			'@jsv': (d) => d.rr,
		}
	}).instance();
}if(!globalThis.msjsNoSelfLoad)loadMsjs();

//# sourceMappingURL=mwi-vendor.esm.js.map
