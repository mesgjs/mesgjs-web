import { describe, it } from '@compat/test';
import {
	assert,
	assertEquals,
	assertStrictEquals,
	assertMatch,
	assertRejects,
} from '@std/assert';

import { setupRuntime } from '../harness.esm.js';

await setupRuntime({
	features: [ 'test.deferred.component', 'test.deferred2.component'],
});

const { fwait, getInstance, MsjsObject } = globalThis.$c;
const { ls, ps } = globalThis;

await fwait('MWIDocument');
describe('MWIDocument - Basic Interface', () => {
	const doc = getInstance('MWIDocument');

	it('.jsv - Returns document instance', () => {
		const jsv = doc.jsv;
		assertStrictEquals(jsv, doc, 'jsv should return the document itself');
	});

	it('.valueOf() - Returns document instance', () => {
		const val = doc.valueOf();
		assertStrictEquals(val, doc, 'valueOf should return the document itself');
	});

	it('(registry) - Get component registry', () => {
		const registry = $c.sm(doc, 'registry');
		assert(registry, 'Should return registry instance');
		assert(registry instanceof MsjsObject, 'Registry should be a Mesgjs object');
	});

	it('.registry - Get component registry', () => {
		const registry = doc.registry;
		assert(registry, 'Should return registry instance');
		assert(registry instanceof MsjsObject, 'Registry should be a Mesgjs object');
	});

	it('(registry) - Same instance across calls', () => {
		const reg1 = $c.sm(doc, 'registry');
		const reg2 = $c.sm(doc, 'registry');
		assertStrictEquals(reg1, reg2, 'Should return same registry instance');
	});

	it('.registry - Same instance across calls', () => {
		const reg1 = doc.registry;
		const reg2 = doc.registry;
		assertStrictEquals(reg1, reg2, 'Should return same registry instance');
	});

	it('(root) - Get document root', () => {
		const root = $c.sm(doc, 'root');
		assert(root, 'Should return root node');
		assert(root instanceof MsjsObject, 'Root should be a Mesgjs object');
	});

	it('.root - Get document root', () => {
		const root = doc.root;
		assert(root, 'Should return root node');
		assert(root instanceof MsjsObject, 'Root should be a Mesgjs object');
	});

	it('(root) - Root is m.frg fragment', () => {
		const root = $c.sm(doc, 'root');
		const type = $c.sm(root, 'type');
		assertEquals(type, 'm.frg', 'Root should be an m.frg fragment');
	});

	it('.root - Root is m.frg fragment', () => {
		const root = doc.root;
		const type = root.type;
		assertEquals(type, 'm.frg', 'Root should be an m.frg fragment');
	});

	it('(root) - Same instance across calls', () => {
		const root1 = $c.sm(doc, 'root');
		const root2 = $c.sm(doc, 'root');
		assertStrictEquals(root1, root2, 'Should return same root instance');
	});

	it('.root - Same instance across calls', () => {
		const root1 = doc.root;
		const root2 = doc.root;
		assertStrictEquals(root1, root2, 'Should return same root instance');
	});

	it('(root) - Root references document', () => {
		const root = $c.sm(doc, 'root');
		const rootDoc = $c.sm(root, 'document');
		assertStrictEquals(rootDoc, doc, 'Root should reference its document');
	});

	it('.root - Root references document', () => {
		const root = doc.root;
		const rootDoc = root.document;
		assertStrictEquals(rootDoc, doc, 'Root should reference its document');
	});

	it('(nextId) - Get next component ID', () => {
		const id1 = $c.sm(doc, 'nextId');
		assertEquals(typeof id1, 'string', 'ID should be a string');
		assertMatch(id1, /^_MS_/, 'ID should have server prefix');
	});

	it('(nextId) - Sequential IDs', () => {
		const id1 = $c.sm(doc, 'nextId');
		const id2 = $c.sm(doc, 'nextId');
		const num1 = parseInt(id1.slice(4), 36);
		const num2 = parseInt(id2.slice(4), 36);
		assertEquals(num2, num1 + 1, 'IDs should increment');
	});

	it('.compIdStr() - Convert numeric ID to string', () => {
		const str0 = doc.compIdStr(0);
		const str1 = doc.compIdStr(1);
		const str10 = doc.compIdStr(10);
		const str100 = doc.compIdStr(100);

		assertEquals(str0, '_MO_0', 'ID 0 should convert correctly');
		assertEquals(str1, '_MO_1', 'ID 1 should convert correctly');
		assertEquals(str10, '_MO_a', 'ID 10 should convert to base-36');
		assertEquals(str100, '_MO_2s', 'ID 100 should convert to base-36');
	});

	it('.compIdStr() - Consistency', () => {
		const id = 42;
		const str1 = doc.compIdStr(id);
		const str2 = doc.compIdStr(id);
		assertEquals(str1, str2, 'Same input should produce same output');
	});

	it('.compIdStr() - Uniqueness', () => {
		const ids = new Set();
		for (let i = 0; i < 100; i++) {
			ids.add(doc.compIdStr(i));
		}
		assertEquals(ids.size, 100, 'Different inputs should produce different outputs');
	});
});

