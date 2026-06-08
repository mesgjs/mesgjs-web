# Aggregate Content — Architectural Plan V2

**Status:** DRAFT  
**Date:** 2026-05-31  
**Last updated:** 2026-06-07  
**Purpose:** Unified architectural plan for SSR and CSR content aggregation with resumability support

---

## Problem Summary

- Sometimes content is distributed across the document tree but needs to be aggregated and displayed in one place.
- Examples:
  - Chapter titles to be displayed in an index or table of contents
  - Script tags, navigation links, sidebar content
- In many cases, the content needs to be rendered at a position in the document tree before all the necessary content has been aggregated.
- Reactive handling for CSR already provides a mechanism for aggregate data to arrive after the rendering has started (the rendering will automatically be updated as content arrives), but SSR does not currently have any corresponding mechanism.
- For SSR, it is crucial that aggregated style information appears before affected content in order to avoid FOUC.

### Key Use Cases

1. **Dynamic table of contents:** A sidebar TOC that starts with an SSR-rendered snapshot and grows as content is dynamically added to the main body
2. **Message thread list:** An email-like interface with an initial snapshot from page load that grows as new messages arrive via WebSocket
3. **Script/style aggregation:** Collecting scripts and stylesheets from throughout the document tree and rendering them in the `<head>` to avoid FOUC

These require an **integrated, cohesive solution** that allows CSR to seemlessly resume where SSR leaves off.

---

## Specific Aggregators

### General Content Aggregation

- **`[m.aggr to=bufferName? content...]`** — Aggregates content to the specified buffer
- **`[m.aggr from=bufferName]`** — Renders the content from the specified buffer
- **Default buffer:** The default buffer name is `default`; a `from` is required for rendering

### "Smart" Scripts

An aggregation-aware variant of the low-level `h.script` tag:

- **`[m.script to=bufferName? m.text=content otherProps...]`** — Aggregates an in-line script (unique by `m.text`)
- **`[m.script to=bufferName? src=URL otherProps...]`** — Aggregates an external script (unique by URL)
- **`[m.script from=bufferName]`** — Renders aggregated script content
- **Default buffer:** The default buffer name for aggregation is `head`; a `from` is required for rendering
- **Multiple buffers:** Support for multiple buffers allows adding different scripts in different places (e.g. `HEAD`, `BODY`)
- **Uniqueness:** Script uniqueness is based on the `m.script` namespace
- **No manual keys:** Users do not need to create or coordinate "uniqueness keys"

### "Smart" Stylesheets

An aggregation-aware variant of the low-level `h.link` and `h.style` tags:

- **`[m.style to=bufferName? m.text=content otherProps...]`** — Aggregates an in-line stylesheet (style, unique by `m.text`)
- **`[m.style to=bufferName? href=URL otherProps...]`** — Aggregates an external stylesheet (link, unique by URL)
- **`[m.style from=bufferName]`** — Renders aggregated stylesheet content
- **Default buffer:** Default buffer name is also `head`
- **Uniqueness:** Stylesheet uniqueness is based on the `m.style` namespace

### Implementation Notes

`m.script` and `m.style` are aggregation-aware variants of the low-level `h.script`/`h.link`/`h.style` tags. They may internally use the corresponding `h.*` tags for rendering. `h.script` and `h.style` can still be used directly for scripts/styles that should always appear at their tree position (no aggregation).

---

## MWIDocument Changes

- **`(getAggr reset=@f)`**
  - If `reset` is true (default is false), clears all aggregated content and buffer ids (below) for a new, clean rerender.
  - Returns a JS `Map` for tracking aggregated content.
  - The Map is created at construction and exists for the lifetime of the instance.
  - Keys should be strings of the form `<namespace>:<buffer name>`, e.g. `m.aggr:default`.
    - The namespace is typically an associated tag name (e.g. `m.aggr`).
	- The buffer name may be empty or e.g. taken from a tag attribute.
  - Values are managed by the aggregating tags.
    - SSR *values* in this map are themselves also JS `Map` instances.
	  - `Map<key, renderedHTML>`
	  - The `key` in *this* map is either a unique symbol (e.g. for `m.aggr`), or the uniqueness key for de-duplicating tags (e.g. `m.script`):
	    - The inline script or style content (text) or the URL where external content is located.
	  - Content is automatically added in tree-traversal order as a by-product of the SSR process.
    - CSR values are tree-traversal-order-sorted, reactive NANOS lists of *doc-tree nodes*
	  - Since the list contents are reactive, assessments of "first instance" and "duplicate value" are subject to change over time. Deduplication (where applicable) must be performed as part of the reactive rendering cycle based on the array contents at the time.

- **`(mapAggrBuffer buffer)`**
  - If `buffer` is a string (`<namespace>:<buffer name>`), returns the associated numeric buffer id.
    - The next sequential, zero-origin buffer id is automatically allocated upon first reference.
  - If `buffer` is a number, returns the associated buffer name.

