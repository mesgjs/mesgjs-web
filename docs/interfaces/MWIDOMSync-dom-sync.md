# MWIDOMSync - DOM Synchronization Interface

**Interface:** `MWIDOMSync`  
**Source:** [`src/mwi-doc-node.msjs`](../src/mwi-doc-node.msjs)  
**Type:** Multi-instance  
**Status:** ACTIVE

## Overview

`MWIDOMSync` is a specialized interface used during SSR-to-CSR hydration to match and reuse existing DOM nodes rather than creating new ones. It maintains a cursor position while walking through SSR-generated DOM, attempting to match each doc-node to an existing DOM node.

## Key Responsibilities

- Maintain current position (cursor) in SSR DOM tree
- Match doc-nodes to existing DOM nodes by tag, content, or ID
- Advance cursor as matches are found
- Enable graceful fallback when matches fail

## Core Concept

When MWI renders on the server, it produces HTML that the browser parses into a DOM tree. When the client-side MWI runtime initializes with the same doc tree, it needs to connect to (hydrate) the existing DOM rather than creating duplicate nodes. `MWIDOMSync` facilitates this by:

1. Starting at a specific DOM node (the cursor)
2. Attempting to match each doc-node to the next appropriate DOM node
3. Advancing the cursor when matches succeed
4. Returning `undefined` when matches fail (triggering regeneration)

## Operations

### Instantiation

**Mesgjs:** `@c(get MWIDOMSync init=[startNode])`  
**JavaScript:** `getInstance('MWIDOMSync', [startNode])`

- `startNode` - The DOM node where synchronization should begin
- Typically `document.body.firstChild` or the first child of a container element
- Returns the `MWIDOMSync` instance

**Example:**
```javascript
// Start synchronizing from the beginning of document.body
const sync = getInstance('MWIDOMSync', [document.body.firstChild]);
```

### Cursor Position

**`(cursor)` / `.cursor`**
- Returns the current sync cursor position (a DOM node)
- Read-only property
- Advanced automatically by successful `sync()` calls

### Sync Operation

**`(sync tag docNode)` / `sync(tag, docNode)`**

Attempts to match the next DOM node to the provided doc-node.

**Parameters:**
- `tag` - Node type identifier:
  - `'m.t'` for text nodes
  - `'m.com'` for comment nodes
  - HTML tag name (e.g., `'DIV'`, `'SPAN'`) for element nodes
- `docNode` - The doc-node being matched (used for content comparison and ID lookup)

**Returns:**
- Matching DOM node if found (cursor advances)
- `undefined` if no match (cursor unchanged)

**Matching Strategy:**

1. **Text/Comment Match:**
   - If `tag` is `'m.t'` or `'m.com'` and cursor matches both type AND content:
     - Advance cursor to `.nextSibling`
     - Return the matching node

