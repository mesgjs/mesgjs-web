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

import { MWIVNodeStorage } from '../../src/shared/MWIVNodeStorage.esm.js';
import { test, assertEqual } from '../test.esm.js';

// Basic Storage Operations
test('basic attribute operations', () => {
    const storage = new MWIVNodeStorage();
    
    storage.setAttr('id', 'test');
    assertEqual(storage.getAttr('id'), 'test');
    
    storage.deleteAttr('id');
    assertEqual(storage.getAttr('id'), undefined);
});

test('basic class operations', () => {
    const storage = new MWIVNodeStorage();
    
    storage.addClass('test');
    assertEqual(storage.hasClass('test'), true);
    assertEqual(storage.getClassString(), 'test');
    
    storage.removeClass('test');
    assertEqual(storage.hasClass('test'), false);
    assertEqual(storage.getClassString(), '');
});

test('basic style operations', () => {
    const storage = new MWIVNodeStorage();
    
    storage.setStyle('color', 'red');
    assertEqual(storage.getStyle('color'), 'red');
    assertEqual(storage.getStyleString(), 'color: red;');
    
    storage.clearStyles();
    assertEqual(storage.getStyleString(), '');
});

// Copy-on-Write Tests
test('attribute copy-on-write', () => {
    const storage1 = new MWIVNodeStorage();
    const storage2 = new MWIVNodeStorage();
    
    // Set initial shared state
    storage1.setAttr('shared', 'value');
    storage2.setAttr('shared', 'value');
    
    // Modify storage1
    storage1.setAttr('unique', 'value');
    
    // Verify storage2 unchanged
    assertEqual(storage1.getAttr('shared'), 'value');
    assertEqual(storage1.getAttr('unique'), 'value');
    assertEqual(storage2.getAttr('shared'), 'value');
    assertEqual(storage2.getAttr('unique'), undefined);
});

test('class copy-on-write', () => {
    const storage1 = new MWIVNodeStorage();
    const storage2 = new MWIVNodeStorage();
    
    // Set initial shared state
    storage1.addClass('shared');
    storage2.addClass('shared');
    
    // Modify storage1
    storage1.addClass('unique');
    
    // Verify storage2 unchanged
    assertEqual(storage1.getClassString(), 'shared unique');
    assertEqual(storage2.getClassString(), 'shared');
});

test('style copy-on-write', () => {
    const storage1 = new MWIVNodeStorage();
    const storage2 = new MWIVNodeStorage();
    
    // Set initial shared state
    storage1.setStyle('color', 'blue');
    storage2.setStyle('color', 'blue');
    
    // Modify storage1
    storage1.setStyle('font-size', '12px');
    
    // Verify storage2 unchanged
    assertEqual(storage1.getStyleString(), 'color: blue; font-size: 12px;');
    assertEqual(storage2.getStyleString(), 'color: blue;');
});

// Multiple Modifications Test
test('multiple modifications only copy once', () => {
    const storage1 = new MWIVNodeStorage();
    const storage2 = new MWIVNodeStorage();
    
    // Set initial shared state
    storage1.setAttr('shared', 'value');
    storage2.setAttr('shared', 'value');
    
    // Multiple modifications to storage1
    storage1.setAttr('a', '1');
    storage1.setAttr('b', '2');
    storage1.setAttr('c', '3');
    
    // Verify storage2 unchanged
    assertEqual(storage2.getAttr('shared'), 'value');
    assertEqual(storage2.getAttr('a'), undefined);
    assertEqual(storage2.getAttr('b'), undefined);
    assertEqual(storage2.getAttr('c'), undefined);
});

// Storage Type Independence Test
test('storage types are copied independently', () => {
    const storage1 = new MWIVNodeStorage();
    const storage2 = new MWIVNodeStorage();
    
    // Set initial state
    storage1.setAttr('id', 'test');
    storage1.addClass('shared');
    storage1.setStyle('color', 'blue');
    
    storage2.setAttr('id', 'test');
    storage2.addClass('shared');
    storage2.setStyle('color', 'blue');
    
    // Modify each storage type in storage1
    storage1.setAttr('data', 'value');
    storage1.addClass('unique');
    storage1.setStyle('font-size', '12px');
    
    // Verify storage2 unchanged
    assertEqual(storage2.getAttr('id'), 'test');
    assertEqual(storage2.getAttr('data'), undefined);
    assertEqual(storage2.getClassString(), 'shared');
    assertEqual(storage2.getStyleString(), 'color: blue;');
});

// Edge Cases
test('null and empty style values', () => {
    const storage = new MWIVNodeStorage();
    
    storage.setStyle('color', 'red');
    storage.setStyle('color', null);
    assertEqual(storage.getStyle('color'), undefined);
    
    storage.setStyle('color', 'red');
    storage.setStyle('color', '');
    assertEqual(storage.getStyle('color'), undefined);
});

test('class order preservation', () => {
    const storage = new MWIVNodeStorage();
    
    storage.addClass('first');
    storage.addClass('second');
    storage.addClass('third');
    
    assertEqual(storage.getClassString(), 'first second third');
});