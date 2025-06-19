# Current Context

The foundational Server-Side Rendering (SSR) and Client-Side Rendering (CSR) pipelines are now in place. The SSR was previously fixed to prevent double-escaping issues, and the CSR is now capable of rendering a component tree into the DOM.

## Recent Changes

*   **Architectural Refactor (SSR):** Refactored the entire server-side rendering pipeline to use a new `VirtualNode` abstraction. This change simplifies the rendering logic, centralizes bilingual data handling (JS vs. NANOS), and improves the overall maintainability of the system.
*   **Introduced `VirtualNode`:** Created `src/server/VirtualNode.esm.js` to act as a proxy for DOM nodes, providing a unified API for manipulating attributes, classes, and children.
*   **Updated `SsrRenderer`:** The `SsrRenderer` at `src/server/SsrRenderer.esm.js` now builds a tree of `VirtualNode` objects instead of HTML strings.
*   **Simplified Component Handlers:** Created a new generic `h.*` handler at `src/server/components/h.esm.js` and refactored the `ComponentFactory` to use it, removing complex HTML-generation logic from the handlers.
*   **Deprecated `:class`:** Removed the special `:class` attribute in favor of the `VirtualNode`'s built-in handling of the standard `class` attribute.

## Next Steps

1.  **Architectural Refactor (CSR):** Replicate the `VirtualNode` architecture on the client side. This will involve creating a client-side `VirtualNode` that generates DOM elements and refactoring the `CsrRenderer` and its component handlers to use it.
2.  **Implement Client-Side Event Handling:** Add support for event listeners (e.g., `:click`) within the new client-side `VirtualNode` architecture.
3.  **Hydration Strategy:** Design and implement a "hydration" mechanism in the `CsrRenderer` to attach event listeners and make server-rendered HTML interactive without a full re-render.