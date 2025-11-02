import {
	assert,
	assertEquals,
	assertStrictEquals,
	assertMatch,
	assertRejects,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

await setupRuntime({
	features: [ 'test.deferred.component', 'test.deferred2.component'],
});

const { fwait, getInstance } = globalThis.$c;
const { ls, ps } = globalThis;

Deno.test('MWIDocument - Basic Interface', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');

	await t.step('.jsv - Returns document instance', () => {
		const jsv = doc.jsv;
		assertStrictEquals(jsv, doc, 'jsv should return the document itself');
	});

	await t.step('.valueOf() - Returns document instance', () => {
		const val = doc.valueOf();
		assertStrictEquals(val, doc, 'valueOf should return the document itself');
	});

	await t.step('(registry) - Get component registry', () => {
		const registry = doc('registry');
		assert(registry, 'Should return registry instance');
		assertEquals(typeof registry, 'function', 'Registry should be a function (Mesgjs object)');
	});

	await t.step('.registry() - Get component registry', () => {
		const registry = doc.registry();
		assert(registry, 'Should return registry instance');
		assertEquals(typeof registry, 'function', 'Registry should be a function (Mesgjs object)');
	});

	await t.step('(registry) - Same instance across calls', () => {
		const reg1 = doc('registry');
		const reg2 = doc('registry');
		assertStrictEquals(reg1, reg2, 'Should return same registry instance');
	});

	await t.step('.registry() - Same instance across calls', () => {
		const reg1 = doc.registry();
		const reg2 = doc.registry();
		assertStrictEquals(reg1, reg2, 'Should return same registry instance');
	});

	await t.step('(root) - Get document root', () => {
		const root = doc('root');
		assert(root, 'Should return root node');
		assertEquals(typeof root, 'function', 'Root should be a function (Mesgjs object)');
	});

	await t.step('.root - Get document root', () => {
		const root = doc.root;
		assert(root, 'Should return root node');
		assertEquals(typeof root, 'function', 'Root should be a function (Mesgjs object)');
	});

	await t.step('(root) - Root is m.frg fragment', () => {
		const root = doc('root');
		const type = root('type');
		assertEquals(type, 'm.frg', 'Root should be an m.frg fragment');
	});

	await t.step('.root - Root is m.frg fragment', () => {
		const root = doc.root;
		const type = root.type;
		assertEquals(type, 'm.frg', 'Root should be an m.frg fragment');
	});

	await t.step('(root) - Same instance across calls', () => {
		const root1 = doc('root');
		const root2 = doc('root');
		assertStrictEquals(root1, root2, 'Should return same root instance');
	});

	await t.step('.root - Same instance across calls', () => {
		const root1 = doc.root;
		const root2 = doc.root;
		assertStrictEquals(root1, root2, 'Should return same root instance');
	});

	await t.step('(root) - Root references document', () => {
		const root = doc('root');
		const rootDoc = root('document');
		assertStrictEquals(rootDoc, doc, 'Root should reference its document');
	});

	await t.step('.root - Root references document', () => {
		const root = doc.root;
		const rootDoc = root.document;
		assertStrictEquals(rootDoc, doc, 'Root should reference its document');
	});

	await t.step('(nextId) - Get next component ID', () => {
		const id1 = doc('nextId');
		assertEquals(typeof id1, 'string', 'ID should be a string');
		assertMatch(id1, /^_MS_/, 'ID should have server prefix');
	});

	await t.step('(nextId) - Sequential IDs', () => {
		const id1 = doc('nextId');
		const id2 = doc('nextId');
		const num1 = parseInt(id1.slice(4), 36);
		const num2 = parseInt(id2.slice(4), 36);
		assertEquals(num2, num1 + 1, 'IDs should increment');
	});

	await t.step('.compIdStr() - Convert numeric ID to string', () => {
		const str0 = doc.compIdStr(0);
		const str1 = doc.compIdStr(1);
		const str10 = doc.compIdStr(10);
		const str100 = doc.compIdStr(100);
		
		assertEquals(str0, '_MC_0', 'ID 0 should convert correctly');
		assertEquals(str1, '_MC_1', 'ID 1 should convert correctly');
		assertEquals(str10, '_MC_a', 'ID 10 should convert to base-36');
		assertEquals(str100, '_MC_2s', 'ID 100 should convert to base-36');
	});

	await t.step('.compIdStr() - Consistency', () => {
		const id = 42;
		const str1 = doc.compIdStr(id);
		const str2 = doc.compIdStr(id);
		assertEquals(str1, str2, 'Same input should produce same output');
	});

	await t.step('.compIdStr() - Uniqueness', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add(doc.compIdStr(i));
		}
		assertEquals(ids.size, 100, 'Different inputs should produce different outputs');
	});
});