- **`(getHTML forNode?)`**
  - Calls `(getHTML)` on node `forNode` (default document root) to get placeholder-based HTML for the (sub-)tree rooted at the node.
  - Post-generation, replaces `<{bufferId}>` (e.g. `<{25}>`) placeholders with rendered content from the aggregation array map iteratively until all placeholders have been replaced.
    - Uses the buffer ID -> buffer name mapping to locate the content array (or content `Set`).
	- Replacement is performed only once per ID. A subsequent request for the same ID generates a console warning message and is replaced with nothing.
	- Replacement content may also contain placeholders; these must be recursively expanded prior to replacing the placeholder with the content.
    - Replacement is comment, script, and in-line-style-aware (permitted content may mimic placeholder syntax, but is passed unmodified—not replaced).

---

## SSR

- SSR with aggregated-data-display tags will render "placeholder HTML" (HTML potentially containing placeholders like `<{25}>`) at the node level. Users must use the `MWIDocument` version of `(getHTML)` in order to get the final HTML output when working with aggregated data, as it is the SSR operation responsible for replacing placeholders with the rendered aggregate content.
- Aggregating tags need to use two keys, one for each level of aggregation `Map`.
- The first-level key is based on the namespace (e.g. tag name) and buffer name: `<namespace>:<buffer name>` (e.g. `m.aggr:contents`), and is used to access the second-level `Map` (first-level value).
- The second-level key will be a the unique key (content text or URL) for de-duplicating tags (like `m.script`) or a unique symbol (via `Symbol()`) for non-de-duplicating tags (like `m.aggr`).
- The second-level *value* should be set to the *rendered HTML* content.
- Values will automatically be added in the proper, tree-traversal order as a result of the tree-traversal-based nature of SSR.
- The result is a consistent structure for the placeholder replacement process provided by `MWIDocument`'s `(getHTML)`.
- Rendering tags use `(mapAggrBuffer)` to map the first-level key to the buffer id and then render placeholder `<{bufferId}>`.
- Note: Unique keys should be based on content, not the HTML rendering, as there can be many different ways to render references to the same content (even just differences in attribute ordering, as one simple example).

---

## CSR: Central Store Pattern

### Design Rationale

Mature, reactive libraries like React, Vue, SolidJS, and Angular typically converge on the **central store pattern** for content aggregation.

A "source" node registers its content with the central store, and unregisters when removed. The central store is used to project the content to a "sink" node.

This is the natural fit for MWI because:
- The document maintains a `Map<namespace:bufferName, reactiveNANOS>` of buffer contents.
- `[m.aggr to=bufferName ...]` nodes register their content (as doc-nodes) with the buffer on mount, and deregister on unmount.
- `[m.aggr from=bufferName]` nodes reactively render the buffer's current content.
- This is how `MWICoreScpCSS` already works — it aggregates CSS from `doc('typesUsed')` (a document-level reactive list) and emits it in one place.

### Core Mechanism

- **Assumption:** The doc tree is the source of truth. The DOM is a rendering-generated projection.
- **Aggregated content location:** Aggregated doc tree content should "live" at the original nodes. Only the DOM is reordered.
- **Saved state:** Unlike SSR, which aggregates and saves rendered content, CSR aggregates the source doc-tree nodes required to (reactively) render the content.
- **State lifecycle:** State is added whenever a new namespace and buffer name is referenced (either by an aggregator or a renderer). For smoother hydration, reactive aggregate rendering is deferred until the initial CSR pass has completed.
- **Registration:** Nodes register when added to the doc tree and unregister when removed.
- **Ordering:** Each content node has a reactively-computed `(nodePath)` which is a reactive list of zero-origin node indexes, top-down, from the root node.
  - These are dependent on reactive `subDoc` properties up to the root, triggering recalculation if impacted by structural changes.
  - Aggregate content is displayed in node order (example: content for a node with path `[1 1 3 5]` comes before one with path `[1 1 4]`).
  - `(nodePath)` and related machinery have been implemented and tested.

---

## Resumability: SSR-to-CSR Continuity

### MWI's Structural Advantage

MWI has a structural advantage over other frameworks: **the doc tree is already a reactive data structure separate from the DOM**. The DOM is a projection of the doc tree. So "resuming" means reconstructing the doc tree state, not the DOM state.

### The Resumability Flow

```
Server:
  1. Build doc tree from page spec
  2. Render doc tree to HTML (SSR) — using placeholder/string-surgery for aggregation
  3. Serialize doc tree state into the HTML
  4. Send HTML to client

Client:
  1. Browser renders HTML immediately (fast initial paint)
  2. Load Mesgjs runtime + MWI modules
  3. Deserialize doc tree state from HTML
  4. Reconstruct doc nodes, "claiming" existing DOM nodes by server-assigned m.id values + tree-walk
  5. Reactive system takes over — DOM is mostly correct; miminal re-render to complete sync
  6. New content (WebSocket, user interaction) updates doc tree → reactive DOM updates
```

### Comparison with Other Approaches

| Approach | Initial paint | Time to interactive | Aggregation complexity |
|---|---|---|---|
| CSR islands | Fast | Fast (only islands) | Complex (two mechanisms needed) |
| Full re-render hydration (React) | Fast | Slower (entire tree) | Simple (one mechanism) |
| Resumability (Qwik-like) | Fast | Fast (no re-render) | Simple (one mechanism) |
| **MWI resumability** | Fast | Fast (doc tree, not DOM) | Simple (one mechanism) |

