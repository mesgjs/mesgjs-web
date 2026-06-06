# Rendered-Node Tracking

**Status:** IMPLEMENTED
**Date:** 2026-06-05
**Purpose:** Document the `m.rns` ("rendered node spec") virtual attribute for components where natural children and rendered output serve different purposes and both must be preserved.

---

## Overview

The `m.rns` attribute is a **virtual, read-only attribute** that records the rendered child nodes for components where natural children and rendered output are semantically distinct. It enables these components to preserve their natural children (e.g., fallback content) while separately tracking what was actually rendered.

### The Problem

Some component types have natural children that serve a different purpose than the rendered output:

- **`m.slot`:** Natural children are fallback content. The rendered output may come from a slot source's attribute or natural children, or fall back to the slot's own natural children. The fallback content must be preserved regardless of what was rendered.
- **Template components:** Natural children are content for slotting into the template. The rendered output is the expanded template with slots filled. Both the slotting content and the rendered expansion must be tracked separately.

For these components, tracking only the natural children (sub-spec) or only the rendered output would lose critical information. `m.rns` solves this by providing a separate, virtual attribute that tracks the rendered state without overwriting the natural children.

---

## Implementation Details

### Schema-Dependent Behavior

`m.rns` is designed for components where natural children and rendered output serve different purposes. Component types opt-in by setting `mrns: true` in their schema:

```javascript
// In src/mwi-core-comp.msjs
const MRNS = 'mrns'; // Virtual m.rns attribute opt-in

// Component registration with mrns opt-in
[SLOT_TYPE]: ls([INTERFACE, SLOT_IF, SCHEMA, ls([MRNS, true])]),

// Template schema (set during @init)
const tplSchema = new NANOS({
	[AUTO_DOC]: false,
	[MRNS]: true,
});
```

**Current opt-in components:**
- **`m.slot`** ([`MWICoreSlot`](../docs/interfaces/MWICoreSlot-slot.md)) - Natural children are default (fallback) content; rendered output may differ
- **Template components** ([`MWICoreTpl`](../docs/interfaces/MWICoreTpl-template.md)) - Natural children are slotting content; rendered output is template expansion

### Virtual Attribute Implementation

`m.rns` is implemented as a virtual attribute in [`opGetAttr`](../src/mwi-doc-node.msjs:513) (lines 513-526):

```javascript
case 'm.rns': // Rendered node spec (virtual, read-only)
	{
	// m.rns is only defined for participating types and when the sub-doc is live but off-spec
	const useMrns = p.at([SCHEMA, MRNS]);
	if (!useMrns) return;
	const rxs = p.at('rxState'), live = rxs.at('live'), equal = rxs.at('docEq');
	if (!live || equal) return;
	const subDoc = p.at('subDoc'), mRns = new NANOS();
	for (const node of subDoc.values()) {
		mRns.push([node('getSpec')]);
	}
	return mRns;
	}
```

**Key conditions for `m.rns` availability:**
1. Component type has `mrns: true` in schema (`useMrns` check) - component needs separate tracking
2. Sub-doc is live (`live` is true) - rendered output has been generated
3. Sub-doc differs from sub-spec (`equal` is false) - rendered output differs from natural children

When these conditions are met, `m.rns` returns a NANOS list of specs for the live sub-doc children (the rendered output).

### Sub-Spec Reporting Behavior

The internal sub-spec (natural children) is always retained for all node types. However, [`opGetSubSpec`](../src/mwi-doc-node.msjs:639) reports differently based on the `mrns` flag:

```javascript
const useMrns = p.at([SCHEMA, MRNS]), rxs = p.at('rxState');
reactive({ eager: true, def: () => {
	let newSpec;
	if (!useMrns && rxs.at('live')) {
		// Non-mrns types: derive from live doc when live
		const subDoc = p.at('subDoc');
		newSpec = [...subDoc.values()].map((n) => n('getSpec'));
	} else {
		// mrns types: always return original sub-spec
		newSpec = [...p.at('subSpec').values()];
	}
	// ...
}}).rv;
```

**For `mrns: true` components (like `m.slot` and templates):**
- `getSubSpec()` always returns the original sub-spec (natural children)
- This ensures fallback content and slotting content are never lost
- The rendered output is tracked separately via `m.rns`