Deno.test('MWIDocument - Node Creation (Synchronous)', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');

	await t.step('(createNode) - Create text node', () => {
		const node = doc('createNode', ls([, 'm.t']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.t', 'Should be text node');
	});

	await t.step('.createNode() - Create text node', () => {
		const node = doc.createNode('m.t');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
	});

	await t.step('(createNode) - Create fragment', () => {
		const node = doc('createNode', ls([, 'm.frg']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.frg', 'Should be fragment');
	});

	await t.step('.createNode() - Create fragment', () => {
		const node = doc.createNode('m.frg');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.frg', 'Should be fragment');
	});

	await t.step('(createNode) - Create comment', () => {
		const node = doc('createNode', ls([, 'm.com']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.com', 'Should be comment');
	});

	await t.step('.createNode() - Create comment', () => {
		const node = doc.createNode('m.com');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.com', 'Should be comment');
	});

	await t.step('(createNode) - Create HTML element', () => {
		const node = doc('createNode', ls([, 'h.div']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'h.div', 'Should be div element');
	});

	await t.step('.createNode() - Create HTML element', () => {
		const node = doc.createNode('h.div');
		assert(node, 'Should create node');
		assertEquals(node.type, 'h.div', 'Should be div element');
	});

	await t.step('(createNode) - Nodes reference document', () => {
		const node = doc('createNode', ls([, 'm.t']));
		const nodeDoc = node('document');
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	await t.step('.createNode() - Nodes reference document', () => {
		const node = doc.createNode('m.t');
		const nodeDoc = node.document;
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	await t.step('(createNode) - Distinct instances', () => {
		const node1 = doc('createNode', ls([, 'm.t']));
		const node2 = doc('createNode', ls([, 'm.t']));
		assert(node1 !== node2, 'Should create distinct instances');
	});

	await t.step('.createNode() - Distinct instances', () => {
		const node1 = doc.createNode('m.t');
		const node2 = doc.createNode('m.t');
		assert(node1 !== node2, 'Should create distinct instances');
	});

	await t.step('(createNode) - Invalid type throws', () => {
		try {
			doc('createNode', ls([, 'invalid.type']));
			assert(false, 'Should have thrown');
		} catch (e) {
			assert(e instanceof TypeError, 'Should throw TypeError');
			assert(e.message.includes('invalid.type'), 'Error should mention the type');
		}
	});

	await t.step('.createNode() - Invalid type throws', () => {
		try {
			doc.createNode('invalid.type');
			assert(false, 'Should have thrown');
		} catch (e) {
			assert(e instanceof TypeError, 'Should throw TypeError');
			assert(e.message.includes('invalid.type'), 'Error should mention the type');
		}
	});
});

Deno.test('MWIDocument - Node Creation (Asynchronous)', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');

	await t.step('(createNodeWait) - Create text node', async () => {
		const node = await doc('createNodeWait', ls([, 'm.t']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.t', 'Should be text node');
	});

	await t.step('.createNodeWait() - Create text node', async () => {
		const node = await doc.createNodeWait('m.t');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
	});

	await t.step('(createNodeWait) - Create fragment', async () => {
		const node = await doc('createNodeWait', ls([, 'm.frg']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.frg', 'Should be fragment');
	});

	await t.step('.createNodeWait() - Create fragment', async () => {
		const node = await doc.createNodeWait('m.frg');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.frg', 'Should be fragment');
	});

	await t.step('(createNodeWait) - Create comment', async () => {
		const node = await doc('createNodeWait', ls([, 'm.com']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.com', 'Should be comment');
	});

	await t.step('.createNodeWait() - Create comment', async () => {
		const node = await doc.createNodeWait('m.com');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.com', 'Should be comment');
	});

	await t.step('(createNodeWait) - Create HTML element', async () => {
		const node = await doc('createNodeWait', ls([, 'h.div']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'h.div', 'Should be div element');
	});

	await t.step('.createNodeWait() - Create HTML element', async () => {
		const node = await doc.createNodeWait('h.div');
		assert(node, 'Should create node');
		assertEquals(node.type, 'h.div', 'Should be div element');
	});

	await t.step('(createNodeWait) - Nodes reference document', async () => {
		const node = await doc('createNodeWait', ls([, 'm.t']));
		const nodeDoc = node('document');
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	await t.step('.createNodeWait() - Nodes reference document', async () => {
		const node = await doc.createNodeWait('m.t');
		const nodeDoc = node.document;
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	await t.step('(createNodeWait) - Distinct instances', async () => {
		const node1 = await doc('createNodeWait', ls([, 'm.t']));
		const node2 = await doc('createNodeWait', ls([, 'm.t']));
		assert(node1 !== node2, 'Should create distinct instances');
	});

	await t.step('.createNodeWait() - Distinct instances', async () => {
		const node1 = await doc.createNodeWait('m.t');
		const node2 = await doc.createNodeWait('m.t');
		assert(node1 !== node2, 'Should create distinct instances');
	});

	await t.step('(createNodeWait) - Invalid type throws', async () => {
		await assertRejects(
			async () => await doc('createNodeWait', ls([, 'invalid.type'])),
			TypeError,
			'invalid.type'
		);
	});

	await t.step('.createNodeWait() - Invalid type throws', async () => {
		await assertRejects(
			async () => await doc.createNodeWait('invalid.type'),
			TypeError,
			'invalid.type'
		);
	});
});

Deno.test('MWIDocument - Node Creation with Slot Source', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');

	await t.step('(createNodeWait) - With slot source', async () => {
		const source = await doc('createNodeWait', ls([, 'm.frg']));
		source('setAttr', ls(['title', 'Source Title']));
		
		const node = await doc('createNodeWait', ls([, 'h.div', 'slotSrc', source]));
		const slotSrc = node('slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});

	await t.step('.createNodeWait() - With slot source', async () => {
		const source = await doc.createNodeWait('m.frg');
		source.setAttr('title', 'Source Title');
		
		const node = await doc.createNodeWait('h.div', { slotSrc: source });
		const slotSrc = node('slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});

	await t.step('(createNode) - With slot source', () => {
		const source = doc('createNode', ls([, 'm.frg']));
		source('setAttr', ls(['title', 'Source Title']));
		
		const node = doc('createNode', ls([, 'h.div', 'slotSrc', source]));
		const slotSrc = node('slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});

	await t.step('.createNode() - With slot source', () => {
		const source = doc.createNode('m.frg');
		source.setAttr('title', 'Source Title');
		
		const node = doc.createNode('h.div', { slotSrc: source });
		const slotSrc = node('slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});
});

Deno.test('MWIDocument - Content Creation from Specs', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');

	await t.step('(from) - Text string creates m.t node', () => {
		const node = doc('from', ls(['item', 'Hello']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.t', 'Should be text node');
		assertEquals(node('getAttr', ls([, 't'])), 'Hello', 'Should have text content');
	});

	await t.step('(from) - NANOS spec creates configured node', () => {
		const spec = ps('[(m.t t=Hello)]');
		const node = doc('from', ls(['item', spec]));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.t', 'Should be text node');
		assertEquals(node('getAttr', ls([, 't'])), 'Hello', 'Should have text attribute');
	});

	await t.step('(from) - SLID string creates nodes', () => {
		const nodes = doc('from', ls(['list', '[([m.t t=A] [m.t t=B])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0]('type'), 'm.t', 'First should be text node');
		assertEquals(nodes[1]('type'), 'm.t', 'Second should be text node');
		assertEquals(nodes[0]('getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals(nodes[1]('getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	await t.step('(from) - NANOS list creates nodes', () => {
		const list = ls([, ls([, 'm.t', 't', 'A']), , ls([, 'm.t', 't', 'B'])]);
		const nodes = doc('from', ls(['list', list]));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0]('getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals(nodes[1]('getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	await t.step('(from) - Mixed content', () => {
		const nodes = doc('from', ls(['list', '[(text [h.div div-text])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0]('type'), 'm.t', 'First should be text node');
		assertEquals(nodes[1]('type'), 'h.div', 'Second should be div');
	});

	await t.step('(from) - With slot source', () => {
		const source = doc('createNode', ls([, 'm.frg']));
		const nodes = doc('from', ls(['list', '[([h.div])]', 'slotSrc', source]));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 1, 'Should create one node');
		const slotSrc = nodes[0]('slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source');
	});

	await t.step('(from) - Neither item nor list throws', () => {
		try {
			doc('from', ls([]));
			assert(false, 'Should have thrown');
		} catch (e) {
			assert(e instanceof TypeError, 'Should throw TypeError');
			assert(e.message.includes('without "item" or "list"'), 'Error should mention missing parameters');
		}
	});
});

Deno.test('MWIDocument - Content Creation from Specs (Async)', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');

	await t.step('(fromWait) - Text string creates m.t node', async () => {
		const node = await doc('fromWait', ls(['item', 'Hello']));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.t', 'Should be text node');
		assertEquals(node('getAttr', ls([, 't'])), 'Hello', 'Should have text content');
	});

	await t.step('.fromWait() - Text string creates m.t node', async () => {
		const node = await doc.fromWait({ item: 'Hello' });
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
		assertEquals(node.getAttr('t'), 'Hello', 'Should have text content');
	});

	await t.step('(fromWait) - NANOS spec creates configured node', async () => {
		const spec = ps('[(m.t t=Hello)]');
		const node = await doc('fromWait', ls(['item', spec]));
		assert(node, 'Should create node');
		assertEquals(node('type'), 'm.t', 'Should be text node');
		assertEquals(node('getAttr', ls([, 't'])), 'Hello', 'Should have text attribute');
	});

	await t.step('.fromWait() - NANOS spec creates configured node', async () => {
		const spec = ps('[(m.t t=Hello)]');
		const node = await doc.fromWait({ item: spec });
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
		assertEquals(node.getAttr('t'), 'Hello', 'Should have text attribute');
	});

	await t.step('(fromWait) - SLID string creates nodes', async () => {
		const nodes = await doc('fromWait', ls(['list', '[([m.t t=A] [m.t t=B])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0]('type'), 'm.t', 'First should be text node');
		assertEquals(nodes[1]('type'), 'm.t', 'Second should be text node');
		assertEquals(nodes[0]('getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals(nodes[1]('getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	await t.step('.fromWait() - SLID string creates nodes', async () => {
		const nodes = await doc.fromWait({ list: '[([m.t t=A] [m.t t=B])]' });
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0].getAttr('t'), 'A', 'First should have text A');
		assertEquals(nodes[1].getAttr('t'), 'B', 'Second should have text B');
	});

	await t.step('(fromWait) - NANOS list creates nodes', async () => {
		const list = ls([, ls([, 'm.t', 't', 'A']), , ls([, 'm.t', 't', 'B'])]);
		const nodes = await doc('fromWait', ls(['list', list]));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0]('getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals(nodes[1]('getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	await t.step('.fromWait() - NANOS list creates nodes', async () => {
		const list = ls([, ls([, 'm.t', 't', 'A']), , ls([, 'm.t', 't', 'B'])]);
		const nodes = await doc.fromWait({ list });
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0].getAttr('t'), 'A', 'First should have text A');
		assertEquals(nodes[1].getAttr('t'), 'B', 'Second should have text B');
	});
});

Deno.test('MWIDocument - Document Root Operations', async (t) => {
	await fwait('MWIDocument');

	await t.step('(append) - Append text string', () => {
		const doc = getInstance('MWIDocument');
		const result = doc('append', ls(['item', 'Hello']));
		assertStrictEquals(result, doc, 'Should return document for chaining');
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	await t.step('(append) - Append single node', () => {
		const doc = getInstance('MWIDocument');
		const node = doc('createNode', ls([, 'm.t']));
		node('setAttr', ls(['t', 'Test']));
		
		const result = doc('append', ls([, node]));
		assertStrictEquals(result, doc, 'Should return document for chaining');
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	await t.step('(append) - Append multiple nodes', () => {
		const doc = getInstance('MWIDocument');
		const node1 = doc('createNode', ls([, 'm.t']));
		const node2 = doc('createNode', ls([, 'm.t']));
		
		const result = doc('append', ls([, node1, , node2]));
		assertStrictEquals(result, doc, 'Should return document for chaining');
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});

	await t.step('(append) - Append SLID spec', () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.t t=A] [m.t t=B])]']));
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});

	await t.step('(append) - Root sub-spec reflects content', () => {
		const doc = getInstance('MWIDocument');
		doc('append', ls(['list', '[([m.t t=First] [m.t t=Second])]']));
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 2, 'Should have two children');
		
		const first = subSpec.at(0);
		const second = subSpec.at(1);
		assertEquals(first.at('t'), 'First', 'First child should have correct text');
		assertEquals(second.at('t'), 'Second', 'Second child should have correct text');
	});

	await t.step('(appendWait) - Append text string', async () => {
		const doc = getInstance('MWIDocument');
		const result = await doc('appendWait', ls(['item', 'Hello']));
		assertStrictEquals(result, doc, 'Should return document for chaining');
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	await t.step('.appendWait() - Append text string', async () => {
		const doc = getInstance('MWIDocument');
		const result = await doc.appendWait({ item: 'Hello' });
		assertStrictEquals(result, doc, 'Should return document for chaining');
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	await t.step('(appendWait) - Append SLID spec', async () => {
		const doc = getInstance('MWIDocument');
		await doc('appendWait', ls(['list', '[([m.t t=A] [m.t t=B])]']));
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});

	await t.step('.appendWait() - Append SLID spec', async () => {
		const doc = getInstance('MWIDocument');
		await doc.appendWait({ list: '[([m.t t=A] [m.t t=B])]' });
		
		const root = doc('root');
		const subSpec = root('getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});
});

Deno.test('MWIDocument - Deferred Component Creation', async (t) => {
	await fwait('MWIDocument');
	const doc = getInstance('MWIDocument');
	const registry = doc.registry();
	const { fready } = globalThis.$c;

	// Register a test component with only a feature promise (no interface/template)
	// This simulates a component that hasn't been loaded yet
	await t.step('Setup: Register deferred test component', () => {
		const deferredEntry = ls([
			'allowLate', true,
			'ftr', 'test.deferred.component'
		]);
		registry.register('test.deferred', deferredEntry);
	});

	await t.step('(createNode) - Creates m.defer for unloaded component', () => {
		const node = doc('createNode', ls([, 'test.deferred']));
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWICoreDefer', 'Should be MWICoreDefer interface');
	});

	await t.step('.createNode() - Creates m.defer for unloaded component', () => {
		const node = doc.createNode('test.deferred');
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWICoreDefer', 'Should be MWICoreDefer interface');
	});

	await t.step('(createNodeWait) - Waits and creates actual component after load', async () => {
		// Start the async creation (it will wait for the feature)
		const nodePromise = doc('createNodeWait', ls([, 'test.deferred']));
		
		// Simulate loading the component by adding interface and signaling ready
		registry.register('test.deferred', ls(['if', 'MWIDocFrag']));
		fready(null, 'test.deferred.component');
		
		// Now the promise should resolve with the actual component
		const node = await nodePromise;
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWIDocFrag', 'Should be actual MWIDocFrag, not defer');
	});

	await t.step('.createNodeWait() - Waits and creates actual component after load', async () => {
		// Register another deferred component for this test
		const deferredEntry2 = ls([
			'allowLate', true,
			'ftr', 'test.deferred2.component'
		]);
		registry.register('test.deferred2', deferredEntry2);
		
		// Start the async creation (it will wait for the feature)
		const nodePromise = doc.createNodeWait('test.deferred2');
		
		// Simulate loading the component
		registry.register('test.deferred2', ls(['if', 'MWIDocFrag']));
		fready(null, 'test.deferred2.component');
		
		// Now the promise should resolve with the actual component
		const node = await nodePromise;
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWIDocFrag', 'Should be actual MWIDocFrag, not defer');
	});
});
