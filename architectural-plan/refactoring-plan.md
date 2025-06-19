> **DEPRECATED:** This "Outside-In" plan was an initial attempt at refactoring the SSR engine. It was abandoned after it was determined that it introduced excessive complexity into the component handlers, violating the principle of programmer efficiency. It is kept for historical reference only. The current, active plan is documented in `MWI-Architectural-Plan-v2.md`.

# SSR Engine Refactoring Plan: "Outside-In" Architecture

**Date:** 2025-06-19

## 1. Goal

Refactor the Server-Side Rendering (SSR) pipeline to a more intuitive **"outside-in"** model. This new architecture will be easier to reason about and will natively support both "smart" (JavaScript-driven) and "low-code" (declarative, data-driven) components.

## 2. Core Concepts

The new design is founded on three core principles:

### 2.1. Outside-In Rendering
Component handlers will take full control over their own rendering logic, including the rendering of their children. The renderer's role shifts from pre-processing children to delegating rendering tasks to the appropriate component handler.

### 2.2. Unified Handler Contract
The system will no longer have different return types for different kinds of components. Instead, it will use a unified contract based on the type of the component's definition:

*   **"Smart" Components (Functions):** If a component's definition is a JavaScript function, the renderer will execute it. The function will be passed the component's `VirtualNode` (containing unprocessed children) and a reference to the `renderer` instance. The function is responsible for performing any logic and returning a single, final `VirtualNode`.

*   **"Low-Code" Components (Data):** If a component's definition is a data structure (a JavaScript Array or a NANOS object), the renderer will treat it as a template for creating a `VirtualNode`.

### 2.3. Declarative Child Placeholder: `m.slot`
To support "low-code" components, we will introduce a special, reserved token: `m.slot`. When used inside a declarative component template, the renderer will replace this token with the rendered children of the component instance. This aligns with the Web Components `<slot>` standard, making it intuitive for web developers.

## 3. Architectural Diagram

```mermaid
graph TD
    subgraph "Component Definitions"
        Smart["<b>Smart Component (JS Function)</b><br>const handler = (vnode, renderer) => { ... };"]
        Declarative["<b>Declarative Component (Data Template)</b><br>const template = ['h.div', {class: 'card'}, ['m.slot']];"]
    end

    subgraph "SsrRenderer"
        A[Get component definition] --> B{Function or Data?};
        B -- "Function" --> C{Invoke JS handler(vnode, renderer)};
        B -- "Data" --> D{Process template, replacing 'm.slot' with rendered children};
        C --> E[Render final VNode to HTML];
        D --> E;
    end
```

## 4. Implementation Plan

The implementation will be executed in two phases.

### Phase 1: Core Class Refactoring

This phase focuses on updating the core rendering engine classes.

**`src/server/VirtualNode.esm.js`**
- [ ] Remove the `rawChildren` property.
- [ ] Remove the `appendRaw()` method.
- [ ] Remove the `rawFragment()` static method.
- [ ] The `children` property will be the single container for a node's children. In a `VirtualNode` passed to a handler, it will contain unprocessed data. A handler will create a *new* `VirtualNode` and populate its `children` property with rendered nodes.

**`src/server/SsrRenderer.esm.js`**
- [ ] Implement the primary branching logic in the main rendering loop to differentiate between function-based and data-based component definitions.
- [ ] Create a new public method, `renderChildren(vnode)`, which iterates over `vnode.children` and recursively calls the main rendering logic for each child.
- [ ] Implement the logic for processing declarative templates. This will involve traversing the template structure, finding any `m.slot` nodes, and replacing them with the result of `renderChildren()`.
- [ ] Ensure the `renderer` instance is passed as an argument to "smart" component handlers.

### Phase 2: Component Handler Refactoring

This phase adapts all existing component handlers to the new architecture.

**`src/server/components/h.esm.js`**
- [ ] Rewrite the generic `h.*` handler to be a "smart" component. Its function will receive the `renderer`, call `renderer.renderChildren()`, and append the resulting nodes to its own `VirtualNode` before returning it.

**`src/server/ComponentFactory.esm.js`**
- [ ] **`card` component:** Refactor to be a "low-code" declarative data template that uses `m.slot` to place its children.
- [ ] **`button` component:** Refactor into a "smart" handler. It will contain the logic to choose between an `h.a` and `h.button` tag, call `renderChildren()` to process its content, and construct the final `VirtualNode`.