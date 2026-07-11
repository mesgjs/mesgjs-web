import {
	assert,
	assertEquals,
	assertStrictEquals,
	assertNotEquals,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";

import { setupRuntime } from '../harness.esm.js';

const REG_READY_FT = 'mwi.compRegReady';

await setupRuntime();

const { fwait, getInstance } = globalThis.$c;
await fwait(REG_READY_FT);

const doc = getInstance('MWIDocument');
const ls = globalThis.ls;
const ps = globalThis.ps;

const modScope = globalThis.$modScope();

// Helper to build a Mesgjs @function
// jsFunction (d) accepts d (standard @dispatch object)
// Call via msjsFunction('call', messageParams)
function makeMsjsFunction (jsFunction) {
	const msjsCode = modScope.d.b({ cd: jsFunction }); // -> @code object
	const msjsFunction = msjsCode.fn(); // -> @function object
	return msjsFunction;
}

Deno.test("MWIDocNode - Basic Interface Tests", async (t) => {
	const divNode = doc.createNode('h.div');

	await t.step("(type) - Get node type", () => {
		assertEquals($c.sm(divNode, 'type'), 'h.div');
	});

	await t.step(".type - Get node type via JS", () => {
		assertEquals(divNode.type, 'h.div');
	});

	await t.step(".msjsType - Get Mesgjs type", () => {
		assertEquals(divNode.msjsType, 'MWIHTML');
	});

	await t.step(".jsv - Should return instance", () => {
		assertStrictEquals(divNode.jsv, divNode);
	});

	await t.step(".valueOf() - Should return instance", () => {
		assertStrictEquals(divNode.valueOf(), divNode);
	});

	await t.step("(document) - Get document reference", () => {
		const docRef = $c.sm(divNode, 'document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(divNode.document, doc);
	});
});

Deno.test("MWIDocNode - Attribute Operations", async (t) => {
	await t.step("(setAttr) - Set string attribute", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'data-test', , 'value123']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set string attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-id', 'div-001');
		assertEquals(divNode.getAttr('data-id'), 'div-001');
	});

	await t.step("(setAttr) - Set boolean attribute", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'disabled', , true]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'disabled'])), true);
	});

	await t.step(".setAttr() - Set boolean attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('hidden', true);
		assertEquals(divNode.getAttr('hidden'), true);
	});

	await t.step("(setAttr) - Set list-valued attribute", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(item1 item2 item3)]');
		$c.sm(divNode, 'setAttr', ls([, 'c.items', , listVal]));
		const retrieved = $c.sm(divNode, 'getAttr', ls([, 'c.items']));
		assertEquals(retrieved.at(0), 'item1');
		assertEquals(retrieved.at(1), 'item2');
		assertEquals(retrieved.at(2), 'item3');
	});

	await t.step(".setAttr() - Set list-valued attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(alpha beta gamma)]');
		divNode.setAttr('c.data', listVal);
		const retrieved = divNode.getAttr('c.data');
		assertEquals(retrieved.at(0), 'alpha');
		assertEquals(retrieved.at(1), 'beta');
		assertEquals(retrieved.at(2), 'gamma');
	});

	await t.step("(setAttr) - Chaining returns node", () => {
		const divNode = doc.createNode('h.div');
		const result = $c.sm(divNode, 'setAttr', ls([, 'title', , 'Test']));
		assertStrictEquals(result, divNode);
	});

	await t.step(".setAttr() - Chaining returns node via JS", () => {
		const divNode = doc.createNode('h.div');
		const result = divNode.setAttr('title', 'Test');
		assertStrictEquals(result, divNode);
	});

	await t.step("(getAttr) - Get existing attribute", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'title', , 'My Title']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'My Title');
	});

	await t.step(".getAttr() - Get existing attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('aria-label', 'Test Label');
		assertEquals(divNode.getAttr('aria-label'), 'Test Label');
	});

	await t.step("(getAttr) - Get non-existent attribute", () => {
		const divNode = doc.createNode('h.div');
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'nonexistent'])), undefined);
	});

	await t.step(".getAttr() - Get non-existent attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		assertEquals(divNode.getAttr('missing'), undefined);
	});

	await t.step("(hasAttr) - Check existing attribute", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals($c.sm(divNode, 'hasAttr', ls([, 'test-attr'])), true);
	});

	await t.step(".hasAttr() - Check existing attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('another-attr', 'value');
		assertEquals(divNode.hasAttr('another-attr'), true);
	});

	await t.step("(hasAttr) - Check non-existent attribute", () => {
		const divNode = doc.createNode('h.div');
		assertEquals($c.sm(divNode, 'hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check non-existent attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		assertEquals(divNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete existing attribute", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals($c.sm(divNode, 'hasAttr', ls([, 'temp-attr'])), true);
		$c.sm(divNode, 'delAttr', ls([, 'temp-attr']));
		assertEquals($c.sm(divNode, 'hasAttr', ls([, 'temp-attr'])), false);
	});

	await t.step(".delAttr() - Delete existing attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('temp-js-attr', 'temporary');
		assertEquals(divNode.hasAttr('temp-js-attr'), true);
		divNode.delAttr('temp-js-attr');
		assertEquals(divNode.hasAttr('temp-js-attr'), false);
	});

	await t.step("(delAttr) - Delete list-valued attribute", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(a b c)]');
		$c.sm(divNode, 'setAttr', ls([, 'c.list', , listVal]));
		assertEquals($c.sm(divNode, 'hasAttr', ls([, 'c.list'])), true);
		$c.sm(divNode, 'delAttr', ls([, 'c.list']));
		assertEquals($c.sm(divNode, 'hasAttr', ls([, 'c.list'])), false);
	});

	await t.step(".delAttr() - Delete list-valued attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(x y z)]');
		divNode.setAttr('c.data', listVal);
		assertEquals(divNode.hasAttr('c.data'), true);
		divNode.delAttr('c.data');
		assertEquals(divNode.hasAttr('c.data'), false);
	});
});

