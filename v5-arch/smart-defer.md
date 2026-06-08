# Smart Defer: Revised `m.defer` Implementation

**Status:** [APPROVED]
**Created:** 2026-06-03
**Author:** Architectural discussion — Brian Katzung + AI partner

---

## 1. Overview and Motivation

The current `MWICoreDefer` (`m.defer`) implementation is a **system-internal placeholder** created automatically by `createNode()` when a component is registered but not yet loaded (has `ftr` but no `if` or `tpl`). It renders nothing in both SSR and CSR, ignores all children, and carries only the deferred component type — but no information about what should eventually replace it.

The code comment at [`src/mwi-core-comp.msjs:117`](../src/mwi-core-comp.msjs:117) proposes a revised `m.defer` that is a **smarter version of the same concept**:

```
// **NEW**
// `[m.defer content...]`
// Does not render any HTML during SSR (doc-spec only, for hydration).
// At CSR, derives the required feature from the registry entry for the
// component type (sub-spec item 0, item 0), then waits via `fwait`.
// If no feature can be derived, CSR does not render either.
```

The key insight is that the new `m.defer` **includes the content (spec) being deferred** as its children. This means that when the required feature becomes available, the content can "just magically appear" — the system already has everything it needs to render it. This is an evolution of the existing `m.defer` concept, not a replacement or renaming.

---

## 2. Design Goals

1. **Smarter deferred content:** `m.defer` now carries the content spec that should be rendered when the gate opens, rather than being an opaque placeholder.
2. **SSR transparency:** `m.defer` emits nothing during SSR — it is invisible to the HTML output, but its spec (including children) is preserved for hydration.
3. **CSR feature-gating:** At CSR, the required feature name is derived from the registry entry for the component type found in sub-spec item 0. CSR rendering is deferred until `fwait(ftr)` resolves.
4. **Unconditional CSR suppression:** When no feature can be derived (e.g., no sub-spec, or the component has no `ftr`), the children are never rendered. This is useful for content that should only appear after an explicit programmatic trigger.
5. **Hydration compatibility:** The `m.defer` node and its children are part of the doc-spec, so the client can reconstruct the full tree and render it reactively once the gate opens.
6. **`autoDoc: false` preserved:** Children are stored in the sub-spec but are **not** auto-rendered. This prevents premature rendering before the feature becomes available.
7. **Backward compatibility:** `createNode()` continues to create `m.defer` nodes for unloaded components. The `from()` path enriches the `m.defer` node with the original child spec (no `until` attribute needed — the feature is derived at CSR from the registry).
8. **Smaller doc-spec:** Eliminating the redundant `until` attribute reduces the size of the doc-spec sent to the client.

---

## 3. Revised `m.defer` Specification

### 3.1 Component Tag

**Type:** `m.defer`
**Interface:** `MWICoreDefer`

### 3.2 Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| All attributes | — | Stored on the node but not rendered (neither SSR nor CSR). |

> **Note:** There is no `until` attribute. The required feature promise name is derived at CSR time from the registry entry for the component type found in sub-spec item 0 (i.e., `registry.get(subSpec.at([0, 0])).at('ftr')`). This avoids redundant information in the doc-spec.

### 3.3 Children

`m.defer` **accepts children**. Children are stored in the sub-spec as normal. They represent the content that will be rendered when the gate opens.

**`autoDoc: false` is preserved.** This prevents the system from auto-rendering children before the feature becomes available. The sub-doc is not auto-populated from the sub-spec; instead, the `getDOM` handler explicitly renders children only after the derived `fwait(ftr)` resolves.

### 3.4 SSR Behavior (`getHTML`)

`m.defer` renders **nothing** during SSR — it returns an empty string and does not render its children. The children are preserved in the doc-spec for hydration.

This is consistent with the `m.csr` attribute semantics described in [`v5-arch/ssr-csr-hydration-v2.md`](ssr-csr-hydration-v2.md): SSR simply omits the node and its subtree entirely.

