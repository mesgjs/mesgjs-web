# MWI Title and Slot Implementation Plan

---
**Status:** ACTIVE
**History:**
- 2025-08-02: ACTIVE, REVISED
**Scope:** Defines required bug fixes and implementation plans for the VNode API and the `h.title` and `m.slot` components.
**Related:** `architectural-plan/MWI-Slot-System.md`, `architectural-plan/Core-Components-Requirements.md`, `src/shared/components/mwi-html-core.msjs`
---

## 1. Introduction

This document has been revised to detail a significant simplification of the renderer-to-component contract. This new model resolves the core rendering bug by replacing implicit behaviors with an explicit, predictable system.

## 2. Core Renderer & Handler Contract

The fundamental flaw in the rendering pipeline was that the renderer tried to guess a smart component handler's intention. The new model is much simpler and can be expressed in a single line of logic.

`const shouldRenderChildren = result.renderChildren ?? vnode.opts.renderChildren ?? !vnode.opts.noClose;`

*   **Default Behavior:** By default (`!vnode.opts.noClose` is true), the renderer will render the children of a VNode after its handler has been called.
*   **Opt-Out via Static Component Option:** A component can be registered with `{ renderChildren: false }` in its options to prevent child rendering by default. This is the ideal mechanism for components like `h.script` or `h.style` that contain raw text.
*   **Opt-Out via `noClose`:** If a component is registered with `{ noClose: true }` (a void element), the default behavior is to *not* render children. This is preserved for backward compatibility.
*   **Explicit Handler Override:** A component handler can always override the default behavior by returning a payload with an explicit boolean value for `renderChildren`.
    *   `{ renderChildren: false }` will prevent child rendering (e.g., `m.slot`, `h.title`).
    *   `{ renderChildren: true }` will force child rendering, even for a `noClose` component.
*   **`content` Property:** After the child-rendering logic is complete, if the handler's payload has a `content` property, the renderer recursively calls `_renderNode` on that content. This is how `m.slot` replaces itself.