describe('MWIDocument - Node Creation (Synchronous)', () => {
	const doc = getInstance('MWIDocument');

	it('(createNode) - Create text node', () => {
		const node = $c.sm(doc, 'createNode', ls([, 'm.t']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.t', 'Should be text node');
	});

	it('.createNode() - Create text node', () => {
		const node = doc.createNode('m.t');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
	});

	it('(createNode) - Create fragment', () => {
		const node = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.frg', 'Should be fragment');
	});

	it('.createNode() - Create fragment', () => {
		const node = doc.createNode('m.frg');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.frg', 'Should be fragment');
	});

	it('(createNode) - Create comment', () => {
		const node = $c.sm(doc, 'createNode', ls([, 'm.com']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.com', 'Should be comment');
	});

	it('.createNode() - Create comment', () => {
		const node = doc.createNode('m.com');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.com', 'Should be comment');
	});

	it('(createNode) - Create HTML element', () => {
		const node = $c.sm(doc, 'createNode', ls([, 'h.div']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'h.div', 'Should be div element');
	});

	it('.createNode() - Create HTML element', () => {
		const node = doc.createNode('h.div');
		assert(node, 'Should create node');
		assertEquals(node.type, 'h.div', 'Should be div element');
	});

	it('(createNode) - Nodes reference document', () => {
		const node = $c.sm(doc, 'createNode', ls([, 'm.t']));
		const nodeDoc = $c.sm(node, 'document');
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	it('.createNode() - Nodes reference document', () => {
		const node = doc.createNode('m.t');
		const nodeDoc = node.document;
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	it('(createNode) - Distinct instances', () => {
		const node1 = $c.sm(doc, 'createNode', ls([, 'm.t']));
		const node2 = $c.sm(doc, 'createNode', ls([, 'm.t']));
		assert(node1 !== node2, 'Should create distinct instances');
	});

	it('.createNode() - Distinct instances', () => {
		const node1 = doc.createNode('m.t');
		const node2 = doc.createNode('m.t');
		assert(node1 !== node2, 'Should create distinct instances');
	});

	it('(createNode) - Invalid type throws', () => {
		try {
			$c.sm(doc, 'createNode', ls([, 'invalid.type']));
			assert(false, 'Should have thrown');
		} catch (e) {
			assert(e instanceof TypeError, 'Should throw TypeError');
			assert(e.message.includes('invalid.type'), 'Error should mention the type');
		}
	});

	it('.createNode() - Invalid type throws', () => {
		try {
			doc.createNode('invalid.type');
			assert(false, 'Should have thrown');
		} catch (e) {
			assert(e instanceof TypeError, 'Should throw TypeError');
			assert(e.message.includes('invalid.type'), 'Error should mention the type');
		}
	});
});

describe('MWIDocument - Node Creation (Asynchronous)', () => {
	const doc = getInstance('MWIDocument');

	it('(createNodeWait) - Create text node', async () => {
		const node = await $c.sm(doc, 'createNodeWait', ls([, 'm.t']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.t', 'Should be text node');
	});

	it('.createNodeWait() - Create text node', async () => {
		const node = await doc.createNodeWait('m.t');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
	});

	it('(createNodeWait) - Create fragment', async () => {
		const node = await $c.sm(doc, 'createNodeWait', ls([, 'm.frg']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.frg', 'Should be fragment');
	});

	it('.createNodeWait() - Create fragment', async () => {
		const node = await doc.createNodeWait('m.frg');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.frg', 'Should be fragment');
	});

	it('(createNodeWait) - Create comment', async () => {
		const node = await $c.sm(doc, 'createNodeWait', ls([, 'm.com']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.com', 'Should be comment');
	});

	it('.createNodeWait() - Create comment', async () => {
		const node = await doc.createNodeWait('m.com');
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.com', 'Should be comment');
	});

	it('(createNodeWait) - Create HTML element', async () => {
		const node = await $c.sm(doc, 'createNodeWait', ls([, 'h.div']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'h.div', 'Should be div element');
	});

	it('.createNodeWait() - Create HTML element', async () => {
		const node = await doc.createNodeWait('h.div');
		assert(node, 'Should create node');
		assertEquals(node.type, 'h.div', 'Should be div element');
	});

	it('(createNodeWait) - Nodes reference document', async () => {
		const node = await $c.sm(doc, 'createNodeWait', ls([, 'm.t']));
		const nodeDoc = $c.sm(node, 'document');
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	it('.createNodeWait() - Nodes reference document', async () => {
		const node = await doc.createNodeWait('m.t');
		const nodeDoc = node.document;
		assertStrictEquals(nodeDoc, doc, 'Node should reference its document');
	});

	it('(createNodeWait) - Distinct instances', async () => {
		const node1 = await $c.sm(doc, 'createNodeWait', ls([, 'm.t']));
		const node2 = await $c.sm(doc, 'createNodeWait', ls([, 'm.t']));
		assert(node1 !== node2, 'Should create distinct instances');
	});

	it('.createNodeWait() - Distinct instances', async () => {
		const node1 = await doc.createNodeWait('m.t');
		const node2 = await doc.createNodeWait('m.t');
		assert(node1 !== node2, 'Should create distinct instances');
	});

	it('(createNodeWait) - Invalid type throws', async () => {
		await assertRejects(
			async () => await $c.sm(doc, 'createNodeWait', ls([, 'invalid.type'])),
			TypeError,
			'invalid.type'
		);
	});

	it('.createNodeWait() - Invalid type throws', async () => {
		await assertRejects(
			async () => await doc.createNodeWait('invalid.type'),
			TypeError,
			'invalid.type'
		);
	});
});

describe('MWIDocument - Node Creation with Slot Source', () => {
	const doc = getInstance('MWIDocument');

	it('(createNodeWait) - With slot source', async () => {
		const source = await $c.sm(doc, 'createNodeWait', ls([, 'm.frg']));
		$c.sm(source, 'setAttr', ls(['title', 'Source Title']));

		const node = await $c.sm(doc, 'createNodeWait', ls([, 'h.div', 'slotSrc', source]));
		const slotSrc = $c.sm(node, 'slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});

	it('.createNodeWait() - With slot source', async () => {
		const source = await doc.createNodeWait('m.frg');
		source.setAttr('title', 'Source Title');

		const node = await doc.createNodeWait('h.div', { slotSrc: source });
		const slotSrc = $c.sm(node, 'slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});

	it('(createNode) - With slot source', () => {
		const source = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		$c.sm(source, 'setAttr', ls(['title', 'Source Title']));

		const node = $c.sm(doc, 'createNode', ls([, 'h.div', 'slotSrc', source]));
		const slotSrc = $c.sm(node, 'slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});

	it('.createNode() - With slot source', () => {
		const source = doc.createNode('m.frg');
		source.setAttr('title', 'Source Title');

		const node = doc.createNode('h.div', { slotSrc: source });
		const slotSrc = $c.sm(node, 'slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source set');
	});
});

describe('MWIDocument - Content Creation from Specs', () => {
	const doc = getInstance('MWIDocument');

	it('(from) - Text string creates m.t node', () => {
		const node = $c.sm(doc, 'from', ls(['item', 'Hello']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.t', 'Should be text node');
		assertEquals($c.sm(node, 'getAttr', ls([, 't'])), 'Hello', 'Should have text content');
	});

	it('(from) - NANOS spec creates configured node', () => {
		const spec = ps('[(m.t t=Hello)]');
		const node = $c.sm(doc, 'from', ls(['item', spec]));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.t', 'Should be text node');
		assertEquals($c.sm(node, 'getAttr', ls([, 't'])), 'Hello', 'Should have text attribute');
	});

	it('(from) - SLID string creates nodes', () => {
		const nodes = $c.sm(doc, 'from', ls(['list', '[([m.t t=A] [m.t t=B])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals($c.sm(nodes[0], 'type'), 'm.t', 'First should be text node');
		assertEquals($c.sm(nodes[1], 'type'), 'm.t', 'Second should be text node');
		assertEquals($c.sm(nodes[0], 'getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals($c.sm(nodes[1], 'getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	it('(from) - NANOS list creates nodes', () => {
		const list = ls([, ls([, 'm.t', 't', 'A']), , ls([, 'm.t', 't', 'B'])]);
		const nodes = $c.sm(doc, 'from', ls(['list', list]));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals($c.sm(nodes[0], 'getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals($c.sm(nodes[1], 'getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	it('(from) - Mixed content', () => {
		const nodes = $c.sm(doc, 'from', ls(['list', '[(text [h.div div-text])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals($c.sm(nodes[0], 'type'), 'm.t', 'First should be text node');
		assertEquals($c.sm(nodes[1], 'type'), 'h.div', 'Second should be div');
	});

	it('(from) - With slot source', () => {
		const source = $c.sm(doc, 'createNode', ls([, 'm.frg']));
		const nodes = $c.sm(doc, 'from', ls(['list', '[([h.div])]', 'slotSrc', source]));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 1, 'Should create one node');
		const slotSrc = $c.sm(nodes[0], 'slotSrc');
		assertStrictEquals(slotSrc, source, 'Node should have slot source');
	});

	it('(from) - Neither item nor list throws', () => {
		try {
			$c.sm(doc, 'from', ls([]));
			assert(false, 'Should have thrown');
		} catch (e) {
			assert(e instanceof TypeError, 'Should throw TypeError');
			assert(e.message.includes('without "item" or "list"'), 'Error should mention missing parameters');
		}
	});
});

describe('MWIDocument - Content Creation from Specs (Async)', () => {
	const doc = getInstance('MWIDocument');

	it('(fromWait) - Text string creates m.t node', async () => {
		const node = await $c.sm(doc, 'fromWait', ls(['item', 'Hello']));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.t', 'Should be text node');
		assertEquals($c.sm(node, 'getAttr', ls([, 't'])), 'Hello', 'Should have text content');
	});

	it('.fromWait() - Text string creates m.t node', async () => {
		const node = await doc.fromWait({ item: 'Hello' });
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
		assertEquals(node.getAttr('t'), 'Hello', 'Should have text content');
	});

	it('(fromWait) - NANOS spec creates configured node', async () => {
		const spec = ps('[(m.t t=Hello)]');
		const node = await $c.sm(doc, 'fromWait', ls(['item', spec]));
		assert(node, 'Should create node');
		assertEquals($c.sm(node, 'type'), 'm.t', 'Should be text node');
		assertEquals($c.sm(node, 'getAttr', ls([, 't'])), 'Hello', 'Should have text attribute');
	});

	it('.fromWait() - NANOS spec creates configured node', async () => {
		const spec = ps('[(m.t t=Hello)]');
		const node = await doc.fromWait({ item: spec });
		assert(node, 'Should create node');
		assertEquals(node.type, 'm.t', 'Should be text node');
		assertEquals(node.getAttr('t'), 'Hello', 'Should have text attribute');
	});

	it('(fromWait) - SLID string creates nodes', async () => {
		const nodes = await $c.sm(doc, 'fromWait', ls(['list', '[([m.t t=A] [m.t t=B])]']));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals($c.sm(nodes[0], 'type'), 'm.t', 'First should be text node');
		assertEquals($c.sm(nodes[1], 'type'), 'm.t', 'Second should be text node');
		assertEquals($c.sm(nodes[0], 'getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals($c.sm(nodes[1], 'getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	it('.fromWait() - SLID string creates nodes', async () => {
		const nodes = await doc.fromWait({ list: '[([m.t t=A] [m.t t=B])]' });
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0].getAttr('t'), 'A', 'First should have text A');
		assertEquals(nodes[1].getAttr('t'), 'B', 'Second should have text B');
	});

	it('(fromWait) - NANOS list creates nodes', async () => {
		const list = ls([, ls([, 'm.t', 't', 'A']), , ls([, 'm.t', 't', 'B'])]);
		const nodes = await $c.sm(doc, 'fromWait', ls(['list', list]));
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals($c.sm(nodes[0], 'getAttr', ls([, 't'])), 'A', 'First should have text A');
		assertEquals($c.sm(nodes[1], 'getAttr', ls([, 't'])), 'B', 'Second should have text B');
	});

	it('.fromWait() - NANOS list creates nodes', async () => {
		const list = ls([, ls([, 'm.t', 't', 'A']), , ls([, 'm.t', 't', 'B'])]);
		const nodes = await doc.fromWait({ list });
		assert(Array.isArray(nodes), 'Should return array');
		assertEquals(nodes.length, 2, 'Should create two nodes');
		assertEquals(nodes[0].getAttr('t'), 'A', 'First should have text A');
		assertEquals(nodes[1].getAttr('t'), 'B', 'Second should have text B');
	});
});

describe('MWIDocument - Document Root Operations', () => {

	it('(append) - Append text string', async () => {
		const doc = getInstance('MWIDocument');
		const result = $c.sm(doc, 'append', ls(['item', 'Hello']));
		assertStrictEquals(result, doc, 'Should return document for chaining');

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	it('(append) - Append single node', async () => {
		const doc = getInstance('MWIDocument');
		const node = $c.sm(doc, 'createNode', ls([, 'm.t']));
		$c.sm(node, 'setAttr', ls(['t', 'Test']));

		const result = $c.sm(doc, 'append', ls([, node]));
		assertStrictEquals(result, doc, 'Should return document for chaining');

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	it('(append) - Append multiple nodes', async () => {
		const doc = getInstance('MWIDocument');
		const node1 = $c.sm(doc, 'createNode', ls([, 'm.t']));
		const node2 = $c.sm(doc, 'createNode', ls([, 'm.t']));

		const result = $c.sm(doc, 'append', ls([, node1, , node2]));
		assertStrictEquals(result, doc, 'Should return document for chaining');

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});

	it('(append) - Append SLID spec', async () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.t t=A] [m.t t=B])]']));

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});

	it('(append) - Root sub-spec reflects content', async () => {
		const doc = getInstance('MWIDocument');
		$c.sm(doc, 'append', ls(['list', '[([m.t t=First] [m.t t=Second])]']));

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 2, 'Should have two children');

		const first = subSpec.at(0);
		const second = subSpec.at(1);
		assertEquals(first, 'First', 'First child should be simplified text spec');
		assertEquals(second, 'Second', 'Second child should be simplified text spec');
	});

	it('(appendWait) - Append text string', async () => {
		const doc = getInstance('MWIDocument');
		const result = await $c.sm(doc, 'appendWait', ls(['item', 'Hello']));
		assertStrictEquals(result, doc, 'Should return document for chaining');

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	it('.appendWait() - Append text string', async () => {
		const doc = getInstance('MWIDocument');
		const result = await doc.appendWait({ item: 'Hello' });
		assertStrictEquals(result, doc, 'Should return document for chaining');

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 1, 'Root should have one child');
	});

	it('(appendWait) - Append SLID spec', async () => {
		const doc = getInstance('MWIDocument');
		await $c.sm(doc, 'appendWait', ls(['list', '[([m.t t=A] [m.t t=B])]']));

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});

	it('.appendWait() - Append SLID spec', async () => {
		const doc = getInstance('MWIDocument');
		await doc.appendWait({ list: '[([m.t t=A] [m.t t=B])]' });

		const root = $c.sm(doc, 'root');
		const subSpec = $c.sm(root, 'getSubSpec');
		assertEquals(subSpec.size, 2, 'Root should have two children');
	});
});

describe('MWIDocument - Deferred Component Creation', () => {
	const doc = getInstance('MWIDocument');
	const registry = doc.registry;
	const { fready } = globalThis.$c;

	// Register a test component with only a feature promise (no interface/template)
	// This simulates a component that hasn't been loaded yet
	it('Setup: Register deferred test component', () => {
		const deferredEntry = ls([
			'allowLate', true,
			'ftr', 'test.deferred.component'
		]);
		registry.register('test.deferred', deferredEntry);
	});

	it('(createNode) - Creates m.defer for unloaded component', () => {
		const node = $c.sm(doc, 'createNode', ls([, 'test.deferred']));
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWICoreDefer', 'Should be MWICoreDefer interface');
	});

	it('.createNode() - Creates m.defer for unloaded component', () => {
		const node = doc.createNode('test.deferred');
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWICoreDefer', 'Should be MWICoreDefer interface');
	});

	it('(createNodeWait) - Waits and creates actual component after load', async () => {
		// Start the async creation (it will wait for the feature)
		const nodePromise = $c.sm(doc, 'createNodeWait', ls([, 'test.deferred']));

		// Simulate loading the component by adding interface and signaling ready
		registry.register('test.deferred', ls(['if', 'MWIDocFrag']));
		fready(null, 'test.deferred.component');

		// Now the promise should resolve with the actual component
		const node = await nodePromise;
		assert(node, 'Should create node');
		assertEquals(node.msjsType, 'MWIDocFrag', 'Should be actual MWIDocFrag, not defer');
	});

	it('.createNodeWait() - Waits and creates actual component after load', async () => {
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
