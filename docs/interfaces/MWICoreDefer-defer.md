# MWICoreDefer - Deferred Component Placeholder

**Interface:** `MWICoreDefer`  
**Component Type:** `m.defer`  
**Attributes:** Any (stored but not rendered)  
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

`MWICoreDefer` is a **smart deferred-rendering placeholder** for components that haven't been loaded yet. It is created automatically by `(createNode ...)` when a component is registered but not yet loaded (has `ftr` but no `if` or `tpl`). Unlike a simple opaque placeholder, `m.defer` **carries the full content spec** of the deferred component as its children. When the required feature becomes available at CSR time, the children are rendered reactively.

## Behavior

- **Automatic Creation:** Created by `createNode()` for deferred components; `opFrom` enriches the node with the original child spec.
- **Accepts Children:** Children are stored in the sub-spec and represent the content to render when the gate opens.
- **SSR: No Rendering:** Returns an empty string. Children are preserved in the doc-spec for hydration but are not rendered to HTML.
- **CSR: Feature-Gated Rendering:** Derives the required feature name from the registry entry for the component type found in the sub-spec. Waits via `fwait(ftr)`. When the gate opens, children are rendered reactively.
- **`autoDoc: false`:** Children are stored in the sub-spec but are **not** auto-rendered. Rendering is gated on the feature promise.

## Schema

```javascript
{
  autoDoc: false  // Children not auto-rendered; rendering is gated on feature promise
}
```

## Attributes

All attributes are stored on the node but **not rendered** (since the node doesn't render at all during SSR, and the children — not the `m.defer` wrapper — are rendered at CSR).

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for basic node operations (attribute management, etc.).

### Defer-Specific

**`(getHTML)` / `getHTML()`**
- Returns empty string (no rendering, even if children are present)

**`(getDOM)` / `getDOM()`**
- Returns a reactive NANOS (initially empty).
- Derives the feature name: `subSpec.at([0, 0])` → component type → `registry.get(compType).at('ftr')`.
- If no feature can be derived (empty sub-spec, component not in registry, or no `ftr`), returns an empty NANOS that is never populated.
- Otherwise, starts an async task: `fwait(ftr)`. When resolved, calls `getSubDOM` with `into` to render children into the reactive NANOS.

**`(append node...)` / `append(...nodes)`**
- Appends children to the sub-spec normally (inherited behavior).

**`(getSubSpec)` / `getSubSpec()`**
- Returns the actual sub-spec (the children as provided).

**`(setSubSpec ...)` / `setSubSpec(...)`**
- Sets the sub-spec normally (inherited behavior).

## CSR Feature Derivation

At `getDOM()` call time, the feature name is derived as follows:

1. `subSpec = getSubSpec()` — the children stored in the sub-spec.
2. `compType = subSpec.at([0, 0])` — item 0 of the sub-spec is the original component spec; item 0 of *that* spec is the component type string.
3. `ftr = registry.get(compType)?.at('ftr')` — the feature promise name from the registry entry.

If any step fails (no sub-spec, no component type, no registry entry, no `ftr`), `getDOM()` returns an empty NANOS that is never populated. This is the "no gate" case — the content is permanently suppressed.

## Usage Examples

### Automatic Creation via `from()`

```javascript
const doc = getInstance('MWIDocument');

// Register deferred component (feature, but no interface yet)
registry.register('my.heavy', ls([
    'ftr', 'mwi.comp.MyHeavy'
]));

// from() creates m.defer with the original spec as children
const node = doc.from({ item: ps('[(my.heavy class=widget data-value=42)]') });
// node is MWICoreDefer; sub-spec contains [my.heavy class=widget data-value=42]

// SSR: (empty - no output)
node.getHTML(); // ''

// CSR: empty NANOS initially; populated when mwi.comp.MyHeavy resolves
const domNodes = node.getDOM(); // reactive NANOS, initially empty
```

### Explicit Creation

```javascript
const doc = getInstance('MWIDocument');

// Synchronous - creates defer node
const node = doc.createNode('my.heavy');
// node is MWICoreDefer (type is 'my.heavy', msjsType is 'MWICoreDefer')
// sub-spec is empty (no children enriched via createNode alone)
```

### Async Loading (Bypass Defer)

```javascript
// Asynchronous - waits for load, returns actual component
const node = await doc.createNodeWait('my.heavy');
// node is actual MyHeavy component (renders normally)
```

### In Document (Mixed Content)

```javascript
const doc = getInstance('MWIDocument');

doc.append({ list: ps(`[(
    [h.div class=container
        [h.h1 "Page Title"]
        [my.heavy class=widget]
        [h.p "More content"]
    ]
)]`)});

// If my.heavy is deferred, SSR output:
// <div class="container">
//   <h1>Page Title</h1>
//   (nothing from my.heavy - placeholder doesn't render)
//   <p>More content</p>
// </div>

// At CSR, when mwi.comp.MyHeavy resolves, the widget appears reactively.
```

### Checking Node Type

```javascript
const node = doc.createNode('my.heavy');
node.msjsType === 'MWICoreDefer';  // true
node.type === 'm.defer';          // true

node.getHTML() === '';             // true (no SSR output)
node.getDOM().size === 0;          // true initially (gate not yet open)
```

## Design Rationale

### Why No SSR Rendering?

- The final content isn't available until after the deferred component has loaded.
- SSR is a snapshot; deferred content is inherently a CSR concern.
- Not rendering unnecessary placeholder elements keeps SSR-generated HTML smaller.
- Per [`v5-arch/ssr-csr-hydration-v2.md`](../v5-arch/ssr-csr-hydration-v2.md), the sync walk skips `m.defer` nodes (no DOM nodes to assimilate).

### Why Carry Children?

- The new `m.defer` carries the full content spec so that when the gate opens, the content "just magically appears" — the system already has everything it needs to render it.
- This eliminates the need for a feature-name attribute; the feature name is derived at CSR time from the registry entry for the component type in the sub-spec.

### Why `autoDoc: false`?

- Prevents premature rendering before the feature becomes available.
- The sub-doc is not auto-populated from the sub-spec; the `getDOM` handler explicitly renders children only after `fwait(ftr)` resolves.

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIHTML`](MWIHTML-HTML-elements.md) - Extended interface (rendering methods overridden)
- [`MWIDocument`](MWIDocument-document.md) - Creates defer nodes automatically
- [`MWIRegistry`](MWIRegistry-registry.md) - Determines when to create defer nodes; provides `ftr` for feature derivation
