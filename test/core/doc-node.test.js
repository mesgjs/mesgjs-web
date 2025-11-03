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

Deno.test("MWIDocNode - Basic Interface Tests", async (t) => {
	const divNode = doc.createNode('h.div');

	await t.step("(type) - Get node type", () => {
		assertEquals(divNode('type'), 'h.div');
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
		const docRef = divNode('document');
		assertStrictEquals(docRef, doc);
	});

	await t.step(".document - Get document reference via JS", () => {
		assertStrictEquals(divNode.document, doc);
	});
});

Deno.test("MWIDocNode - Attribute Operations", async (t) => {
	await t.step("(setAttr) - Set string attribute", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'data-test', , 'value123']));
		assertEquals(divNode('getAttr', ls([, 'data-test'])), 'value123');
	});

	await t.step(".setAttr() - Set string attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('data-id', 'div-001');
		assertEquals(divNode.getAttr('data-id'), 'div-001');
	});

	await t.step("(setAttr) - Set boolean attribute", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'disabled', , true]));
		assertEquals(divNode('getAttr', ls([, 'disabled'])), true);
	});

	await t.step(".setAttr() - Set boolean attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('hidden', true);
		assertEquals(divNode.getAttr('hidden'), true);
	});

	await t.step("(setAttr) - Set list-valued attribute", () => {
		const divNode = doc.createNode('h.div');
		const listVal = ps('[(item1 item2 item3)]');
		divNode('setAttr', ls([, 'c.items', , listVal]));
		const retrieved = divNode('getAttr', ls([, 'c.items']));
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
		const result = divNode('setAttr', ls([, 'title', , 'Test']));
		assertStrictEquals(result, divNode);
	});

	await t.step(".setAttr() - Chaining returns node via JS", () => {
		const divNode = doc.createNode('h.div');
		const result = divNode.setAttr('title', 'Test');
		assertStrictEquals(result, divNode);
	});

	await t.step("(getAttr) - Get existing attribute", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'title', , 'My Title']));
		assertEquals(divNode('getAttr', ls([, 'title'])), 'My Title');
	});

	await t.step(".getAttr() - Get existing attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('aria-label', 'Test Label');
		assertEquals(divNode.getAttr('aria-label'), 'Test Label');
	});

	await t.step("(getAttr) - Get non-existent attribute", () => {
		const divNode = doc.createNode('h.div');
		assertEquals(divNode('getAttr', ls([, 'nonexistent'])), undefined);
	});

	await t.step(".getAttr() - Get non-existent attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		assertEquals(divNode.getAttr('missing'), undefined);
	});

	await t.step("(hasAttr) - Check existing attribute", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'test-attr', , 'exists']));
		assertEquals(divNode('hasAttr', ls([, 'test-attr'])), true);
	});

	await t.step(".hasAttr() - Check existing attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('another-attr', 'value');
		assertEquals(divNode.hasAttr('another-attr'), true);
	});

	await t.step("(hasAttr) - Check non-existent attribute", () => {
		const divNode = doc.createNode('h.div');
		assertEquals(divNode('hasAttr', ls([, 'nonexistent'])), false);
	});

	await t.step(".hasAttr() - Check non-existent attribute via JS", () => {
		const divNode = doc.createNode('h.div');
		assertEquals(divNode.hasAttr('missing-attr'), false);
	});

	await t.step("(delAttr) - Delete existing attribute", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'temp-attr', , 'temporary']));
		assertEquals(divNode('hasAttr', ls([, 'temp-attr'])), true);
		divNode('delAttr', ls([, 'temp-attr']));
		assertEquals(divNode('hasAttr', ls([, 'temp-attr'])), false);
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
		divNode('setAttr', ls([, 'c.list', , listVal]));
		assertEquals(divNode('hasAttr', ls([, 'c.list'])), true);
		divNode('delAttr', ls([, 'c.list']));
		assertEquals(divNode('hasAttr', ls([, 'c.list'])), false);
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
		assertEquals(divNode('getAttr', ls([, 'id'])), undefined);
		const id1 = divNode('getAttr', ls([, 'm.id']));
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
		divNode('setAttr', ls([, 'id', , 'my-explicit-id']));
		assertEquals(divNode('getAttr', ls([, 'm.id'])), 'my-explicit-id');
	});

	await t.step(".getAttr() - Return explicit ID when set via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('id', 'js-explicit-id');
		assertEquals(divNode.getAttr('m.id'), 'js-explicit-id');
	});

	await t.step("(getAttr) - Auto-generated IDs are unique", () => {
		const div1 = doc.createNode('h.div');
		const div2 = doc.createNode('h.div');
		const id1 = div1('getAttr', ls([, 'm.id']));
		const id2 = div2('getAttr', ls([, 'm.id']));
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
		const id1 = divNode('getAttr', ls([, 'm.id']));
		const id2 = divNode('getAttr', ls([, 'm.id']));
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
		assertEquals(divNode('getAttr', ls([, 'id'])), undefined);
		const mid = divNode('getAttr', ls([, 'm.id']));
		const id = divNode('getAttr', ls([, 'id']));
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
});