Deno.test("MWIDocNode - Special Attribute: m.id", async (t) => {
	await t.step("(getAttr) - Auto-generate ID when not set", () => {
		const divNode = doc.createNode('h.div');
		// Confirm id starts undefined
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), undefined);
		const id1 = $c.sm(divNode, 'getAttr', ls([, 'm.id']));
		assert(typeof id1 === 'string');
		assert(id1.length > 0);
	});

	await t.step(".getAttr() - Auto-generate ID when not set via JS", () => {
		const divNode = doc.createNode('h.div');
		// Confirm id starts undefined
		assertEquals(divNode.getAttr('id'), undefined);
		const id1 = divNode.getAttr('m.id');
		assert(typeof id1 === 'string');
		assert(id1.length > 0);
	});

	await t.step("(getAttr) - Return explicit ID when set", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'my-explicit-id']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'm.id'])), 'my-explicit-id');
	});

	await t.step(".getAttr() - Return explicit ID when set via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-explicit-id');
		assertEquals(divNode.getAttr('m.id'), 'js-explicit-id');
	});

	await t.step("(getAttr) - Auto-generated IDs are unique", () => {
		const div1 = doc.createNode('h.div');
		const div2 = doc.createNode('h.div');
		const id1 = $c.sm(div1, 'getAttr', ls([, 'm.id']));
		const id2 = $c.sm(div2, 'getAttr', ls([, 'm.id']));
		assertNotEquals(id1, id2);
	});

	await t.step(".getAttr() - Auto-generated IDs are unique via JS", () => {
		const div1 = doc.createNode('h.div');
		const div2 = doc.createNode('h.div');
		const id1 = div1.getAttr('m.id');
		const id2 = div2.getAttr('m.id');
		assertNotEquals(id1, id2);
	});

	await t.step("(getAttr) - Auto-generated ID is persisted", () => {
		const divNode = doc.createNode('h.div');
		const id1 = $c.sm(divNode, 'getAttr', ls([, 'm.id']));
		const id2 = $c.sm(divNode, 'getAttr', ls([, 'm.id']));
		assertEquals(id1, id2);
	});

	await t.step(".getAttr() - Auto-generated ID is persisted via JS", () => {
		const divNode = doc.createNode('h.div');
		const id1 = divNode.getAttr('m.id');
		const id2 = divNode.getAttr('m.id');
		assertEquals(id1, id2);
	});

	await t.step("(getAttr) - m.id sets id attribute", () => {
		const divNode = doc.createNode('h.div');
		// Confirm id starts undefined
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), undefined);
		const mid = $c.sm(divNode, 'getAttr', ls([, 'm.id']));
		const id = $c.sm(divNode, 'getAttr', ls([, 'id']));
		assertEquals(mid, id);
	});

	await t.step(".getAttr() - m.id sets id attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		// Confirm id starts undefined
		assertEquals(divNode.getAttr('id'), undefined);
		const mid = divNode.getAttr('m.id');
		const id = divNode.getAttr('id');
		assertEquals(mid, id);
	});

	await t.step("(setAttr) - m.id auto-assigns id when not set (supplied value ignored)", () => {
		const divNode = doc.createNode('h.div');
		// Confirm id starts undefined
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), undefined);
		// setAttr with m.id should auto-assign an id; the supplied value is ignored
		$c.sm(divNode, 'setAttr', ls([, 'm.id', , 'ignored-value']));
		const id = $c.sm(divNode, 'getAttr', ls([, 'id']));
		assert(typeof id === 'string');
		assert(id.length > 0);
		assert(id !== 'ignored-value');
	});

	await t.step(".setAttr() - m.id auto-assigns id when not set (supplied value ignored) via JS", () => {
		const divNode = doc.createNode('h.div');
		// Confirm id starts undefined
		assertEquals(divNode.getAttr('id'), undefined);
		// setAttr with m.id should auto-assign an id; the supplied value is ignored
		divNode.setAttr('m.id', 'ignored-value');
		const id = divNode.getAttr('id');
		assert(typeof id === 'string');
		assert(id.length > 0);
		assert(id !== 'ignored-value');
	});

	await t.step("(setAttr) - m.id does not override existing id (supplied value ignored)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'existing-id']));
		// setAttr with m.id should NOT change the existing id; the supplied value is ignored
		$c.sm(divNode, 'setAttr', ls([, 'm.id', , 'should-be-ignored']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), 'existing-id');
	});

	await t.step(".setAttr() - m.id does not override existing id (supplied value ignored) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-existing-id');
		// setAttr with m.id should NOT change the existing id; the supplied value is ignored
		divNode.setAttr('m.id', 'should-be-ignored');
		assertEquals(divNode.getAttr('id'), 'js-existing-id');
	});

	await t.step("(setAttr) - m.id returns node for chaining", () => {
		const divNode = doc.createNode('h.div');
		const result = $c.sm(divNode, 'setAttr', ls([, 'm.id', , 'any-value']));
		assertStrictEquals(result, divNode);
	});

	await t.step(".setAttr() - m.id returns node for chaining via JS", () => {
		const divNode = doc.createNode('h.div');
		const result = divNode.setAttr('m.id', 'any-value');
		assertStrictEquals(result, divNode);
	});
});

Deno.test("MWIDocNode - Special Attribute: class", async (t) => {
	await t.step("(setAttr) - Basic class setting", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'class'])), 'test-class');
	});

	await t.step(".setAttr() - Basic class setting via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-class');
		assertEquals(divNode.getAttr('class'), 'js-class');
	});

	await t.step("(setAttr) - Multiple classes", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'class1 class2 class3']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(classStr.includes('class1'));
		assert(classStr.includes('class2'));
		assert(classStr.includes('class3'));
	});

	await t.step(".setAttr() - Multiple classes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'alpha beta gamma');
		const classStr = divNode.getAttr('class');
		assert(classStr.includes('alpha'));
		assert(classStr.includes('beta'));
		assert(classStr.includes('gamma'));
	});

	await t.step("(setAttr) - Conditional clear (=)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'old-class']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '= new-class']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(!classStr.includes('old-class'));
		assert(classStr.includes('new-class'));
	});

	await t.step(".setAttr() - Conditional clear (=) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'old-class');
		divNode.setAttr('class', '= new-class');
		const classStr = divNode.getAttr('class');
		assert(!classStr.includes('old-class'));
		assert(classStr.includes('new-class'));
	});

	await t.step("(setAttr) - Unconditional clear (==)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'old-class']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '== new-class']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(!classStr.includes('old-class'));
		assert(classStr.includes('new-class'));
	});

	await t.step(".setAttr() - Unconditional clear (==) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'old-class');
		divNode.setAttr('class', '== new-class');
		const classStr = divNode.getAttr('class');
		assert(!classStr.includes('old-class'));
		assert(classStr.includes('new-class'));
	});

	await t.step("(setAttr) - Unconditional clear with nothing after (==)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'old-class']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '==']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assertEquals(classStr, undefined);
	});

	await t.step(".setAttr() - Unconditional clear with nothing after (==) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'old-class');
		divNode.setAttr('class', '==');
		const classStr = divNode.getAttr('class');
		assertEquals(classStr, undefined);
	});

	await t.step("(setAttr) - Supplement mode (+)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'existing']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ additional']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(classStr.includes('existing'));
		assert(classStr.includes('additional'));
	});

	await t.step(".setAttr() - Supplement mode (+) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'existing');
		divNode.setAttr('class', '+ additional');
		const classStr = divNode.getAttr('class');
		assert(classStr.includes('existing'));
		assert(classStr.includes('additional'));
	});

	await t.step("(setAttr) - Remove class (!)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'keep remove']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ !remove']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(classStr.includes('keep'));
		assert(!classStr.includes('remove'));
	});

	await t.step(".setAttr() - Remove class (!) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'keep remove');
		divNode.setAttr('class', '+ !remove');
		const classStr = divNode.getAttr('class');
		assert(classStr.includes('keep'));
		assert(!classStr.includes('remove'));
	});

	await t.step("(setAttr) - Toggle class (~)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'existing']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ ~toggle']));
		assert($c.sm(divNode, 'hasClass', ls([, 'toggle'])));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ ~toggle']));
		assert(!$c.sm(divNode, 'hasClass', ls([, 'toggle'])));
	});

	await t.step(".setAttr() - Toggle class (~) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'existing');
		divNode.setAttr('class', '+ ~toggle');
		assert(divNode.hasClass('toggle'));
		divNode.setAttr('class', '+ ~toggle');
		assert(!divNode.hasClass('toggle'));
	});

	await t.step("(setAttr) - Empty/whitespace clears classes", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'some-class']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '   ']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assertEquals(classStr, undefined);
	});

	await t.step(".setAttr() - Empty/whitespace clears classes via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'some-class');
		divNode.setAttr('class', '   ');
		const classStr = divNode.getAttr('class');
		assertEquals(classStr, undefined);
	});

	await t.step("(hasClass) - Check existing class", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(divNode, 'hasClass', ls([, 'test-class'])), true);
	});

	await t.step(".hasClass() - Check existing class via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-class');
		assertEquals(divNode.hasClass('js-class'), true);
	});

	await t.step("(hasClass) - Check non-existent class", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'test-class']));
		assertEquals($c.sm(divNode, 'hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Check non-existent class via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-class');
		assertEquals(divNode.hasClass('not-there'), false);
	});

	await t.step("(hasClass) - After modifications", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'class1 class2']));
		assertEquals($c.sm(divNode, 'hasClass', ls([, 'class1'])), true);
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ !class1']));
		assertEquals($c.sm(divNode, 'hasClass', ls([, 'class1'])), false);
		assertEquals($c.sm(divNode, 'hasClass', ls([, 'class2'])), true);
	});

	await t.step(".hasClass() - After modifications via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'class1 class2');
		assertEquals(divNode.hasClass('class1'), true);
		divNode.setAttr('class', '+ !class1');
		assertEquals(divNode.hasClass('class1'), false);
		assertEquals(divNode.hasClass('class2'), true);
	});
});

