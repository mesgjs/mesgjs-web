# Rendered-Node Tracking

The `m.rns` ("rendered node spec") idea is sound and fits naturally into the existing architecture. Here's an analysis:

---

## The Proposal: `m.rns` as Rendered-Node-Spec Attribute

For nodes where natural children ≠ rendered output, the SSR pass would store the rendered child nodes as a list-valued attribute (e.g., `m.rns`) on the node. The sync walk checks for `m.rns` first; if present, it uses that as the rendered-children source instead of the natural children.

### Why It Works Well

1. **Fits the existing spec model.** Attributes already carry list-valued content (e.g., named slot attributes like `c.header`). `m.rns` would just be another list-valued attribute, reconstructed by `getSpec()` alongside everything else.

2. **Minimal sync-walk complexity.** The MWIDOMSync interface (see [`v5-arch/ssr-csr-hydration-v2.md`](ssr-csr-hydration-v2.md)) already needs to handle virtual nodes (`m.frg`, template types, slot types) by recursing into children. With `m.rns`, the walk rule becomes: *"if the node has `m.rns`, walk `m.rns` as the rendered children; otherwise walk natural children."* This is a single, clean branch.

3. **Covers both affected node types cleanly:**
   - **[`m.slot`](docs/interfaces/MWICoreSlot-slot.md):** The slot's *selected* content (whether from the slot source or fallback) is what was rendered. `m.rns` would hold that resolved content.
   - **Template components ([`MWICoreTpl`](docs/interfaces/MWICoreTpl-template.md)):** The expanded `tpl` output is what was rendered. `m.rns` would hold the template's rendered subtree.

4. **Lazy/best-effort compatible.** If `m.rns` is absent (e.g., for a node that was never SSR-rendered), the sync walk falls back to natural children — consistent with the lazy principle already established in the hydration doc.

---

## One Nuance: When to Populate `m.rns`

`m.rns` should be populated **during `getHTML()`** (the SSR pass), not at doc-tree construction time, because:
- For `m.slot`, the resolved content isn't known until render time (it depends on the slot source's state at that moment).
- For template components, the expanded output is produced during rendering.

This means `m.rns` is a **render-time side effect** written back into the spec — similar in spirit to how `m.id` auto-assigns an `id` during `getHTML()` in [`MWICoreDefer`](docs/interfaces/MWICoreDefer-defer.md:66).

---

## Summary Recommendation

The `m.rns` approach is reasonable and architecturally consistent. The sync walk rule is simple: **check for `m.rns`; if present, use it as the rendered-children source; otherwise use natural children.** Populating it as a render-time side effect of `getHTML()` keeps it accurate and avoids premature computation.
