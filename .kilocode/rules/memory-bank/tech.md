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

## V5 Architectural Documents (`v5-architecture/`)

This directory contains the active design and requirements documents for the MWI V5 system.

*   **Document:** `v5-architecture/Initial-Requirements.md`
    *   **Status:** ACTIVE
    *   **Scope:** The foundational requirements for the V5 implementation.

*   **Document:** `v5-architecture/new-tests-20251019.md`
    *   **Status:** ACTIVE
    *   **Scope:** The active, comprehensive test plan for MWI V5, covering unit and compound tests for both SSR and CSR.

*   **Document:** `v5-architecture/User-Notes.md`
    *   **Status:** ACTIVE
    *   **Scope:** Supplementary notes and clarifications from the user regarding V5 development.

## Core Language and Runtime Reference

*   **MANDATORY: Mesgjs Language & Runtime Bible:** `resources/Mesgjs-Training-Data.md`
    *   **Content:** This is the **ABSOLUTE SOURCE OF TRUTH** for the Mesgjs language, syntax, runtime, and core interaction patterns. It is not optional.
    *   **When to Read:** **MUST READ an APPROPRIATE SECTION of THIS DOCUMENT BEFORE EVERY TASK that involves writing or debugging Mesgjs or JavaScript that interoperates with it.**
*   **NANOS Reference Material:** `resources/NANOS-Training-Data.md`
    *   **Content:** Detailed information about the `NANOS` JavaScript class (used extensively throughout Mesgjs, including the Mesgjs `@list` interface, and MWI).

---
*All prior architectural documents (V3, V4, etc.) have been archived under `historical/`; they are considered SUPERSEDED and should not be consulted for new development.*