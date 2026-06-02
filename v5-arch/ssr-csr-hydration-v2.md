# MWI SSR-to-CSR Hydration

**Status:** ACTIVE  
**Created:** 2026-05-28  
**Updated:** 2026-06-01  
**Author:** Architectural discussion — Brian Katzung + AI partner

---

## 1. Overview

This document specifies the approach for connecting the DOM produced by SSR HTML generation back to the MWI doc tree for client-side rendering (CSR) and reactivity.

### 1.1 The Core Problem

When MWI renders a page server-side, it produces an HTML string via [`getHTML()`](../src/mwi-html-comp.msjs:172). The browser parses this into a DOM. When the client-side MWI runtime initializes, it has the same doc tree that was used for SSR (reconstructed from the page spec). The question is: how does the CSR system connect to the existing SSR DOM rather than creating a redundant, duplicate DOM?

### 1.2 Key Principles

- **Most of the tree is SSR-rendered.** In a typical hybrid page, the majority of content is static and was fully rendered server-side. Only specific interactive or dynamic subtrees need CSR.
- **Hydration operates on whole branches.** The boundary between SSR-preserved and CSR-rendered content is at the subtree level, not the individual node level.
- **SSR content is preserved by default.** The system should not touch SSR-rendered DOM unless explicitly told to, or unless the doc tree is updated reactively.
- **Lazy fallback for unconnected nodes.** If a doc node cannot be connected with an existing SSR DOM node, CSR regenerates that portion of the DOM and replaces it via `domSyncChildren`.

### 1.3 Solution Approach

