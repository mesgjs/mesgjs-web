---
**Status:** DRAFT
**History:**
- 2025-08-04: DRAFT
**Scope:** The core system architecture for the Mesgjs Web Interface (MWI) v4, replacing the v3 payload-based model with a simpler, two-phase, document-centric rendering pipeline.
**Replaces:** `MWI-Architecture-v3-Core.md`, `MWI-Architecture-v3-VNode.md`, `MWI-Architecture-v3-VNode-Implementation.md`
**Replaced by:**
**Related:** `MWI-Component-System.md`, `MWI-Slot-System.md`, `MWI-Architecture-v3-Hydration.md`
---
# MWI System Architecture v4

## 1. Executive Summary

MWI v4 represents a significant evolution of the rendering architecture, designed to address the complexity and ambiguity of the v3 model. It replaces the single-pass, payload-driven renderer with a cleaner, isomorphic, two-phase, "inside-out" process orchestrated by a new `m.doc` primitive.

This new architecture retains the most powerful features of v3—a unified component model, sophisticated content slotting, and a robust hydration system—while implementing them in a more predictable and decoupled way. It fully supports Server-Side Rendering (SSR), Client-Side Rendering (CSR), and client-side hydration of server-rendered content.

## 2. Core Concepts

*   **Isomorphic Pipeline:** The core rendering logic is identical on the server and client. It takes structured data and produces a final, primitive `MWISSRInfo` tree. The only difference is the final output step: the server creates an HTML string, the client creates live DOM nodes.
*   **Document-Centric Rendering:** The entire render process is driven by a single, top-level `[m.doc]` component which orchestrates a two-phase render.
*   **Two-Phase "Inside-Out" Flow:**
    1.  **Phase 1 (Aggregation):** The main body of the document is processed first, allowing deeply nested components to send content "upward" to be aggregated by the `m.doc` handler.
    2.  **Phase 2 (Composition):** Once aggregation is complete, a final page template is rendered, and the aggregated content is slotted "downward" into the final structure.
*   **`MWISSRInfo` vs. `MWICSRNode`:**
    *   **`MWISSRInfo`:** A simple, serializable, plain data object representing a node, produced by the isomorphic rendering pipeline. It is the "blueprint" of the DOM.
    *   **`MWICSRNode`:** A "smart" class instance on the client that holds a direct reference to a live DOM element and manages reactive updates.
*   **Unified Slotting:** Both upward and downward content projection use the same consistent `cs.*` and `as.*` slotting convention.
*   **Stable Hydration:** The V3 hydration mechanism via `mount`/`mountOnce` payloads and the `MWIMUM` is preserved, providing a stable bridge between the V4 SSR pipeline and the client.

## 3. The Isomorphic Rendering Pipeline

The rendering pipeline executes identically on both server and client.

### 3.1. Phase 1: Content Render & Aggregation
1.  Processing begins on a data structure rooted with `[m.doc template=MyTemplate ...]`.
2.  The `Renderer` service invokes the `m.doc` handler, establishing it as the singleton aggregator for the render cycle.
3.  The `m.doc` handler instructs the `Renderer` to process its main content (the `cs.default` slot).
4.  As the `Renderer` walks the content, any nested `[m.doc cs.head=[...]]` declarations are handled by the same singleton, which accumulates the content into an `aggregatedSlots` map.

### 3.2. Phase 2: Template Instantiation & Final `MWISSRInfo` Tree
1.  Once the main content is processed, the `m.doc` handler instructs the `Renderer` to process the `template` component (e.g., `MyPageTemplate`), passing the `aggregatedSlots` as its properties.
2.  The page template uses standard `[m.slot]` components to render the aggregated content.
3.  The final output of this process, on both server and client, is a complete `MWISSRInfo` tree of only primitive `h.*` elements.

## 4. Environment-Specific Finalization

### 4.1. Server-Side Rendering (SSR)
1.  **HTML Generation:** The final `MWISSRInfo` tree is passed to a **Stringifier**, which produces the final HTML output.
2.  **Hydration Data:** The `Renderer`'s `RenderContext` contains all `mount`/`mountOnce` data accumulated during the render. This data is serialized and embedded in a `<script>` tag in the HTML.

### 4.2. Client-Side Hydration
1.  The client browser parses the HTML from the server.
2.  The `MWIMUM` (from V3) runs, finds the serialized `mount`/`mountOnce` data, and attaches the appropriate handlers to the live DOM elements via their stable `MWS$...` IDs.
3.  These handlers, when executed, may instantiate `MWICSRNode` objects **on-demand**. An `MWICSRNode` is only created for an element that requires interactivity. It is this handler's responsibility to create the node, connect it to the DOM, and set up any reactive data subscriptions. Static elements do not incur this overhead.

### 4.3. Pure Client-Side Rendering (CSR)
1.  The isomorphic pipeline runs in the browser, producing a final `MWISSRInfo` tree from the input data.
2.  **DOM Factory:** This `MWISSRInfo` tree is passed to a **DOM Factory** instead of a stringifier.
3.  The factory walks the `MWISSRInfo` tree and creates a corresponding tree of live DOM nodes using `document.createElement`.
4.  As it creates DOM nodes, it also instantiates `MWICSRNode` objects, connects them to the new DOM elements, and sets up any reactive bindings.
5.  The resulting DOM fragment is then appended to the user-specified container on the page.

## 5. Key Primitives & APIs (V4)

### 5.1. `[m.doc]` Component
The central orchestrator for the two-phase render. See section 3 for details.

### 5.2. `MWISSRInfo` Data Structure
A plain, immutable, serializable data object representing a node blueprint.
```typescript
interface MWISSRInfo {
    readonly type: string; // e.g., 'div', 'my-component', '#text'
    readonly attrs: { [key: string]: any };
    readonly children: MWISSRInfo[];
    readonly text?: string; // for #text nodes
}
```

### 5.3. `MWICSRNode` Class
A "smart" client-side class managing a live DOM element and its reactive updates. Created on-demand during hydration or CSR.
```typescript
class MWICSRNode {
    readonly element: HTMLElement;
    constructor(element: HTMLElement, info: MWISSRInfo);
    // ... methods for updates and subscriptions
}
```

### 5.4. Renderer Service API
An isomorphic service that runs the core pipeline.
```typescript
class MWIRenderer {
    // SSR entry point
    renderToString(docData: any): string;
    // CSR entry point
    renderToDom(docData: any, container: HTMLElement): void;
    // Recursive processor for use by component handlers
    process(data: any): MWISSRInfo;
    readonly context: RenderContext;
}
```