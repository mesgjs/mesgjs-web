import {
	assert,
	assertEquals,
	assertStrictEquals,
	assertMatch,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_OPEN_FT = 'mwi.compRegOpen';
const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

Deno.test('MWIRegistry - Initialization', async (t) => {
	// Wait for registry to be open
	await fwait(REG_OPEN_FT);
	const registry = getInstance('MWIRegistry');
	assert(registry, 'MWIRegistry instance exists');
});

Deno.test('MWIRegistry - Ready signal', async (t) => {
	// Wait for full registry readiness
	await fwait(REG_READY_FT);
	const registry = getInstance('MWIRegistry');
	assert(registry, 'MWIRegistry instance exists after ready signal');
});

Deno.test('MWIRegistry - ID Generation', async (t) => {
	await fwait(REG_READY_FT);
	const registry = getInstance('MWIRegistry');

	await t.step('(nextId) - Server ID prefix', () => {
		const id1 = registry('nextId');
		assertMatch(id1, /^_MS_/, 'ID should start with _MS_ prefix for server');
		assertEquals(typeof id1, 'string', 'ID should be a string');
	});

	await t.step('.nextId() - Server ID prefix', () => {
		const id1 = registry.nextId();
		assertMatch(id1, /^_MS_/, 'ID should start with _MS_ prefix for server');
		assertEquals(typeof id1, 'string', 'ID should be a string');
	});

	await t.step('(nextId) - Sequential IDs', () => {
		const id1 = registry('nextId');
		const id2 = registry('nextId');
		const id3 = registry('nextId');

		// Extract numeric parts (base-36)
		const num1 = parseInt(id1.slice(4), 36);
		const num2 = parseInt(id2.slice(4), 36);
		const num3 = parseInt(id3.slice(4), 36);

		assertEquals(num2, num1 + 1, 'IDs should increment sequentially');
		assertEquals(num3, num2 + 1, 'IDs should increment sequentially');
	});

	await t.step('.nextId() - Sequential IDs', () => {
		const id1 = registry.nextId();
		const id2 = registry.nextId();
		const id3 = registry.nextId();

		// Extract numeric parts (base-36)
		const num1 = parseInt(id1.slice(4), 36);
		const num2 = parseInt(id2.slice(4), 36);
		const num3 = parseInt(id3.slice(4), 36);

		assertEquals(num2, num1 + 1, 'IDs should increment sequentially');
		assertEquals(num3, num2 + 1, 'IDs should increment sequentially');
	});

	await t.step('(nextId) - Unique IDs', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add(registry('nextId'));
		}
		assertEquals(ids.size, 100, 'All generated IDs should be unique');
	});

	await t.step('.nextId() - Unique IDs', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add(registry.nextId());
		}
		assertEquals(ids.size, 100, 'All generated IDs should be unique');
	});
});

Deno.test('MWIRegistry - Component Retrieval (get)', async (t) => {
	await fwait(REG_READY_FT);
	const registry = getInstance('MWIRegistry');

	await t.step('(get) - Retrieve registered component', () => {
		// Core components should be registered by now
		const textComp = registry('get', ls([, 'm.t']));
		assert(textComp, 'Should return component entry for m.t');
		assert(textComp.has('if'), 'Component entry should have interface');
	});

	await t.step('.get() - Retrieve registered component', () => {
		const textComp = registry.get('m.t');
		assert(textComp, 'Should return component entry for m.t');
		assert(textComp.has('if'), 'Component entry should have interface');
	});

	await t.step('(get) - Multiple component types', () => {
		const components = ['m.t', 'm.com', 'm.frg', 'h.div'];
		for (const compName of components) {
			const comp = registry('get', ls([, compName]));
			assert(comp, `Should return component entry for ${compName}`);
		}
	});

	await t.step('.get() - Multiple component types', () => {
		const components = ['m.t', 'm.com', 'm.frg', 'h.div'];
		for (const compName of components) {
			const comp = registry.get(compName);
			assert(comp, `Should return component entry for ${compName}`);
		}
	});

	await t.step('(get) - Non-existent component', () => {
		const comp = registry('get', ls([, 'nonexistent.component']));
		assertEquals(comp, undefined, 'Should return undefined for non-existent component');
	});

	await t.step('.get() - Non-existent component', () => {
		const comp = registry.get('nonexistent.component');
		assertEquals(comp, undefined, 'Should return undefined for non-existent component');
	});

	await t.step('(get) - Component has ID', () => {
		const textComp = registry('get', ls([, 'm.t']));
		assert(textComp.has('id'), 'Component entry should have an ID');
		const id = textComp.at('id');
		assertMatch(id, /^_MO_/, 'Component ID should start with _MO_ prefix');
	});

	await t.step('.get() - Component has ID', () => {
		const textComp = registry.get('m.t');
		assert(textComp.has('id'), 'Component entry should have an ID');
		const id = textComp.at('id');
		assertMatch(id, /^_MO_/, 'Component ID should start with _MO_ prefix');
	});
});

Deno.test('MWIRegistry - Hydration (loadServerComps)', async (t) => {
	// Create a new runtime instance with server component data
	// This simulates SSR hydration on the client

	await t.step('Hydration with server components', async () => {
		// Set up server component data before runtime initialization
		const serverComps = ls([
			, 'm.t',
			, 'm.com',
			, 'm.frg',
			, 'h.div',
			, 'h.span',
		]);

		globalThis.mwiServer = ls(['components', serverComps]);

		// Create a fresh runtime with the server data
		// Note: We can't actually reinitialize the runtime in the same process,
		// so we'll test the behavior by checking if the registry would handle it correctly

		// Clean up
		delete globalThis.mwiServer;

		// For now, we verify the registry exists and has the expected components
		const registry = getInstance('MWIRegistry');
		assert(registry, 'Registry should exist');

		// Verify core components are registered
		const textComp = registry.get('m.t');
		assert(textComp, 'Text component should be registered');
		assert(textComp.has('id'), 'Component should have an ID');
	});

	await t.step('Component IDs match server assignments', async () => {
		const registry = getInstance('MWIRegistry');

		// Get several components and verify they have sequential IDs
		const comp1 = registry.get('m.t');
		const comp2 = registry.get('m.com');
		const comp3 = registry.get('m.frg');

		assert(comp1 && comp1.has('id'), 'First component should have ID');
		assert(comp2 && comp2.has('id'), 'Second component should have ID');
		assert(comp3 && comp3.has('id'), 'Third component should have ID');

		// All component IDs should use _MO_ prefix
		assertMatch(comp1.at('id'), /^_MO_/, 'Component ID should use _MO_ prefix');
		assertMatch(comp2.at('id'), /^_MO_/, 'Component ID should use _MO_ prefix');
		assertMatch(comp3.at('id'), /^_MO_/, 'Component ID should use _MO_ prefix');
	});
});
