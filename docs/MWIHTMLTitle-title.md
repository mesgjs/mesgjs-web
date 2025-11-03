# MWIHTMLTitle - Title Element

**Interface:** `MWIHTMLTitle`  
**Component Type:** `h.title`  
**Source:** [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs) (lines 276-311)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

Handles the `<title>` element. Content is provided via the `m.text` attribute rather than as children, and is properly HTML-escaped.

## Behavior

- **No Children:** Cannot have children (content via `m.text` attribute)
- **Escaped Content:** Text is HTML-escaped
- **Reactive Content:** Content updates reactively in DOM
- **Single Element:** Only one title should exist per document

## Attributes

**`m.text`** (string)
- Title text content
- Optional (defaults to empty string)
- Reactively updates in DOM
- HTML-escaped in output

## Operations

### Inherited from MWIHTML

See [`MWIHTML`](MWIHTML-HTML-elements.md) and [`MWIDocNode`](MWIDocNode-document-node.md) for inherited operations.

### Title-Specific

**`(getHTML)` / `getHTML()`**
- Returns `<title>text</title>`
- Text is HTML-escaped

**`(getDOM)` / `getDOM()`**
- Returns NANOS with single `<title>` element
- Sets `textContent` with text
- Content updates reactively

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (ignores children)

## Usage Examples

### Basic Title

```javascript
const doc = getInstance('MWIDocument');
const title = doc.createNode('h.title');
title.setAttr('m.text', 'My Page Title');

// SSR: <title>My Page Title</title>
// CSR: <title>My Page Title</title>
```

### In Document Head

```javascript
const doc = getInstance('MWIDocument');

const head = doc.from({ item: ps(`[h.head
    [h.title m.text="Welcome"]
    [h.meta charset=utf-8]
]`)});

doc.append(head);
```

### Reactive Updates

```javascript
const title = doc.createNode('h.title');
title.setAttr('m.text', 'Initial Title');

const domNodes = title.getDOM();
// <title>Initial Title</title>

title.setAttr('m.text', 'Updated Title');
// DOM automatically updates to "Updated Title"
// Browser tab title also updates
```

### HTML Escaping

```javascript
const title = doc.createNode('h.title');
title.setAttr('m.text', 'Products < $100 & "Special" Offers');

// SSR: <title>Products &lt; $100 &amp; "Special" Offers</title>
// CSR: <title>Products < $100 & "Special" Offers</title>
```

### From Spec

```javascript
const title = doc.from({ 
    item: ps('[h.title m.text="Page Title"]')
});
```

### Empty Title

```javascript
const title = doc.createNode('h.title');
// No m.text attribute set

// SSR: <title></title>
// CSR: <title></title>
```

### Dynamic Title

```javascript
// Template component with dynamic title
registry.register('my.page', ls([
    'tpl', ps(`[(
        [h.html
            [h.head
                [h.title m.slat=[m.text=[pageTitle]]]
            ]
            [h.body [m.slot]]
        ]
    )]`)
]));

// Use with title
const page = doc.createNode('my.page');
page.setAttr('pageTitle', 'Welcome to My Site');
page.setSubSpec(ps('[([h.h1 "Content"])]'));

// Renders with <title>Welcome to My Site</title>
```

## Notes

- **Document Head:** Title should be in `<head>` section
- **Single Title:** Only one title per document
- **SEO:** Important for search engines and browser tabs
- **Reactive:** Updates browser tab title in CSR

## Related Interfaces

- [`MWIHTML`](MWIHTML-HTML-elements.md) - Base HTML interface
- [`MWIDocNode`](MWIDocNode-document-node.md) - Base node interface
- [`MWIHTMLScript`](MWIHTMLScript-script-style.md) - Similar pattern for script/style
