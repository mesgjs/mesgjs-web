# MWIHTMLDocType - DOCTYPE Declaration

**Interface:** `MWIHTMLDocType`  
**Component Type:** `h.doctype`  
**Attributes:** Void
**Source:** [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs) (lines 202-222)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

Renders the HTML5 DOCTYPE declaration. This is a special component that outputs `<!DOCTYPE html>` with no attributes or children.

## Behavior

- **Fixed Output:** Always renders `<!DOCTYPE html>`
- **No Attributes:** Attributes are ignored
- **No Children:** Cannot have children
- **No DOM:** Returns empty NANOS in CSR (DOCTYPE not represented in DOM)

## Operations

### Inherited from MWIHTML

See [`MWIHTML`](MWIHTML-HTML-elements.md) and [`MWIDocNode`](MWIDocNode-document-node.md) for inherited operations.

### DocType-Specific

**`(getHTML)` / `getHTML()`**
- Returns `<!DOCTYPE html>`
- Ignores all attributes

**`(getDOM)` / `getDOM()`**
- Returns empty NANOS
- DOCTYPE not represented in DOM

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (ignores children)

## Usage Examples

### Basic Usage

```javascript
const doc = getInstance('MWIDocument');
const doctype = doc.createNode('h.doctype');

// SSR: <!DOCTYPE html>
// CSR: (no DOM nodes)
```

### In Complete Document

```javascript
const doc = getInstance('MWIDocument');

doc.append(
    doc.createNode('h.doctype'),
    doc.from({ item: ps(`[h.html
        [h.head
            [h.title m.text="Page Title"]
        ]
        [h.body
            [h.h1 "Hello, World!"]
        ]
    ]`)})
);

const html = doc.getHTML();
// <!DOCTYPE html>
// <html>
//   <head><title>Page Title</title></head>
//   <body><h1>Hello, World!</h1></body>
// </html>
```

### From Spec

```javascript
const doctype = doc.from({ item: ps('[h.doctype]') });
```

### Attributes Ignored

```javascript
const doctype = doc.createNode('h.doctype');
doctype.setAttr('version', '5.0'); // Ignored

// Still outputs: <!DOCTYPE html>
```

## Notes

- **HTML5 Only:** Currently only supports HTML5 DOCTYPE
- **Position:** Should be first element in document
- **CSR:** DOCTYPE not needed in CSR (browser already has document type)
- **SSR:** Essential for proper HTML5 document structure

## Related Interfaces

- [`MWIHTML`](MWIHTML-HTML-elements.md) - Base HTML interface
- [`MWIDocNode`](MWIDocNode-document-node.md) - Base node interface
- [`MWIHTMLTitle`](MWIHTMLTitle-title.md) - Another specialized HTML element
