# MWICoreFrag - Fragment Component

**Interface:** `MWICoreFrag`  
**Component Type:** `m.frg`  
**Attributes:** Container
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 155-167)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

Fragments are "transparent containers" that render as the combined rendering of their children, with no wrapper element. They pass the slot source through to their children unchanged.

## Behavior

- **Transparent:** No wrapper element in output
- **Pass-through:** Slot source passed to children unmodified
- **Container:** Accepts children and modifications
- **Immediate Conversion:** Sub-specs converted to sub-doc nodes immediately (`autoDoc` not disabled)

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for:
- `(getAttr name)` / `getAttr(name)`
- `(setAttr name value)` / `setAttr(name, value)`
- `(hasAttr name)` / `hasAttr(name)`
- `(setSpec spec)` / `setSpec(spec)`
- `(setSubSpec ...)` / `setSubSpec(...)`
- `(append node...)` / `append(...nodes)`
- `(getSpec)` / `getSpec()`
- `(getSubSpec)` / `getSubSpec()`
- `(hasChildren)` / `hasChildren()`
- `(type)` / `.type`
- `(root)` / `.root`

### Fragment-Specific

**`(subSlotSrc)` / `subSlotSrc()`**
- Returns `slotSrc` (pass-through, not self)
- Fragments don't become slot sources

**`(getHTML)` / `getHTML()`**
- Returns combined HTML of children
- No wrapper element

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- Returns reactive NANOS of child DOM nodes
- No wrapper element

## Usage Examples

### Basic Fragment

```javascript
const doc = getInstance('MWIDocument');
const frag = doc.createNode('m.frg');

// Add children
frag.append(
    doc.createNode('h.div'),
    doc.createNode('h.span')
);

// Renders as: <div></div><span></span>
// (no wrapper)
```

### With Slot Source

```javascript
const source = doc.createNode('h.div');
source.setAttr('class', 'active');

const frag = doc.createNode('m.frg', { slotSrc: source });

// Children receive source as their slot source
frag.setSubSpec(ps('[([h.button m.slat=[class=[]]])]'));
// Button will have class="active" from source
```

### Document Root

```javascript
// Every document has an m.frg root
const doc = getInstance('MWIDocument');
const root = doc.root;

root.append(
    doc.createNode('h.h1'),
    doc.createNode('h.p')
);
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIDocument`](MWIDocument-document.md) - Uses fragments as document root
- [`MWICoreSlot`](MWICoreSlot-slot.md) - Uses fragments internally
- [`MWICoreTpl`](MWICoreTpl-template.md) - Uses fragments internally
