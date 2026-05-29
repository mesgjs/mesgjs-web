# MWICoreCom - Comment Component

**Interface:** `MWICoreCom`  
**Component Type:** `m.com`  
**Attributes:** Void
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 55-107)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

Renders HTML comments. The comment content is stored in the `t` attribute and is reactively updated in DOM rendering.

## Behavior

- **Void:** Cannot have children (`schema.void = true`)
- **Reactive Content:** Comment text updates reactively in DOM
- **Escaped:** Content properly escaped for HTML comments

## Attributes

**`t`** (string)
- Comment text content
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

### Comment-Specific

**`(getHTML)` / `getHTML()`**
- Returns `<!--text-->` with escaped content
- Empty if `t` attribute is empty

**`(getDOM)` / `getDOM()`**
- Returns NANOS with single comment node
- Content reactively updates
- Returns empty NANOS in non-browser environment

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (void element, ignores children)

## HTML Comment Escaping

Comments are escaped to prevent malformed HTML:
- `&` → `&amp;`
- Leading `>` → `&gt;`
- Leading `->` → `-&gt;`
- `<!--` sequences → `&lt;!--`
- `-->` sequences → `--&gt;`

## Usage Examples

### Basic Comment

```javascript
const doc = getInstance('MWIDocument');
const comment = doc.createNode('m.com');
comment.setAttr('t', 'This is a comment');

// SSR: <!--This is a comment-->
// CSR: Comment node with text "This is a comment"
```

### Empty Comment

```javascript
const comment = doc.createNode('m.com');
// No 't' attribute set

// SSR: <!---->
// CSR: Comment node with empty text
```

### Reactive Updates

```javascript
const comment = doc.createNode('m.com');
comment.setAttr('t', 'Initial');

const domNodes = comment.getDOM();
// Comment node created with "Initial"

comment.setAttr('t', 'Updated');
// Comment node automatically updates to "Updated"
```

### From Spec

```javascript
// Using doc.from()
const comment = doc.from({ 
    item: ps('[(m.com t="Debug marker")]')
});

// Direct creation
const comment = doc.createNode('m.com');
comment.setSpec(ps('[(m.com t="Debug marker")]'));
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWICoreText`](MWICoreText-text.md) - Similar void component for text
