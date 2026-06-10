# MWIAggr - Aggregate Content

**Interface:** `MWIAggr`  
**Component Type:** `m.aggr`  
**Source:** [`src/mwi-aggr-comp.msjs`](../src/mwi-aggr-comp.msjs)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

`MWIAggr` implements **content aggregation** — a mechanism for collecting content from distributed locations in the document tree and rendering it in a single place. This is useful for patterns like:

- **Table of contents:** Collecting headings from throughout the document and rendering them in a sidebar
- **Script/style aggregation:** Collecting scripts and stylesheets from components and rendering them in `<head>`
- **Message threads:** Collecting items from multiple sources and rendering them in order

The component operates in two modes:

- **`to` mode** (`[m.aggr to=bufferName? content...]`): Aggregates children to the specified buffer
- **`from` mode** (`[m.aggr from=bufferName]`): Renders the content from the specified buffer

The **default buffer name** is `default`. A `from` attribute is required to render; without it, the node is in `to` mode.

## Behavior

### SSR Behavior

- **`to` mode:** Renders children to HTML and stores the result in the document's aggregation map. Returns empty string.
- **`from` mode:** Renders a placeholder `<{bufferId}>` for later substitution by `MWIDocument.getHTML()`. The buffer ID is allocated via `mapAggrBuffer()`.
- **`m.csr` attribute:** If set to a truthy value, suppresses all SSR output (both `to` and `from` modes return empty string, and `to` mode does not store content).

### CSR Behavior

- **`to` mode:** Registers this node's sub-doc with the reactive buffer on `getDOM()` call. Returns an empty reactive NANOS (the `to` node itself renders nothing).
- **`from` mode:** Reactively renders the buffer's current content in node-path order. Returns a reactive NANOS that updates as the buffer changes.
- **CSR-only fallback:** In `from` mode, if the buffer is empty (no `to` nodes registered), the node falls back to rendering its own sub-doc. SSR does not support conditional aggregate rendering, so fallback content, when supplied, is only available during the CSR phase.

### `autoDoc: false`

The `m.aggr` component uses `autoDoc: false`, meaning children are stored in the sub-spec but are **not** auto-rendered. Rendering is controlled by the `getHTML`/`getDOM` handlers.

### `subSlotSrc` (pass-through)

`m.aggr` is a non-source node: `subSlotSrc` returns the parent's `slotSrc`, making it transparent to the slotting hierarchy.

## Schema

```javascript
{
  autoDoc: false  // Children not auto-rendered; rendering is controlled by handlers
}
```

## Attributes

**`from`** (string, optional)
- Puts the node in `from` mode: renders content from the named buffer
- If absent, the node is in `to` mode

**`to`** (string, optional)
- In `to` mode: specifies the named buffer to aggregate content into
- If absent in `to` mode, uses the default buffer (`default`)

**`m.csr`** (boolean, optional)
- If truthy, suppresses all SSR output
- Useful for content that should only appear in CSR (e.g., dynamic content that has no SSR representation)

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for basic node operations (attribute management, sub-spec, etc.).

### Aggregate-Specific

**`(getHTML)` / `getHTML()`**
- **`to` mode:** Renders children to HTML, stores in aggregation map, returns `''`
- **`from` mode:** Returns `<{bufferId}>` placeholder string
- **`m.csr` set:** Returns `''` regardless of mode

**`(getDOM)` / `getDOM()`**
- **`to` mode:** Registers this node in the reactive buffer, returns empty reactive NANOS
- **`from` mode:** Returns reactive NANOS of DOM nodes from all registered `to` nodes (sorted by node path)
- **`from` mode (empty buffer):** Falls back to rendering own sub-doc (CSR-only fallback)
- Result is cached: subsequent calls return the same NANOS instance

## MWIDocument Integration

`MWIAggr` works in conjunction with `MWIDocument` for SSR placeholder replacement:

**`(getAggr clear=@f)` / `getAggr({ clear? })`**
- Returns the document's aggregation `Map<bufferKey, bufferData>`
- `bufferKey` format: `<namespace>:<bufferName>` (e.g., `m.aggr:default`)
- SSR buffer values are `Map<Symbol, renderedHTML>` (non-deduplicating)
- CSR buffer values are reactive NANOS lists of doc-tree nodes
- `clear: true` clears all aggregated data and resets buffer IDs

