# MWI SSR-to-CSR Hydration

**Status:** DRAFT  
**Created:** 2026-05-28  
**Author:** Architectural discussion — Brian Katzung + AI partner

---

## 1. Overview

This document specifies the approach for connecting the DOM produced by SSR HTML generation back to the MWI doc tree for client-side rendering (CSR) and reactivity.

### 1.1 The Core Problem

When MWI renders a page server-side, it produces an HTML string via [`getHTML()`](../src/mwi-html-comp.msjs:172). The browser parses this into a DOM. When the client-side MWI runtime initializes, it has the same doc tree that was used for SSR (reconstructed from the page spec). The question is: how does the CSR system connect to the existing SSR DOM rather than creating a redundant, duplicate DOM?

### 1.2 Key Assumptions

- **Most of the tree is SSR-rendered.** In a typical hybrid page, the majority of content is static and was fully rendered server-side. Only specific interactive or dynamic subtrees need CSR.
- **Hydration operates on whole branches.** The boundary between SSR-preserved and CSR-rendered content is at the subtree level, not the individual node level.
- **SSR content is preserved by default.** The system should not touch SSR-rendered DOM unless explicitly told to, or unless the doc tree is updated reactively.
- **Lazy fallback for unconnected nodes.** If a doc node cannot be connected to an SSR DOM node, the SSR DOM is left as-is. It is only replaced when the doc tree is actually updated (triggering normal reactive CSR behavior).

---

## 2. The `m.csr` Attribute

### 2.1 Purpose

The `m.csr` attribute is an **opt-in CSR marker**. It designates a doc node (and its entire subtree) as a CSR-rendered region. Nodes without `m.csr` are treated as SSR-eligible by default.

### 2.2 Semantics

- `m.csr` set to a truthy value on a doc node completely suppresses SSR of the node and any associated sub-tree.
- CSR DOM sync will detect the absence of pre-generated nodes and generate them automatically.
- Nodes *without* `m.csr` are left as SSR DOM. Most will be synchronized and only replaced if the doc tree is later updated reactively (at which point normal CSR behavior takes over for that subtree).

### 2.3 Open Design Questions

**Q1: Scope of `m.csr`**  
Should `m.csr` be:
- (a) A **doc-node attribute** set in the doc spec (e.g., `[h.div m.csr=@t ...]`) — per-instance control
- (b) A **component registry flag** — meaning "all instances of this component type are always CSR"
- (c) Both (a) and (b)
- Answer: Both doc-node attribute and component schema flag
  - The schema flag should be implemented by adding an initially-true-valued `m.csr` attribute to the node (which might be explicitly overridden in the doc-node).

**Q2: SSR output marker**  

For a `m.csr` node, what does SSR emit to allow the hydrator to find it?
- (a) A `data-mwi-csr` attribute on the rendered HTML element
- (b) Require the node to have an `id` attribute (the hydrator uses `document.getElementById`)
- (c) Both `data-mwi-csr` and `id`
- Answer: (d) None of the above. SSR never generates *anything* for an `m.csr` node. Nodes are added relative to existing nodes during CSR via `domSyncChildren` (or `domSyncManagedChildren`).

**Q3: Hydration replacement strategy**  
When the hydrator activates a `m.csr` subtree:
- (a) **Replace**: remove the SSR DOM element and insert the CSR DOM in its place
- (b) **Adopt**: insert CSR DOM *inside* the SSR DOM element (treating it as a container)
- (c) **Swap**: replace the SSR DOM element's *children* with CSR DOM children (keeping the SSR element as the container)
- Answer: (d) None of the above. The elements skipped during SSR are added during CSR.

---

## `MWIDOMSync` Interface

`MWIDOMSync` will be a new bi-lingual interface used to facilitate associating existing DOM nodes with matching doc-nodes in the doc-tree during CSR. Passing an `MWIDOMSync` instance via `(getDOM sync=instance)` indicates that CSR should be performed in sync mode, assimilating existing DOM nodes (rather than generating new ones from scratch) when possible.

Components that don't render nodes directly just need to pass the sync instance to sub-doc nodes. The `h.` series of HTML-tag-related nodes will be where most of the assimilation happens.

- `@c(get MWIDOMSync init=[syncNode])`
- `getInstance('MWIDOMSync', [syncNode])`
  - Accepts the sync node (a DOM node) where the instance should begin matching.
  - Returns the `MWIDOMSync` instance.
