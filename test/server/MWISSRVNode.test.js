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

import { MWISSRVNode } from '../../src/server/MWISSRVNode.esm.js';
import { NANOS } from '../../src/shared/vendor.esm.js';
import { test, testThrows, assertEqual } from '../test.esm.js';

// Basic HTML Rendering
test('renders simple element', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    assertEqual(node.outerHTML, '<div></div>');
});

test('renders with attributes', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.setAttr('id', 'test');
    node.setAttr('class', 'foo bar');
    assertEqual(node.outerHTML, '<div id="test" class="foo bar"></div>');
});

test('renders boolean attributes', () => {
    const node = new MWISSRVNode('h.input', { tag: 'input' });
    node.setAttr('disabled', true);
    node.setAttr('hidden', false);
    assertEqual(node.outerHTML, '<input disabled></input>');
});

test('renders with styles', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.editStyle('color: red; font-size: 12px');
    assertEqual(node.outerHTML, '<div style="color: red; font-size: 12px;"></div>');
});

// HTML Escaping
test('escapes special characters in attributes', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.setAttr('data', '<>&"\'');
    assertEqual(node.outerHTML, '<div data="&lt;&gt;&amp;&quot;&#39;"></div>');
});

test('escapes special characters in text content', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.append('<script>alert("xss")</script>');
    assertEqual(node.outerHTML, '<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>');
});

// Child Rendering
test('renders child nodes', () => {
    const parent = new MWISSRVNode('h.div', { tag: 'div' });
    const child = new MWISSRVNode('h.span', { tag: 'span' });
    child.append('text');
    parent.append(child);
    assertEqual(parent.outerHTML, '<div><span>text</span></div>');
});

test('renders mixed content', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    const child = new MWISSRVNode('h.span', { tag: 'span' });
    node.append('before ', child, ' after');
    assertEqual(node.outerHTML, '<div>before <span></span> after</div>');
});

// Special Node Types
test('renders text node', () => {
    const node = MWISSRVNode.textNode('test');
    assertEqual(node.type, 'h.TEXT');
    assertEqual(node.children[0], 'test');
    assertEqual(node.opts.noTag, true);
    assertEqual(node.outerHTML, 'test');
});

test('renders fragment node', () => {
    const child1 = new MWISSRVNode('h.div', { tag: 'div' });
    const child2 = new MWISSRVNode('h.span', { tag: 'span' });
    const frag = MWISSRVNode.fragment(child1, 'text', child2);

    assertEqual(frag.type, 'h.FRAG');
    assertEqual(frag.children.length, 3);
    assertEqual(frag.children[0], child1);
// Static Method Tests from fromData
test('fromData with array format', () => {
    const node = MWISSRVNode.fromData(['div', { id: 'test' }, 'text']);
    assertEqual(node.type, 'div');
    assertEqual(node.getAttr('id'), 'test');
    assertEqual(node.children[0], 'text');
    assertEqual(node.outerHTML, '<div id="test">text</div>');
});

test('fromData with options', () => {
    const opts = { noTag: true };
    const node = MWISSRVNode.fromData(['h.div', { id: 'test' }, 'text'], opts);
    assertEqual(node.type, 'h.div');
    assertEqual(node.getAttr('id'), 'test');
    assertEqual(node.opts.noTag, true);
    testThrows('noTag option should be read-only',
        () => node.opts.noTag = false,
        'Cannot assign to read only property'
    );
    assertEqual(node.outerHTML, 'text');
});

test('fromData with NANOS format', () => {
    const data = NANOS.parseSLID('[(div id=test text)]');
    const node = MWISSRVNode.fromData(data);
    assertEqual(node.type, 'div');
    assertEqual(node.getAttr('id'), 'test');
    assertEqual(node.children[0], 'text');
    assertEqual(node.outerHTML, '<div id="test">text</div>');
});

test('fromData with NANOS format and options', () => {
    const data = NANOS.parseSLID('[(h.div id=test text)]');
    const opts = { noTag: true };
    const node = MWISSRVNode.fromData(data, opts);
    assertEqual(node.type, 'h.div');
    assertEqual(node.getAttr('id'), 'test');
    assertEqual(node.children[0], 'text');
    assertEqual(node.opts.noTag, true);
    testThrows('noTag option should be read-only',
        () => node.opts.noTag = false,
        'Cannot assign to read only property'
    );
    assertEqual(node.outerHTML, 'text');
});
    assertEqual(frag.children[1], 'text');
    assertEqual(frag.children[2], child2);
    assertEqual(frag.opts.noTag, true);
    assertEqual(frag.outerHTML, '<div></div>text<span></span>');
});

// Scope Replacement
test('replaces @@ tokens with scope', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.scope = 'test-scope';
    node.setAttr('class', 'prefix-@@-suffix');
    assertEqual(node.outerHTML, '<div class="prefix-test-scope-suffix"></div>');
});

// Inherited Functionality
test('inherits attribute handling', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.setAttr('id', 'test');
    assertEqual(node.getAttr('id'), 'test');
});

test('inherits class handling', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.editClass('foo bar');
    node.removeClass('bar');
    assertEqual(node.getAttr('class'), 'foo');
});

test('inherits style handling', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div' });
    node.editStyle({ color: 'red' });
    assertEqual(node.getAttr('style'), 'color: red;');
});

// Special Options
test('respects noTag option', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div', noTag: true });
    node.append('test');
    assertEqual(node.outerHTML, 'test');
});

test('renders void elements correctly', () => {
    const br = new MWISSRVNode('h.br', { tag: 'br', noClose: true });
    assertEqual(br.outerHTML, '<br>');

    const img = new MWISSRVNode('h.img', { tag: 'img', noClose: true });
    img.setAttr('src', 'test.jpg');
    img.setAttr('alt', 'Test Image');
    assertEqual(img.outerHTML, '<img src="test.jpg" alt="Test Image">');

    const input = new MWISSRVNode('h.input', { tag: 'input', noClose: true });
    input.setAttr('type', 'text');
    input.setAttr('value', 'test');
    assertEqual(input.outerHTML, '<input type="text" value="test">');
});

test('respects noClose option', () => {
    const node = new MWISSRVNode('h.div', { tag: 'div', noClose: true });
    node.append('test');
    assertEqual(node.outerHTML, '<div>test');
});

test('uses opts.tag over type', () => {
    const node = new MWISSRVNode('h.div', { tag: 'span' });
    assertEqual(node.outerHTML, '<span></span>');
});

// Async Child Rendering
test('async renderChildren', async () => {
    const parent = new MWISSRVNode('h.div', { tag: 'div' });
    const child = new MWISSRVNode('h.span', { tag: 'span' });
    parent.append(child);

    const mockRenderer = {
        _renderNode: async (node) => {
            if (node instanceof MWISSRVNode) {
                node.setAttr('rendered', 'true');
            }
            return node;
        }
    };

    await parent.renderChildren(mockRenderer);
    assertEqual(child.getAttr('rendered'), 'true');
});