### 3.5 CSR Behavior (`getDOM`)

CSR behavior depends on whether a feature name can be derived from the sub-spec:

**Case 1: Feature name derived successfully**

1. `getDOM()` returns a reactive NANOS (initially empty).
2. The feature name is derived: `subSpec.at([0, 0])` gives the component type; `registry.get(compType).at('ftr')` gives the feature name.
3. An async task is started: `fwait(ftr)` is awaited.
4. When `fwait` resolves, the children are rendered by calling `getSubDOM` with the pre-existing reactive NANOS as the `into` target. `getSubDOM` with `into` behaves like a fragment (reactively rendering sub-spec children) but does so into the provided NANOS.
5. Subsequent reactive updates to the children propagate normally.

**Case 2: No feature name can be derived**

`getDOM()` returns an empty NANOS. No rendering occurs. The node is effectively invisible in the DOM (but available for manipulation within the doc-spec). This covers: empty sub-spec, component type not in registry, or registry entry has no `ftr`.

### 3.6 Schema

```javascript
{
    autoDoc: false  // Children not auto-rendered; rendering is gated on `until`
}
```

---

## 4. `createNode()` and `from()` Integration

The primary use case for `m.defer` remains the same: `createNode()` in [`src/mwi-document.msjs`](../src/mwi-document.msjs) creates `m.defer` nodes when a component is registered but not yet loaded.

### 4.1 Current Behavior

Currently, `createNodeCommon()` (lines 111-130 of `mwi-document.msjs`) creates an `m.defer` node for unloaded components. The node's `type` is set to the **original component type** (e.g., `my.component`), not `m.defer`. No `until` attribute is set, and no child spec is stored.

### 4.2 New Behavior via `opFrom`

With the revised `m.defer`, the `opFrom` function (lines 150-175 of `mwi-document.msjs`) creates nodes from specs. When it creates a node and detects that the result is an `m.defer` placeholder (i.e., `node('type') === 'm.defer'` and the requested type differs from `m.defer`), it should:

1. Set the sub-spec of the `m.defer` node to the original spec (the full `[type attr=value... children...]` spec).

The `ftr` feature name is **not** stored on the node — it is derived at CSR time from the registry entry for the component type in the sub-spec. This keeps the doc-spec smaller by eliminating redundant information.

### 4.3 Example

```
// Original spec:
[(my.component class=widget data-value=42)]

// my.component is registered with ftr=mwi.comp.MyComponent but not yet loaded.
// opFrom creates:
[m.defer
    [my.component class=widget data-value=42]
]
```

At CSR, `getDOM()` reads the sub-spec, finds `my.component` as the component type, looks up `registry.get('my.component').at('ftr')` → `'mwi.comp.MyComponent'`, and calls `fwait('mwi.comp.MyComponent')`. When that resolves, the `m.defer` node renders its child spec — which is now the actual component — and the DOM updates reactively.

---

## 5. Reactive CSR Implementation

The CSR `getDOM` handler for the new `m.defer` uses the `getSubDOM` `into` parameter to render children into a pre-existing reactive NANOS after the gate opens:

> Note: The following implemention is out of date.

```javascript
function opGetDOM (d) {
    if (typeof document !== 'object') return new NANOS();
    const p = d.p;
    if (p.has('dom')) return p.at('dom');
    const doc = p.at('doc'), nodes = doc.rxNANOS();
    p.set('dom', nodes);

    // Derive the feature name from the sub-spec's component type
    const subSpec = d.rr('getSubSpec');
    const compType = subSpec?.at([0, 0]);  // item 0 of sub-spec → item 0 of that spec
    const registry = getInstance('MWIRegistry');
    const ftr = compType && registry.get(compType)?.at('ftr');
    if (!ftr) return nodes; // No gate: never renders

    // Gate: wait for the feature, then render like a fragment
    fwait(ftr).then(() => {
        d.rr('getSubDOM', { into: nodes });
    }, () => {});

    return nodes;
}
```