2. **Skip Normalized Nodes:**
   - While cursor is a text or comment node (that didn't match in step 1):
     - Advance to `.nextSibling`
   - This handles browser normalization of adjacent text/comment nodes

3. **Tag Match:**
   - If cursor's tag name matches the `tag` parameter:
     - Advance cursor to `.nextSibling`
     - Return the matching node

4. **ID-based Resync:**
   - If doc-node has an `id` attribute and `document.getElementById()` finds it:
     - Advance cursor to `.nextSibling` of the located node
     - Return the located node
   - This enables recovery from structural mismatches

5. **No Match:**
   - Do not advance cursor
   - Return `undefined`
   - Caller will regenerate the node and insert via `domSyncChildren`

## Usage Examples

### Basic Hydration Flow

```javascript
// Server generates HTML into document
const html = doc.getHTML();
// ... send to browser, browser parses into DOM ...

// Client: Create sync cursor starting at body's first child
const sync = getInstance('MWIDOMSync', [document.body.firstChild]);

// Client: Render in sync mode to connect to existing DOM
const dom = doc.getDOM({ sync });
```

### Component Integration

Components that create DOM elements use `sync` to determine whether to reuse or create:

```javascript
// Inside a component's getDOM handler
function opGetDOM(d) {
    const m = d.mp, sync = m.at('sync');
    const tag = 'DIV';  // This component renders <div> elements
    
    // Try to match existing DOM node
    let elem = sync?.sync(tag, d.rr);
    
    if (!elem) {
        // No match - create new element
        elem = document.createElement('div');
    }
    
    // Set up reactive attributes and children...
    
    return elem;
}
```

### Transparent Components

Transparent components (such as templates) pass sync through to their children:

```javascript
// Pass existing sync to sub-DOM rendering
const subDOM = node.getSubDOM({ sync });
```

### Container Components

Container components (typically, non-void HTML elements) create a new `MWIDOMSync` node for their children (when passed a sync node themselves).

```javascript
// Pass new sync to sub-DOM rendering (excerpts)
const m = d.mp, sync = m.at('sync');
const existing = sync && sync('sync', [type, d.rr]);
const subSync = existing?.firstChild && getInstance('MWIDOMSync', [existing.firstChild]);
const subDOM = node.getSubDOM({ sync: subSync });
```

### Multi-Region Components

Components with managed regions (like [`m.head`](MWICoreHeadBody-head-body.md) and [`m.body`](MWICoreHeadBody-head-body.md)) create new sync instances for their managed regions:

```javascript
// Get the managed region boundaries
const { begin, end } = getManagedRegion(elem);

// Create new sync starting after the begin boundary
const regionSync = sync && getInstance('MWIDOMSync', [begin.nextSibling]);

// Sync managed children
const children = node.getSubDOM({ sync: regionSync });
domSyncManagedChildren(elem, children);
```

## Structural Mismatch Handling

When sync fails (returns `undefined`), components handle it gracefully:

1. **Generate new node:** Create the DOM node as if sync mode wasn't active
2. **Insert/replace:** Use `domSyncChildren` or similar to insert the new node
3. **Continue:** The next doc-node will attempt to sync with the next DOM node

This ensures maximum reuse of SSR DOM while regenerating only what's necessary.

## Common Mismatch Cases

### Browser Text Node Normalization

Adjacent text nodes in HTML are often merged by the browser:
- **SSR output:** Multiple `Text` nodes
- **Browser DOM:** Single merged `Text` node
- **Sync behavior:** Skip and regenerate normalized nodes

### Comment Node Merging

Similar to text nodes, comments may be normalized or removed by the browser.

### CSR-Only Nodes (`m.csr`)

Nodes marked with `m.csr` attribute are not rendered during SSR:
- **SSR output:** Nothing
- **Browser DOM:** Missing
- **Sync behavior:** Returns `undefined`, node is generated and inserted

### Deferred Components (`m.defer`)

Components wrapped in `m.defer` are not rendered during SSR:
- **SSR output:** Nothing  
- **Browser DOM:** Missing
- **Sync behavior:** Not relevant (defer waits for feature, then renders)

## ID-Based Resynchronization

The ID-based resync strategy (step 4 in matching) provides recovery from structural mismatches:

```javascript
// Doc tree:
//   <div id="outer">
//     <p>Text</p>  ← Mismatched (e.g., different tag during SSR)
//     <div id="recoverable">Content</div>
//   </div>

// During sync:
// 1. Try to sync <p> - fails (tag mismatch)
// 2. Regenerate <p> and insert
// 3. Try to sync <div id="recoverable">
//    - Tag doesn't match cursor position (now <div> in HTML)
//    - BUT doc-node has id="recoverable"
//    - Use getElementById to locate and resync
//    - Successfully continue from that point
```

This makes hydration resilient to minor SSR/CSR differences.

## Performance Considerations

- **Matching is fast:** Simple property checks and comparisons
- **ID lookup is rare:** Only used on mismatch recovery
- **Cursor advances sequentially:** O(n) walk through DOM tree
- **No deep inspection:** Each node checked once

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base node interface, defines `getDOM({ sync })`
- [`MWIDocument`](MWIDocument-document.md) - Document coordinator, defines document-level `getDOM({ sync })`
- [`MWICoreHeadBody`](MWICoreHeadBody-head-body.md) - Example of managed-region sync

## Related Documentation

- [SSR-CSR Hydration Architecture](../../v5-arch/ssr-csr-hydration-v2.md) - Complete hydration strategy
- [Core Architecture](../../v5-arch/core-architecture.md) - System overview including sync mode

[supplemental keywords: hydration, rehydration, SSR DOM reconnection, client-side takeover, progressive enhancement, DOM assimilation, sync mode, structural mismatch, text node normalization, DOM cursor]
