# MWICoreSource - Slot Source Component

**Interface:** `MWICoreSource`  
**Component Type:** `m.src`  
**Attributes:** Container, slotting boundary
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 487–509)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

`m.src` is a fragment-like container that establishes a new slotting boundary ("staging area") for its children, while passing through the `m.ci` (component identity) of its own slot source. This makes it useful for creating isolated attribute scopes within a template, where children see `m.src` as their slot source but `m.ci`-based CSS scoping still refers to the outer template or component.

## Behavior

- **New Slotting Boundary:** `m.src` becomes the `slotSrc` for its own children (`subSlotSrc` returns `self`), unlike `m.frg` which passes through.
- **`m.ci` Pass-Through:** When `m.ci` is requested on an `m.src` node that has a `slotSrc`, it returns the `slotSrc`'s `m.ci` instead of its own. This ensures that CSS scoping (`@@` expansion) in child nodes resolves to the outer component's identity, not `m.src`'s registry entry.
- **Transparent Container:** Renders as the combined output of its children with no wrapper element.
- **Attribute Isolation:** Children can only access attributes on `m.src` itself (not on `m.src`'s own `slotSrc`). To expose outer attributes to children, use `m.slat` and/or `m.coat` to slot them through `m.src` explicitly.

## `m.ci` Pass-Through Detail

The `m.ci` pass-through is a special override of `getAttr`:

- If `getAttr('m.ci')` is called on an `m.src` node **with** a `slotSrc`, it delegates to `slotSrc('getAttr', ['m.ci'])`.
- If called on an `m.src` node **without** a `slotSrc`, it falls through to the base `MWIDocNode` behavior (returns the registry entry's `id` for `m.src` itself).
- This behavior is **transitive**: nested `m.src` nodes each pass through to their own `slotSrc`, so a chain of `m.src` nodes ultimately resolves to the outermost non-`m.src` slot source's `m.ci`.

## Comparison with `m.frg`

| Feature | `m.src` | `m.frg` |
|---|---|---|
| `subSlotSrc` | Returns `self` (new boundary) | Returns `slotSrc` (pass-through) |
| `m.ci` behavior | Passes through `slotSrc`'s `m.ci` | Has its own `m.ci` |
| Attribute scope for children | Children see `m.src`'s attributes | Children see `slotSrc`'s attributes |
| Wrapper element | None | None |

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for:
- `(getAttr name)` / `getAttr(name)` — with `m.ci` pass-through override (see above)
- `(setAttr name value)` / `setAttr(name, value)`
- `(hasAttr name)` / `hasAttr(name)`
- `(setSpec spec)` / `setSpec(spec)`
- `(setSubSpec ...)` / `setSubSpec(...)`
- `(append node...)` / `append(...nodes)`
- `(getSpec)` / `getSpec()`
- `(getSubSpec)` / `getSubSpec()`
- `(getHTML)` / `getHTML()`
- `(getDOM sync=domSync?)` / `getDOM({ sync? })`
- `(hasChildren)` / `hasChildren()`
- `(type)` / `.type`
- `(root)` / `.root`

### Source-Specific

**`(subSlotSrc)` / `subSlotSrc`**
- Returns `self` — `m.src` always becomes the slot source for its children.
- This is the key distinction from `m.frg`, which passes through.

**`(getAttr 'm.ci')` / `getAttr('m.ci')`**
- If `slotSrc` is set: returns `slotSrc('getAttr', ['m.ci'])`.
- If no `slotSrc`: returns the base `m.ci` (registry entry `id` for `m.src`).
- All other attribute names fall through to the standard `MWIDocNode` behavior.

## Usage Examples

### Basic Slot Source (Staging Area)

```javascript
// m.src creates an isolated attribute scope
const srcNode = doc.createNode('m.src');
srcNode.setAttr('data-label', 'my-label');
srcNode.setSubSpec(ps('[( [h.div m.coat=[data-label="<data-label>"]] )]'));

// h.div sees m.src as its slotSrc, so it reads data-label from m.src
srcNode.getHTML(); // <div data-label="my-label"></div>
```

### Inside a Template — `m.ci` Pass-Through

```javascript
// m.src inside a template passes through the template's m.ci
registry.register('my.card', ls([
    'tpl', ps(`[(
        [m.src
            [h.div m.coat=[class="@@__card"]]
        ]
    )]`)
]));

const card = doc.createNode('my.card');
const cardCI = card.getAttr('m.ci'); // e.g. "mci-42"

card.getHTML();
// <div class="mci-42__card"></div>
// @@ resolved to template's m.ci, not m.src's own m.ci
```

### Attribute Isolation — Slotting Through `m.src`

```javascript
// Template attribute is NOT visible to m.src's children by default
registry.register('my.widget', ls([
    'tpl', ps(`[(
        [m.src
            myattr="src-value"
            [h.div m.coat=[data-from="<myattr>"]]
        ]
    )]`)
]));

const widget = doc.createNode('my.widget');
widget.setAttr('myattr', 'template-value');

widget.getHTML();
// <div data-from="src-value"></div>
// h.div sees m.src as slotSrc, so it reads myattr from m.src ("src-value"),
// not from the template ("template-value")
```

To expose a template attribute to `m.src`'s children, slot it through `m.src` using `m.slat`:

```javascript
registry.register('my.widget2', ls([
    'tpl', ps(`[(
        [m.src
            m.slat=[srcattr=[tplattr]]
            [h.div m.coat=[data-val="<srcattr>"]]
        ]
    )]`)
]));

const widget2 = doc.createNode('my.widget2');
widget2.setAttr('tplattr', 'from-template');

widget2.getHTML();
// <div data-val="from-template"></div>
// m.src slots tplattr from template to srcattr on itself;
// h.div reads srcattr from m.src
```

### Nested `m.src` — Transitive `m.ci` Pass-Through

```javascript
// All nested m.src nodes pass through to the outermost slotSrc's m.ci
registry.register('my.nested', ls([
    'tpl', ps(`[(
        [m.src
            [m.src
                [m.src
                    [h.div m.coat=[data-ci="@@"]]
                ]
            ]
        ]
    )]`)
]));

const node = doc.createNode('my.nested');
const ci = node.getAttr('m.ci'); // e.g. "mci-7"

node.getHTML();
// <div data-ci="mci-7"></div>
// All three m.src nodes pass through to the template's m.ci
```

### Reactive Attribute Updates

```javascript
registry.register('my.reactive', ls([
    'tpl', ps(`[(
        [m.src myattr="initial"
            [h.div m.coat=[data-val="<myattr>"]]
        ]
    )]`)
]));

const node = doc.createNode('my.reactive');
const dom = node.getDOM();
const divEl = dom.at(0);

// divEl.getAttribute('data-val') === 'initial'

// Get the m.src child and update its attribute
const subDoc = node.getSubDoc();
const srcNode = subDoc.at(0);
srcNode.setAttr('myattr', 'updated');

await reactive.wait();
// divEl.getAttribute('data-val') === 'updated'
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWICoreFrag`](MWICoreFrag-fragment.md) - Transparent container (no boundary); compare with `m.src`
- [`MWICoreSlot`](MWICoreSlot-slot.md) - Also creates a slotting boundary; used for content projection
- [`MWICoreTpl`](MWICoreTpl-template.md) - Also creates a slotting boundary; used for template components
- [`docs/Slotting.md`](../Slotting.md) - Slotting system overview

[supplemental keywords: staging area, slot source, m.ci pass-through, component identity, CSS scoping, attribute isolation, slotting boundary, transparent container, subSlotSrc, m.src]