**For non-`mrns` components (most components):**
- `getSubSpec()` returns a spec derived from the live doc when the sub-doc is live
- This reflects the current rendered/live content (the pre-`m.rns` behavior)
- The internal sub-spec is still retained, but `getSubSpec()` reports the live state

This distinction is why `mrns: true` is needed for components where natural children and rendered output serve different purposes - it changes how `getSubSpec()` reports the node's state.

### Integration with `getSpec()`

`m.rns` is explicitly included in [`opGetSpec`](../src/mwi-doc-node.msjs:573) output when available (line 573):

```javascript
const rns = d.rr('getAttr', ['m.rns']); // Virtual; computed from live sub-doc
// ...
if (rns) spec.set('m.rns', rns); // Include rendered state when present
```

This ensures that a node's full spec includes both:
- The original sub-spec (natural children) - preserved in the spec's positional values
- The rendered output (`m.rns`) - included as a named attribute when the rendered output differs

### Hydration Support

During CSR hydration, [`opSetSubSpec`](../src/mwi-doc-node.msjs:770) checks for `m.rns` in the incoming spec (line 770):

```javascript
const rns = m.at('m.rns') ?? spec?.at('m.rns');
// ...
if (rns instanceof NANOS) {
	// m.rns present: use it to populate the initial live doc children
	// (applies to all node types, including autoDoc: false nodes)
	const nodes = doc('from', { list: rns, slotSrc });
	subDoc.push(nodes);
	rxs.push({ live: true, docEq: false });
}
```

When `m.rns` is present in a spec, it is used to reconstruct the live doc state (the rendered output), while the original sub-spec (natural children) is preserved separately. This ensures the CSR doc tree matches the SSR-rendered structure while maintaining the original natural children for future re-rendering.

---

## Component-Specific Behavior

### MWICoreSlot

For [`m.slot`](../src/mwi-core-comp.msjs:349), `m.rns` tracks the selected content while preserving fallback:
- **Natural children (sub-spec):** Always preserved as fallback content
- **Rendered output (`m.rns`):** Tracks what was actually rendered:
  - Named slot with attribute: specs from the named slot attribute
  - Unnamed slot with source children: specs from the slot source's natural children
  - Fallback content: `m.rns` is **not set** (rendered output matches natural children; `docEq` is true)

### MWICoreTpl

For template components (lines 510-580), `m.rns` tracks the expanded template output while preserving slotting content:
- **Natural children (sub-spec):** Always preserved as content for slotting into the template
- **Rendered output (`m.rns`):** Tracks the expanded template with slots filled

---

## Relationship to Other Documents

- [`v5-arch/live-doc-spec.md`](live-doc-spec.md) — Comprehensive design for the live doc / sub-spec relationship, including detailed `m.rns` semantics as a virtual attribute
- [`v5-arch/ssr-csr-hydration-v2.md`](ssr-csr-hydration-v2.md) — SSR-to-CSR hydration strategy; `m.rns` is used by the sync walk to correctly associate doc nodes with SSR-rendered DOM counterparts
- [`v5-arch/core-architecture.md`](core-architecture.md) — Core architecture overview

---

## Summary

The `m.rns` virtual attribute provides a clean, schema-dependent mechanism for components where natural children and rendered output serve different purposes and both must be preserved. It is:

- **Virtual:** Computed on-demand from the live sub-doc, not stored in `attrs`
- **Read-only:** Writes are silently ignored
- **Schema-dependent:** Designed for component types with `mrns: true` in their schema where natural children and rendered output are semantically distinct
- **Conditional:** Only returns a value when the sub-doc is live and differs from the sub-spec (i.e., when rendered output differs from natural children)
- **Hydration-aware:** Used during CSR to reconstruct the live doc state (rendered output) from SSR-rendered specs while preserving the original natural children
- **Non-destructive:** The original sub-spec (natural children) is always preserved via `getSubSpec()`, ensuring fallback content and slotting content are never lost

This design ensures correct SSR-to-CSR hydration for components with dynamic rendering behavior while maintaining a clean separation between the original sub-spec (the "blueprint" / natural children) and the live doc (the "house" / rendered output).

---

[supplemental keywords: rendered node spec, virtual attribute, schema-dependent, mrns, live doc, sub-spec, hydration, slot, template, MWICoreSlot, MWICoreTpl, docEq, rxState, fallback content, slotting content, natural children preservation]