**Notes:**
- The feature name is derived from the sub-spec at `getDOM()` call time (not reactively). The sub-spec's item 0 is the original component spec; its item 0 is the component type string.
- The registry lookup is safe: the registry is always available when `getDOM()` runs (the document waits on `mwi.compRegReady`), and `ftr` persists in the registry entry even after the component loads (since `opRegister` merges, not replaces).
- If `fwait(ftr)` resolves immediately (component already loaded), the children are rendered synchronously in the microtask queue.
- The reactive relay is only set up after `fwait` resolves, so no reactive tracking occurs before the gate opens.
- The returned `nodes` NANOS is reactive — once the gate opens and children are rendered, the NANOS is populated and any parent reactive contexts are notified.
- Since `autoDoc: false`, the sub-doc is not auto-populated; the nodes are rendered after the gate opens via `getSubDOM`.
- `getSubDOM` with `into` behaves like a fragment (reactively rendering sub-spec children) but does so into the provided NANOS.

---

## 6. `getSubDOM` `into` Parameter

The `opGetSubDOM` function in [`src/mwi-doc-node.msjs`](../src/mwi-doc-node.msjs) already supports the `into` parameter (line 578-581):

```javascript
// Get reactive NANOS of sub-doc DOM nodes
// (getSubDOM into=list?)
// The `into` option allows re-using an existing nodes list (e.g. for m.defer)
function opGetSubDOM (d) {
    const p = d.p, m = d.mp, into = m.at('into');
    ...
}
```

The `into` parameter is read from `d.mp` (message parameters), so calling `d.rr('getSubDOM', { into: nodes })` correctly passes the pre-existing NANOS. **No changes to `opGetSubDOM` are required.**

---

## 7. Interaction with Hydration

Per [`v5-arch/ssr-csr-hydration-v2.md`](ssr-csr-hydration-v2.md), `m.defer` nodes emit nothing during SSR. During CSR in sync mode (`MWIDOMSync`), the absence of pre-generated nodes is detected and handled:

