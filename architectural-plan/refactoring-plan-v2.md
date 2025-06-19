> **DEPRECATED:** This "Payload-Driven" plan was a second attempt at refactoring the SSR engine. While it correctly identified the need to simplify component handlers, it was superseded by the more comprehensive `MWI-Architectural-Plan-v2.md`, which was created after a formal requirements-gathering step. It is kept for historical reference only.

# SSR Engine Refactoring Plan v2: Payload-Driven Rendering

**Date:** 2025-06-19

## 1. Goal

To refactor the Server-Side Rendering (SSR) pipeline to a **payload-driven** model. This approach will simplify the component handler contract, reduce boilerplate code, and centralize complex rendering logic within the `SsrRenderer`. This plan supersedes the previous "outside-in" refactoring plan.

## 2. Core Problems with the Previous Approach

*   **Complex Handlers:** "Smart" component handlers became responsible for manually creating `VirtualNode` instances and copying attributes, making them verbose and error-prone.
*   **Broken Declarative Components:** The `m.slot` mechanism for "low-code" components was unreliable and did not correctly render nested content.
*   **Inefficient Attribute Handling:** Manual attribute copying was inefficient and a significant source of boilerplate.

## 3. The Payload-Driven Solution

The new architecture is based on a simple contract: component handlers do not render HTML or `VirtualNode`s directly. Instead, they return a **payload object** that describes their intended output. The `SsrRenderer` is responsible for interpreting this payload and rendering the final `VirtualNode`.

### 3.1. The Component Payload

A handler can return a payload with the following properties:

*   **`tag` (string):** Specifies the HTML tag to be rendered (e.g., `'div'`, `'a'`). This is primarily for primitive components like `h.*`.
*   **`attrs` (object):** An object of attributes to be merged with the attributes from the component instance. Attributes in the payload take precedence.
*   **`content` (any):** A data structure (Array or NANOS) that represents the component's inner content. The renderer will recursively render this content. This replaces the `m.slot` mechanism.

### 3.2. The Rendering Process

1.  The `SsrRenderer` receives a `VirtualNode` for a component instance (e.g., `<card title="My Card">...</card>`).
2.  It calls the component's handler, which returns a payload.
3.  The renderer processes the children of the *original* component instance.
4.  It creates a new `VirtualNode` for the output.
5.  It merges the attributes from the original instance and the payload.
6.  If the payload has a `content` property, the renderer recursively renders it, passing the original instance's rendered children to be used where `m.slot` appears.
7.  The final, merged `VirtualNode` is returned.

## 4. Implementation Plan

### Phase 1: `VirtualNode` Enhancements

**`src/server/VirtualNode.esm.js`**
- [ ] Add a `clone()` method to create a copy of a node.
- [ ] Add a `mergeWith(otherVNode)` method that merges attributes and children from another `VirtualNode`.

### Phase 2: `SsrRenderer` Refactoring

**`src/server/SsrRenderer.esm.js`**
- [ ] Rewrite `_renderComponent` to implement the payload-driven logic. It will call the handler, process the returned payload, and manage the creation and merging of the final `VirtualNode`.
- [ ] Remove the `_buildVNodeFromTemplate` method, as its logic will be incorporated into the new `_renderComponent` method.

### Phase 3: Component Handler Refactoring

**`src/server/components/h.esm.js`**
- [ ] Simplify the `h.*` handler to return a simple payload: `{ tag: vnode.type.substring(2) }`.

**`src/server/ComponentFactory.esm.js`**
- [ ] **`button` component:** Refactor to a "smart" handler that returns a payload. It will determine the tag and return `{ tag: 'a' }` or `{ tag: 'button' }`.
- [ ] **`card` component:** Refactor back to a "low-code" declarative component. Its handler will be a simple data structure that will be returned as the `content` of a payload.

This new approach will significantly simplify the component handlers, fix the issues with declarative components, and create a more robust and maintainable rendering engine.