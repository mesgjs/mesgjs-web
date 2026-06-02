# MWICoreDefer - Deferred Component Placeholder

**Interface:** `MWICoreDefer`  
**Component Type:** `m.defer`  
**Attributes:** None (placeholder only)  
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 117-133)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

`MWICoreDefer` represents a non-rendering placeholder for components that haven't been loaded yet. It's created automatically by `(createNode ...)` when a component is registered but not yet loaded (has `ftr` but no `if` or `tpl`).

## Behavior

- **Automatic Creation:** Created by `createNode()` for deferred components
- **No Rendering:** Does not render to HTML or DOM (placeholder in doc-tree only)
- **No Children:** Cannot have children (`autoDoc = false`)
- **Attribute Storage:** Can store attributes but they're not rendered

## Schema

```javascript
{
  autoDoc: false  // Children not allowed
}
```

## Attributes

All attributes are stored on the node but **not rendered** (since the node doesn't render at all). Attributes are available for the actual component when it loads.

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for basic node operations (attribute management, etc.).

### Defer-Specific

**`(getHTML)` / `getHTML()`**
- Returns empty string (no rendering)

**`(getDOM)` / `getDOM()`**
- Returns empty NANOS (no rendering)

**`(append node...)` / `append(...nodes)`**
- No-op (defer nodes don't accept children)
- Returns self (chainable)

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (ignores children)
- Returns self (chainable)

## Usage Examples

### Automatic Creation

```javascript
const doc = getInstance('MWIDocument');

// Register deferred component
registry.register('my.heavy', ls([
    'ftr', 'mwi.comp.MyHeavy'  // Feature, but no interface yet
]));

// Create node synchronously
const node = doc.createNode('my.heavy');
// Creates MWICoreDefer placeholder (doesn't render)

// SSR: (empty - no output)
// CSR: (empty - no DOM nodes)
```

### With Attributes

```javascript
// Original spec with attributes
const spec = ps('[(my.heavy class=widget data-value=42)]');
const node = doc.from({ item: spec });

// Attributes are stored on the node but not rendered
node.getAttr('class'); // 'widget'
node.getAttr('data-value'); // '42'

// Rendering produces nothing
node.getHTML(); // ''
node.getDOM(); // empty NANOS
```

### Async Loading

```javascript
// Synchronous - creates defer node
const node1 = doc.createNode('my.heavy');
// node1 is MWICoreDefer (doesn't render)

// Asynchronous - waits for load
const node2 = await doc.createNodeWait('my.heavy');
// node2 is actual MyHeavy component (renders normally)
```

### In Document

```javascript
const doc = getInstance('MWIDocument');

// Mix of loaded and deferred components
doc.append({ list: ps(`[(
    [h.div class=container
        [h.h1 "Page Title"]
        [my.heavy class=widget]
        [h.p "More content"]
    ]
)]`)});

// If my.heavy is deferred:
// <div class="container">
//   <h1>Page Title</h1>
//   (nothing from my.heavy - placeholder doesn't render)
//   <p>More content</p>
// </div>
```

### Checking Node Type

```javascript
// Identify defer nodes programmatically
const node = doc.createNode('my.heavy');
node.msjsType === 'MWICoreDefer';  // true
node.type === 'my.heavy';  // true (keeps original type)

// Check if rendering would produce output
node.getHTML() === '';  // true (no output)
node.getDOM().size === 0;  // true (no DOM nodes)
```

## Design Rationale

### Why No Rendering?

- The final content isn't available until after the deferred component has loaded
- MWI doesn't need it; CSR rendering will generate any required nodes and automatically put them in the correct place when `m.defer` is replaced in the doc-spec
- An empty `<script>` element is the only placeholder that would be valid in both the `<head>` and `<body>` sections
- Not rendering unnecessary, empty `<script>` elements keeps SSR-generated HTML smaller

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIHTML`](MWIHTML-HTML-elements.md) - Extended interface (but rendering methods overridden)
- [`MWIDocument`](MWIDocument-document.md) - Creates defer nodes automatically
- [`MWIRegistry`](MWIRegistry-registry.md) - Determines when to create defer nodes
