# MWI Rendering Engine: Architectural Plan v2

**Date:** 2025-06-19

## 1. Introduction

This document outlines the definitive architecture for the Mesgjs Web Interface (MWI) rendering engine. It is designed to meet all criteria specified in `architectural-plan/requirements.md` and supersedes all previous architectural plans. The core goal is to create a rendering pipeline that is efficient, bilingual, and caters to both experienced programmers and declarative, low-code users.

## 2. Core Architecture: Incremental, Single-Pass Rendering

The architecture is built on a single, elegant, recursive rendering function: `_renderNode`. This function can incrementally process any data type it encounters, eliminating the need for complex multi-pass logic or separate "raw" and "rendered" child arrays.

```mermaid
graph TD
    subgraph "Page Data"
        A[Page Data (String, Number, Array, NANOS, or VNode)]
    end

    subgraph "SsrRenderer._renderNode(data)"
        B{Input Type?}
        B -- "Primitive" --> C[Return TextNode]
        B -- "VirtualNode" --> D[Return as-is (Base Case)]
        B -- "Array/NANOS" --> E[Process as Component]
    end

    subgraph "Component Processing"
        E --> F[Create VNode]
        F --> G{Get Handler}
        G -- "No Handler" --> H[Recurse on Children]
        G -- "Declarative" --> I[Transform Data & Recurse]
        G -- "Smart" --> J[Execute Handler, Recurse on Result]
    end

    A --> B
    H --> D
    I --> B
    J --> B
```

### 2.1. The `VirtualNode`
*   The `children` array can contain a mix of data types (primitives, un-rendered Arrays/NANOS, or already-rendered `VirtualNode`s).
*   The `fromData` method is simple: it parses the component type and attributes, and places the unprocessed children into the `children` array.
*   A new `renderChildren(renderer)` method will be added to provide a streamlined way for smart handlers to render their children.
*   **Requirement Met:** `Programmer Efficiency` - No `rawChildren` distinction and a helper method for a common task simplifies the mental model.

### 2.2. The `SsrRenderer._renderNode` Function
This is the single engine of the renderer.
*   **If `data` is a primitive or an already-rendered `VirtualNode`**, it is returned immediately.
*   **If `data` is an un-rendered component (Array/NANOS)**, it is processed:
    *   A `VirtualNode` is created.
    *   The component's handler is retrieved.
    *   **No Handler:** Recursively call `_renderNode` on each child and return the `vnode`.
    *   **Declarative Handler (Data Template):** A new data structure is composed by merging attributes and substituting the instance's raw child data into the template's `m.slot`s. `_renderNode` is then called on this new data structure.
    *   **Smart Handler (Function):** The handler is called with the `vnode` and the `renderer`. The handler can then either modify the `vnode` in place or create a new data structure. It **must return** the result (either the modified `vnode` or the new data). The renderer then makes a final recursive call to `_renderNode` on this returned result to ensure any newly generated content is also fully rendered.

### 2.3. The Slotting Mechanism
The unified slotting mechanism remains as previously designed:
*   **Node Slotting:** `m.slot` component in the template is replaced by nodes from the instance that have a matching `:slot` attribute.
*   **Attribute Slotting:** An element with a `:slot` attribute in the template has attributes merged onto it from an `m.attrs` component in the instance.
*   **Requirements Met:** `Declarative ("Low-Code") Components`, `Bilingual by Design`, `Programmer Efficiency`.

## 3. Implementation Plan

**STATUS: APPROVED FOR IMPLEMENTATION**

1.  **`VirtualNode` Refactoring:** Add the `renderChildren(renderer)` method.
2.  **`SsrRenderer` Refactoring:** Update `_renderNode` to handle the return value from smart handlers correctly.
3.  **Component Handler Refactoring:** Update all smart handlers to return the `vnode` or new data.