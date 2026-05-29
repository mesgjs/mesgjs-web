# MWICoreDefer - Deferred Component Placeholder

**Interface:** `MWICoreDefer`  
**Component Type:** `m.defer`  
**Attributes:** Void
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 109-153)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

`MWICoreDefer` represents a placeholder for components that haven't been loaded yet. It's created automatically by `(createNode ...)` when a component is registered but not yet loaded (has `ftr` but no `if` or `tpl`).

## Behavior

- **Automatic Creation:** Created by `createNode()` for deferred components
- **Renders as Slot:** Renders as `<slot>` element with metadata
- **Attribute Filtering:** Only `id` and `data-mwi-defer` render to HTML
- **No Children:** Cannot have children (`autoDoc = false`)
- **Auto-ID:** Automatically assigns unique ID for easy targeting

## Schema

```javascript
{
  autoDoc: false,  // Children not validated until actual component loads
  htmlAllowAttr: new Set(['id', 'data-mwi-defer'])  // Only these render to HTML
}
```

## Attributes

**`m.deferType`** (string, internal)
- Original component type that was deferred
- Stored internally but not rendered to HTML

**`data-mwi-defer`** (string, rendered)
- Original component type
- Rendered to HTML for inspection
- Allows identification of deferred components

**`id`** (string, rendered)
- Auto-assigned unique element ID if not provided
- Rendered to HTML
- Allows easy DOM targeting for replacement

**Other attributes:**
- Preserved internally from original spec
- Not rendered to HTML (filtered by `htmlAllowAttr`)
- Available when component loads

## Operations

### Inherited from MWIHTML

See [`MWIHTML`](MWIHTML-HTML-elements.md) for inherited operations from [`MWIDocNode`](MWIDocNode-document-node.md).

### Defer-Specific

**`@init`**
- Captures original deferred type
- Changes node type to `h.slot`
- Sets `m.deferType` and `data-mwi-defer` attributes

**`(getHTML)` / `getHTML()`**
- Auto-assigns ID via `m.id` if `id` was not specified
- Delegates to `MWIHTML` (renders as `<slot>`)
- Only `id` and `data-mwi-defer` attributes render

**`(getDOM)` / `getDOM()`**
- Auto-assigns ID via `m.id` if `id` was not specified
- Delegates to `MWIHTML` (creates `<slot>` element)
- Only `id` and `data-mwi-defer` attributes render

**`(append node...)` / `append(...nodes)`**
- No-op (defer nodes don't accept children)

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (ignores children)

## HTML Attribute Filtering

The `htmlAllowAttr` schema property prevents premature rendering of:
- **Visual styling:** `class`, `style` attributes
- **Event handlers:** `onclick`, `onload`, etc.
- **ARIA attributes:** Would be on wrong element type
- **Custom IDs:** The component, when loaded, is responsible for replacing the node or using new ids in order to avoid conflict
- **Data attributes:** Might trigger unintended JavaScript

Only `id` (for targeting) and `data-mwi-defer` (for identification) are rendered.

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
// Creates MWICoreDefer placeholder instead

// SSR: <slot id="_MS_0" data-mwi-defer="my.heavy"></slot>
// CSR: <slot id="_ML_0" data-mwi-defer="my.heavy"></slot>
```

### With Attributes

```javascript
// Original spec with attributes
const spec = ps('[(my.heavy class=widget data-value=42)]');
const node = doc.from({ item: spec });

// Attributes preserved internally but not rendered
// SSR: <slot id="_MS_0" data-mwi-defer="my.heavy"></slot>
// (class and data-value filtered out)
```

### Async Loading

```javascript
// Synchronous - creates defer node
const node1 = doc.createNode('my.heavy');
// node1 is MWICoreDefer

// Asynchronous - waits for load
const node2 = await doc.createNodeWait('my.heavy');
// node2 is actual MyHeavy component
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
//   <slot id="_MS_0" data-mwi-defer="my.heavy"></slot>
//   <p>More content</p>
// </div>
```

### Identifying Defer Nodes

```javascript
// In browser, find defer nodes
const deferNodes = document.querySelectorAll('[data-mwi-defer]');
deferNodes.forEach(node => {
    console.log('Deferred:', node.dataset.mwiDefer);
    console.log('ID:', node.id);
});
```

### Future Replacement

```javascript
// Placeholder for future enhancement:
// Replace defer node with actual component after load

const deferNode = doc.createNode('my.heavy');
const domNodes = deferNode.getDOM();
const slotElement = domNodes.at(0);

// Later, after component loads:
// 1. Create actual component
// 2. Replace slot element in DOM
// 3. Update doc-node reference
```

## Design Rationale

### Why Render as `<slot>`?

- **Valid HTML:** `<slot>` is a valid HTML element
- **Semantic:** Represents "content to be filled in"
- **Targetable:** Easy to find (with e.g. `querySelector` or `getElementById`) and replace
- **Visible:** Can be styled for debugging

### Why Filter Attributes?

Prevents issues like:
- Visual styling applied to wrong element type
- Event handlers on placeholder instead of actual component
- ARIA attributes on semantically incorrect element
- ID conflicts between placeholder and actual component
- Unintended JavaScript behavior from data attributes

### Why Auto-Assign ID?

- **Targeting:** Easy to locate in DOM for replacement
- **Uniqueness:** Prevents conflicts
- **Debugging:** Clear identification of defer nodes

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIHTML`](MWIHTML-HTML-elements.md) - Extended interface (renders as h.slot)
- [`MWIDocument`](MWIDocument-document.md) - Creates defer nodes automatically
- [`MWIRegistry`](MWIRegistry-registry.md) - Determines when to create defer nodes