- The `MWIDOMSync` sync walk encounters the `m.defer` node in the doc tree.
- Since `m.defer` renders nothing during SSR, there are no corresponding DOM nodes to assimilate.
- The sync walk skips the `m.defer` node (no DOM nodes to match).
- When the feature gate opens, the children are rendered and inserted into the DOM via normal reactive CSR mechanisms (the reactive NANOS returned by `getDOM()` is tracked by the parent's sub-DOM relay, which handles insertion and removal).

---

## 8. Interaction with `m.rns` and Live Doc

Per [`v5-arch/live-doc-spec.md`](live-doc-spec.md), `m.rns` is a virtual attribute that records the live sub-doc state. For `m.defer`:

- During SSR, `m.defer` renders nothing, so its live sub-doc is not populated. `m.rns` returns `undefined`.
- During CSR, `getSubDOM` with `into` renders from the sub-spec directly (since `subDoc.live` is false). The sub-doc remains unpopulated unless `append` is called explicitly. `m.rns` returns `undefined` in the typical case.
- This is acceptable — `m.defer` is a CSR-only rendering mechanism and does not need `m.rns` for hydration purposes.

---

## 9. `getSubSpec` and `getSpec` Behavior

- `getSubSpec()` returns the original sub-spec (the children as provided in the doc-spec). The `getSubSpec` override that returned an empty NANOS is removed.
- `getSpec()` returns the full spec including attributes and sub-spec. The child specs are included.
- `append` and `setSubSpec` are **not** overridden — children can be added to the sub-spec normally. The `autoDoc: false` flag prevents auto-rendering, but the sub-spec is still managed.

---

## 10. Files Requiring Changes

### 10.1 `src/mwi-core-comp.msjs`

| Change | Description |
|--------|-------------|
| Remove `append` no-op override | New `m.defer` accepts children normally |
| Remove `getSubSpec` empty override | New `m.defer` returns the actual sub-spec |
| Remove `setSubSpec` no-op override | New `m.defer` stores children in sub-spec |
| Keep `getHTML` handler | Continue returning empty string (unchanged behavior) |
| Implement new `getDOM` handler | Reactive NANOS, gated on registry-derived `ftr` via `fwait`, uses `getSubDOM` with `into` |
| Keep `autoDoc: false` in `coreConfig` schema | Prevents auto-rendering before gate opens |

### 10.2 `src/mwi-doc-node.msjs`

No changes required. The `into` parameter for `opGetSubDOM` is already implemented (reads from `d.mp`).

### 10.3 `src/mwi-document.msjs`

| Change | Description |
|--------|-------------|
| Update `opFrom` | After `createNode`, detect `m.defer` result (via `node('type') === 'm.defer'`); set sub-spec to original spec (no `until` needed — feature is derived at CSR from registry) |

### 10.4 `docs/interfaces/MWICoreDefer-defer.md`

| Change | Description |
|--------|-------------|
| Update documentation | Reflect new `m.defer` behavior: children accepted, registry-derived CSR gating, `autoDoc: false` semantics, no `until` attribute |

### 10.5 `v5-arch/core-architecture.md`

| Change | Description |
|--------|-------------|
| Update `MWICoreDefer` description | Reflect new behavior: children accepted, registry-derived feature gating, no `until` attribute |

### 10.6 Tests

| File | Change |
|------|--------|
| `test/core/defer.test.js` | Update for new `m.defer` behavior: children accepted, registry-derived gate, `autoDoc: false` semantics |
| `test/ssr-html/defer.test.js` | Update for new `m.defer` SSR behavior (still renders nothing, but children are accepted) |
| `test/csr-dom/defer.test.js` | Update for new `m.defer` CSR behavior (gated rendering via registry-derived `ftr`) |

---

## 11. Test Plan for New `m.defer`

### 11.1 Core Tests (`test/core/defer.test.js`)

**Group: Basic Interface**
- `m.defer` node type is `m.defer`
- `m.defer` msjsType is `MWICoreDefer`
- `m.defer` accepts children via `append`
- `m.defer` accepts children via `setSubSpec`
- `m.defer` `getSubSpec` returns children (sub-spec)
- `m.defer` schema has `autoDoc: false`

**Group: SSR Behavior**
- `getHTML()` returns empty string (no rendering)
- `getHTML()` returns empty string even with children
- `getHTML()` returns empty string even with children and sub-spec

**Group: CSR Behavior — No Gate**
- `getDOM()` returns empty NANOS when sub-spec is empty (no component type to derive feature from)
- `getDOM()` returns empty NANOS when sub-spec component has no `ftr` in registry

**Group: CSR Behavior — With Gate**
- `getDOM()` returns empty NANOS before gate opens
- After `fready(mid, featureName)`, `getDOM()` NANOS is populated with rendered children
- Multiple `m.defer` nodes with the same derived feature all render when gate opens

**Group: `from()` Integration**
- `from()` with an unloaded component spec creates `m.defer` with child sub-spec (no `until` attribute)
- CSR correctly derives feature name from sub-spec component type via registry

### 11.2 SSR Tests (`test/ssr-html/defer.test.js`)

**Group: No Rendering**
- `m.defer` with children renders nothing
- `m.defer` in mixed content is invisible
- `m.defer` created by `from()` for unloaded component renders nothing

### 11.3 CSR/DOM Tests (`test/csr-dom/defer.test.js`)

**Group: No Gate**
- `m.defer` with empty sub-spec renders no DOM nodes
- `m.defer` with sub-spec component having no `ftr` renders no DOM nodes
- `m.defer` with no-gate sub-spec in mixed content is invisible

**Group: With Gate**
- `m.defer` with deferred component sub-spec renders no DOM nodes before gate opens
- After gate opens (feature signaled), DOM nodes appear
- Children are reactive after gate opens
- `m.defer` in mixed content: surrounding nodes visible before gate, all nodes visible after
- `from()` for unloaded component: renders nothing before load, renders correctly after load

---

## 12. Open Questions

### 12.1 Error Handling for Unknown Feature Names

If `fwait(ftr)` is called with a feature name that is never signaled, the `m.defer` node will never render. Should there be a timeout or error mechanism?

**Current thinking:** No timeout in the initial implementation. The `fwait` mechanism is the standard MWI feature-promise system; if a feature is never signaled, the content is never rendered. Documentation should note this behavior.

### 12.2 Sub-Doc Population After Gate Opens

When the gate opens and `getSubDOM` is called with `into`, does the sub-doc get populated?

**Current thinking:** Since `autoDoc: false`, the sub-doc is not auto-populated. `getSubDOM` renders from the sub-spec directly (when `subDoc.live` is false). The sub-doc remains unpopulated unless `append` is called explicitly. This means `m.rns` returns `undefined` for `m.defer` nodes in the typical case. This is acceptable — `m.defer` is a CSR-only rendering mechanism and does not need `m.rns` for hydration purposes.

---

## 13. Implementation Plan

### Phase 1: Update `MWICoreDefer` Interface

1. Remove `append`, `getSubSpec`, and `setSubSpec` no-op overrides from `MWICoreDefer` in `src/mwi-core-comp.msjs`.
2. Keep `getHTML` returning empty string (unchanged).
3. Implement new `getDOM` handler with registry-derived feature-gated reactive rendering using `getSubDOM` with `into`.
4. Keep `autoDoc: false` in the `coreConfig` schema for `m.defer`.

### Phase 2: Update `opFrom` in `MWIDocument`

5. In `opFrom` in `src/mwi-document.msjs`, after `createNode`, detect `m.defer` result via `node('type') === 'm.defer'`.
6. If detected (and not the originally-requested type), set the sub-spec of the `m.defer` node to the original spec. (No `until` attribute needed — the feature name is derived at CSR from the registry.)

### Phase 3: Update Tests

7. Update `test/core/defer.test.js` for new behavior.
8. Update `test/ssr-html/defer.test.js` for new behavior.
9. Update `test/csr-dom/defer.test.js` for new behavior.

### Phase 4: Documentation

10. Update `docs/interfaces/MWICoreDefer-defer.md`.
11. Update `v5-arch/core-architecture.md`.
12. Update memory bank `context.md`.
13. Add `v5-arch/smart-defer.md` to `tech.md` index.

---

## 14. Related Documents

- [`v5-arch/ssr-csr-hydration-v2.md`](ssr-csr-hydration-v2.md) — SSR-to-CSR hydration; `m.defer` interaction with sync walk
- [`v5-arch/live-doc-spec.md`](live-doc-spec.md) — `m.rns` virtual attribute; `autoDoc: false` nodes
- [`v5-arch/core-architecture.md`](core-architecture.md) — Core architecture; deferred loading
- [`v5-init-arch/resync-render.md`](../v5-init-arch/resync-render.md) — Original `MWICoreDefer` design (now evolved)
- [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) — Current implementation
- [`src/mwi-document.msjs`](../src/mwi-document.msjs) — `createNode()` / `from()` implementation
- [`src/mwi-doc-node.msjs`](../src/mwi-doc-node.msjs) — `getSubDOM` with `into` parameter
- [`docs/interfaces/MWICoreDefer-defer.md`](../docs/interfaces/MWICoreDefer-defer.md) — Current documentation

---

[supplemental keywords: deferred rendering, feature-gated content, client-side only, CSR-only, fwait, registry-derived feature, conditional rendering, lazy rendering, smart defer, autoDoc false, unloaded component, placeholder evolution, createNode deferred, getSubDOM into, opFrom enrichment, smaller doc-spec, no until attribute]