MWI uses a **synchronous DOM assimilation** strategy via the [`MWIDOMSync`](#2-mwidomsync-interface) interface. When CSR runs in sync mode (by passing an `MWIDOMSync` instance), it attempts to match and reuse existing DOM nodes rather than generating new ones. Nodes that can't be matched are regenerated and replaced.

---

## 2. `MWIDOMSync` Interface

`MWIDOMSync` is a bi-lingual interface used to facilitate associating existing DOM nodes with matching doc-nodes during CSR. Passing an `MWIDOMSync` instance via `(getDOM sync=instance)` indicates that CSR should be performed in sync mode, assimilating existing DOM nodes when possible.

### 2.1 Interface Definition

- **Constructor:** `@c(get MWIDOMSync init=[syncNode])`
- **JavaScript Factory:** `getInstance('MWIDOMSync', [syncNode])`
  - Accepts the sync node (a DOM node) where the instance should begin matching.
  - Returns the `MWIDOMSync` instance.

### 2.2 Core Operation: `sync(tag docNode)`

- **Mesgjs:** `(sync tag docNode)`
- **JavaScript:** `.sync(tag, docNode)`
- **Parameters:** 
  - `tag` — `m.t` (for text), `m.com` (for comments), or an HTML tag name (e.g. `DIV`, `SPAN`)
  - `docNode` — a doc-node for the desired node
- **Returns:** A matching DOM node if found, `undefined` otherwise
- **Side Effect:** Advances the internal sync cursor position when a match is found

#### Matching Strategy

The `sync` operation attempts to match the next sync (DOM) node to the provided doc-node:

1. **Text/Comment Match:**
   - If the doc-node is a text or comment node and the sync node matches both type *and content*:
     - Advance sync cursor to `.nextSibling`
     - Return the matching DOM node

2. **Skip Normalized Nodes:**
   - While the sync node is a text or comment node (that didn't match in step 1), advance to `.nextSibling`

3. **Tag Match:**
   - If the sync node's tag matches the tag parameter:
     - Advance sync cursor to `.nextSibling`
     - Return the matching DOM node

4. **ID-based Resync:**
   - If the doc-node includes an `id` attribute and `getElementById` locates the node:
     - Advance sync cursor to `.nextSibling` of the located node
     - Return the located DOM node

5. **No Match:**
   - Do not advance the sync cursor
   - Return `undefined` (CSR will generate the node from scratch)

#### Sync Failure Handling

When sync fails (either partially or completely):
- Unassimilated nodes are regenerated (like normal, no-sync CSR)
- The regenerated nodes are then inserted/replaced via `domSyncChildren`

### 2.3 Component Integration Patterns

#### Components That Generate DOM Directly

Components that create DOM elements (e.g., the `h.` HTML element series) use the `sync` message/method to determine if the next DOM node corresponds to the doc-spec and can be assimilated, or whether a new node needs to be generated.

#### Container Components

Container elements pass a new `MWIDOMSync` instance based on their `.firstChild` to the sub-doc rendering when in sync mode.

#### Multi-Region Components

Multi-region components (e.g., [`m.head` and `m.body`](split-regions.md)) must sync the managed region beginning with the DOM node after the beginning boundary marker.

#### Pass-Through Components

Components that don't render nodes directly (e.g., fragments, templates when expanded) simply pass the `MWIDOMSync` instance through to their child nodes.

---

## 3. The `m.csr` Attribute

### 3.1 Purpose

The `m.csr` attribute is an **opt-in CSR marker**. It designates a doc node (and its entire subtree) as a CSR-rendered region, completely suppressing SSR for that branch.

### 3.2 Semantics

- `m.csr` set to a truthy value on a doc node completely suppresses SSR of the node and any associated subtree
- SSR never generates *anything* for an `m.csr` node
- During CSR in sync mode, the absence of pre-generated nodes is detected
- Missing nodes are generated and added relative to existing nodes via `domSyncChildren` or `domSyncManagedChildren`

### 3.3 Scope

The `m.csr` attribute can be set in two ways:

1. **Doc-node attribute:** Set in the doc spec (e.g., `[h.div m.csr=@t ...]`) — per-instance control
2. **Component registry flag:** All instances of a component type are always CSR
   - Implemented by adding an initially-true-valued `m.csr` attribute to the node (which can be explicitly overridden in the doc-node)

### 3.4 No SSR Markers

Unlike deferred components, `m.csr` nodes do not emit any SSR placeholders or markers. The SSR output simply omits them entirely. CSR in sync mode detects their absence and generates them.

---

## 4. Hydration Flow

### 4.1 Overall Sequence

1. **Server:** Build doc tree → call `getHTML()` → send HTML to browser
2. **Browser:** Parse HTML → create SSR DOM
3. **Client:** Load Mesgjs runtime + MWI modules
4. **Client:** Reconstruct doc tree from page spec (same spec as server used)
5. **Client:** Wait for `mwi.compRegReady`
6. **Client:** Run CSR in DOM-sync mode (using `MWIDOMSync`)
7. **Ongoing:** Reactive updates replace SSR DOM as doc tree changes

### 4.2 Hydration Trigger

Hydration happens when CSR runs in sync mode — i.e., when CSR is passed an `MWIDOMSync` instance. This is typically initiated by the application after the component registry is ready.

### 4.3 No Explicit Subtree Discovery

The hydrator does not search for `m.csr` subtree roots or use `querySelectorAll`. Instead:
- The absence of required nodes is detected during CSR's normal tree walk
- Missing nodes (whether from `m.csr` or structural mismatches) are generated and inserted based on the DOM-projection of the doc-tree structure

---

## 5. Structural Mismatch Handling

### 5.1 Maximum SSR Foundation / Minimal Re-Rendering

Not all doc nodes can be cleanly connected to SSR DOM nodes. The system handles this gracefully:

- If a doc node *can* be connected to an SSR DOM node (via tag/content match or `id` resync), it is
- If a doc node *cannot* be connected (structural mismatch, normalized nodes, etc.), CSR regenerates the unmatched areas
- Reactive CSR takes over after any necessary updates are made to resynchronize the DOM with the doc-spec

### 5.2 Known Structural Differences

#### Text Nodes (`m.t`)

- **SSR:** Emits raw escaped text as DOM `Text` nodes
- **CSR:** Also creates DOM `Text` nodes
- **Hydration:** CSR in sync mode will assimilate and reuse single, unmodified text nodes, but will regenerate adjacent nodes that were merged by the browser
- **Limitation:** The `MWIDOMSync` interface accounts for normalized text nodes with a worst-case fallback of regenerating portions of the DOM that can't be synchronized

#### Comment Nodes (`m.com`)

Similar to text nodes — can be matched when unmodified, regenerated when normalized or merged.

#### Fragment Nodes (`m.frg`)

Fragments are transparent containers with no DOM element in either SSR or CSR. The sync process skips through them naturally by passing the `MWIDOMSync` instance to their children.

#### Template/Slot Expansion

Template invocation nodes have no corresponding DOM element — the template expands inline. The sync process skips through them, matching the expanded content.

#### Aggregate Content

Aggregators (e.g., `m.scpcss`) collect content from across the doc tree and render it at a single location:

- **Collection vs. Rendering:** Aggregate *collection* tags do not render immediately and therefore should not sync immediately
- **Rendering:** Aggregate *rendering* tags determine the active content doc-nodes (applying deduplication where applicable), then render the active content nodes in sync mode
- **Best Practice:** Well-formed aggregated content fragments should begin with elements with `id` attributes to aid in synchronization. Leading text should be wrapped in a container element (e.g., `<span>`)

---

## 6. ID Strategy and Synchronization

### 6.1 Current ID Namespaces

Per [`v5-arch/core-architecture.md`](core-architecture.md):
- **Server element IDs:** `_MS_<base36>` (assigned by [`MWIRegistry.nextId()`](../src/mwi-registry.msjs))
- **Client element IDs:** `_ML_<base36>` (different namespace, no sync needed)
- **Component IDs:** `_MO_<base36>` (synchronized server-to-client via `globalThis.mwiServer`)

### 6.2 Nodes That Should Have IDs

Certain node types benefit from auto-assigned IDs (via `m.id` reference if not user-supplied):

| Node Type | Reason | Current Status |
|-----------|--------|----------------|
| `m.defer` nodes | Required for deferred component replacement | Already auto-assigns via `m.id` |
| First element of aggregated content | Aids synchronization during hydration | Should reference `m.id` |
| `m.csr` subtree roots (optional) | Can help resync after structural mismatch | Not required — parent sync maintains position |

### 6.3 User Responsibility: Aggregated Content

Documentation should note that it is the user's responsibility to ensure aggregated content does not begin with uncontained text or comments if they want to avoid re-rendering, since text and comment HTML doesn't support attributes (including `id`).

### 6.4 Deferred Components Special Case

[`MWICoreDefer`](../src/mwi-core-comp.msjs:112) should be updated:
- Currently renders `<slot>` placeholders, which are not permitted in `<head>` and will break HTML parsing
- Should instead render *nothing* during SSR
- After the deferred component loads, the `m.defer` node should be replaced within the doc-spec
- Replacement is then reactively projected into the DOM via normal CSR mechanisms
- The `m.defer` node should reference its `m.id` attribute during "rendering" to ensure a library-supplied ID is used if the user did not provide one

---

## 7. Server-to-Client Synchronization

### 7.1 What Is Synchronized

For hydration to work, the client needs:

1. **Component IDs** — Already synchronized via `globalThis.mwiServer.at('components')`
2. **Scope IDs** (for scoped CSS) — Already synchronized via `globalThis.mwiServer`

No additional synchronization is required for `m.csr` nodes — they are handled entirely through DOM structure matching and optional `id` resyncing.

### 7.2 Synchronization Mechanism

The existing mechanism passes data via `globalThis.mwiServer` embedded in the SSR HTML. This infrastructure is sufficient for current hydration needs.

---

## 8. Relationship to Deferred Components

[`MWICoreDefer`](../src/mwi-core-comp.msjs:112) implements a related but distinct pattern:

| Aspect | `m.defer` | `m.csr` |
|--------|-----------|---------|
| **Purpose** | Component not yet loaded at render time | Component that should be CSR-managed |
| **SSR Output** | ~~`<slot>` placeholder~~ Nothing (needs update) | Nothing |
| **Client Behavior** | Loads component → replaces doc node → reactive update | Normal CSR in sync mode |
| **Timing** | Triggered by component load event | Triggered by initial CSR pass |

These mechanisms share the principle of "SSR outputs nothing, CSR handles it" but serve different use cases.

---

## 9. Related Documents

- [`v5-arch/core-architecture.md`](core-architecture.md) — System overview, ID namespaces
- [`v5-arch/reactive-dom.md`](reactive-dom.md) — Reactive DOM system
- [`v5-arch/split-regions.md`](split-regions.md) — Managed regions (`m.head`, `m.body`)
- [`v5-init-arch/Reactive-DOM-Reqs-Rev1.md`](../v5-init-arch/Reactive-DOM-Reqs-Rev1.md) — Detailed reactive requirements
- [`v5-init-arch/Initial-Requirements.md`](../v5-init-arch/Initial-Requirements.md) — Foundational requirements

---

[supplemental keywords: hydration, rehydration, hybrid rendering, SSR DOM reconnection, client-side takeover, progressive enhancement, m.csr, DOM assimilation, sync mode, lazy hydration, structural mismatch, text node normalization, MWIDOMSync, domSyncChildren, aggregate content synchronization]