Deno.test("MWIDocNode - Special Attribute: class", async (t) => {
	await t.step("(setAttr) - Basic class setting", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'class', , 'test-class']));
		assertEquals(divNode('getAttr', ls([, 'class'])), 'test-class');
	});

	await t.step(".setAttr() - Basic class setting via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-class');
		assertEquals(divNode.getAttr('class'), 'js-class');
	});

	await t.step("(setAttr) - Multiple classes", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'class', , 'class1 class2 class3']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'old-class']));
		divNode('setAttr', ls([, 'class', , '= new-class']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'old-class']));
		divNode('setAttr', ls([, 'class', , '== new-class']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'old-class']));
		divNode('setAttr', ls([, 'class', , '==']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'existing']));
		divNode('setAttr', ls([, 'class', , '+ additional']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'keep remove']));
		divNode('setAttr', ls([, 'class', , '+ !remove']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'existing']));
		divNode('setAttr', ls([, 'class', , '+ ~toggle']));
		assert(divNode('hasClass', ls([, 'toggle'])));
		divNode('setAttr', ls([, 'class', , '+ ~toggle']));
		assert(!divNode('hasClass', ls([, 'toggle'])));
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
		divNode('setAttr', ls([, 'class', , 'some-class']));
		divNode('setAttr', ls([, 'class', , '   ']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'class', , 'test-class']));
		assertEquals(divNode('hasClass', ls([, 'test-class'])), true);
	});

	await t.step(".hasClass() - Check existing class via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-class');
		assertEquals(divNode.hasClass('js-class'), true);
	});

	await t.step("(hasClass) - Check non-existent class", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'class', , 'test-class']));
		assertEquals(divNode('hasClass', ls([, 'missing-class'])), false);
	});

	await t.step(".hasClass() - Check non-existent class via JS", () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('class', 'js-class');
		assertEquals(divNode.hasClass('not-there'), false);
	});

	await t.step("(hasClass) - After modifications", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'class', , 'class1 class2']));
		assertEquals(divNode('hasClass', ls([, 'class1'])), true);
		divNode('setAttr', ls([, 'class', , '+ !class1']));
		assertEquals(divNode('hasClass', ls([, 'class1'])), false);
		assertEquals(divNode('hasClass', ls([, 'class2'])), true);
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
		divNode('setAttr', ls([, 'm.percl', , 'perm1 perm2']));
		const classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'm.percl', , 'permanent']));
		divNode('setAttr', ls([, 'class', , 'temporary']));
		let classStr = divNode('getAttr', ls([, 'class']));
		assert(classStr.includes('permanent'));
		assert(classStr.includes('temporary'));
		divNode('setAttr', ls([, 'class', , '==']));
		classStr = divNode('getAttr', ls([, 'class']));
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
		divNode('setAttr', ls([, 'm.percl', , 'perm']));
		assert(divNode('hasClass', ls([, 'perm'])));
		divNode('delAttr', ls([, 'm.percl']));
		divNode('setAttr', ls([, 'class', , '!perm']));
		assert(!divNode('hasClass', ls([, 'perm'])));
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
		divNode('setAttr', ls([, 'm.percl', , 'perm']));
		divNode('setAttr', ls([, 'class', , 'temp']));
		divNode('setAttr', ls([, 'class', , '==']));
		assert(divNode('hasClass', ls([, 'perm'])));
		assert(!divNode('hasClass', ls([, 'temp'])));
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
		divNode('setAttr', ls([, 'm.percl', , 'perm']));
		divNode('setAttr', ls([, 'class', , '+ !perm']));
		assert(divNode('hasClass', ls([, 'perm'])));
	});

	await t.step(".setAttr() - Cannot remove permanent class with ! via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm');
		divNode.setAttr('class', '+ !perm');
		assert(divNode.hasClass('perm'));
	});

	await t.step("(setAttr) - Cannot toggle permanent class with ~", async () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'm.percl', , 'perm']));
		divNode('setAttr', ls([, 'class', , '+ ~perm']));
		assert(divNode('hasClass', ls([, 'perm'])));
	});

	await t.step(".setAttr() - Cannot toggle permanent class with ~ via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.setAttr('m.percl', 'perm');
		divNode.setAttr('class', '+ ~perm');
		assert(divNode.hasClass('perm'));
	});
});

