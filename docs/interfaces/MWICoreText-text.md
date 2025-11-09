# MWICoreText - Text Component

**Interface:** `MWICoreText`  
**Component Type:** `m.t`  
**Attributes:** Void
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 262-306)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

Renders text content. In SSR, outputs escaped HTML text. In CSR, renders as an `<output>` element for non-empty text, or nothing for empty text.

## Behavior

- **Void:** Cannot have children (`schema.void = true`)
- **Conditional DOM:** `<output>` for non-empty text, nothing for empty
- **Reactive Content:** Text updates reactively in DOM
- **Escaped:** Content properly escaped for HTML

## Attributes

**`t`** (string)
- Text content
- Optional (defaults to empty string)
- Reactively updates in DOM

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for:
- `(getAttr name)` / `getAttr(name)`
- `(setAttr name value)` / `setAttr(name, value)`
- `(hasAttr name)` / `hasAttr(name)`
- `(type)` / `.type`
- `(root)` / `.root`

### Text-Specific

**`(getHTML)` / `getHTML()`**
- Returns HTML-escaped text
- Empty string if `t` attribute is empty

**`(getDOM)` / `getDOM()`**
- Non-empty text: Returns NANOS with `<output>` element
- Empty text: Returns empty NANOS (no DOM nodes)
- Content reactively updates
- Returns empty NANOS in non-browser environment

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (void element, ignores children)

## Usage Examples

### Basic Text

```javascript
const doc = getInstance('MWIDocument');
const text = doc.createNode('m.t');
text.setAttr('t', 'Hello, world!');

// SSR: Hello, world! (escaped)
// CSR: <output>Hello, world!</output>
```

### Empty Text

```javascript
const text = doc.createNode('m.t');
// No 't' attribute set

// SSR: (empty string)
// CSR: (no DOM nodes)
```

### Reactive Updates

```javascript
const text = doc.createNode('m.t');
text.setAttr('t', 'Initial');

const domNodes = text.getDOM();
// <output>Initial</output> created

text.setAttr('t', 'Updated');
// <output> content automatically updates to "Updated"

text.setAttr('t', '');
// <output> element removed from DOM
```

### From String

```javascript
// Strings automatically become m.t nodes
const text = doc.from({ item: 'Hello' });
// Creates m.t node with t="Hello"

// From spec
const text = doc.from({ 
    item: ps('[m.t t="Hello"]')
});
```

### HTML Escaping

```javascript
const text = doc.createNode('m.t');
text.setAttr('t', '<script>alert("XSS")</script>');

// SSR: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
// CSR: <output>&lt;script&gt;alert("XSS")&lt;/script&gt;</output>
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWICoreCom`](MWICoreCom-comment.md) - Similar void component for comments