MWI's resumability is cheaper than Qwik's because the doc tree is not the DOM — it's a lightweight reactive data structure. Reconstructing the doc tree from serialized state is much cheaper than re-rendering significant portions of the DOM.

### "Resuming" Aggregation Buffers

For SSR, aggregation state contains rendered HTML strings aggregated during a single rendering pass, which are then substituted back into the result at the appropriate placeholders. This is a static, one-shot-per-render process.

The rendered-HTML aggregation state is not serialized to the client, but rather, reconstructed in a CSR-compatible form (using lists of doc-node references) as part of recreating the doc-tree on the client from the doc-spec.

Most DOM elements (not necessarily all nodes) created by the SSR-generated HTML will be adopted into the client-side doc-tree during the initial CSR rendering, resulting in minimal re-rendering.

Subsequent updates to the doc-tree will be reactively projected to the DOM.

```
SSR:
  Buffer "toc" = [entry1, entry2, entry3]  (aggregated from page content)
  HTML: <nav id="toc-from">entry1 entry2 entry3</nav>
  Serialized state: (doc spec for page)

Client startup:
  1. Deserialize state
  2. Reconstruct doc nodes from specs, claiming existing DOM nodes by m.id/walking
  3. Aggregate buffers now contain the doc-nodes (and possibly some additional duplicate candidates) that resulted in the original HTML

WebSocket update:
  4. New message arrives → new TOC entry spec
  5. [m.aggr to=toc ...] adds entry to reactive buffer
  6. [m.aggr from=toc] reactively updates <nav> with new entry added (in tree-traversal order)
```

### Integration with SSR

The placeholder/string-surgery approach is the mechanism for **generating the initial HTML**. Resumability is a layer on top of it:

1. **SSR:** `getHTML()` uses placeholder + string surgery to produce correct HTML
2. **State serialization:** After `getHTML()` runs, serialize the doc-spec into the page — e.g., as `<script id='mwi-doc-tree' type='text/vnd.mesgjs.slid'>` or similar. Buffer state will **not** be separately serialized (it is reconstructed from the doc-spec).
3. **DOM claiming:** Associate the `from` node's reactive DOM output with the existing server-rendered DOM nodes, using the server-assigned `m.id` values *and tree-walking*
   - More generally, DOM elements from SSR-generated HTML will be adopted across the doc-tree
   - The `MWIDOMSync` interface has been written and tested to perform this function

### Implementation Status

| Piece | Status |
|---|---|
| SSR placeholder + string surgery | Proposed (this document) |
| `m.id` attribute | Exists |
| Reactive doc tree | Already exists |
| Buffer as reactive NANOS on document | New (follows `MWICoreScpCSS` pattern) |
| Doc-spec serialization format | New (needs specification) — JSON or SLID |
| DOM claiming on client startup | New — `MWIDOMSync` exists, integration needs specification |

---

## "Orphan" Handling

- It's completely valid for there to be no aggregated content to render. The absence of content does not generate any type of warning or error.
- Aggregated content might or might not be rendered. The absence of a rendering tag does not generate any type of warning or error (any aggregated content is simply never rendered).
- A valid example scenario:
  - Some content is aggregated during SSR (there's no rendering tag yet, so nothing is rendered)
  - Additional content is aggregated during CSR (still no rendering tag yet)
  - A rendering tag is added for the first time during CSR; existing aggregated content gets rendered
  - Additional content is aggregated during CSR (the rendering updates)

---

## Open Questions

### 1. State Serialization Format

**Question:** What is the exact format for serializing doc tree state into the HTML?

**Current thinking:** `(getSpec)` can already serialize the doc tree. This can probably be packaged as `<script id='mwi-doc-tree' type='text/vnd.mesgjs.slid'>` or similar. This might be everything we need using this (e.g. non-island) approach. It should already have node ids where assigned.

### 2. DOM Claiming Mechanism

**Question:** How does the client associate reconstructed doc nodes with existing DOM nodes?

**Current thinking:** The `m.id` system provides the mapping (for nodes that have an id; not all do). The `MWIDOMSync` interface has been written and tested to perform this function. The exact integration with aggregate content still needs to be specified.

---

## Next Steps

1. **Finalize state serialization format** — Determine the exact format for serializing doc tree state into HTML
2. **Specify DOM claiming integration** — Define how `MWIDOMSync` integrates with aggregate content reconstruction
3. **Implement SSR aggregation** — Build the placeholder + string surgery mechanism in `MWIDocument`
4. **Implement CSR aggregation** — Build the central store pattern with reactive buffers
5. **Implement resumability** — Build the state serialization and DOM claiming mechanisms
6. **Create test suite** — Comprehensive tests for SSR, CSR, and resumability scenarios
7. **Document interfaces** — Create interface documentation for `m.aggr`, `m.script`, and `m.style`

---

## Supplemental Keywords

[supplemental keywords: teleport, portal, head management, content projection, slot forwarding, deduplication, hydration, islands architecture, partial hydration, progressive enhancement]
