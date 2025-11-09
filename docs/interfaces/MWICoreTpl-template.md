# MWICoreTpl - Template Component Handler

**Interface:** `MWICoreTpl`  
**Component Type:** (assigned to template components)  
**Attributes:** Container, slotting source
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 308-363)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

`MWICoreTpl` is automatically assigned by the registry as the handler for template components (those registered with a `tpl` property). It manages template instantiation and slotting.

## Behavior

- **Static Template:** Internal fragment initialized once with template spec
- **Lazy Conversion:** Sub-specs not immediately converted (`autoDoc = false`)
- **Slot Source:** Template node itself is slot source for template content
  - As a slot source, you must "slot through" the template node (using `m.coat` and/or `m.slat`) to make higher-level template values available to the template's inner content.
- **Reactive Slotting:** Template reactively slots against node's attributes and sub-spec

## Template Mechanics

1. **Registration:** Component registered with `tpl` property
2. **Assignment:** Registry assigns `MWICoreTpl` as interface
3. **Initialization:** Creates internal `m.frg` fragment with template content
4. **Slotting:** Fragment slots against template invocation node
5. **Rendering:** Delegates to internal fragment

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

### Template-Specific

**`@init`**
- Disables `autoDoc` in schema
- Prevents immediate sub-spec conversion

**`(getHTML)` / `getHTML()`**
- Delegates to internal fragment
- Returns HTML for slotted template

**`(getDOM)` / `getDOM()`**
- Returns reactive NANOS of template's DOM nodes
- Delegates to internal fragment
- Updates reactively when attributes or sub-spec change

## Internal Fragment

The template creates an internal `m.frg` fragment:
- **Created once:** During first `getDOM()` or `getHTML()` call
- **Slot source:** Template node itself (`d.rr`)
- **Static content:** Initialized with template spec
- **Reactive slotting:** Responds to template node's attribute and sub-spec changes

## Usage Examples

### Register Template Component

```javascript
const registry = getInstance('MWIRegistry');

registry.register('my.button', ls([
    'tpl', ps(`[(
        [h.button class=btn [m.slot]]
    )]`)
]));
```

### Use Template Component

```javascript
const doc = getInstance('MWIDocument');
const btn = doc.createNode('my.button');

// Add content (goes to unnamed slot)
btn.setSubSpec(ps('[([m.t t="Click me"])]'));

// Renders: <button class="btn">Click me</button>
```

### Named Slots

```javascript
// Template with named slots
registry.register('my.card', ls([
    'tpl', ps(`[(
        [h.div class=card
            [h.header [m.slot name=c.header]]
            [h.div class=body [m.slot]]
        ]
    )]`)
]));

// Use with named content
const card = doc.createNode('my.card');
card.setAttr('c.header', ps('[([h.h2 "Title"])]'));
card.setSubSpec(ps('[([h.p "Body content"])]'));

// Renders:
// <div class="card">
//   <header><h2>Title</h2></header>
//   <div class="body"><p>Body content</p></div>
// </div>
```

### Attribute Slotting

```javascript
// Template with attribute slotting
registry.register('my.input', ls([
    'tpl', ps(`[(
        [h.input m.slat=[type=[else=input] placeholder=[] value=[]]]
    )]`)
]));

// Use with attributes
const input = doc.createNode('my.input');
input.setAttr('type', 'email');
input.setAttr('placeholder', 'Enter email');

// Renders: <input type="email" placeholder="Enter email">
```

### Reactive Template Updates

```javascript
const btn = doc.createNode('my.button');
btn.setSubSpec(ps('[([m.t t="Initial"])]'));

const domNodes = btn.getDOM();
// <button class="btn">Initial</button>

// Update content
btn.setSubSpec(ps('[([m.t t="Updated"])]'));
// DOM automatically updates to show "Updated"

// Update via append
const newText = doc.createNode('m.t');
newText.setAttr('t', 'Appended');
btn.append(newText);
// DOM updates to show "Appended"
```

### Computed Attributes

```javascript
// Template with computed attributes
registry.register('my.btn', ls([
    'tpl', ps(`[(
        [h.button m.coat=[class="btn <type>-btn"]]
    )]`)
]));

// Use with type attribute
const btn = doc.createNode('my.btn');
btn.setAttr('type', 'primary');

// Renders: <button class="btn primary-btn"></button>
```

## Sub-Spec Behavior

Templates have `autoDoc = false`, meaning:
- Sub-specs stored without immediate conversion
- Conversion happens on `append()` or similar operations
- Allows lazy instantiation of template content

```javascript
const tpl = doc.createNode('my.template');

// Set sub-spec (not converted yet)
tpl.setSubSpec(ps('[([h.div "Content"])]'));

// Still not converted (lazy)
const subSpec = tpl.getSubSpec();

// Conversion happens on append
const newNode = doc.createNode('h.span');
tpl.append(newNode);
// Now sub-doc is live
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWICoreFrag`](MWICoreFrag-fragment.md) - Used for internal template content
- [`MWICoreSlot`](MWICoreSlot-slot.md) - Handles content slotting within templates
- [`MWIRegistry`](MWIRegistry-registry.md) - Assigns this interface to template components