Deno.test("MWIDocNode - Special Attribute: style", async (t) => {
	await t.step("(setAttr) - Basic style", () => {
		const divNode = doc.createNode('h.div');
		divNode('setAttr', ls([, 'style', , 'color: red']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red; background: blue']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red']));
		divNode('setAttr', ls([, 'style', , '= color: green']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red; margin: 10px']));
		divNode('setAttr', ls([, 'style', , '== color: green']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red']));
		divNode('setAttr', ls([, 'style', , '==']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red']));
		divNode('setAttr', ls([, 'style', , '+ margin: 10px']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red; margin: 10px']));
		divNode('setAttr', ls([, 'style', , '+ color: ;']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red']));
		divNode('setAttr', ls([, 'style', , '   ']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		divNode('setAttr', ls([, 'style', , 'color: red; margin: 10px']));
		divNode('delAttr', ls([, 'style']));
		const styleStr = divNode('getAttr', ls([, 'style']));
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
		fragNode('setAttr', ls([, 'title', , 'Source Title']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[])]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Source Title');
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
		fragNode('setAttr', ls([, 'data-source', , 'Source Value']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[data-source])]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Source Value');
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
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[missing else=Default])]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Default');
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
		fragNode('setAttr', ls([, 'src1', , 'Value1']));
		fragNode('setAttr', ls([, 'src2', , 'Value2']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[src1] data-info=[src2])]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Value1');
		assertEquals(divNode('getAttr', ls([, 'data-info'])), 'Value2');
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
		fragNode('setAttr', ls([, 'c.items', , listVal]));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.slat', , ps('[(c.data=[c.items])]')]));

		const retrieved = divNode('getAttr', ls([, 'c.data']));
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
		divNode('setAttr', ls([, 'm.slat', , slatVal]));

		const retrieved = divNode('getAttr', ls([, 'm.slat']));
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
		fragNode('setAttr', ls([, 'title', , 'Slotted']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });

		// Slotting happens immediately when m.slat is set
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[])]')]));

		// Verify slotting occurred immediately
		assertEquals(divNode('getAttr', ls([, 'title'])), 'Slotted');
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
});

Deno.test("MWIDocNode - Computed Attributes: m.coat", async (t) => {
	await t.step("(setAttr) - Simple interpolation", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode('setAttr', ls([, 'name', , 'World']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.coat', , ps('[(title="<name>")]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'World');
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
		fragNode('setAttr', ls([, 'name', , 'Test']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.coat', , ps('[(title="<name?Hello >")]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Hello ');
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
		fragNode('setAttr', ls([, 'name', , 'Test']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.coat', , ps('[(title="<name??Hello >")]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Hello ');
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
		divNode('setAttr', ls([, 'm.coat', , ps('[(title="<name|Default>")]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Default');
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
		fragNode('setAttr', ls([, 'name', , ''])); // Empty string

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.coat', , ps('[(title="<name||Default>")]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Default');
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
		fragNode('setAttr', ls([, 'name', , 'World']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.coat', , ps('[(title="Prefix <name> Suffix")]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Prefix World Suffix');
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
		fragNode('setAttr', ls([, 'name', , 'Test']));
		fragNode('setAttr', ls([, 'cls', , 'my-class']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.coat', , ps('[(title=<name> class=<cls>)]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Test');
		assertEquals(divNode('getAttr', ls([, 'class'])), 'my-class');
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
		divNode('setAttr', ls([, 'm.coat', , ps('[(title=<.lt>tag<.gt>)]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), '<tag>');
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
		divNode('setAttr', ls([, 'm.coat', , coatVal]));

		const retrieved = divNode('getAttr', ls([, 'm.coat']));
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
		fragNode('setAttr', ls([, 'name', , 'Computed']));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });

		// Computation happens immediately when m.coat is set
		divNode('setAttr', ls([, 'm.coat', , ps('[(title=<name>)]')]));

		// Verify computation occurred immediately
		assertEquals(divNode('getAttr', ls([, 'title'])), 'Computed');
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

Deno.test("MWIDocNode - Combined m.slat and m.coat", async (t) => {
	await t.step("(setAttr) - Both processed immediately", async () => {
		const fragNode = doc.createNode('m.frg');
		fragNode('setAttr', ls([, 'src-title', , 'Slotted']));
		fragNode('setAttr', ls([, 'name', , 'Computed']));
		const listVal = ps('[(a b c)]');
		fragNode('setAttr', ls([, 'c.items', , listVal]));

		const divNode = doc.createNode('h.div', { slotSrc: fragNode });
		divNode('setAttr', ls([, 'm.slat', , ps('[(title=[src-title] c.data=[c.items])]')]));
		divNode('setAttr', ls([, 'm.coat', , ps('[(data-name=<name>)]')]));

		assertEquals(divNode('getAttr', ls([, 'title'])), 'Slotted');
		assertEquals(divNode('getAttr', ls([, 'data-name'])), 'Computed');
		const retrieved = divNode('getAttr', ls([, 'c.data']));
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
		const spec = divNode('getSpec');
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
		divNode('setAttr', ls([, 'id', , 'test-id']));
		divNode('setAttr', ls([, 'class', , 'test-class']));
		const spec = divNode('getSpec');
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
		divNode('setAttr', ls([, 'c.items', , listVal]));
		const spec = divNode('getSpec');
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
		textNode('setAttr', ls([, 't', , 'Child text']));
		divNode('append', ls([, textNode]));
		const spec = divNode('getSpec');
		assertEquals(spec.at(0), 'h.div');
		assertEquals(spec.at([1, 0]), 'm.t');
	});

	await t.step(".getSpec() - With children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child text');
		divNode.append(textNode);
		const spec = divNode.getSpec();
		assertEquals(spec.at(0), 'h.div');
		assertEquals(spec.at([1, 0]), 'm.t');
	});

	await t.step("(getSubSpec) - No children", async () => {
		const divNode = doc.createNode('h.div');
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".getSubSpec() - No children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});

	await t.step("(getSubSpec) - With children", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Child']));
		divNode('append', ls([, textNode]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
	});

	await t.step(".getSubSpec() - With children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Child');
		divNode.append(textNode);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
	});

	await t.step("(getSubSpec) - Void node always empty", async () => {
		const brNode = doc.createNode('h.br');
		const subSpec = brNode('getSubSpec');
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
		await divNode('setSpec', ls([, spec]));
		assertEquals(divNode('getAttr', ls([, 'id'])), 'spec-id');
		assert(divNode('getAttr', ls([, 'class'])).includes('spec-class'));
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
		await divNode('setSpec', ls([, spec]));
		const retrieved = divNode('getAttr', ls([, 'c.items']));
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
		await divNode('setSpec', ls([, spec]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'Child 1');
		assertEquals(subSpec.at([1, 't']), 'Child 2');
	});

	await t.step(".setSpec() - Set children via JS", async () => {
		const divNode = doc.createNode('h.div');
		const spec = ps('[(h.div [m.t t="JS Child 1"] [m.t t="JS Child 2"])]');
		divNode.setSpec(spec);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS Child 1');
		assertEquals(subSpec.at([1, 't']), 'JS Child 2');
	});

	await t.step("(setSubSpec) - With NANOS list", () => {
		const divNode = doc.createNode('h.div');
		const subList = ps('[([m.t t="Sub 1"] [m.t t="Sub 2"])]');
		divNode('setSubSpec', ls(['subSpec', subList]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'Sub 1');
		assertEquals(subSpec.at([1, 't']), 'Sub 2');
	});

	await t.step(".setSubSpec() - With NANOS list via JS", () => {
		const divNode = doc.createNode('h.div');
		const subList = ps('[([m.t t="JS Sub 1"] [m.t t="JS Sub 2"])]');
		divNode.setSubSpec({ subSpec: subList });
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS Sub 1');
		assertEquals(subSpec.at([1, 't']), 'JS Sub 2');
	});

	await t.step("(setSubSpec) - With spec parameter", () => {
		const divNode = doc.createNode('h.div');
		const fullSpec = ps('[(h.div [m.t t="Spec Child"])]');
		divNode('setSubSpec', ls(['spec', fullSpec]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Spec Child');
	});

	await t.step(".setSubSpec() - With spec parameter via JS", () => {
		const divNode = doc.createNode('h.div');
		const fullSpec = ps('[(h.div [m.t t="JS Spec Child"])]');
		divNode.setSubSpec({ spec: fullSpec });
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'JS Spec Child');
	});

	await t.step("(setSubSpec) - With multiple positional parameters", () => {
		const divNode = doc.createNode('h.div');
		const spec1 = ps('[(m.t t="Pos 1")]');
		const spec2 = ps('[(m.t t="Pos 2")]');
		divNode('setSubSpec', ls([, spec1, , spec2]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'Pos 1');
		assertEquals(subSpec.at([1, 't']), 'Pos 2');
	});

	await t.step(".setSubSpec() - With multiple positional parameters via JS", () => {
		const divNode = doc.createNode('h.div');
		const spec1 = ps('[(m.t t="JS Pos 1")]');
		const spec2 = ps('[(m.t t="JS Pos 2")]');
		divNode.setSubSpec(spec1, spec2);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS Pos 1');
		assertEquals(subSpec.at([1, 't']), 'JS Pos 2');
	});

	await t.step("(setSubSpec) - Void node ignores children", () => {
		const brNode = doc.createNode('h.br');
		const subList = ps('[([m.t t="Should not appear"])]');
		brNode('setSubSpec', ls(['subSpec', subList]));
		const subSpec = brNode('getSubSpec');
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

Deno.test("MWIDocNode - Content Operations", async (t) => {
	await t.step("(append) - Text string auto-converts to m.t", async () => {
		const divNode = doc.createNode('h.div');
		divNode('append', ls([, 'Plain text']));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
		assertEquals(subSpec.at([0, 't']), 'Plain text');
	});

	await t.step(".append() - Text string auto-converts to m.t via JS", async () => {
		const divNode = doc.createNode('h.div');
		divNode.append('JS plain text');
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 0]), 'm.t');
		assertEquals(subSpec.at([0, 't']), 'JS plain text');
	});

	await t.step("(append) - Doc-node", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Appended node']));
		divNode('append', ls([, textNode]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'Appended node');
	});

	await t.step(".append() - Doc-node via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS appended node');
		divNode.append(textNode);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 1);
		assertEquals(subSpec.at([0, 't']), 'JS appended node');
	});

	await t.step("(append) - Multiple items at once", async () => {
		const divNode = doc.createNode('h.div');
		const text1 = doc.createNode('m.t');
		text1('setAttr', ls([, 't', , 'First']));
		const text2 = doc.createNode('m.t');
		text2('setAttr', ls([, 't', , 'Second']));
		divNode('append', ls([, text1, , text2]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'First');
		assertEquals(subSpec.at([1, 't']), 'Second');
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
		assertEquals(subSpec.at([0, 't']), 'JS First');
		assertEquals(subSpec.at([1, 't']), 'JS Second');
	});

	await t.step("(append) - Mixed text and nodes", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode('setAttr', ls([, 't', , 'Node text']));
		divNode('append', ls([, 'String text', , textNode]));
		const subSpec = divNode('getSubSpec');
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'String text');
		assertEquals(subSpec.at([1, 't']), 'Node text');
	});

	await t.step(".append() - Mixed text and nodes via JS", async () => {
		const divNode = doc.createNode('h.div');
		const textNode = doc.createNode('m.t');
		textNode.setAttr('t', 'JS Node text');
		divNode.append('JS String text', textNode);
		const subSpec = divNode.getSubSpec();
		assertEquals(subSpec.size, 2);
		assertEquals(subSpec.at([0, 't']), 'JS String text');
		assertEquals(subSpec.at([1, 't']), 'JS Node text');
	});

	await t.step("(append) - Returns node for chaining", async () => {
		const divNode = doc.createNode('h.div');
		const result = divNode('append', ls([, 'text']));
		assertStrictEquals(result, divNode);
	});

	await t.step(".append() - Returns node for chaining via JS", async () => {
		const divNode = doc.createNode('h.div');
		const result = divNode.append('text');
		assertStrictEquals(result, divNode);
	});

	await t.step("(append) - Void node is no-op", async () => {
		const brNode = doc.createNode('h.br');
		brNode('append', ls([, 'text']));
		const subSpec = brNode('getSubSpec');
		assertEquals(subSpec.size, 0);
	});

	await t.step(".append() - Void node is no-op via JS", async () => {
		const brNode = doc.createNode('h.br');
		brNode.append('text');
		const subSpec = brNode.getSubSpec();
		assertEquals(subSpec.size, 0);
	});
});
