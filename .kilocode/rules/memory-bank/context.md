# Current Context

The project is actively implementing the client-side rendering (CSR) architecture. A recent debugging session focused on the `MWIMUM` (Mount/Unmount Monitor) uncovered and resolved a critical architectural issue, reinforcing the separation between shared and environment-specific code.

## Implementation Status Update

*   **CSR VNode Refactored**: The client-side VNode, [`src/client/MWICSRVNode.esm.js`](src/client/MWICSRVNode.esm.js), has been cleaned up. The instantiation logic and bilingual interface pattern are now correctly implemented.
*   **Reactivity Implemented**: The `MWICSRVNode` supports reactive attributes and children, using comment nodes as guards for text content to prevent browser normalization issues.
*   **Event Handling Completed**: The `(on)` and `(off)` message handlers for VNode-intrinsic event management are now fully implemented and aligned with the architectural plan.
*   **Architectural Layering Enforced**: A bug where the shared component bundle (`mwi-html-core.esm.js`) was importing server-side handlers has been fixed. This module is now environment-agnostic.
*   **CSR Factory Corrected**: The [`MWICSRFactory.esm.js`](src/client/MWICSRFactory.esm.js) is now the definitive source for providing primitive `h.*` component handlers on the client, centralizing environment-specific logic.

## Key Learnings & Development Patterns

1.  **Strict Environment Separation:** `src/shared` code MUST remain environment-agnostic. It should not contain any client- or server-specific logic or imports. Environment-specific implementations (like default component handlers) belong in their respective `src/client` or `src/server` directories.
2.  **Factory Responsibility:** The environment-specific factories (e.g., `MWICSRFactory`) are responsible for providing default, primitive component handlers (like for `h.*` tags). Shared component bundles should only register component metadata, not concrete handler implementations.
3.  **Bilingual Interface Pattern:** The correct pattern for creating a JS-managed Mesgjs object involves a proxy prototype that chains `Function.prototype`. This prototype's methods delegate to the underlying JS class instance, which is attached to the Mesgjs receiver function (`d.rr`) via a read-only property (e.g., `jsv`).
4.  **VNode-Intrinsic Event & Reactivity:** The `MWICSRVNode` is the engine for both event handling and reactivity. It directly manages DOM elements, listeners, and subscriptions to reactive values.
5.  **Eager Reactive for Side-Effects:** The correct pattern to bridge the reactive system with the DOM is to create a terminal, "eager" reactive value whose definition function performs the DOM manipulation as a side effect.
6.  **Automatic Subscription Cleanup:** The reactive system handles its own dependency garbage collection. The VNode only needs to release its references to the eager "subscriber" reactives upon unmount.

## Prioritized Implementation Plan

1.  **Implement Core Component Architecture** (Completed)
2.  **Enforce Naming Conventions** (Completed)
3.  **Define Component Authoring Strategy** (Completed)
4.  **Finalize CSR Interaction Architecture** (Completed)
5.  **Implement CSR Event & State Model** (In Progress)
    *   Create `MWICSRVNode` with reactivity (Completed)
    *   Implement `(on)` and `(off)` event handlers (Completed)
    *   Implement `MWIMUM` for lifecycle management (Completed)
    *   Implement Pub/Sub State Management (Future)
6.  **Implement SSR/CSR Synchronization** (Future)
7.  **Implement Semantic Component Library** (Future)

## Next Steps

With the `MWIMUM` and the core component architecture now stable and correctly implemented, the next logical step is to continue building out the CSR capabilities. This will likely involve implementing the Pub/Sub state management system or beginning work on SSR/CSR synchronization.