Deno.test("MWIDocNode - Special Attribute: m.percl", async (t) => {
	await t.step("(setAttr) - Set permanent classes", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.percl', , 'perm1 perm2']));
		const classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(classStr.includes('perm1'));
		assert(classStr.includes('perm2'));
	});

	await t.step(".setAttr() - Set permanent classes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm-a perm-b');
		const classStr = divNode.getAttr('class');
		assert(classStr.includes('perm-a'));
		assert(classStr.includes('perm-b'));
	});

	await t.step("(setAttr) - Permanent classes persist through modifications", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.percl', , 'permanent']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'temporary']));
		let classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(classStr.includes('permanent'));
		assert(classStr.includes('temporary'));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '==']));
		classStr = $c.sm(divNode, 'getAttr', ls([, 'class']));
		assert(classStr.includes('permanent'));
		assert(!classStr.includes('temporary'));
	});

	await t.step(".setAttr() - Permanent classes persist through modifications via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'permanent');
		divNode.setAttr('class', 'temporary');
		let classStr = divNode.getAttr('class');
		assert(classStr.includes('permanent'));
		assert(classStr.includes('temporary'));
		divNode.setAttr('class', '==');
		classStr = divNode.getAttr('class');
		assert(classStr.includes('permanent'));
		assert(!classStr.includes('temporary'));
	});

	await t.step("(delAttr) - Clear permanent classes", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.percl', , 'perm']));
		assert($c.sm(divNode, 'hasClass', ls([, 'perm'])));
		$c.sm(divNode, 'delAttr', ls([, 'm.percl']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '!perm']));
		assert(!$c.sm(divNode, 'hasClass', ls([, 'perm'])));
	});

	await t.step(".delAttr() - Clear permanent classes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm');
		assert(divNode.hasClass('perm'));
		divNode.delAttr('m.percl');
		divNode.setAttr('class', '!perm');
		assert(!divNode.hasClass('perm'));
	});

	await t.step("(setAttr) - Permanent classes remain after class clear", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.percl', , 'perm']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'temp']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '==']));
		assert($c.sm(divNode, 'hasClass', ls([, 'perm'])));
		assert(!$c.sm(divNode, 'hasClass', ls([, 'temp'])));
	});

	await t.step(".setAttr() - Permanent classes remain after class clear via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm');
		divNode.setAttr('class', 'temp');
		divNode.setAttr('class', '==');
		assert(divNode.hasClass('perm'));
		assert(!divNode.hasClass('temp'));
	});

	await t.step("(setAttr) - Cannot remove permanent class with !", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.percl', , 'perm']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ !perm']));
		assert($c.sm(divNode, 'hasClass', ls([, 'perm'])));
	});

	await t.step(".setAttr() - Cannot remove permanent class with ! via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm');
		divNode.setAttr('class', '+ !perm');
		assert(divNode.hasClass('perm'));
	});

	await t.step("(setAttr) - Cannot toggle permanent class with ~", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.percl', , 'perm']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , '+ ~perm']));
		assert($c.sm(divNode, 'hasClass', ls([, 'perm'])));
	});

	await t.step(".setAttr() - Cannot toggle permanent class with ~ via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm');
		divNode.setAttr('class', '+ ~perm');
		assert(divNode.hasClass('perm'));
	});
});

Deno.test("MWIDocNode - Special Attribute: id type checking", async (t) => {
	await t.step("(setAttr) - id accepts string", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'my-id']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), 'my-id');
	});

	await t.step(".setAttr() - id accepts string via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-my-id');
		assertEquals(divNode.getAttr('id'), 'js-my-id');
	});

	await t.step("(setAttr) - id accepts number (normalized to string)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 123]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), '123');
	});

	await t.step(".setAttr() - id accepts number (normalized to string) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 456);
		assertEquals(divNode.getAttr('id'), '456');
	});

	await t.step("(setAttr) - id clears on undefined", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'initial']));
		$c.sm(divNode, 'setAttr', ls([, 'id', , undefined]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), undefined);
	});

	await t.step(".setAttr() - id clears on null via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'initial');
		divNode.setAttr('id', null);
		assertEquals(divNode.getAttr('id'), undefined);
	});

	await t.step("(setAttr) - id clears on false", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'initial']));
		$c.sm(divNode, 'setAttr', ls([, 'id', , false]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), undefined);
	});

	await t.step(".setAttr() - id ignores other types", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'initial');
		divNode.setAttr('id', true); // Should be ignored
		assertEquals(divNode.getAttr('id'), 'initial');
		divNode.setAttr('id', {}); // Should be ignored
		assertEquals(divNode.getAttr('id'), 'initial');
	});
});

Deno.test("MWIDocNode - document.getDocById()", async (t) => {
	await t.step("(getDocById) - Find node by string id", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'test-node-1']));

		const found = $c.sm(doc, 'getDocById', ls([, 'test-node-1']));
		assertStrictEquals(found, divNode);
	});

	await t.step(".getDocById() - Find node by string id via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-test-node-2');

		const found = doc.getDocById('js-test-node-2');
		assertStrictEquals(found, divNode);
	});

	await t.step("(getDocById) - Find node by numeric id", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 12345]));

		const found = $c.sm(doc, 'getDocById', ls([, 12345]));
		assertStrictEquals(found, divNode);
	});

	await t.step(".getDocById() - Find node by numeric id via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 45678);

		const found = doc.getDocById(45678);
		assertStrictEquals(found, divNode);
	});

	await t.step("(getDocById) - Numeric id normalized to string for lookup", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , '78901']));

		// Should find with numeric lookup
		const found = $c.sm(doc, 'getDocById', ls([, 78901]));
		assertStrictEquals(found, divNode);
	});

	await t.step(".getDocById() - Return undefined for non-existent id", () => {
		const found = doc.getDocById('does-not-exist-xyz');
		assertEquals(found, undefined);
	});

	await t.step("(getDocById) - Works with disconnected nodes", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'disconnected-node']));

		// Node is not in any rendering tree
		const found = $c.sm(doc, 'getDocById', ls([, 'disconnected-node']));
		assertStrictEquals(found, divNode);
	});

	await t.step(".getDocById() - Last assignment wins on collision", () => {
		const div1 = doc.createNode('h.div');
		div1.setAttr('id', 'shared-id-test');

		const div2 = doc.createNode('h.div');
		div2.setAttr('id', 'shared-id-test');

		// Should return the last one assigned
		const found = doc.getDocById('shared-id-test');
		assertStrictEquals(found, div2);
	});

	await t.step("(getDocById) - Cleared id removes from index", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'temp-id-test']));

		let found = $c.sm(doc, 'getDocById', ls([, 'temp-id-test']));
		assertStrictEquals(found, divNode);

		// Clear the id
		$c.sm(divNode, 'delAttr', ls([, 'id']));
		found = $c.sm(doc, 'getDocById', ls([, 'temp-id-test']));
		assertEquals(found, undefined);
	});

	await t.step(".getDocById() - Changed id updates index", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'old-id-test');

		let found = doc.getDocById('old-id-test');
		assertStrictEquals(found, divNode);

		// Change the id
		divNode.setAttr('id', 'new-id-test');

		found = doc.getDocById('old-id-test');
		assertEquals(found, undefined, 'Old id should not find node');

		found = doc.getDocById('new-id-test');
		assertStrictEquals(found, divNode, 'New id should find node');
	});
});

