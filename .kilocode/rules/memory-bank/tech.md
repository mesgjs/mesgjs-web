# MWI Technology Stack (V5 Focus)

This document outlines the key technologies, languages, and platforms for the V5 iteration of the Mesgjs Web Interface (MWI) project.

## Core Technologies

*   **Mesgjs:** A secure, sandboxed language for component and event-handling logic.
*   **JavaScript (ESM):** The primary language for the overall application structure.
*   **Deno:** The runtime environment for server-side components.
*   **HTML5:** The standard for the final rendered output.

## Data Formats

*   **NANOS:** The primary structured data format for describing page content.
*   **JSON / QJSON:** Supported alternatives for describing page content. [Technically speaking, yes, but only from the perspective that NANOS can parse "QJSON". This isn't anticipated to be an advertised v5 feature. Extensive flexibility and "bilingualism" was becoming a significant development burden and source of technical debt in earlier MWI versions.]

## Key Architectural Patterns

*   **Hybrid Rendering (SSR / CSR):** The core rendering strategy.
*   **Component-Based Architecture:** The UI is built from small, reusable components.
*   **Reactivity:** The system uses a fine-grained reactive library.
*   **Slotting-Through Pattern:** When content is placed in a slot within a template and you need to slot from the template node into that content, you must slot the target attributes *through the slot* first (optionally renaming them). This ensures proper attribute propagation through the slotting hierarchy. See [`test/ssr-html/mcoat.test.js`](test/ssr-html/mcoat.test.js) for a practical example of this pattern.

## V5 Architectural Documents (`v5-arch/`)

This directory contains the active design and requirements documents for the MWI V5 system.

*   **Document:** `v5-arch/Initial-Requirements.md`
    *   **Status:** ACTIVE
    *   **Scope:** The foundational requirements for the V5 implementation.

*   **Document:** `v5-arch/new-tests-20251019.md`
    *   **Status:** ACTIVE
    *   **Scope:** The active, comprehensive test plan for MWI V5, covering unit and compound tests for both SSR and CSR.

*   **Document:** `v5-arch/scoped-css-tests.md`
    *   **Status:** COMPLETE
    *   **Scope:** Comprehensive test plan for the scoped CSS system (MWICoreScpCSS), including core interface tests, SSR/CSR tests, and compound integration tests. All test coverage 100% complete.

*   **Document:** `v5-arch/User-Notes.md`
    *   **Status:** ACTIVE
    *   **Scope:** Supplementary notes and clarifications from the user regarding V5 development.

*   **Document:** `v5-arch/resync-render.md`
    *   **Status:** APPROVED
    *   **Scope:** Architectural plan to eliminate async rendering complexity by making HTML and DOM rendering synchronous. Introduces `MWICoreDefer` component for deferred-load components and renames APIs to make sync operations the default.

*   **Document:** `v5-arch/resync-render-tests.md`
    *   **Status:** APPROVED
    *   **Scope:** Test suite migration plan for synchronous rendering changes. Details updates needed for all test files, new defer node test coverage, and execution strategy.

## Documentation

### AI-Training Documentation (`docs-ai-training/`)

*   **Purpose:** Contains condensed AI/LLM training data derived from full documentation in `docs/`
*   **Format:** Markdown files with corresponding names to source docs
*   **Maintenance:** See `docs-ai-training/0-instructions.md` for generation and maintenance procedures
*   **Key Files:**
    *   `0-MWI-Training-Data.md` - Assembled training data for all MWI interfaces
    *   `0-sources.md` - List of source documentation files
    *   Individual interface documentation (e.g., `MWIDocNode-document-node.md`, `MWICoreSlot-slot.md`)

### Core Language and Runtime Reference

*   **MANDATORY: Mesgjs Language & Runtime Bible:** `resources/Mesgjs-Training-Data.md`
    *   **Content:** This is the **ABSOLUTE SOURCE OF TRUTH** for the Mesgjs language, syntax, runtime, and core interaction patterns. It is not optional.
    *   **When to Read:** **THIS DOCUMENT MUST BE READ BEFORE EVERY TASK that involves writing or debugging Mesgjs or JavaScript that interoperates with it.**
*   **NANOS Reference Material:** `resources/NANOS-Training-Data.md`
    *   **Content:** Detailed information about the `NANOS` JavaScript class (used extensively throughout Mesgjs, including the Mesgjs `@list` interface, and MWI) and the `SLID` (static list data) format.
	*   NANOS is the basis for the commonly-used `ls` and `ps` helper functions. This documentation will help you understand how to pass the correct parameters.
    *   **Critical:** SLID format requires boundary markers `[(` at start and `)]` at end, with inner `[ ]` node boundaries preserved.

---
*All prior architectural documents (V3, V4, etc.) have been archived under `historical/`; they are considered SUPERSEDED and should not be consulted for new development.*
