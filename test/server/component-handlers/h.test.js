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

import { HTMLPrimitiveHandler, createHTMLPrimitiveHandler } from '../../../src/server/component-handlers/h.esm.js';
import { test, assertEqual } from '../../test.esm.js';

// Basic Handler Tests
test('handler creation', () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    assertEqual(handler.type, 'h.div');
});

// Rendering Tests
test('basic element rendering', async () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    const node = await handler.render({}, {});
    assertEqual(node.type, 'h.div');
});

test('rendering with attributes', async () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    const data = {
        attrs: {
            id: 'test',
            class: 'sample'
        }
    };
    const node = await handler.render(data, {});
    assertEqual(node.getAttr('id'), 'test');
    assertEqual(node.getAttr('class'), 'sample');
});

test('rendering with children', async () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    const data = {
        children: ['text', ['h.span', 'nested']]
    };
    const node = await handler.render(data, {});
    assertEqual(node.children.length, 2);
    assertEqual(node.children[0], 'text');
    assertEqual(node.children[1][0], 'h.span');
    assertEqual(node.children[1][1], 'nested');
});

test('rendering with options', async () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    const data = {
        opts: {
            noOpen: true,
            noClose: true
        }
    };
    const node = await handler.render(data, {});
    assertEqual(node.opts.noOpen, true);
    assertEqual(node.opts.noClose, true);
});

test('rendering with mixed content', async () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    const data = {
        attrs: { id: 'test' },
        opts: { noOpen: true },
        children: ['text']
    };
    const node = await handler.render(data, {});
    assertEqual(node.type, 'h.div');
    assertEqual(node.getAttr('id'), 'test');
    assertEqual(node.opts.noOpen, true);
    assertEqual(node.children[0], 'text');
});

test('options remain separate from attributes', async () => {
    const handler = createHTMLPrimitiveHandler('h.div');
    const data = {
        attrs: { id: 'test' },
        opts: { noOpen: true }
    };
    const node = await handler.render(data, {});
    assertEqual(node.getAttr('opts'), undefined);
    assertEqual(node.opts.noOpen, true);
});