Deno.test("MWIDocNode - Special Attribute: style", async (t) => {
	await t.step("(setAttr) - Basic style", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assert(styleStr.includes('color:red'));
	});

	await t.step(".setAttr() - Basic style via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: blue');
		const styleStr = divNode.getAttr('style');
		assert(styleStr.includes('color:blue'));
	});

	await t.step("(setAttr) - Multiple styles", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red; background: blue']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assert(styleStr.includes('color:red'));
		assert(styleStr.includes('background:blue'));
	});

	await t.step(".setAttr() - Multiple styles via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: green; margin: 10px');
		const styleStr = divNode.getAttr('style');
		assert(styleStr.includes('color:green'));
		assert(styleStr.includes('margin:10px'));
	});

	await t.step("(setAttr) - Conditional clear (=)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red']));
		$c.sm(divNode, 'setAttr', ls([, 'style', , '= color: green']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assert(styleStr.includes('color:green'));
		assert(!styleStr.includes('red'));
	});

	await t.step(".setAttr() - Conditional clear (=) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red');
		divNode.setAttr('style', '= color: green');
		const styleStr = divNode.getAttr('style');
		assert(styleStr.includes('color:green'));
		assert(!styleStr.includes('red'));
	});

	await t.step("(setAttr) - Unconditional clear (==)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red; margin: 10px']));
		$c.sm(divNode, 'setAttr', ls([, 'style', , '== color: green']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assert(styleStr.includes('color:green'));
		assert(!styleStr.includes('margin'));
	});

	await t.step(".setAttr() - Unconditional clear (==) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red; margin: 10px');
		divNode.setAttr('style', '== color: green');
		const styleStr = divNode.getAttr('style');
		assert(styleStr.includes('color:green'));
		assert(!styleStr.includes('margin'));
	});

	await t.step("(setAttr) - Unconditional clear with nothing after (==)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red']));
		$c.sm(divNode, 'setAttr', ls([, 'style', , '==']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assertEquals(styleStr, undefined);
	});

	await t.step(".setAttr() - Unconditional clear with nothing after (==) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red');
		divNode.setAttr('style', '==');
		const styleStr = divNode.getAttr('style');
		assertEquals(styleStr, undefined);
	});

	await t.step("(setAttr) - Supplement mode (+)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red']));
		$c.sm(divNode, 'setAttr', ls([, 'style', , '+ margin: 10px']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assert(styleStr.includes('color:red'));
		assert(styleStr.includes('margin:10px'));
	});

	await t.step(".setAttr() - Supplement mode (+) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red');
		divNode.setAttr('style', '+ margin: 10px');
		const styleStr = divNode.getAttr('style');
		assert(styleStr.includes('color:red'));
		assert(styleStr.includes('margin:10px'));
	});

	await t.step("(setAttr) - Remove style (empty value)", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red; margin: 10px']));
		$c.sm(divNode, 'setAttr', ls([, 'style', , '+ color: ;']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assert(!styleStr.includes('color'));
		assert(styleStr.includes('margin:10px'));
	});

	await t.step(".setAttr() - Remove style (empty value) via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red; margin: 10px');
		divNode.setAttr('style', '+ color: ;');
		const styleStr = divNode.getAttr('style');
		assert(!styleStr.includes('color'));
		assert(styleStr.includes('margin:10px'));
	});

	await t.step("(setAttr) - Empty/whitespace clears styles", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red']));
		$c.sm(divNode, 'setAttr', ls([, 'style', , '   ']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assertEquals(styleStr, undefined);
	});

	await t.step(".setAttr() - Empty/whitespace clears styles via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red');
		divNode.setAttr('style', '   ');
		const styleStr = divNode.getAttr('style');
		assertEquals(styleStr, undefined);
	});

	await t.step("(delAttr) - Clear all styles", () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'style', , 'color: red; margin: 10px']));
		$c.sm(divNode, 'delAttr', ls([, 'style']));
		const styleStr = $c.sm(divNode, 'getAttr', ls([, 'style']));
		assertEquals(styleStr, undefined);
	});

	await t.step(".delAttr() - Clear all styles via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('style', 'color: red; margin: 10px');
		divNode.delAttr('style');
		const styleStr = divNode.getAttr('style');
		assertEquals(styleStr, undefined);
	});
});

