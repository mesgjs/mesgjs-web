# Current Context

An architectural audit has been completed. The process of reconciling the audit's findings is underway. The core architecture for the SSR/CSR hydration and lifecycle system has been clarified, and several key architectural documents have been updated or archived to reflect the canonical design.

## Implementation Status Update

*   **Architectural Audit Reconciliation (In Progress):**
    *   **HTML Core Unification (Complete):** The logic for void tags has been centralized into the shared HTML core registrar module, and the server-side handler has been simplified. This resolves a key SSR/CSR parity issue.
    *   **File Naming and Structure (Complete):** The files for the core HTML primitives have been renamed for clarity, and the server-side component handlers have been consolidated into a single `components` directory, improving structural consistency.
    *   **Sections 1-11 (Complete):** All major findings related to VNodes, component consistency, client/server sync, naming, and syntax have been resolved, with documentation updated accordingly.
    *   **Section 12 (Follow-ups):** A shared constants module has been created, the `.jsv` pattern is standardized, a new `Error-Handling-Strategy.md` has been written, `Security.md` has been created, and all major documentation consolidation tasks (Item 12.4) are now complete.

*   **Key Architectural Decisions Clarified:**
    *   **Hydration:** The system uses a declarative, lifecycle-only map (`mwiHydration`) to connect element IDs to mount/unmount handlers, not a state-transfer system.
    *   **MUM:** The Mount/Unmount monitor is driven by the hydration map and uses direct `getElementById` lookups, avoiding costly DOM traversals on initialization.
    *   **Reactive Cleanup:** The reactive system requires explicit cleanup. Components must clear the definition (`.def`) of their eager DOM updaters to sever dependencies and prevent memory leaks.
    *   **Bilingual JS/Mesgjs API:** The `.jsv` ("JavaScript View") property has been established as the sole standard for exposing JavaScript-managed state and APIs from bilingual Mesgjs objects, replacing older prototype-based patterns.

## Key Learnings & Development Patterns

1.  **Architectural Diligence:** Assuming architectural details are missing before conducting an exhaustive search of all indexed documentation (`tech.md`) is a procedural failure. The first step must always be to find the existing specification.
2.  **Architectural Hygiene:** Outdated architectural plans must be archived to the `historical/` sub-directory to keep active documents clean and focused.

## Prioritized Implementation Plan

1.  **Reconcile Architectural Audit** (In Progress)
2.  **Implement Semantic Component Library** (Future)

## Next Steps

Continue resolving the remaining findings documented in `architectural-audit.md`. The next major architectural task is to refactor the `MWIRenderer` to adhere to the Single Responsibility Principle by breaking its functionality into smaller, dedicated helper services as defined in **Audit Item 12.6**.