**`(mapAggrBuffer name)` / `mapAggrBuffer(name)`**
- Maps a buffer key string to a numeric buffer ID (allocated sequentially from 0)
- Returns the existing ID if already allocated
- **`(mapAggrBuffer id)` / `mapAggrBuffer(id)`** (reverse lookup)
- Maps a numeric buffer ID back to the buffer key string

**`(getHTML)` / `getHTML()`** (document-level)
- After rendering, replaces `<{bufferId}>` placeholders with aggregated content
- Processes placeholders recursively (aggregated content may itself contain placeholders)
- Skips placeholders inside HTML comments, `<script>`, and `<style>` tags
- **First reference:** Renders content normally
- **Second reference:** Issues `console.warn` and renders nothing (prevents loops)
- **Third+ references:** Renders nothing silently

## Usage Examples

### Basic Aggregation (SSR + CSR)

```javascript
const doc = getInstance('MWIDocument');

// `from` node: renders aggregated content here
const fromNode = doc.createNode('m.aggr');
fromNode.setAttr('from', 'default');

// `to` node: contributes content to the buffer
const toNode = doc.createNode('m.aggr');
toNode.setSubSpec({ subSpec: ps('[([h.p "Aggregated paragraph"])]') });

doc.append(fromNode, toNode);

// SSR: getHTML() replaces placeholder with aggregated content
const html = doc.getHTML();
// html: '<p>Aggregated paragraph</p>'

// CSR: getDOM() returns reactive NANOS with aggregated DOM nodes
const domNodes = doc.getDOM();
await reactive.wait();
// domNodes.at(0).tagName === 'P'
```

### Named Buffers

```javascript
// Aggregate scripts to a named buffer
const scriptTo = doc.createNode('m.aggr');
scriptTo.setAttr('to', 'head-scripts');
scriptTo.setSubSpec({ subSpec: ps('[([h.script type=text/javascript "console.log(1)"])]') });

// Render from the named buffer
const scriptFrom = doc.createNode('m.aggr');
scriptFrom.setAttr('from', 'head-scripts');

doc.append(scriptFrom, scriptTo);
const html = doc.getHTML();
// html: '<script type="text/javascript">console.log(1)</script>'
```

### CSR-Only Fallback

```javascript
// `from` node with fallback content (shown when buffer is empty)
const fromNode = doc.createNode('m.aggr');
fromNode.setAttr('from', 'dynamic-content');
fromNode.setSubSpec({ subSpec: ps('[([h.p "Loading..."])]') });

const domNodes = fromNode.getDOM();
await reactive.wait();
// domNodes.at(0).textContent === 'Loading...' (fallback shown)

// Later, when a `to` node is added:
const toNode = doc.createNode('m.aggr');
toNode.setAttr('to', 'dynamic-content');
toNode.setSubSpec({ subSpec: ps('[([h.p "Loaded content"])]') });
toNode.getDOM(); // Register in buffer

await reactive.wait();
// domNodes.at(0).textContent === 'Loaded content' (fallback replaced)
```

### SSR-Only Content (m.csr suppression)

```javascript
// Content that should only appear in CSR (not SSR)
const csrOnlyNode = doc.createNode('m.aggr');
csrOnlyNode.setAttr('from', 'csr-only');
csrOnlyNode.setAttr('m.csr', true);
// SSR: getHTML() returns '' (suppressed)
// CSR: getDOM() renders normally
```

### SLID Syntax

```
[m.aggr from=toc]                    // from mode: render TOC buffer
[m.aggr to=toc [h.li "Chapter 1"]]  // to mode: add to TOC buffer
[m.aggr [h.li "Chapter 2"]]         // to mode: add to default buffer
```

## Ordering

In CSR, content from multiple `to` nodes is sorted by **node path** (tree-traversal order) before rendering. This ensures consistent ordering regardless of when nodes are registered. The `compareNodePaths()` utility on `MWIDocument` is used for this comparison.

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIDocument`](MWIDocument-document.md) - Provides `getAggr()`, `mapAggrBuffer()`, and placeholder-replacing `getHTML()`
- [`v5-arch/aggregate-content-v2.md`](../../v5-arch/aggregate-content-v2.md) - Architectural plan

## Supplemental Keywords

[supplemental keywords: teleport, portal, head management, content projection, slot forwarding, aggregation, content collection, content hoisting, deduplication, table of contents, TOC, script injection, style injection, head injection]
