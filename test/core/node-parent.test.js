import {
	assert,
	assertEquals,
	assertStrictEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';
const DOC_NODE_RDY_FT = 'MWIDocNode';

await setupRuntime();

const { fwait, getInstance, getInterface } = globalThis.$c;
await fwait(REG_READY_FT, DOC_NODE_RDY_FT);

const doc = getInstance('MWIDocument');
const MWIDocNode = getInterface('MWIDocNode').proto;
const ls = globalThis.ls;
const ps = globalThis.ps;

// ─────────────────────────────────────────────────────────────────────────────
// getParent / setParent
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("MWIDocNode - getParent / setParent", async (t) => {
	await t.step("(getParent) - New node has null parent and undefined index", () => {
		const node = doc.createNode('h.div');
		const pi = $c.sm(node, 'getParent');
		assertEquals(pi.at('parent'), null);
		assertEquals(pi.at('index'), undefined);
	});

	await t.step(".getParent() - New node has null parent and undefined index via JS", () => {
		const node = doc.createNode('h.div');
		const pi = node.getParent();
		assertEquals(pi.parent, null);
		assertEquals(pi.index, undefined);
	});

	await t.step("(setParent) - Set parent and index", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		$c.sm(child, 'setParent', ls([, parent, , 0]));
		const pi = $c.sm(child, 'getParent');
		assertStrictEquals(pi.at('parent'), parent);
		assertEquals(pi.at('index'), 0);
	});

	await t.step(".setParent() - Set parent and index via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setParent(parent, 2);
		const pi = child.getParent();
		assertStrictEquals(pi.parent, parent);
		assertEquals(pi.index, 2);
	});

	await t.step("(setParent) - Non-MWIDocNode parent is ignored", () => {
		const child = doc.createNode('h.div');
		// Pass a plain object as parent — should be ignored
		$c.sm(child, 'setParent', ls([, {}, , 0]));
		const pi = $c.sm(child, 'getParent');
		assertEquals(pi.at('parent'), null);
		assertEquals(pi.at('index'), undefined);
	});

	await t.step(".setParent() - Non-MWIDocNode parent is ignored via JS", () => {
		const child = doc.createNode('h.div');
		child.setParent({}, 0);
		const pi = child.getParent();
		assertEquals(pi.parent, null);
		assertEquals(pi.index, undefined);
	});

	await t.step("(setParent) - Negative index is stored as undefined", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		$c.sm(child, 'setParent', ls([, parent, , -1]));
		const pi = $c.sm(child, 'getParent');
		assertStrictEquals(pi.at('parent'), parent);
		assertEquals(pi.at('index'), undefined);
	});

	await t.step(".setParent() - Negative index is stored as undefined via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setParent(parent, -1);
		const pi = child.getParent();
		assertStrictEquals(pi.parent, parent);
		assertEquals(pi.index, undefined);
	});

	await t.step("(setParent) - Non-integer index is stored as undefined", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		$c.sm(child, 'setParent', ls([, parent, , 'bad']));
		const pi = $c.sm(child, 'getParent');
		assertStrictEquals(pi.at('parent'), parent);
		assertEquals(pi.at('index'), undefined);
	});

	await t.step(".setParent() - Non-integer index is stored as undefined via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setParent(parent, 1.5);
		const pi = child.getParent();
		assertStrictEquals(pi.parent, parent);
		assertEquals(pi.index, undefined);
	});

	await t.step("(setParent) - Index 0 is valid", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		$c.sm(child, 'setParent', ls([, parent, , 0]));
		assertEquals($c.sm(child, 'getParent').at('index'), 0);
	});

	await t.step(".setParent() - Index 0 is valid via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setParent(parent, 0);
		assertEquals(child.getParent().index, 0);
	});

	await t.step("(setParent) - Parent can be updated", () => {
		const parent1 = doc.createNode('h.div');
		const parent2 = doc.createNode('h.section');
		const child = doc.createNode('m.t');
		$c.sm(child, 'setParent', ls([, parent1, , 0]));
		assertStrictEquals($c.sm(child, 'getParent').at('parent'), parent1);
		$c.sm(child, 'setParent', ls([, parent2, , 3]));
		assertStrictEquals($c.sm(child, 'getParent').at('parent'), parent2);
		assertEquals($c.sm(child, 'getParent').at('index'), 3);
	});

	await t.step(".setParent() - Parent can be updated via JS", () => {
		const parent1 = doc.createNode('h.div');
		const parent2 = doc.createNode('h.section');
		const child = doc.createNode('m.t');
		child.setParent(parent1, 0);
		assertStrictEquals(child.getParent().parent, parent1);
		child.setParent(parent2, 5);
		assertStrictEquals(child.getParent().parent, parent2);
		assertEquals(child.getParent().index, 5);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Parent/index set automatically by append
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("MWIDocNode - Parent/index set by append", async (t) => {
	await t.step("(append) - Single child gets parent and index 0", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'hello');
		$c.sm(parent, 'append', ls([, child]));
		const pi = $c.sm(child, 'getParent');
		assertStrictEquals(pi.at('parent'), parent);
		assertEquals(pi.at('index'), 0);
	});

	await t.step(".append() - Single child gets parent and index 0 via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'hello');
		parent.append(child);
		const pi = child.getParent();
		assertStrictEquals(pi.parent, parent);
		assertEquals(pi.index, 0);
	});

	await t.step("(append) - Multiple children get sequential indexes", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		$c.sm(parent, 'append', ls([, c0, , c1, , c2]));
		assertEquals($c.sm(c0, 'getParent').at('index'), 0);
		assertEquals($c.sm(c1, 'getParent').at('index'), 1);
		assertEquals($c.sm(c2, 'getParent').at('index'), 2);
	});

	await t.step(".append() - Multiple children get sequential indexes via JS", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		parent.append(c0, c1, c2);
		assertEquals(c0.getParent().index, 0);
		assertEquals(c1.getParent().index, 1);
		assertEquals(c2.getParent().index, 2);
	});

	await t.step("(append) - Second append continues index from current subDoc size", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'first');
		c1.setAttr('t', 'second');
		$c.sm(parent, 'append', ls([, c0]));
		$c.sm(parent, 'append', ls([, c1]));
		assertEquals($c.sm(c0, 'getParent').at('index'), 0);
		assertEquals($c.sm(c1, 'getParent').at('index'), 1);
	});

	await t.step(".append() - Second append continues index from current subDoc size via JS", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'first');
		c1.setAttr('t', 'second');
		parent.append(c0);
		parent.append(c1);
		assertEquals(c0.getParent().index, 0);
		assertEquals(c1.getParent().index, 1);
	});

	await t.step("(append) - All appended children share the same parent", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'x');
		c1.setAttr('t', 'y');
		$c.sm(parent, 'append', ls([, c0, , c1]));
		assertStrictEquals($c.sm(c0, 'getParent').at('parent'), parent);
		assertStrictEquals($c.sm(c1, 'getParent').at('parent'), parent);
	});

	await t.step(".append() - All appended children share the same parent via JS", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'x');
		c1.setAttr('t', 'y');
		parent.append(c0, c1);
		assertStrictEquals(c0.getParent().parent, parent);
		assertStrictEquals(c1.getParent().parent, parent);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Parent/index set automatically by setSubSpec
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("MWIDocNode - Parent/index set by setSubSpec", async (t) => {
	await t.step("(setSubSpec) - Children from spec get parent and sequential indexes", () => {
		const parent = doc.createNode('h.div');
		const subList = ps('[([m.t t=A] [m.t t=B] [m.t t=C])]');
		$c.sm(parent, 'setSubSpec', ls(['subSpec', subList]));
		const subDoc = $c.sm(parent, 'getSubDoc');
		assertEquals(subDoc.size, 3);
		for (let i = 0; i < 3; i++) {
			const child = subDoc.at(i);
			assertStrictEquals($c.sm(child, 'getParent').at('parent'), parent);
			assertEquals($c.sm(child, 'getParent').at('index'), i);
		}
	});

	await t.step(".setSubSpec() - Children from spec get parent and sequential indexes via JS", () => {
		const parent = doc.createNode('h.div');
		const subList = ps('[([m.t t=X] [m.t t=Y])]');
		parent.setSubSpec({ subSpec: subList });
		const subDoc = parent.getSubDoc();
		assertEquals(subDoc.size, 2);
		for (let i = 0; i < 2; i++) {
			const child = subDoc.at(i);
			assertStrictEquals(child.getParent().parent, parent);
			assertEquals(child.getParent().index, i);
		}
	});

	await t.step("(setSubSpec) - Replacing spec resets children's parent/index", () => {
		const parent = doc.createNode('h.div');
		const subList1 = ps('[([m.t t=First])]');
		$c.sm(parent, 'setSubSpec', ls(['subSpec', subList1]));
		const firstChild = $c.sm(parent, 'getSubDoc').at(0);
		assertStrictEquals($c.sm(firstChild, 'getParent').at('parent'), parent);
		assertEquals($c.sm(firstChild, 'getParent').at('index'), 0);

		// Replace with a new spec
		const subList2 = ps('[([m.t t=Second] [m.t t=Third])]');
		$c.sm(parent, 'setSubSpec', ls(['subSpec', subList2]));
		const subDoc2 = $c.sm(parent, 'getSubDoc');
		assertEquals(subDoc2.size, 2);
		assertStrictEquals($c.sm(subDoc2.at(0), 'getParent').at('parent'), parent);
		assertEquals($c.sm(subDoc2.at(0), 'getParent').at('index'), 0);
		assertStrictEquals($c.sm(subDoc2.at(1), 'getParent').at('parent'), parent);
		assertEquals($c.sm(subDoc2.at(1), 'getParent').at('index'), 1);
	});

	await t.step(".setSubSpec() - Replacing spec resets children's parent/index via JS", () => {
		const parent = doc.createNode('h.div');
		parent.setSubSpec({ subSpec: ps('[([m.t t=A])]') });
		parent.setSubSpec({ subSpec: ps('[([m.t t=B] [m.t t=C])]') });
		const subDoc = parent.getSubDoc();
		assertEquals(subDoc.size, 2);
		assertStrictEquals(subDoc.at(0).getParent().parent, parent);
		assertEquals(subDoc.at(0).getParent().index, 0);
		assertStrictEquals(subDoc.at(1).getParent().parent, parent);
		assertEquals(subDoc.at(1).getParent().index, 1);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// nodePath
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("MWIDocNode - nodePath", async (t) => {
	await t.step("(nodePath) - Unparented node returns empty path", () => {
		const node = doc.createNode('h.div');
		const path = $c.sm(node, 'nodePath');
		assertEquals(path.size, 0);
	});

	await t.step(".nodePath() - Unparented node returns empty path via JS", () => {
		const node = doc.createNode('h.div');
		const path = node.nodePath();
		assertEquals(path.size, 0);
	});

	await t.step("(nodePath) - Node with parent but no valid index returns empty path", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		// Set parent but with invalid index
		$c.sm(child, 'setParent', ls([, parent, , -1]));
		const path = $c.sm(child, 'nodePath');
		assertEquals(path.size, 0);
	});

	await t.step(".nodePath() - Node with parent but no valid index returns empty path via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setParent(parent, -5);
		const path = child.nodePath();
		assertEquals(path.size, 0);
	});

	await t.step("(nodePath) - Single-level: child at index 0 returns [0]", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'hello');
		$c.sm(parent, 'append', ls([, child]));
		const path = $c.sm(child, 'nodePath');
		assertEquals(path.size, 1);
		assertEquals(path.at(0), 0);
	});

	await t.step(".nodePath() - Single-level: child at index 0 returns [0] via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'hello');
		parent.append(child);
		const path = child.nodePath();
		assertEquals(path.size, 1);
		assertEquals(path.at(0), 0);
	});

	await t.step("(nodePath) - Single-level: child at index 2 returns [2]", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		$c.sm(parent, 'append', ls([, c0, , c1, , c2]));
		const path = $c.sm(c2, 'nodePath');
		assertEquals(path.size, 1);
		assertEquals(path.at(0), 2);
	});

	await t.step(".nodePath() - Single-level: child at index 2 returns [2] via JS", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		parent.append(c0, c1, c2);
		const path = c2.nodePath();
		assertEquals(path.size, 1);
		assertEquals(path.at(0), 2);
	});

	await t.step("(nodePath) - Two-level: grandchild returns [parentIdx, childIdx]", () => {
		const grandparent = doc.createNode('h.div');
		const parent = doc.createNode('h.section');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'leaf');
		// grandparent -> parent (index 0) -> child (index 0)
		$c.sm(grandparent, 'append', ls([, parent]));
		$c.sm(parent, 'append', ls([, child]));
		const path = $c.sm(child, 'nodePath');
		assertEquals(path.size, 2);
		assertEquals(path.at(0), 0); // parent's index in grandparent
		assertEquals(path.at(1), 0); // child's index in parent
	});

	await t.step(".nodePath() - Two-level: grandchild returns [parentIdx, childIdx] via JS", () => {
		const grandparent = doc.createNode('h.div');
		const parent = doc.createNode('h.section');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'leaf');
		grandparent.append(parent);
		parent.append(child);
		const path = child.nodePath();
		assertEquals(path.size, 2);
		assertEquals(path.at(0), 0);
		assertEquals(path.at(1), 0);
	});

	await t.step("(nodePath) - Two-level: non-zero indexes at both levels", () => {
		const grandparent = doc.createNode('h.div');
		const p0 = doc.createNode('h.section');
		const p1 = doc.createNode('h.section');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		$c.sm(grandparent, 'append', ls([, p0, , p1]));
		$c.sm(p1, 'append', ls([, c0, , c1, , c2]));
		// c2 is at index 2 in p1, and p1 is at index 1 in grandparent
		const path = $c.sm(c2, 'nodePath');
		assertEquals(path.size, 2);
		assertEquals(path.at(0), 1); // p1's index in grandparent
		assertEquals(path.at(1), 2); // c2's index in p1
	});

	await t.step(".nodePath() - Two-level: non-zero indexes at both levels via JS", () => {
		const grandparent = doc.createNode('h.div');
		const p0 = doc.createNode('h.section');
		const p1 = doc.createNode('h.section');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		grandparent.append(p0, p1);
		p1.append(c0, c1, c2);
		const path = c2.nodePath();
		assertEquals(path.size, 2);
		assertEquals(path.at(0), 1);
		assertEquals(path.at(1), 2);
	});

	await t.step("(nodePath) - Three-level: path length equals depth from unparented ancestor", () => {
		// root (no parent) -> mid (index 0 in root) -> leaf (index 0 in mid)
		// root.nodePath() = [] (no parent)
		// mid.nodePath() = [0] (mid is at index 0 in root, root has no parent so root.nodePath()=[])
		// leaf.nodePath() = [0, 0] (leaf is at index 0 in mid, mid.nodePath()=[0])
		const root = doc.createNode('h.div');
		const mid = doc.createNode('h.section');
		const leaf = doc.createNode('m.t');
		leaf.setAttr('t', 'deep');
		$c.sm(root, 'append', ls([, mid]));
		$c.sm(mid, 'append', ls([, leaf]));
		assertEquals($c.sm(root, 'nodePath').size, 0);
		assertEquals($c.sm(mid, 'nodePath').size, 1);
		assertEquals($c.sm(mid, 'nodePath').at(0), 0);
		assertEquals($c.sm(leaf, 'nodePath').size, 2);
		assertEquals($c.sm(leaf, 'nodePath').at(0), 0);
		assertEquals($c.sm(leaf, 'nodePath').at(1), 0);
	});

	await t.step(".nodePath() - Three-level: path length equals depth from unparented ancestor via JS", () => {
		const root = doc.createNode('h.div');
		const mid = doc.createNode('h.section');
		const leaf = doc.createNode('m.t');
		leaf.setAttr('t', 'deep');
		root.append(mid);
		mid.append(leaf);
		assertEquals(root.nodePath().size, 0);
		assertEquals(mid.nodePath().size, 1);
		assertEquals(mid.nodePath().at(0), 0);
		assertEquals(leaf.nodePath().size, 2);
		assertEquals(leaf.nodePath().at(0), 0);
		assertEquals(leaf.nodePath().at(1), 0);
	});

	await t.step("(nodePath) - Sibling nodes have different paths", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'first');
		c1.setAttr('t', 'second');
		$c.sm(parent, 'append', ls([, c0, , c1]));
		const path0 = $c.sm(c0, 'nodePath');
		const path1 = $c.sm(c1, 'nodePath');
		assertEquals(path0.size, 1);
		assertEquals(path1.size, 1);
		assertEquals(path0.at(0), 0);
		assertEquals(path1.at(0), 1);
	});

	await t.step(".nodePath() - Sibling nodes have different paths via JS", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'first');
		c1.setAttr('t', 'second');
		parent.append(c0, c1);
		const path0 = c0.nodePath();
		const path1 = c1.nodePath();
		assertEquals(path0.size, 1);
		assertEquals(path1.size, 1);
		assertEquals(path0.at(0), 0);
		assertEquals(path1.at(0), 1);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// setNodesParent helper (via JS prototype)
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("MWIDocNode - setNodesParent helper", async (t) => {
	await t.step(".setNodesParent() - Sets parent and sequential indexes starting at offset 0", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		const c2 = doc.createNode('m.t');
		c0.setAttr('t', 'a');
		c1.setAttr('t', 'b');
		c2.setAttr('t', 'c');
		// setNodesParent is a static helper on the JS prototype
		MWIDocNode.setNodesParent([c0, c1, c2], parent, 0);
		assertStrictEquals(c0.getParent().parent, parent);
		assertEquals(c0.getParent().index, 0);
		assertStrictEquals(c1.getParent().parent, parent);
		assertEquals(c1.getParent().index, 1);
		assertStrictEquals(c2.getParent().parent, parent);
		assertEquals(c2.getParent().index, 2);
	});

	await t.step(".setNodesParent() - Offset shifts starting index", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		const c1 = doc.createNode('m.t');
		c0.setAttr('t', 'x');
		c1.setAttr('t', 'y');
		MWIDocNode.setNodesParent([c0, c1], parent, 5);
		assertEquals(c0.getParent().index, 5);
		assertEquals(c1.getParent().index, 6);
	});

	await t.step(".setNodesParent() - Empty array is a no-op", () => {
		const parent = doc.createNode('h.div');
		// Should not throw
		MWIDocNode.setNodesParent([], parent, 0);
	});

	await t.step(".setNodesParent() - Default offset is 0", () => {
		const parent = doc.createNode('h.div');
		const c0 = doc.createNode('m.t');
		c0.setAttr('t', 'test');
		MWIDocNode.setNodesParent([c0], parent);
		assertEquals(c0.getParent().index, 0);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Reactive behavior of parent/index
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("MWIDocNode - Reactive parent/index", async (t) => {
	await t.step("(nodePath) - Returns a NANOS instance", () => {
		const node = doc.createNode('h.div');
		const path = $c.sm(node, 'nodePath');
		assert(path instanceof NANOS, 'nodePath should return a NANOS');
	});

	await t.step(".nodePath() - Returns a NANOS instance via JS", () => {
		const node = doc.createNode('h.div');
		const path = node.nodePath();
		assert(path instanceof NANOS, 'nodePath should return a NANOS');
	});

	await t.step("(nodePath) - Same NANOS instance returned on repeated calls", () => {
		const node = doc.createNode('h.div');
		const path1 = $c.sm(node, 'nodePath');
		const path2 = $c.sm(node, 'nodePath');
		assertStrictEquals(path1, path2);
	});

	await t.step(".nodePath() - Same NANOS instance returned on repeated calls via JS", () => {
		const node = doc.createNode('h.div');
		const path1 = node.nodePath();
		const path2 = node.nodePath();
		assertStrictEquals(path1, path2);
	});

	await t.step("(nodePath) - Path updates when parent is set", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'reactive');
		const path = $c.sm(child, 'nodePath');
		assertEquals(path.size, 0); // No parent yet

		$c.sm(parent, 'append', ls([, child]));
		// After append, path should reflect the new parent/index
		$c.sm(child, 'nodePath'); // Non-eager; create reactive demand
		assertEquals(path.size, 1);
		assertEquals(path.at(0), 0);
	});

	await t.step(".nodePath() - Path updates when parent is set via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'reactive');
		const path = child.nodePath();
		assertEquals(path.size, 0);

		parent.append(child);
		child.nodePath();
		assertEquals(path.size, 1);
		assertEquals(path.at(0), 0);
	});

	await t.step("(nodePath) - Path updates when index changes via setParent", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'test');
		$c.sm(parent, 'append', ls([, child]));
		const path = $c.sm(child, 'nodePath');
		assertEquals(path.at(0), 0);

		// Manually update the index
		$c.sm(child, 'setParent', ls([, parent, , 7]));
		$c.sm(child, 'nodePath');
		assertEquals(path.at(0), 7);
	});

	await t.step(".nodePath() - Path updates when index changes via setParent via JS", () => {
		const parent = doc.createNode('h.div');
		const child = doc.createNode('m.t');
		child.setAttr('t', 'test');
		parent.append(child);
		const path = child.nodePath();
		assertEquals(path.at(0), 0);

		child.setParent(parent, 4);
		child.nodePath();
		assertEquals(path.at(0), 4);
	});
});
