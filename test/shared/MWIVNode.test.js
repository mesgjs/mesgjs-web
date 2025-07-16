/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 *
 * This file is part of the Mesgjs Web Interface (MWI).
 *
 * The MWI is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * @license MIT
 */

import { MWIVNode } from '../../src/shared/MWIVNode.esm.js';
import { test, testReturns, testThrows, assertEqual } from '../test.esm.js';

// Constructor Tests
test('constructor accepts valid type', () => {
    const node = new MWIVNode('h.div');
    assertEqual(node.type, 'h.div');
});

testThrows('constructor rejects invalid type', 
    () => new MWIVNode('invalid!type'),
    'Invalid virtual node name'
);

test('constructor freezes opts', () => {
    const opts = { foo: 'bar' };
    const node = new MWIVNode('h.div', opts);
    testThrows('opts property should be read-only',
        () => node.opts.foo = 'baz',
        'Cannot assign to read only property'
    );
});

// Attribute Tests
test('attribute handling', () => {
    const node = new MWIVNode('h.div');
    
    // Set and get
    node.setAttr('id', 'test');
    assertEqual(node.getAttr('id'), 'test');
    
    // Boolean attributes
    node.setAttr('disabled', true);
    assertEqual(node.getAttr('disabled'), true);
    node.setAttr('disabled', false);
    assertEqual(node.getAttr('disabled'), undefined);
    
    // Name validation
    node.setAttr('valid-name', 'value');
    assertEqual(node.getAttr('valid-name'), 'value');
    node.setAttr('invalid!name', 'value');
    assertEqual(node.getAttr('invalid!name'), undefined);
});

// Class Tests
test('class handling', () => {
    const node = new MWIVNode('h.div');
    
    // Add and remove
    node.editClass('foo bar');
    assertEqual(node.getAttr('class'), 'foo bar');
    node.removeClass('foo');
    assertEqual(node.getAttr('class'), 'bar');
    
    // Array input
    node.editClass(['baz', 'qux']);
    assertEqual(node.getAttr('class'), 'bar baz qux');
    
    // Removal prefix
    node.editClass('!baz');
    assertEqual(node.getAttr('class'), 'bar qux');
    
    // Name validation
    node.editClass('valid-name invalid!name');
    assertEqual(node.getAttr('class'), 'bar qux valid-name');
});

// Style Tests
test('style handling', () => {
    const node = new MWIVNode('h.div');
    
    // String format
    node.editStyle('color: red; font-size: 12px');
    assertEqual(node.getAttr('style'), 'color: red; font-size: 12px;');
    
    // Object format
    node.editStyle({ color: 'blue', fontSize: '14px' });
    assertEqual(node.getAttr('style'), 'color: blue; font-size: 14px;');
    
    // Property-value pairs
    node.editStyle('margin', '10px');
    assertEqual(node.getAttr('style'), 'color: blue; font-size: 14px; margin: 10px;');
    
    // Property validation
    node.editStyle('valid-prop: value; invalid!prop: value');
    assertEqual(node.getAttr('style'), 'color: blue; font-size: 14px; margin: 10px; valid-prop: value;');
});

test('style property case handling', () => {
    const node = new MWIVNode('h.div');
    
    // Single word properties
    node.editStyle({ color: 'red', margin: '10px' });
    assertEqual(node.getAttr('style'), 'color: red; margin: 10px;');
    
    // camelCase to kebab-case conversion
    node.editStyle({
        fontSize: '16px',
        backgroundColor: 'blue',
        borderBottomWidth: '2px',
        '-webkitTransform': 'scale(1.1)',
        '-msFlexAlign': 'center'
    });
    assertEqual(
        node.getAttr('style'),
        'color: red; margin: 10px; font-size: 16px; background-color: blue; border-bottom-width: 2px; -webkit-transform: scale(1.1); -ms-flex-align: center;'
    );
    
    // Mixed format input - demonstrates accumulation of styles
    node.editStyle('fontWeight: bold; border-color: black');
    assertEqual(
        node.getAttr('style'),
        'color: red; margin: 10px; font-size: 16px; background-color: blue; border-bottom-width: 2px; -webkit-transform: scale(1.1); -ms-flex-align: center; font-weight: bold; border-color: black;'
    );
    
    // Clearing specific properties - only removes specified properties
    node.editStyle({ fontSize: '', backgroundColor: null });
    assertEqual(
        node.getAttr('style'),
        'color: red; margin: 10px; border-bottom-width: 2px; -webkit-transform: scale(1.1); -ms-flex-align: center; font-weight: bold; border-color: black;'
    );
});

// Child Management Tests
test('child management', () => {
    const node = new MWIVNode('h.div');
    const child = new MWIVNode('h.span');
    
    node.append(child, 'text');
    assertEqual(node.children.length, 2);
    assertEqual(node.children[0], child);
    assertEqual(node.children[1], 'text');
});


test('void element handling', () => {
    const br = new MWIVNode('h.br', { noClose: true });
    assertEqual(br.type, 'h.br');
    assertEqual(br.opts.noClose, true);
    
    const img = new MWIVNode('h.img', { noClose: true });
    img.setAttr('src', 'test.jpg');
    img.setAttr('alt', 'Test Image');
    assertEqual(img.type, 'h.img');
    assertEqual(img.opts.noClose, true);
    assertEqual(img.getAttr('src'), 'test.jpg');
    assertEqual(img.getAttr('alt'), 'Test Image');
    
    const input = new MWIVNode('h.input', { noClose: true });
    input.setAttr('type', 'text');
    input.setAttr('value', 'test');
    assertEqual(input.type, 'h.input');
    assertEqual(input.opts.noClose, true);
    assertEqual(input.getAttr('type'), 'text');
    assertEqual(input.getAttr('value'), 'test');
});

// Copy-on-Write Tests
test('copy-on-write for attributes', () => {
    const node1 = new MWIVNode('h.div');
    const node2 = new MWIVNode('h.div');
    
    node1.setAttr('id', 'original');
    node2.setAttr('id', 'original');
    
    node1.setAttr('id', 'modified');
    
    assertEqual(node1.getAttr('id'), 'modified');
    assertEqual(node2.getAttr('id'), 'original');
});

test('copy-on-write for classes', () => {
    const node1 = new MWIVNode('h.div');
    const node2 = new MWIVNode('h.div');
    
    node1.editClass('shared');
    node2.editClass('shared');
    
    node1.editClass('unique');
    
    assertEqual(node1.getAttr('class'), 'shared unique');
    assertEqual(node2.getAttr('class'), 'shared');
});

test('copy-on-write for styles', () => {
    const node1 = new MWIVNode('h.div');
    const node2 = new MWIVNode('h.div');
    
    node1.editStyle('color: blue');
    node2.editStyle('color: blue');
    
    node1.editStyle('font-size: 12px');
    
    assertEqual(node1.getAttr('style'), 'color: blue; font-size: 12px;');
    assertEqual(node2.getAttr('style'), 'color: blue;');
});
