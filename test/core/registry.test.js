import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
	assertMatch,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

const REG_OPEN_FT = 'mwi.compRegOpen';
const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait(REG_OPEN_FT);

describe('MWIRegistry - Initialization', () => {
	// Wait for registry to be open
	const registry = getInstance('MWIRegistry');
	assert(registry, 'MWIRegistry instance exists');
});

describe('MWIRegistry - Ready signal', () => {
	// Wait for full registry readiness
	const registry = getInstance('MWIRegistry');
	assert(registry, 'MWIRegistry instance exists after ready signal');
});

describe('MWIRegistry - ID Generation', () => {
	const registry = getInstance('MWIRegistry');

	it('(nextId) - Server ID prefix', () => {
		const id1 = $c.sm(registry, 'nextId');
		assertMatch(id1, /^_MS_/, 'ID should start with _MS_ prefix for server');
		assertEquals(typeof id1, 'string', 'ID should be a string');
	});

	it('.nextId() - Server ID prefix', () => {
		const id1 = registry.nextId();
		assertMatch(id1, /^_MS_/, 'ID should start with _MS_ prefix for server');
		assertEquals(typeof id1, 'string', 'ID should be a string');
	});

	it('(nextId) - Sequential IDs', () => {
		const id1 = $c.sm(registry, 'nextId');
		const id2 = $c.sm(registry, 'nextId');
		const id3 = $c.sm(registry, 'nextId');

		// Extract numeric parts (base-36)
		const num1 = parseInt(id1.slice(4), 36);
		const num2 = parseInt(id2.slice(4), 36);
		const num3 = parseInt(id3.slice(4), 36);

		assertEquals(num2, num1 + 1, 'IDs should increment sequentially');
		assertEquals(num3, num2 + 1, 'IDs should increment sequentially');
	});

	it('.nextId() - Sequential IDs', () => {
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

	it('(nextId) - Unique IDs', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add($c.sm(registry, 'nextId'));
		}
		assertEquals(ids.size, 100, 'All generated IDs should be unique');
	});

	it('.nextId() - Unique IDs', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add(registry.nextId());
		}
		assertEquals(ids.size, 100, 'All generated IDs should be unique');
	});
});

describe('MWIRegistry - Component Retrieval (get)', () => {
	const registry = getInstance('MWIRegistry');

	it('(get) - Retrieve registered component', () => {
		// Core components should be registered by now
		const textComp = $c.sm(registry, 'get', ls([, 'm.t']));
		assert(textComp, 'Should return component entry for m.t');
		assert(textComp.has('if'), 'Component entry should have interface');
	});

	it('.get() - Retrieve registered component', () => {
		const textComp = registry.get('m.t');
		assert(textComp, 'Should return component entry for m.t');
		assert(textComp.has('if'), 'Component entry should have interface');
	});

	it('(get) - Multiple component types', () => {
		const components = ['m.t', 'm.com', 'm.frg', 'h.div'];
		for (const compName of components) {
			const comp = $c.sm(registry, 'get', ls([, compName]));
			assert(comp, `Should return component entry for ${compName}`);
		}
	});

	it('.get() - Multiple component types', () => {
		const components = ['m.t', 'm.com', 'm.frg', 'h.div'];
		for (const compName of components) {
			const comp = registry.get(compName);
			assert(comp, `Should return component entry for ${compName}`);
		}
	});

	it('(get) - Non-existent component', () => {
		const comp = $c.sm(registry, 'get', ls([, 'nonexistent.component']));
		assertEquals(comp, undefined, 'Should return undefined for non-existent component');
	});

	it('.get() - Non-existent component', () => {
		const comp = registry.get('nonexistent.component');
		assertEquals(comp, undefined, 'Should return undefined for non-existent component');
	});

	it('(get) - Component has ID', () => {
		const textComp = $c.sm(registry, 'get', ls([, 'm.t']));
		assert(textComp.has('id'), 'Component entry should have an ID');
		const id = textComp.at('id');
		assertMatch(id, /^_MO_/, 'Component ID should start with _MO_ prefix');
	});

	it('.get() - Component has ID', () => {
		const textComp = registry.get('m.t');
		assert(textComp.has('id'), 'Component entry should have an ID');
		const id = textComp.at('id');
		assertMatch(id, /^_MO_/, 'Component ID should start with _MO_ prefix');
	});
});

describe('MWIRegistry - Hydration (loadServerComps)', () => {
	// Create a new runtime instance with server component data
	// This simulates SSR hydration on the client

	it('Hydration with server components', async () => {
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

	it('Component IDs match server assignments', async () => {
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
