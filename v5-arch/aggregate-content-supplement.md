# Aggregate Content — Design Discussion Supplement

**Status:** DRAFT (discussion notes, not yet integrated into main plan)  
**Date:** 2026-05-27  
**Purpose:** Preserve design discussion details for review before generating an integrated plan

---

## Background

This document supplements [`aggregate-content.md`](aggregate-content.md) with design analysis and discussion from the initial planning session. It covers:

1. Design issues identified in the SSR proposal
2. CSR aggregation approaches used by other libraries
3. The "resumability" model and its implications for MWI

---

## CSR Aggregation: Approaches in Other Libraries

### Common Pattern Across Libraries

All mature libraries converge on the **central store pattern**:

```
Source/To node  →  registers content  →  Central store / reactive signal
                                                    ↓
                                         projects content
                                                    ↓
                                         Sink/From node
Source/To node  →  on unmount  →  deregisters content  →  Central store
```

### Library Survey

| Library | Mechanism | Notes |
|---|---|---|
| React | Portals + React Helmet (context + singleton store) | Store is source of truth; DOM is projection |
| Vue | `<Teleport>` + Unhead (reactive head entries) | Central `Unhead` instance merges and deduplicates |
| Svelte | `<svelte:head>` (direct DOM manipulation) | Simple but SSR requires separate serialization |
| SolidJS | `<Portal>` + fine-grained reactivity | Natural fit with signal-based reactivity |
| Angular CDK | `Portal` + `PortalOutlet` (explicit source/sink) | Closest analog to MWI's `m.aggr` design |

### Implications for MWI's CSR Design

**The central store pattern is the natural fit for MWI:**

- The document maintains a `Map<namespace:bufferName, reactiveNANOS>` of buffer contents.
- `[m.aggr to=bufferName ...]` nodes register their content (as doc-nodes) with the buffer on mount, and deregister on unmount.
- `[m.aggr from=bufferName]` nodes reactively render the buffer's current content.

This is exactly how `MWICoreScpCSS` already works — it aggregates CSS from `doc('typesUsed')` (a document-level reactive list) and emits it in one place. `m.aggr` generalizes this pattern.

---

## The Resumability Model

### Motivation

The use cases driving this design:
- A sidebar table of contents that starts with an SSR-rendered snapshot and grows as content is dynamically added to the main body.
- A message thread list (email-ish) with an initial snapshot from page load that grows as new messages arrive via WebSocket.

These require a **single general solution** that works for both SSR and CSR — not two separate systems.

### What "Resume" Means for MWI

MWI has a structural advantage over other frameworks: **the doc tree is already a reactive data structure separate from the DOM**. The DOM is a projection of the doc tree. So "resuming" means reconstructing the doc tree state, not the DOM state.

```
Server:
  1. Build doc tree from page spec
  2. Render doc tree to HTML (SSR) — using placeholder/string-surgery for aggregation
  3. Serialize doc tree state (buffer contents as doc specs, node IDs) into the HTML
     - Q: Why do we need to serialize *buffer contents*? Won't the existing buffer content be regenerated when the doc tree is CSR'd in the client?
  4. Send HTML to client

Client:
  1. Browser renders HTML immediately (fast initial paint)
  2. Load Mesgjs runtime + MWI modules
  3. Deserialize doc tree state from HTML
  4. Reconstruct doc nodes, "claiming" existing DOM nodes by server-assigned m.id values
  5. Reactive system resumes — DOM is already correct, no re-render needed
  6. New content (WebSocket, user interaction) updates doc tree → reactive DOM updates
```

### Comparison with Other Approaches

| Approach | Initial paint | Time to interactive | Aggregation complexity |
|---|---|---|---|
| CSR islands | Fast | Fast (only islands) | Complex (two mechanisms needed) |
| Full re-render hydration (React) | Fast | Slower (entire tree) | Simple (one mechanism) |
| Resumability (Qwik-like) | Fast | Fast (no re-render) | Simple (one mechanism) |
| **MWI resumability** | Fast | Fast (doc tree, not DOM) | Simple (one mechanism) |

