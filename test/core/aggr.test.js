import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

await setupRuntime({
	modules: {
		'mwi/mwi-aggr-comp': {
			url: './src/mwi-aggr-comp.msjs',
			featpro: 'mwi.comp.MWIAggr',
		},
	},
});

const { fwait, getInstance } = globalThis.$c;
const { ls } = globalThis;

await fwait('MWIDocument', 'mwi.comp.MWIAggr');

Deno.test('MWIDocument - getAggr', async (t) => {
	await t.step('(getAggr) - Returns a Map', () => {
		const doc = getInstance('MWIDocument');
		const aggr = $c.sm(doc, 'getAggr');
		assert(aggr instanceof Map, 'Should return a Map');
	});

	await t.step('.getAggr() - Returns a Map via JS', () => {
		const doc = getInstance('MWIDocument');
		const aggr = doc.getAggr();
		assert(aggr instanceof Map, 'Should return a Map via JS');
	});

	await t.step('(getAggr) - Returns same Map on repeated calls', () => {
		const doc = getInstance('MWIDocument');
		const aggr1 = $c.sm(doc, 'getAggr');
		const aggr2 = $c.sm(doc, 'getAggr');
		assertStrictEquals(aggr1, aggr2, 'Should return same Map instance');
	});

	await t.step('.getAggr() - Returns same Map on repeated calls via JS', () => {
		const doc = getInstance('MWIDocument');
		const aggr1 = doc.getAggr();
		const aggr2 = doc.getAggr();
		assertStrictEquals(aggr1, aggr2, 'Should return same Map instance via JS');
	});

	await t.step('(getAggr clear=@t) - Clears aggregated data', () => {
		const doc = getInstance('MWIDocument');
		// Populate the aggr map with something
		const aggrBefore = $c.sm(doc, 'getAggr');
		aggrBefore.set('m.aggr:test', new Map());

		// Now clear
		const aggrAfter = $c.sm(doc, 'getAggr', ls(['clear', true]));
		assertEquals(aggrAfter.size, 0, 'Should be empty after clear');
	});

	await t.step('.getAggr({ clear: true }) - Clears aggregated data via JS', () => {
		const doc = getInstance('MWIDocument');
		// Populate the aggr map
		const aggrBefore = doc.getAggr();
		aggrBefore.set('m.aggr:test', new Map());

		// Now clear
		const aggrAfter = doc.getAggr({ clear: true });
		assertEquals(aggrAfter.size, 0, 'Should be empty after clear via JS');
	});

	await t.step('(getAggr clear=@t) - Resets buffer id counter', () => {
		const doc = getInstance('MWIDocument');
		// Allocate a buffer id
		const id1 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:counter-test']));
		assertEquals(typeof id1, 'number', 'Should return a number');

		// Clear
		$c.sm(doc, 'getAggr', ls(['clear', true]));

		// After clear, the same name should get id 0 again
		const id2 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:counter-test']));
		assertEquals(id2, 0, 'Should restart from 0 after clear');
	});

	await t.step('.getAggr({ clear: true }) - Resets buffer id counter via JS', () => {
		const doc = getInstance('MWIDocument');
		// Allocate a buffer id
		const id1 = doc.mapAggrBuffer('m.aggr:counter-test-js');
		assertEquals(typeof id1, 'number', 'Should return a number via JS');

		// Clear
		doc.getAggr({ clear: true });

		// After clear, the same name should get id 0 again
		const id2 = doc.mapAggrBuffer('m.aggr:counter-test-js');
		assertEquals(id2, 0, 'Should restart from 0 after clear via JS');
	});
});

Deno.test('MWIDocument - mapAggrBuffer', async (t) => {
	await t.step('(mapAggrBuffer) - Assigns sequential IDs to buffer names', () => {
		const doc = getInstance('MWIDocument');

		const id0 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:first']));
		const id1 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:second']));
		const id2 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:third']));

		assertEquals(id0, 0, 'First buffer should get id 0');
		assertEquals(id1, 1, 'Second buffer should get id 1');
		assertEquals(id2, 2, 'Third buffer should get id 2');
	});

	await t.step('.mapAggrBuffer() - Assigns sequential IDs via JS', () => {
		const doc = getInstance('MWIDocument');

		const id0 = doc.mapAggrBuffer('m.aggr:first');
		const id1 = doc.mapAggrBuffer('m.aggr:second');

		assertEquals(id0, 0, 'First buffer should get id 0 via JS');
		assertEquals(id1, 1, 'Second buffer should get id 1 via JS');
	});

	await t.step('(mapAggrBuffer) - Returns same ID for same name', () => {
		const doc = getInstance('MWIDocument');

		const id1 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:stable']));
		const id2 = $c.sm(doc, 'mapAggrBuffer', ls([, 'm.aggr:stable']));

		assertEquals(id1, id2, 'Same name should return same ID');
	});

	await t.step('.mapAggrBuffer() - Returns same ID for same name via JS', () => {
		const doc = getInstance('MWIDocument');

		const id1 = doc.mapAggrBuffer('m.aggr:stable');
		const id2 = doc.mapAggrBuffer('m.aggr:stable');

		assertEquals(id1, id2, 'Same name should return same ID via JS');
	});

	await t.step('(mapAggrBuffer) - Reverse lookup: ID to name', () => {
		const doc = getInstance('MWIDocument');

		const name = 'm.aggr:reverse-test';
		const id = $c.sm(doc, 'mapAggrBuffer', ls([, name]));
		const lookedUp = $c.sm(doc, 'mapAggrBuffer', ls([, id]));

		assertEquals(lookedUp, name, 'Should return name for given ID');
	});

	await t.step('.mapAggrBuffer() - Reverse lookup: ID to name via JS', () => {
		const doc = getInstance('MWIDocument');

		const name = 'm.aggr:reverse-test';
		const id = doc.mapAggrBuffer(name);
		const lookedUp = doc.mapAggrBuffer(id);

		assertEquals(lookedUp, name, 'Should return name for given ID via JS');
	});

	await t.step('(mapAggrBuffer) - Unknown ID returns undefined', () => {
		const doc = getInstance('MWIDocument');

		const result = $c.sm(doc, 'mapAggrBuffer', ls([, 999]));
		assertEquals(result, undefined, 'Unknown ID should return undefined');
	});

	await t.step('.mapAggrBuffer() - Unknown ID returns undefined via JS', () => {
		const doc = getInstance('MWIDocument');

		const result = doc.mapAggrBuffer(999);
		assertEquals(result, undefined, 'Unknown ID should return undefined via JS');
	});
});