Deno.test("MWIDocNode - Attribute Slotting: m.slat", async (t) => {
	await t.step("(setAttr) - Default source (empty spec)", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'title', , 'Source Title']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Source Title');
	});

	await t.step(".setAttr() - Default source (empty spec) via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('title', 'JS Source Title');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[])]'));

		assertEquals(divNode.getAttr('title'), 'JS Source Title');
	});

	await t.step("(setAttr) - Explicit source", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'data-source', , 'Source Value']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[data-source])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Source Value');
	});

	await t.step(".setAttr() - Explicit source via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('data-source', 'JS Source Value');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[data-source])]'));

		assertEquals(divNode.getAttr('title'), 'JS Source Value');
	});

	await t.step("(setAttr) - With else fallback", async () => {
		const fragNode = doc.createNode('m.frg');
		// Don't set the source attribute

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[missing else=Default])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');
	});

	await t.step(".setAttr() - With else fallback via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// Don't set the source attribute

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[missing else="JS Default"])]'));

		assertEquals(divNode.getAttr('title'), 'JS Default');
	});

	await t.step("(setAttr) - Multiple slottings", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'src1', , 'Value1']));
		$c.sm(fragNode, 'setAttr', ls([, 'src2', , 'Value2']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[src1] data-info=[src2])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Value1');
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'data-info'])), 'Value2');
	});

	await t.step(".setAttr() - Multiple slottings via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('src1', 'JS Value1');
		fragNode.setAttr('src2', 'JS Value2');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[src1] data-info=[src2])]'));

		assertEquals(divNode.getAttr('title'), 'JS Value1');
		assertEquals(divNode.getAttr('data-info'), 'JS Value2');
	});

	await t.step("(setAttr) - List-valued attribute preservation", async () => {
		const fragNode = doc.createNode('m.frg');
		const listVal = ps('[(item1 item2 item3)]');
		$c.sm(fragNode, 'setAttr', ls([, 'c.items', , listVal]));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(c.data=[c.items])]')]));

		const retrieved = $c.sm(divNode, 'getAttr', ls([, 'c.data']));
		assertEquals(retrieved.at(0), 'item1');
		assertEquals(retrieved.at(1), 'item2');
		assertEquals(retrieved.at(2), 'item3');
	});

	await t.step(".setAttr() - List-valued attribute preservation via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		const listVal = ps('[(alpha beta gamma)]');
		fragNode.setAttr('c.items', listVal);

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(c.data=[c.items])]'));

		const retrieved = divNode.getAttr('c.data');
		assertEquals(retrieved.at(0), 'alpha');
		assertEquals(retrieved.at(1), 'beta');
		assertEquals(retrieved.at(2), 'gamma');
	});

	await t.step("(setAttr) - m.slat attribute is set", async () => {
		const divNode = doc.createNode('h.div');
		const slatVal = ps('[(title=[])]');
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , slatVal]));

		const retrieved = $c.sm(divNode, 'getAttr', ls([, 'm.slat']));
		assert(retrieved !== undefined);
	});

	await t.step(".setAttr() - m.slat attribute is set via JS", async () => {
		const divNode = doc.createNode('h.div');
		const slatVal = ps('[(title=[])]');
		divNode.setAttr('m.slat', slatVal);

		const retrieved = divNode.getAttr('m.slat');
		assert(retrieved !== undefined);
	});

	await t.step("(setAttr) - Triggers slotting immediately", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'title', , 'Slotted']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });

		// Slotting happens immediately when m.slat is set
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[])]')]));

		// Verify slotting occurred immediately
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Slotted');
	});

	await t.step(".setAttr() - Triggers slotting immediately via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('title', 'JS Slotted');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });

		// Slotting happens immediately when m.slat is set
		divNode.setAttr('m.slat', ps('[(title=[])]'));

		// Verify slotting occurred immediately
		assertEquals(divNode.getAttr('title'), 'JS Slotted');
	});

	await t.step("(setAttr) - No slot source uses else default", async () => {
		// Node with NO slotSrc
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[missing else=DefaultValue])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'DefaultValue');
	});

	await t.step(".setAttr() - No slot source uses else default via JS", async () => {
		// Node with NO slotSrc
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[missing else="JS DefaultValue"])]'));

		assertEquals(divNode.getAttr('title'), 'JS DefaultValue');
	});

	await t.step("(setAttr) - No slot source, multiple targets with defaults", async () => {
		// Node with NO slotSrc
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[src1 else=Default1] data-info=[src2 else=Default2])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default1');
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'data-info'])), 'Default2');
	});

	await t.step(".setAttr() - No slot source, multiple targets with defaults via JS", async () => {
		// Node with NO slotSrc
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.slat', ps('[(title=[src1 else="JS Default1"] data-info=[src2 else="JS Default2"])]'));

		assertEquals(divNode.getAttr('title'), 'JS Default1');
		assertEquals(divNode.getAttr('data-info'), 'JS Default2');
	});
});

Deno.test("MWIDocNode - Computed Attributes: m.coat", async (t) => {
	await t.step("(setAttr) - Simple interpolation", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'World']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title="<name>")]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'World');
	});

	await t.step(".setAttr() - Simple interpolation via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="<name>")]'));

		assertEquals(divNode.getAttr('title'), 'JS World');
	});

	await t.step("(setAttr) - Conditional (?)", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Test']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title="<name?Hello >")]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Hello ');
	});

	await t.step(".setAttr() - Conditional (?) via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Test');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="<name?Hello >")]'));

		assertEquals(divNode.getAttr('title'), 'Hello ');
	});

	await t.step("(setAttr) - Conditional (??)", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Test']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title="<name??Hello >")]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Hello ');
	});

	await t.step(".setAttr() - Conditional (??) via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Test');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="<name??Hello >")]'));

		assertEquals(divNode.getAttr('title'), 'Hello ');
	});

	await t.step("(setAttr) - Default (|)", async () => {
		const fragNode = doc.createNode('m.frg');
		// Don't set name

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title="<name|Default>")]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');
	});

	await t.step(".setAttr() - Default (|) via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// Don't set name

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="<name|JS Default>")]'));

		assertEquals(divNode.getAttr('title'), 'JS Default');
	});

	await t.step("(setAttr) - Default (||)", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , ''])); // Empty string

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title="<name||Default>")]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');
	});

	await t.step(".setAttr() - Default (||) via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', ''); // Empty string

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="<name||JS Default>")]'));

		assertEquals(divNode.getAttr('title'), 'JS Default');
	});

	await t.step("(setAttr) - Literal text", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'World']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title="Prefix <name> Suffix")]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Prefix World Suffix');
	});

	await t.step(".setAttr() - Literal text via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="Prefix <name> Suffix")]'));

		assertEquals(divNode.getAttr('title'), 'Prefix JS World Suffix');
	});

	await t.step("(setAttr) - Multiple targets", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Test']));
		$c.sm(fragNode, 'setAttr', ls([, 'cls', , 'my-class']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<name> class=<cls>)]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Test');
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'class'])), 'my-class');
	});

	await t.step(".setAttr() - Multiple targets via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Test');
		fragNode.setAttr('cls', 'js-class');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name> class=<cls>)]'));

		assertEquals(divNode.getAttr('title'), 'JS Test');
		assertEquals(divNode.getAttr('class'), 'js-class');
	});

	await t.step("(setAttr) - Escapes", async () => {
		const fragNode = doc.createNode('m.frg');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<.lt>tag<.gt>)]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), '<tag>');
	});

	await t.step(".setAttr() - Escapes via JS", async () => {
		const fragNode = doc.createNode('m.frg');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<.lt>tag<.gt>)]'));

		assertEquals(divNode.getAttr('title'), '<tag>');
	});

	await t.step("(setAttr) - m.coat attribute is set", async () => {
		const divNode = doc.createNode('h.div');
		const coatVal = ps('[(title=<name>)]');
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , coatVal]));

		const retrieved = $c.sm(divNode, 'getAttr', ls([, 'm.coat']));
		assert(retrieved !== undefined);
	});

	await t.step(".setAttr() - m.coat attribute is set via JS", async () => {
		const divNode = doc.createNode('h.div');
		const coatVal = ps('[(title=<name>)]');
		divNode.setAttr('m.coat', coatVal);

		const retrieved = divNode.getAttr('m.coat');
		assert(retrieved !== undefined);
	});

	await t.step("(setAttr) - Triggers computation immediately", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Computed']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });

		// Computation happens immediately when m.coat is set
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<name>)]')]));

		// Verify computation occurred immediately
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Computed');
	});

	await t.step(".setAttr() - Triggers computation immediately via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Computed');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });

		// Computation happens immediately when m.coat is set
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));

		// Verify computation occurred immediately
		assertEquals(divNode.getAttr('title'), 'JS Computed');
	});
});

