# Current Context

An architectural audit has been completed. The process of reconciling the audit's findings is underway. The core architecture for the SSR/CSR hydration and lifecycle system has been clarified, and several key architectural documents have been updated or archived to reflect the canonical design.

## Implementation Status Update

*   **Architectural Audit Reconciliation (In Progress):**
    *   **Sections 1-4 (VNode, Components, Client/Server Sync):** The core principles and implementation details for these areas have been clarified. Obsolete documentation has been archived, and canonical documents have been updated and correctly indexed in `tech.md`. The previously undocumented "Text Node Guard" mechanism is now also documented.
    *   **Sections 5-11 (Naming, Syntax):** The audit's initial findings regarding naming conventions and Mesgjs syntax have been thoroughly reviewed. Several items were found to be based on misunderstandings of the runtime and were corrected within the audit document itself. All genuinely incorrect examples have been fixed in the relevant architectural plans.
    *   **Section 12 (Follow-ups):** A shared constants module has been created, the `.jsv` pattern is standardized, and a new `Error-Handling-Strategy.md` has been written. All major documentation consolidation tasks (Item 12.4) are now complete, resulting in new canonical documents for the component system and client-side interactions.

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

Continue resolving the remaining findings documented in `architectural-audit.md`. With documentation consolidation now complete (Audit Item 12.4), the next step is to create a `Security.md` document to explicitly define data sanitization rules and responsibilities (Audit Item 12.5).