- `(sync docSpec)` / `.sync(docSpec)`
  - Accepts a doc-spec for the desired node.
  - Strategy:
    1. If the spec is a text or comment node and the sync node matches both type *and content*:
       - The sync node advances to the `.nextSibling`.
       - The matching DOM node is returned.
    2. While the sync node is a text or comment node, it advances to the `.nextSibling`.
    3. If the sync node tag matches the spec:
       - The sync node advances to the `.nextSibling`.
       - The matching DOM node is returned.
    4. If the spec includes an id attribute and `getElementById` locates the node:
       - The sync node advances to the `.nextSibling` of the located node.
       - The located DOM node is returned.
    5. No match.
	   - Usually means the spec has more nodes (e.g. adjacent text nodes that've been normalized in the DOM).
	   - The sync node does not advance.
	   - Returns undefined (CSR will generate nodes from scratch).
  - If sync fails (either partially or completely):
    - Unassimilated nodes get regenerated (like a "plain", no-sync CSR) and then replaced by `domSyncChildren`.

Tags that generate DOM nodes directly use the `sync` message/method to determine if the next DOM node corresponds to the doc-spec and can be assimilated, or whether a new node needs to be generated from scratch.

Container elements pass a new `MWIDOMSync` instance based on their `.firstChild` to the sub-doc rendering when in sync mode. Multi-region tags (e.g. `m.head` and `m.body`) need to sync the managed region beginning with the DOM node after the beginning boundary marker.

If a node contains a truthy `m.csr` attribute value, the node, and any sub-tree rooted at the node, do not sync (fresh CSR is assumed/provided).

---

## 3. Hydration Flow

### 3.1 Overall Sequence

1. Server: Build doc tree → call getHTML() → send HTML to browser
2. Browser: Parse HTML → create SSR DOM
3. Client: Load Mesgjs runtime + MWI modules
4. Client: Reconstruct doc tree from page spec (same spec as server used)
5. Client: Wait for mwi.compRegReady
~~6. Client: Run hydration pass~~
~~7. Hydration pass: Find all m.csr subtree roots in the DOM~~
~~8. Hydration pass: For each m.csr root, locate the corresponding doc node~~
~~9. Hydration pass: Activate CSR rendering for that subtree~~
6. CSR in DOM-sync mode (using `MWIDOMSync`)
7. ~~10.~~ Ongoing: Reactive updates replace SSR DOM as doc tree changes

### 3.2 Hydration Trigger Timing

**Open Design Question Q4:**  
When should the hydration pass run?
- (a) Automatically, after both `DOMContentLoaded` and `mwi.compRegReady` are satisfied
- (b) Manually, triggered by the application (gives more control over timing)
- (c) Both: automatic by default, with an API to disable/defer
- Answer: (d) None of the above. Hydration happens when CSR runs in sync mode (i.e. is passed an `MWIDOMSync` instance).

### 3.3 Locating `m.csr` Subtree Roots

The hydrator needs to find all `m.csr` subtree roots in the DOM. The mechanism depends on the answer to Q2 above. Likely approaches:

- `document.querySelectorAll('[data-mwi-csr]')` — if `data-mwi-csr` is emitted
- `document.querySelectorAll('[id^="_MS_"]')` — if server-assigned IDs are used as markers
- A combination

FEEDBACK: No, it doesn't. None of the above. Absence of required nodes is detected during CSR; the missing nodes are generated and inserted based on the DOM-projection of the doc-tree structure.

### 3.4 Connecting Doc Nodes to DOM Nodes

Once a `m.csr` DOM element is found, the hydrator needs to locate the corresponding doc node. This requires the SSR-rendered element to carry an `id` that matches the doc node's `m.id` value. The hydrator calls `document.getDocById(id)` to retrieve the doc node, then activates CSR rendering.

FEEDBACK: It's the other way around. DOM nodes get connected to doc nodes. CSR happens in a semi-normal fashion. Roughly speaking, if the "next" DOM node is the node that would be CSR generated, the node is simply assimilated instead of being generated from scratch. "Next" for rendered aggregates might be elsewhere, in which case `getElementById` is attempted in order to resync the concept of "next".

---

## 4. ID Strategy for Hydration Anchors

### 4.1 Current ID Namespaces

Per [`v5-arch/core-architecture.md`](core-architecture.md):
- Server element IDs: `_MS_<base36>` (assigned by [`MWIRegistry.nextId()`](../src/mwi-registry.msjs))
- Client element IDs: `_ML_<base36>` (different namespace, no sync needed)
- Component IDs: `_MO_<base36>` (synchronized server-to-client via `globalThis.mwiServer`)

### 4.2 Hydration Anchor IDs

For hydration to work, `m.csr` subtree roots need IDs that are **stable across server and client** — i.e., the same ID must appear in both the SSR HTML and the client-side doc tree.

**Open Design Question Q5:**  
How should stable hydration anchor IDs be assigned?
- (a) **Explicit user-assigned `id` attributes** — the application developer assigns stable IDs to `m.csr` nodes (e.g., `[h.div id=my-widget m.csr=@t]`)
- (b) **Auto-assigned stable IDs** — the system auto-assigns IDs to `m.csr` nodes during SSR, and synchronizes them to the client (similar to how component IDs are synchronized)
- (c) **Positional IDs** — IDs derived from the node's position in the doc tree (e.g., a path like `root.2.1.3`), which are stable as long as the tree structure doesn't change between SSR and hydration

Option (a) is simplest and most explicit. Option (b) requires extending the server-to-client sync mechanism. Option (c) is fragile if the tree structure changes.

FEEDBACK: Section 4.2 is incorrect and irrelevant.

### 4.3 Nodes That Must Always Have IDs

Regardless of the hydration strategy, certain node types should always be assigned an `id` to enable reliable hydration and reactive updates:

| Node Type | Reason |
|-----------|--------|
| `m.csr` subtree roots | Required for hydrator to locate them |
| `m.defer` (deferred components) | Already required; [`MWICoreDefer`](../src/mwi-core-comp.msjs:130) auto-assigns via `m.id` |
| Any node with reactive attributes that need DOM sync | Hydrator needs to find the DOM element to attach reactive updates |

FEEDBACK:
- `m.defer` should actually be updated to not render anything. `<slot>` tags are not permitted in the `<head>` container, which means deferred components there will very likely break HTML parsing and start putting head content into the body instead. After a deferred component is loaded, the `m.defer` should be replaced within the doc-spec and reactively projected into the DOM.
  - If it doesn't happen already, `m.defer` nodes should have their `m.id` attributes referenced during rendering so that a library-supplied id is used if the user did not provide one.
- The first element of any aggregated content should also have an auto-assigned id (via `m.id` reference) if one was not supplied by the user.
- Documentation should mention that it is the user's responsibility to make sure aggregated content does not begin with uncontained text or comments if they don't want the content re-rendered (since text and comment HTML doesn't support attributes).

---

## 5. Structural Mismatch Handling

### 5.1 Maximum SSR Foundation / Minimal Re-Rendering

Not all doc nodes can be cleanly connected to SSR DOM nodes.

- If a doc node *can* be connected to an SSR DOM node (via `id` match or tree-walk), it is.
- If a doc node *cannot* be connected (structural mismatch, text node normalization, etc.), CSR will regerate the unmatched areas.
- Reactive CSR takes over after any necessary updates are made to resynchronize the DOM with the doc-spec.

### 5.2 Known Structural Mismatches

#### Text Nodes (`m.t`)

SSR emits raw escaped text; CSR wraps text in `<output>` elements. These are structurally incompatible.

**Open Design Question Q6:**
How should text node hydration be handled?
- (a) **Accept the mismatch**: SSR text nodes are left as-is. When the doc tree is updated, the `<output>` element replaces the text node.
- (b) **Change CSR to use `Text` nodes**: [`MWICoreText.opGetDOM()`](../src/mwi-core-comp.msjs:332) switches from `<output>` to DOM `Text` nodes. This matches SSR output and enables clean hydration, but changes existing CSR behavior.
  - **Quantity mismatch problem**: Even if CSR uses `Text` nodes, the browser may merge adjacent SSR text runs into a single `Text` DOM node, so there could be fewer DOM text nodes than doc-spec `m.t` nodes. The parallel walk cannot reliably match them 1:1 without additional markers.
  - **Child sync compatibility**: [`domSyncChildren()`](../src/mwi-doc-node.msjs:48) uses `insertBefore`/`append` which work with any DOM node including `Text` nodes. [`setDOMAttrs()`](../src/mwi-doc-node.msjs:62) only applies to elements (text nodes have no attributes), but that's fine — text nodes only need `textContent` sync, not attribute sync. So the reactive sync infrastructure is compatible with `Text` nodes.
  - **Conclusion**: Switching to `Text` nodes solves the structural type mismatch but not the quantity mismatch. The quantity mismatch requires either (i) markers in the SSR HTML to delimit individual text node boundaries, or (ii) accepting that text node hydration is best-effort only.
- (c) **Change SSR to emit `<output>` elements**: SSR emits `<output>` tags for `m.t` nodes. Preserves current CSR behavior, slightly heavier HTML. Solves both the type mismatch and the quantity mismatch (each `m.t` node maps to exactly one `<output>` element).

Option (a) is the simplest and aligns with the lazy/best-effort principle. Option (c) is the most complete solution for text node hydration. Option (b) is a partial solution that still requires additional work for the quantity mismatch.

FEEDBACK:
- This section is out of date. Text nodes are CSR'd as-is, not wrapped in `<output>` elements.
- CSR in sync-mode will assimilate and reuse single, unmodified/unmerged text-nodes, but will regenerate adjacent nodes that got merged in the DOM by the browser.
- The `MWIDOMSync` interface accounts for mismatched text and comment nodes, with a worst-case fall-back of regenerating parts of the DOM that can't be synchronized, assimilated, and reused.
- Re: the following specific tag types, the basic concept was mentioned above:
  - Components (such as the `h.` series) that generate content directly should attempt to match DOM nodes based on the doc-spec.
  - Components that don't render directly should pass the `MWIDOMSync` instance (if one was provided) through to the child nodes that do.
- Aggregate collection tags do not render immediately and therefore should not sync immediately.
- Aggregate rendering tags should determine the active content doc-nodes (applying content deduplication where applicable), and then render the active content nodes in sync-mode. Well-formed aggregated content fragments should begin with elements with ids to aid in synchronization (i.e. leading text should be wrapped in e.g. a `<span>`).

#### Fragment Nodes (`m.frg`)

Fragments are transparent containers — no DOM element in either SSR or CSR. The tree walk skips through them naturally. No mismatch.

#### Template/Slot Expansion

Template invocation nodes have no corresponding DOM element (the template expands inline). The tree walk must skip through them. No mismatch at the template level; the expanded content is what matters.

#### Aggregate Content (`m.scpcss`, etc.)

Aggregators collect content from across the doc tree and render it at a single location. The aggregator node in the doc tree corresponds to the aggregated output element in the DOM (e.g., `<style>`). This is a 1:1 correspondence and can be handled normally.

### 5.3 The Parallel Tree Walk (for Future Full Hydration)

**Section 5.3 REJECTED**

For a more complete hydration strategy (beyond ID-only), a parallel tree walk can be used:

```
function hydrateSubtree(docNode, domCursor):
  switch docNode.type:
    case 'm.frg', template-type, slot-type:
      // Virtual node: no DOM counterpart, recurse into children
      for each child in docNode.children:
        domCursor = hydrateSubtree(child, domCursor)
      return domCursor

    case 'm.t':
      // Text node: structural mismatch (see Q6)
      // Best-effort: skip the DOM text node, leave SSR as-is
      if domCursor is a Text node:
        return domCursor.nextSibling
      return domCursor  // No match; leave as-is

    case 'm.com':
      // Comment node: connect to existing Comment DOM node
      if domCursor is a Comment node:
        docNode.connectSSRDOM(domCursor)
      return domCursor?.nextSibling

    case HTML element type:
      const expectedTag = docNode.type.replace(/^h\./, '').toUpperCase()
      if domCursor?.tagName === expectedTag:
        docNode.connectSSRDOM(domCursor)
        hydrateChildren(docNode, domCursor)
        return domCursor.nextSibling
      else:
        // Mismatch: try to resync via id
        const id = docNode.getAttr('id')
        if id:
          const target = document.getElementById(id)
          if target:
            docNode.connectSSRDOM(target)
            hydrateChildren(docNode, target)
        // If no resync possible, leave SSR as-is (lazy fallback)
        return domCursor  // Don't advance; DOM node stays
```

The `connectSSRDOM(domElement)` operation stores the SSR DOM element reference in the doc node's private state, so that `getDOM()` returns it instead of creating a fresh element.

---

## 6. The `connectSSRDOM` Operation

**Section 6 REJECTED**

### 6.1 Purpose

`connectSSRDOM(domElement)` is a new operation on doc nodes that:
1. Stores the SSR DOM element reference in the doc node's private state (`p`)
2. Activates reactive attribute synchronization against the existing DOM element (instead of a fresh one)
3. Activates reactive child synchronization against the existing DOM element's children

### 6.2 Behavior After Connection

Once a doc node is connected to an SSR DOM element:
- `getDOM()` returns a NANOS containing the SSR DOM element (not a fresh element)
- Reactive attribute updates apply to the SSR DOM element directly
- Reactive child updates replace the SSR DOM element's children

### 6.3 Behavior Without Connection (Lazy Fallback)

If `connectSSRDOM` is never called on a doc node:
- `getDOM()` behaves as today — creates a fresh DOM element
- The fresh DOM element is inserted into the live DOM, replacing the SSR content, when the doc tree is updated

---

## 7. Relationship to Deferred Components

[`MWICoreDefer`](../src/mwi-core-comp.msjs:112) already implements a similar pattern:
- SSR renders a `<slot data-mwi-defer="componentType" id="...">` placeholder
- When the deferred component loads, it replaces the placeholder

The `m.csr` hydration mechanism is a generalization of this pattern. The key difference:
- `m.defer` is for components not yet loaded at render time
- `m.csr` is for components that are loaded but should be CSR-managed (reactive, interactive)

These two mechanisms should be designed to be consistent and potentially share infrastructure.

---

## 8. Server-to-Client Synchronization

### 8.1 What Needs to Be Synchronized

For hydration to work, the client needs to know:
1. **Component IDs** — already synchronized via `globalThis.mwiServer.at('components')`
2. **Scope IDs** (for scoped CSS) — already synchronized
3. ~~**Hydration anchor IDs** — the IDs of `m.csr` subtree roots (see Q5)~~

### 8.2 Synchronization Mechanism

The existing mechanism passes data via `globalThis.mwiServer` embedded in the SSR HTML. The hydration anchor IDs (if auto-assigned) would be added to this payload.

---

## 9. Implementation Phases

**Section 9 REJECTED**

### Phase 1: ID-Only Hydration (Minimal)

- `m.csr` attribute support in doc nodes
- SSR emits `data-mwi-csr` marker and requires `id` on `m.csr` nodes
- Hydrator: `document.querySelectorAll('[data-mwi-csr]')` → `document.getElementById(id)` → `connectSSRDOM()`
- No parallel tree walk; only explicitly-IDed nodes are connected
- Sufficient for most interactive widget use cases

### Phase 2: Parallel Tree Walk (Full Hydration)

- Implement the parallel tree walk algorithm (Section 5.3)
- Enables hydration of nodes without explicit IDs
- Handles structural mismatch cases with lazy fallback

### Phase 3: Text Node Reconciliation

- Resolve Q6 (text node strategy)
- Implement chosen approach

---

## 10. Open Design Questions Summary

FEEDBACK: Check, but I believe all of these questions have already been answered.

| # | Question | Options |
|---|----------|---------|
| Q1 | Scope of `m.csr` | Doc-node attribute / component registry flag / both |
| Q2 | SSR output marker for `m.csr` nodes | `data-mwi-csr` / require `id` / both |
| Q3 | Hydration replacement strategy | Replace / Adopt / Swap children |
| Q4 | Hydration trigger timing | Automatic / Manual / Both |
| Q5 | Stable hydration anchor ID assignment | Explicit user `id` / Auto-assigned + synced / Positional |
| Q6 | Text node (`m.t`) hydration strategy | Accept mismatch (lazy) / CSR uses `Text` nodes / SSR emits `<output>` |

---

## 11. Related Documents

- [`v5-arch/core-architecture.md`](core-architecture.md) — System overview, ID namespaces
- [`v5-arch/reactive-dom.md`](reactive-dom.md) — Reactive DOM system
- [`v5-init-arch/Reactive-DOM-Reqs-Rev1.md`](../v5-init-arch/Reactive-DOM-Reqs-Rev1.md) — Detailed reactive requirements
- [`v5-init-arch/Initial-Requirements.md`](../v5-init-arch/Initial-Requirements.md) — Foundational requirements (see MWIMUM)

[supplemental keywords: hydration, rehydration, hybrid rendering, SSR DOM reconnection, client-side takeover, progressive enhancement, m.csr, connectSSRDOM, lazy hydration, structural mismatch, text node reconciliation, deferred hydration, hydration anchor, parallel tree walk]
