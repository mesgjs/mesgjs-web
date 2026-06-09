# MWICoreSlot - Slot Component

**Interface:** `MWICoreSlot`  
**Component Type:** `m.slot`  
**Attributes:** Container, slotting source
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 169-260)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

Handles content slotting for template components. Selects content from the slot source based on the `name` attribute, with fallback to the slot's own children.

## Behavior

- **Content Selection:** Chooses content based on slot source and `name` attribute
- **Reactive:** Content selection updates reactively
- **Fallback:** Uses slot's own children if no source content available
- **Slot Source:** Slot itself becomes slot source for its content
  - As a slot source, you must "slot through" the `m.slot` node (using `m.coat` and/or `m.slat`) to make outer (template node) values available to the slot's inner content.

## Attributes

**`name`** (string, optional)
- Slot name for named slotting
- If present: Uses slot source's attribute with matching name
- If absent: Uses slot source's natural children
- Fallback: Uses slot's own children
- Convention: Use `c.` prefix (e.g., `c.header`, `c.footer`)

## Content Selection Logic

### Named Slot (`name` attribute present and not empty/undefined)
1. Check slot source for list-valued attribute matching `name`
2. If found (even if the list is empty) → Render attribute value as content
3. Otherwise → Render slot's own children

### Unnamed Slot (`name` attribute absent or empty/undefined)
1. Check if slot source has natural children
2. If yes → Render slot source's children
3. Otherwise → Render slot's own children

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
- `(type)` / `.type`
- `(root)` / `.root`

### Slot-Specific

**`(getHTML)` / `getHTML()`**
- Returns HTML for selected content
- Reactively selects based on slot source

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- Returns reactive NANOS of selected content's DOM nodes
- Content selection updates reactively

**`(hasChildren)` / `hasChildren()`**
- Returns `true` if selected content has children
- Considers slot source and fallback

## Usage Examples

### Named Slot

```javascript
// Slot source with matching attribute
const source = doc.createNode('h.div');
source.setAttr('c.header', ps('[([h.h1 "Title"])]'));

// Slot with name
const slot = doc.createNode('m.slot', { slotSrc: source });
slot.setAttr('name', 'c.header');

// Renders: <h1>Title</h1>
```

### Unnamed Slot

```javascript
// Slot source with children
const source = doc.createNode('h.div');
source.setSubSpec(ps('[([h.span "Content"])]'));

// Unnamed slot
const slot = doc.createNode('m.slot', { slotSrc: source });
slot.setSubSpec(ps('[([h.p "Default"])]'));

// Renders: <span>Content</span>
```

### Fallback Content

```javascript
// Source without matching attribute
const source = doc.createNode('h.div');

const slot = doc.createNode('m.slot', { slotSrc: source });
slot.setAttr('name', 'c.optional');
slot.setSubSpec(ps('[([h.p "Fallback"])]'));

// Renders: <p>Fallback</p>
```

### In Template Component

```javascript
// Register template with slots
registry.register('my.card', ls([
    'tpl', ps(`[(
        [h.div class=card
            [h.header [m.slot name=c.header]]
            [h.div class=body [m.slot]]
            [h.footer [m.slot name=c.footer [h.p "Default footer"]]]
        ]
    )]`)
]));

// Use template
const card = doc.createNode('my.card');
card.setAttr('c.header', ps('[([h.h2 "Card Title"])]'));
card.setSubSpec(ps('[([h.p "Card content"])]'));
// c.footer uses default

// Renders:
// <div class="card">
//   <header><h2>Card Title</h2></header>
//   <div class="body"><p>Card content</p></div>
//   <footer><p>Default footer</p></footer>
// </div>
```

### Reactive Slotting

```javascript
const source = doc.createNode('h.div');

const slot = doc.createNode('m.slot', { slotSrc: source });
slot.setAttr('name', 'c.content');

// Initially no content
const domNodes = slot.getDOM();
// Empty

// Add content to source
source.setAttr('c.content', ps('[([h.span "New content"])]'));
// DOM automatically updates to show <span>New content</span>
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWICoreTpl`](MWICoreTpl-template.md) - Uses slots for content
- [`MWICoreFrag`](MWICoreFrag-fragment.md) - Used internally for content assembly
