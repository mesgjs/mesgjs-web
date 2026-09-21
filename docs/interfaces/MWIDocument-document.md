# MWIDocument - Document Coordinator

**Interface:** `MWIDocument`  
**Source:** [`src/mwi-document.msjs`](../src/mwi-document.msjs)  
**Type:** Multi-instance  
**Status:** ACTIVE

## Overview

`MWIDocument` coordinates rendering for a single document instance. It manages the document root, node creation, and provides utilities for converting specs to nodes.

## Key Responsibilities

- Doc-node creation and management
- Root fragment management (`m.frg`)
- Spec-to-node conversion
- Content and style aggregation coordination
- SSR aggregation placeholder substitution and lifecycle management
- Reactive NANOS creation helper

## Operations

### Node Creation

**`(createNode type slotSrc=node?)` / `createNode(type, { slotSrc })`**
- Creates doc-node synchronously
- If component loaded → Creates actual node
- If component deferred → Creates `MWICoreDefer` placeholder
- Throws `TypeError` if component doesn't exist

**`(createNodeWait type slotSrc=node?)` / `createNodeWait(type, { slotSrc })`**
- Creates doc-node asynchronously
- Waits for deferred components to load
- Always creates actual component (never defer)
- Throws `TypeError` if component doesn't exist

### Content Conversion

**`(from item=spec? list=spec? slotSrc=node?)` / `from({ item, list, slotSrc })`**
- Converts specs to doc-nodes synchronously
- `item` - Single spec (string or NANOS)
- `list` - Multiple specs (SLID string or NANOS)
- Returns single node (for `item`) or array of nodes (for `list`)
- May create `MWICoreDefer` nodes for unloaded components

**`(fromWait item=spec? list=spec? slotSrc=node?)` / `fromWait({ item, list, slotSrc })`**
- Converts specs to doc-nodes asynchronously
- Waits for all deferred components to load
- Returns promise for nodes
- Never creates `MWICoreDefer` nodes

### Content Appending

**`(append node... item=spec? list=spec? slotSrc=node?)` / `append(...nodes)` / `append({ item, list, slotSrc })`**
- Appends to document root synchronously
- Accepts positional nodes or `item`/`list` parameters
- Converts specs via `(from ...)` if needed
- May create `MWICoreDefer` nodes

**`(appendWait node... item=spec? list=spec? slotSrc=node?)` / `appendWait(...nodes)` / `appendWait({ item, list, slotSrc })`**
- Appends to document root asynchronously
- Waits for deferred components when converting
- Returns promise
- Never creates `MWICoreDefer` nodes

### Rendering

**`(getHTML node?)` / `getHTML(node?)`**
- Returns HTML string for the entire document (or specific `node` if provided)
- Synchronous operation
- Renders initial HTML and recursively replaces aggregation `<{id}>` placeholders
- Supports both static buffer substitution and dynamic callback-function entries (`entry('getHTML', doc)`)
- Preserves placeholders inside HTML comments, `<script>`, and `<style>` blocks without corrupting them

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- Returns reactive NANOS of DOM nodes
- Synchronous initial render
- Uses a two-pass mechanism during initial CSR (`initialCSR` flag) to ensure collector/`to` nodes register before render/`from` nodes evaluate
- Delegates to root fragment's `getDOM()`
- **`sync` parameter (optional):** [`MWIDOMSync`](MWIDOMSync-dom-sync.md) instance for SSR-CSR hydration
  - Pass a `MWIDOMSync` instance to enable sync mode during hydration
  - Typically initialized with `document.body.firstChild` or similar to start matching from existing SSR DOM
  - See [SSR-CSR Hydration](../../v5-arch/ssr-csr-hydration-v2.md) for complete hydration workflow

### Aggregation & Coordination

**`(getAggr clear=@f)` / `getAggr({ clear? } = {})`**
- Returns the document's aggregation data map (`Map<bufferName, data | callback>`)
- If `clear: true` is passed, invokes `clearAggr()` before returning the cleared map

**`(mapAggrBuffer name)` / `mapAggrBuffer(name)`**
- Assigns and returns a numeric buffer ID for the specified aggregation buffer name
- Used by aggregation `from` / render nodes (`m.aggr`, `m.script`, `m.style`, `m.stag`) to generate placeholder tokens (`<{id}>`)

**`static compareNodePaths(a, b)`**
- Compares two doc-node path arrays for ordering
- Returns negative if `a < b`, `0` if equal, and positive if `a > b`
- Used to sort registered collector nodes by deterministic document tree-traversal order in CSR

### Utilities

**`(root)` / `.root`**
- Returns document root (`m.frg` fragment)
- Synchronous property access

**`(registry)` / `registry()`**
- Returns `MWIRegistry` singleton instance

**`(nextId)` / `nextId()`**
- Returns next unique element ID
- Delegates to registry's `nextId()`