MWI's resumability is cheaper than Qwik's because the doc tree is not the DOM — it's a lightweight reactive data structure. Reconstructing the doc tree from serialized state is much cheaper than re-rendering the DOM.

### The "Snapshot + Resume" Pattern for Aggregation Buffers

```
SSR:
  Buffer "toc" = [entry1, entry2, entry3]  (aggregated from page content)
  HTML: <nav id="toc-from">entry1 entry2 entry3</nav>
  Serialized state: {"toc": [spec1, spec2, spec3]}  (doc specs, not HTML strings)

Client startup:
  1. Deserialize state → buffer "toc" = reactive NANOS([spec1, spec2, spec3])
  2. Reconstruct doc nodes for specs, claiming existing DOM nodes by m.id
  3. Reactive buffer is now live with initial entries

WebSocket update:
  4. New message arrives → new TOC entry spec
  5. [m.aggr to=toc ...] adds entry to reactive buffer
  6. [m.aggr from=toc] reactively updates <nav> with new entry appended
```

### Compatibility with the SSR Proposal

The placeholder/string-surgery approach in `aggregate-content.md` is still the right mechanism for **generating the initial HTML**. Resumability is a layer on top of it:

1. **SSR (existing proposal):** `getHTML()` uses placeholder + string surgery to produce correct HTML.
2. **State serialization (new):** After `getHTML()` runs, serialize the buffer contents (as doc specs, not HTML strings) into the page — e.g., as `<script type="application/json" id="mwi-state">...</script>`.
3. **Client deserialization (new):** On startup, deserialize the buffer state and populate the reactive buffers on the document.
4. **DOM claiming (new):** Associate the `from` node's reactive DOM output with the existing server-rendered DOM nodes, using the server-assigned `m.id` values.

### What's New vs. What Already Exists

| Piece | Status |
|---|---|
| SSR placeholder + string surgery | Proposed in `aggregate-content.md` |
| `m.id` server-client ID synchronization | Already exists |
| Reactive doc tree | Already exists |
| Buffer as reactive NANOS on document | New (follows `MWICoreScpCSS` pattern) |
| State serialization format | New |
| DOM claiming on client startup | New |

The main new pieces are the **state serialization format** and the **DOM claiming mechanism**. The existing `m.id` system (server assigns `_MS_<n>`, client uses same IDs) is already the foundation for DOM claiming — it needs to be extended to cover aggregation buffer contents.

---

## Open Questions for Integrated Plan

1. **State serialization format:** What is the exact format for serializing doc tree state into the HTML? Options: inline JSON in a `<script>` tag, data attributes on the `from` nodes, a separate SLID-format block.
   - `(getSpec)` can already serialize the doc tree. This can probably be packaged as `<script id='mwi-doc-tree' type='text/vnd.mesgjs.slid'>` or similar. This might be everything we need using this (e.g. non-island) approach. It should already have node ids where assigned.

2. **DOM claiming mechanism:** How does the client associate reconstructed doc nodes with existing DOM nodes? The `m.id` system provides the mapping (for nodes that have an id; not all do), but the claiming process needs to be specified.
   - The exact process still remains to be determined (likely based on the final aggregate content implementation).

3. **Partial page updates:** If only a sub-tree is re-rendered (e.g., a new message is added to a thread), how does the aggregation buffer update? The reactive buffer handles this naturally — new `to` contributions are added, and the `from` node re-renders.
   - I believe this process has already been addressed.

4. **Buffer ordering:** When multiple `to` nodes contribute to the same buffer, what determines the order of their content in the `from` output? Tree traversal order (SSR) vs. registration order (CSR) may differ.
   - I believe this is already covered by updates in the main proposal.

5. **Unmount behavior:** When a `to` node is unmounted (e.g., a message is deleted), its content should be removed from the buffer. How is this tracked? The reactive NANOS key (for deduplicated content) or a WeakRef-based approach (for non-deduplicated content)?
   - The node should remove itself from the associated content list. The rest should be emergent behavior of the reactive rendering process.