Deno.test("MWIDocNode - m.coat Reactivity", async (t) => {
	await t.step("(getAttr) - Updates when slot source attribute changes", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Initial']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<name>)]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Initial');

		// Change the source attribute - m.coat should reactively update
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Updated']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Updated');
	});

	await t.step(".getAttr() - Updates when slot source attribute changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS Initial');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));

		assertEquals(divNode.getAttr('title'), 'JS Initial');

		// Change the source attribute - m.coat should reactively update
		fragNode.setAttr('name', 'JS Updated');
		assertEquals(divNode.getAttr('title'), 'JS Updated');
	});

	await t.step("(getAttr) - Updates when m.coat spec changes", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'World']));
		$c.sm(fragNode, 'setAttr', ls([, 'greeting', , 'Hello']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<name>)]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'World');

		// Change the m.coat spec itself - should re-compute
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<greeting>)]')]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Hello');
	});

	await t.step(".getAttr() - Updates when m.coat spec changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('name', 'JS World');
		fragNode.setAttr('greeting', 'JS Hello');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title=<name>)]'));

		assertEquals(divNode.getAttr('title'), 'JS World');

		// Change the m.coat spec itself - should re-compute
		divNode.setAttr('m.coat', ps('[(title=<greeting>)]'));
		assertEquals(divNode.getAttr('title'), 'JS Hello');
	});

	await t.step("(getAttr) - Conditional expression updates reactively", async () => {
		const fragNode = doc.createNode('m.frg');
		// Start with name unset

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(title=<name|Default>)]')]));

		// Initially unset - should use default
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');

		// Set the source attribute - should now use the value
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Set Value']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Set Value');

		// Clear the source attribute - should revert to default
		$c.sm(fragNode, 'delAttr', ls([, 'name']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');
	});

	await t.step(".getAttr() - Conditional expression updates reactively via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// Start with name unset

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.coat', ps('[(title="<name|JS Default>")]'));

		// Initially unset - should use default
		assertEquals(divNode.getAttr('title'), 'JS Default');

		// Set the source attribute - should now use the value
		fragNode.setAttr('name', 'JS Set Value');
		assertEquals(divNode.getAttr('title'), 'JS Set Value');

		// Clear the source attribute - should revert to default
		fragNode.delAttr('name');
		assertEquals(divNode.getAttr('title'), 'JS Default');
	});
});

Deno.test("MWIDocNode - m.slat Reactivity", async (t) => {
	await t.step("(getAttr) - Updates when slot source attribute changes", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'title', , 'Initial']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Initial');

		// Change the source attribute - m.slat should reactively update
		$c.sm(fragNode, 'setAttr', ls([, 'title', , 'Updated']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Updated');
	});

	await t.step(".getAttr() - Updates when slot source attribute changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('title', 'JS Initial');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[])]'));

		assertEquals(divNode.getAttr('title'), 'JS Initial');

		// Change the source attribute - m.slat should reactively update
		fragNode.setAttr('title', 'JS Updated');
		assertEquals(divNode.getAttr('title'), 'JS Updated');
	});

	await t.step("(getAttr) - Updates when m.slat spec changes", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'src1', , 'Value1']));
		$c.sm(fragNode, 'setAttr', ls([, 'src2', , 'Value2']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[src1])]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Value1');

		// Change the m.slat spec to use a different source
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[src2])]')]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Value2');
	});

	await t.step(".getAttr() - Updates when m.slat spec changes via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('src1', 'JS Value1');
		fragNode.setAttr('src2', 'JS Value2');

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[src1])]'));

		assertEquals(divNode.getAttr('title'), 'JS Value1');

		// Change the m.slat spec to use a different source
		divNode.setAttr('m.slat', ps('[(title=[src2])]'));
		assertEquals(divNode.getAttr('title'), 'JS Value2');
	});

	await t.step("(getAttr) - Else fallback updates reactively", async () => {
		const fragNode = doc.createNode('m.frg');
		// Start with source attribute unset

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[missing else=Default])]')]));

		// Initially unset - should use else default
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');

		// Set the source attribute - should now use the value
		$c.sm(fragNode, 'setAttr', ls([, 'missing', , 'Found']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Found');

		// Clear the source attribute - should revert to else default
		$c.sm(fragNode, 'delAttr', ls([, 'missing']));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Default');
	});

	await t.step(".getAttr() - Else fallback updates reactively via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		// Start with source attribute unset

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[missing else="JS Default"])]'));

		// Initially unset - should use else default
		assertEquals(divNode.getAttr('title'), 'JS Default');

		// Set the source attribute - should now use the value
		fragNode.setAttr('missing', 'JS Found');
		assertEquals(divNode.getAttr('title'), 'JS Found');

		// Clear the source attribute - should revert to else default
		fragNode.delAttr('missing');
		assertEquals(divNode.getAttr('title'), 'JS Default');
	});
});

Deno.test("MWIDocNode - Combined m.slat and m.coat", async (t) => {
	await t.step("(setAttr) - Both processed immediately", async () => {
		const fragNode = doc.createNode('m.frg');
		$c.sm(fragNode, 'setAttr', ls([, 'src-title', , 'Slotted']));
		$c.sm(fragNode, 'setAttr', ls([, 'name', , 'Computed']));
		const listVal = ps('[(a b c)]');
		$c.sm(fragNode, 'setAttr', ls([, 'c.items', , listVal]));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		$c.sm(divNode, 'setAttr', ls([, 'm.slat', , ps('[(title=[src-title] c.data=[c.items])]')]));
		$c.sm(divNode, 'setAttr', ls([, 'm.coat', , ps('[(data-name=<name>)]')]));

		assertEquals($c.sm(divNode, 'getAttr', ls([, 'title'])), 'Slotted');
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'data-name'])), 'Computed');
		const retrieved = $c.sm(divNode, 'getAttr', ls([, 'c.data']));
		assertEquals(retrieved.at(0), 'a');
	});

	await t.step(".setAttr() - Both processed immediately via JS", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode.setAttr('src-title', 'JS Slotted');
		fragNode.setAttr('name', 'JS Computed');
		const listVal = ps('[(x y z)]');
		fragNode.setAttr('c.items', listVal);

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode.setAttr('m.slat', ps('[(title=[src-title] c.data=[c.items])]'));
		divNode.setAttr('m.coat', ps('[(data-name=<name>)]'));

		assertEquals(divNode.getAttr('title'), 'JS Slotted');
		assertEquals(divNode.getAttr('data-name'), 'JS Computed');
		const retrieved = divNode.getAttr('c.data');
		assertEquals(retrieved.at(0), 'x');
	});
});