**`(getDocById id)` / `getDocById(id)`**
- Retrieves doc-node by its `id` attribute
- Accepts string or number (numbers normalized to strings)
- Returns the doc-node or `undefined` if not found
- Works for any live doc-node, even if disconnected from rendering tree
- See [`id` attribute documentation](MWIDocNode-document-node.md#id---node-id-attribute) for important behaviors

**`rxNANOS(...args)`**
- Creates reactive NANOS instance
- Helper for creating reactive storage
- Optionally accepts initial values

## Document Root

Every document has an `m.frg` fragment as its root:
- Created automatically during `@init`
- All content appended to root
- Root manages top-level rendering

## Usage Examples

### Basic Document Creation

```javascript
const doc = getInstance('MWIDocument');

// Create nodes
const div = doc.createNode('h.div');
div.setAttr('class', 'container');

// Append to document
doc.append(div);

// Render
const html = doc.getHTML();
const domNodes = doc.getDOM();
```

### Content Conversion

```javascript
// From single item
const node = doc.from({ item: 'Hello' });
// Creates m.t text node

// From spec
const node = doc.from({ 
    item: ps('[(h.div class=box "Content")]')
});

// From list
const nodes = doc.from({ 
    list: ps('[(first [h.span "First"] last [h.span "Last"])]')
});
```

### Async Operations

```javascript
// Wait for deferred components
const node = await doc.createNodeWait('my.deferred');

// Convert with waiting
const nodes = await doc.fromWait({ 
    list: ps('[([my.deferred "Content"])]')
});

// Append with waiting
await doc.appendWait({ 
    list: ps('[([my.deferred "Content"])]')
});
```

### Reactive NANOS

```javascript
// Create reactive storage
const attrs = doc.rxNANOS();
attrs.set('class', 'active');

// With initial values
const list = doc.rxNANOS(['item1', 'item2']);
```

### SSR-CSR Hydration (Sync Mode)

```javascript
// Define page spec
const pageSpec = ps(`[(
	[h.div id=app class=container
		[h.h1 "Welcome"]
		[h.p "Server-rendered content"]
	]
)]`);

// Server: Generate HTML from spec
const doc = getInstance('MWIDocument');
doc.append({ list: pageSpec });
const html = doc.getHTML();
// Outputs: <div id="app" class="container"><h1>Welcome</h1><p>Server-rendered content</p></div>
// Send HTML to browser...

// Client: Browser has parsed HTML into existing DOM
// Reconstruct same doc tree from same spec
const doc = getInstance('MWIDocument');
doc.append({ list: pageSpec });

// Create sync cursor starting at existing DOM
const sync = getInstance('MWIDOMSync', [document.body.firstChild]);

// Render in sync mode - connects to existing DOM instead of creating new nodes
const dom = doc.getDOM({ sync });
// dom contains the existing DOM nodes, now connected to reactive system
// Future reactive updates will modify the existing DOM

// See MWIDOMSync and SSR-CSR Hydration docs for complete details
```

## Content & Style Aggregation Protocol

`MWIDocument` coordinates document-wide content and style aggregation via `getAggr()`, `mapAggrBuffer()`, and post-render placeholder substitution in `getHTML()`.

### Placeholder Substitution

1. Render / `from` nodes request a numeric buffer ID via `mapAggrBuffer(name)` and emit `<{id}>` into the SSR stream.
2. After the root fragment renders, `getHTML()` scans for `<{id}>` tokens (skipping HTML comments, `<script>`, and `<style>` blocks).
3. For each token, `getHTML()` looks up the registered entry in `aggrData`:
   - **Static Buffer Map (`Map<key, renderedHTML>` or array):** Concatenates all rendered values.
   - **Dynamic Callback Function (`function(action, doc)`):** Invokes `callback('getHTML', doc)` and recursively processes the returned HTML string.

### Aggregation Lifecycle & Cleanup

When document state is cleared via `getAggr({ clear: true })` or `clearAggr()`:
- Scans `aggrData` for function entries and calls `callback('clear', doc)` to allow modules (such as `MWIStyleAggr`) to clean up document-scoped `WeakMap` state.
- Resets buffer IDs and clears internal maps.

## Related Interfaces

- [`MWIRegistry`](MWIRegistry-registry.md) - Component registry
- [`MWIDocNode`](MWIDocNode-document-node.md) - Base node interface
- [`MWICoreFrag`](MWICoreFrag-fragment.md) - Document root type
- [`MWIAggr`](MWIAggr-aggregate-content.md) - Content aggregation (`m.aggr`)
- [`MWIAggrScript`](MWIAggrScript-script-style.md) - Script and stylesheet aggregation (`m.script`, `m.style`)
- [`MWIStyleAggr`](MWIStyleAggr-style-aggregation.md) - CSS style-value aggregation (`m.stag`)
- [`MWIDOMSync`](MWIDOMSync-dom-sync.md) - SSR-CSR DOM synchronization