Deno.test("MWIDocNode - Spec Management", async (t) => {
	await t.step("(getSpec) - No attributes", async () => {
		const divNode = doc.createNode('h.div');
		const spec = $c.sm(divNode, 'getSpec');
		assertEquals(spec.at(0), 'h.div');
		const slidStr = spec.toSLID();
		assert(slidStr.includes('h.div'));
	});

	await t.step(".getSpec() - No attributes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const spec = divNode.getSpec();
		assertEquals(spec.at(0), 'h.div');
	});

	await t.step("(getSpec) - With basic attributes", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'setAttr', ls([, 'id', , 'test-id']));
		$c.sm(divNode, 'setAttr', ls([, 'class', , 'test-class']));
		const spec = $c.sm(divNode, 'getSpec');
		assertEquals(spec.at(0), 'h.div');
		assertEquals(spec.at('id'), 'test-id');
		assert(spec.at('class').includes('test-class'));
	});

	await t.step(".getSpec() - With basic attributes via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-test-id');
		divNode.setAttr('class', 'js-test-class');
		const spec = divNode.getSpec();
		assertEquals(spec.at(0), 'h.div');
		assertEquals(spec.at('id'), 'js-test-id');
		assert(spec.at('class').includes('js-test-class'));
	});

	await t.step("(getSpec) - With list-valued attributes", async () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(item1 item2)]');
		$c.sm(divNode, 'setAttr', ls([, 'c.items', , listVal]));
		const spec = $c.sm(divNode, 'getSpec');
		const retrieved = spec.at('c.items');
		assertEquals(retrieved.at(0), 'item1');
		assertEquals(retrieved.at(1), 'item2');
	});

	await t.step(".getSpec() - With list-valued attributes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(alpha beta)]');
		divNode.setAttr('c.items', listVal);
		const spec = divNode.getSpec();
		const retrieved = spec.at('c.items');
		assertEquals(retrieved.at(0), 'alpha');
		assertEquals(retrieved.at(1), 'beta');
	});

	await t.step("(getSpec) - With children", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Child text']));
		$c.sm(divNode, 'append', ls([, textNode]));
		const spec = $c.sm(divNode, 'getSpec');
		assertEquals(spec.size, 2);
		assertEquals(spec.at(0), 'h.div');
		assertEquals(spec.at(1), 'Child text'); // Simplified text spec
	});

	await t.step(".getSpec() - With children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child text');
		divNode.append(textNode);
		const spec = divNode.getSpec();
		assertEquals(spec.size, 2);
		assertEquals(spec.at(0), 'h.div');
		assertEquals(spec.at(1), 'JS Child text'); // Simplified text spec
	});

	await t.step("(getSubSpec) - No children", async () => {
		const divNode = doc.createNode('h.div');
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - No children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(getAttr m.rns) - With appended children", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Child']));
		$c.sm(divNode, 'append', ls([, textNode]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'Child'); // Simplified text spec
	});

	await t.step(".getAttr('m.rns') - With appended children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child');
		divNode.append(textNode);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at(0), 'JS Child'); // Simplified text spec
	});

	await t.step("(getSubSpec) - Void node always empty", async () => {
		const brNode = doc.createNode('h.br');
		const subSpec = $c.sm(brNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - Void node always empty via JS", async () => {
		const brNode = doc.createNode('h.br');
		const subSpec = brNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(setSpec) - Set basic attributes", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div id=spec-id class=spec-class)]');
		await $c.sm(divNode, 'setSpec', ls([, spec]));
		assertEquals($c.sm(divNode, 'getAttr', ls([, 'id'])), 'spec-id');
		assert($c.sm(divNode, 'getAttr', ls([, 'class'])).includes('spec-class'));
	});

	await t.step(".setSpec() - Set basic attributes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div id=js-spec-id class=js-spec-class)]');
		divNode.setSpec(spec);
		assertEquals(divNode.getAttr('id'), 'js-spec-id');
		assert(divNode.getAttr('class').includes('js-spec-class'));
	});

	await t.step("(setSpec) - Set list-valued attributes", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div c.items=[a b c])]');
		await $c.sm(divNode, 'setSpec', ls([, spec]));
		const retrieved = $c.sm(divNode, 'getAttr', ls([, 'c.items']));
		assertEquals(retrieved.at(0), 'a');
		assertEquals(retrieved.at(1), 'b');
		assertEquals(retrieved.at(2), 'c');
	});

	await t.step(".setSpec() - Set list-valued attributes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div c.items=[x y z])]');
		divNode.setSpec(spec);
		const retrieved = divNode.getAttr('c.items');
		assertEquals(retrieved.at(0), 'x');
		assertEquals(retrieved.at(1), 'y');
		assertEquals(retrieved.at(2), 'z');
	});

	await t.step("(setSpec) - Set children", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div [m.t t="Child 1"] [m.t t="Child 2"])]');
		await $c.sm(divNode, 'setSpec', ls([, spec]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'Child 1');
		assertEquals(subSpec.at(1), 'Child 2');
	});

	await t.step(".setSpec() - Set children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div [m.t t="JS Child 1"] [m.t t="JS Child 2"])]');
		divNode.setSpec(spec);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS Child 1');
		assertEquals(subSpec.at(1), 'JS Child 2');
	});

	await t.step("(setSubSpec) - With NANOS list", () => {
		const divNode = doc.createNode('h.div');
		const subList = ps('[([m.t t="Sub 1"] [m.t t="Sub 2"])]');
		$c.sm(divNode, 'setSubSpec', ls(['subSpec', subList]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'Sub 1');
		assertEquals(subSpec.at(1), 'Sub 2');
	});

	await t.step(".setSubSpec() - With NANOS list via JS", () => {
		const divNode = doc.createNode('h.div');
		const subList = ps('[([m.t t="JS Sub 1"] [m.t t="JS Sub 2"])]');
		divNode.setSubSpec({ subSpec: subList });
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS Sub 1');
		assertEquals(subSpec.at(1), 'JS Sub 2');
	});

	await t.step("(setSubSpec) - With spec parameter", () => {
		const divNode = doc.createNode('h.div');
		const fullSpec = ps('[(h.div [m.t t="Spec Child"])]');
		$c.sm(divNode, 'setSubSpec', ls(['spec', fullSpec]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 1);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'Spec Child');
	});

	await t.step(".setSubSpec() - With spec parameter via JS", () => {
		const divNode = doc.createNode('h.div');
		const fullSpec = ps('[(h.div [m.t t="JS Spec Child"])]');
		divNode.setSubSpec({ spec: fullSpec });
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS Spec Child');
	});

	await t.step("(setSubSpec) - With multiple positional parameters", () => {
		const divNode = doc.createNode('h.div');
		const spec1 = ps('[(m.t t="Pos 1")]');
		const spec2 = ps('[(m.t t="Pos 2")]');
		$c.sm(divNode, 'setSubSpec', ls([, spec1, , spec2]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'Pos 1');
		assertEquals(subSpec.at(1), 'Pos 2');
	});

	await t.step(".setSubSpec() - With multiple positional parameters via JS", () => {
		const divNode = doc.createNode('h.div');
		const spec1 = ps('[(m.t t="JS Pos 1")]');
		const spec2 = ps('[(m.t t="JS Pos 2")]');
		divNode.setSubSpec(spec1, spec2);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS Pos 1');
		assertEquals(subSpec.at(1), 'JS Pos 2');
	});

	await t.step("(setSubSpec) - Void node ignores children", () => {
		const brNode = doc.createNode('h.br');
		const subList = ps('[([m.t t="Should not appear"])]');
		$c.sm(brNode, 'setSubSpec', ls(['subSpec', subList]));
		const subSpec = $c.sm(brNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".setSubSpec() - Void node ignores children via JS", () => {
		const brNode = doc.createNode('h.br');
		const subList = ps('[([m.t t="Should not appear"])]');
		brNode.setSubSpec({ subSpec: subList });
		const subSpec = brNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});
});

Deno.test("MWIDocNode - closest", async (t) => {
	// Build a small tree: grandparent (h.section) > parent (h.div) > child (m.t)
	const grandparent = doc.createNode('h.section');
	const parent = doc.createNode('h.div');
	const child = doc.createNode('m.t');
	child.setAttr('t', 'leaf');
	grandparent.append(parent);
	parent.append(child);

	await t.step("(closest) - String predicate: finds self when type matches", () => {
		const result = $c.sm(child, 'closest', ls([, 'm.t']));
		assertStrictEquals(result, child);
	});

	await t.step(".closest() - String predicate: finds self when type matches via JS", () => {
		const result = child.closest('m.t');
		assertStrictEquals(result, child);
	});

	await t.step("(closest) - String predicate: finds ancestor by type", () => {
		const result = $c.sm(child, 'closest', ls([, 'h.div']));
		assertStrictEquals(result, parent);
	});

	await t.step(".closest() - String predicate: finds ancestor by type via JS", () => {
		const result = child.closest('h.div');
		assertStrictEquals(result, parent);
	});

	await t.step("(closest) - String predicate: finds distant ancestor by type", () => {
		const result = $c.sm(child, 'closest', ls([, 'h.section']));
		assertStrictEquals(result, grandparent);
	});

	await t.step(".closest() - String predicate: finds distant ancestor by type via JS", () => {
		const result = child.closest('h.section');
		assertStrictEquals(result, grandparent);
	});

	await t.step("(closest) - String predicate: comma-separated types (first match wins)", () => {
		// Both h.div and h.section are ancestors; h.div is closer
		const result = $c.sm(child, 'closest', ls([, 'h.div,h.section']));
		assertStrictEquals(result, parent);
	});

	await t.step(".closest() - String predicate: comma-separated types (first match wins) via JS", () => {
		const result = child.closest('h.div,h.section');
		assertStrictEquals(result, parent);
	});

	await t.step("(closest) - String predicate: returns null when no match", () => {
		const result = $c.sm(child, 'closest', ls([, 'h.span']));
		assertEquals(result, null);
	});

	await t.step(".closest() - String predicate: returns null when no match via JS", () => {
		const result = child.closest('h.span');
		assertEquals(result, null);
	});

	await t.step("(closest) - String predicate: empty string returns null", () => {
		const result = $c.sm(child, 'closest', ls([, '']));
		assertEquals(result, null);
	});

	await t.step(".closest() - String predicate: empty string returns null via JS", () => {
		const result = child.closest('');
		assertEquals(result, null);
	});

	await t.step("(closest) - JS function predicate: finds self", () => {
		const result = $c.sm(child, 'closest', ls([, (node) => node === child]));
		assertStrictEquals(result, child);
	});

	await t.step(".closest() - JS function predicate: finds self via JS", () => {
		const result = child.closest((node) => node === child);
		assertStrictEquals(result, child);
	});

	await t.step("(closest) - JS function predicate: finds ancestor", () => {
		const result = $c.sm(child, 'closest', ls([, (node) => node.type === 'h.div']));
		assertStrictEquals(result, parent);
	});

	await t.step(".closest() - JS function predicate: finds ancestor via JS", () => {
		const result = child.closest((node) => node.type === 'h.section');
		assertStrictEquals(result, grandparent);
	});

	await t.step("(closest) - JS function predicate: returns null when no match", () => {
		const result = $c.sm(child, 'closest', ls([, (_node) => false]));
		assertEquals(result, null);
	});

	await t.step(".closest() - JS function predicate: returns null when no match via JS", () => {
		const result = child.closest((_node) => false);
		assertEquals(result, null);
	});

	await t.step("(closest) - Mesgjs @function predicate: finds ancestor", () => {
		// Construct a Mesgjs @function that checks if the node type is 'h.div'
		const msjsFn = makeMsjsFunction((d) => d.mp.at(0).type === 'h.div');
		const result = $c.sm(child, 'closest', ls([, msjsFn]));
		assertStrictEquals(result, parent);
	});

	await t.step(".closest() - Mesgjs @function predicate: finds ancestor via JS", () => {
		const msjsFn = makeMsjsFunction((d) => d.mp.at(0).type === 'h.section');
		const result = child.closest(msjsFn);
		assertStrictEquals(result, grandparent);
	});

	await t.step("(closest) - Non-function/non-string predicate returns null", () => {
		const result = $c.sm(child, 'closest', ls([, 42]));
		assertEquals(result, null);
	});

	await t.step(".closest() - Non-function/non-string predicate returns null via JS", () => {
		const result = child.closest(42);
		assertEquals(result, null);
	});

	await t.step("(closest) - Unparented node: only finds self", () => {
		const orphan = doc.createNode('h.div');
		const result = $c.sm(orphan, 'closest', ls([, 'h.div']));
		assertStrictEquals(result, orphan);
	});

	await t.step(".closest() - Unparented node: returns null for non-matching type via JS", () => {
		const orphan = doc.createNode('h.div');
		const result = orphan.closest('h.span');
		assertEquals(result, null);
	});
});

Deno.test("MWIDocNode - Content Operations", async (t) => {
	await t.step("(append) - Text string auto-converts to m.t", async () => {
		const divNode = doc.createNode('h.div');
		$c.sm(divNode, 'append', ls([, 'Plain text']));
		const subDoc = $c.sm(divNode, 'getSubDoc');
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals($c.sm(textNode, 'type'), 'm.t');
		assertEquals($c.sm(textNode, 'getAttr', ['t']), 'Plain text');
	});

	await t.step(".append() - Text string auto-converts to m.t via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('JS plain text');
		const subDoc = divNode.getSubDoc();
		assertEquals(subDoc.size, 1);
		const textNode = subDoc.at(0);
		assertEquals(textNode.type, 'm.t');
		assertEquals(textNode.getAttr('t'), 'JS plain text');
	});

	await t.step("(append) - Doc-node", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Appended node']));
		$c.sm(divNode, 'append', ls([, textNode]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 1);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'Appended node');
	});

	await t.step(".append() - Doc-node via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS appended node');
		divNode.append(textNode);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS appended node');
	});

	await t.step("(append) - Multiple items at once", async () => {
		const divNode = doc.createNode('h.div');
		const text1 = doc.createNode('m.t');
		$c.sm(text1, 'setAttr', ls([, 't', , 'First']));
		const text2 = doc.createNode('m.t');
		$c.sm(text2, 'setAttr', ls([, 't', , 'Second']));
		$c.sm(divNode, 'append', ls([, text1, , text2]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'First');
		assertEquals(subSpec.at(1), 'Second');
	});

	await t.step(".append() - Multiple items at once via JS", async () => {
		const divNode = doc.createNode('h.div');
		const text1 = doc.createNode('m.t');
		text1.setAttr('t', 'JS First');
		const text2 = doc.createNode('m.t');
		text2.setAttr('t', 'JS Second');
		divNode.append(text1, text2);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS First');
		assertEquals(subSpec.at(1), 'JS Second');
	});

	await t.step("(append) - Mixed text and nodes", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		$c.sm(textNode, 'setAttr', ls([, 't', , 'Node text']));
		$c.sm(divNode, 'append', ls([, 'String text', , textNode]));
		const subSpec = $c.sm(divNode, 'getSubSpec');
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'String text');
		assertEquals(subSpec.at(1), 'Node text');
	});

	await t.step(".append() - Mixed text and nodes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Node text');
		divNode.append('JS String text', textNode);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		// Text node getSpec is simplified to just the string
		assertEquals(subSpec.at(0), 'JS String text');
		assertEquals(subSpec.at(1), 'JS Node text');
	});

	await t.step("(append) - Returns node for chaining", async () => {
		const divNode = doc.createNode('h.div');
		const result = $c.sm(divNode, 'append', ls([, 'text']));
		assertStrictEquals(result, divNode);
	});

	await t.step(".append() - Returns node for chaining via JS", async () => {
		const divNode = doc.createNode('h.div');
		const result = divNode.append('text');
		assertStrictEquals(result, divNode);
	});

	await t.step("(append) - Void node is no-op", async () => {
		const brNode = doc.createNode('h.br');
		$c.sm(brNode, 'append', ls([, 'text']));
		const subSpec = $c.sm(brNode, 'getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Void node is no-op via JS", async () => {
		const brNode = doc.createNode('h.br');
		brNode.append('text');
		const subSpec = brNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});
});
