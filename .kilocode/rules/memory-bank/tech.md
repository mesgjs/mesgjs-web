# MWI Technology Stack

This document outlines the key technologies, languages, and platforms used in the Mesgjs Web Interface (MWI) project.

## Core Technologies

*   **Mesgjs:** A secure, sandboxed language that forms the foundation of the component and event-handling system. It is used for both server-side and client-side logic. See `reference-materials/MWI-Training-Data.md` for detailed language documentation.
*   **JavaScript (ESM):** The primary language for the overall application structure, particularly for the renderers and core services.
*   **Deno:** The runtime environment for the server-side components. Deno's security features, including process-level sandboxing and permission controls, are critical to the MWI's security model.
*   **HTML5:** The standard for the final rendered output.

## Data Formats

*   **NANOS (Named and numbered ordered storage):** The primary structured data format for describing page content. It has a compact, LISP-like serialization format called SLID (Static List Data).
*   **JSON:** An alternative, more JavaScript-friendly format for page descriptions is also supported, which is parsed into NANOS structures.
*   **QJSON (Quasi-JSON):** A relaxed JSON-like format supported by NANOS that allows for unquoted keys and values, optional commas, and other conveniences, making it easier to write manually.

## Key Architectural Patterns

*   **Server-Side Rendering (SSR):** The system can render full HTML pages on the server for fast initial loads.
*   **Client-Side Rendering (CSR) / Hydration:** The client-side can take over from the server-rendered page to provide full interactivity, or render pages from scratch.
*   **Component-Based Architecture:** The UI is built from small, reusable, and sandboxed components.
*   **Messaging-Based Communication:** Components and services interact via synchronous messaging.
*   **Reactivity:** The system includes a reactive value library for creating values and data structures that can have dependencies on each other.

## Tool Usage Patterns

*   **Import Paths:** All JavaScript module imports must be relative to the project's import map. This means they should be prefixed with `mesgjs-web/` followed by the path from the project root (e.g., `import { X } from 'mesgjs-web/src/shared/constants.esm.js';`). Relative paths like `./` or `../` are not used.

## Reference Materials and Project Index

This section provides an index of key reference materials and architectural documents to guide development. Future instances of the AI should consult this index before starting a task to gain relevant context.

### 1. Core Language and Runtime (`resources/mesgjs`)

*   **Primary Documentation:** `resources/mesgjs/docs/MWI-Training-Data.md`
    *   **Content:** The definitive language, syntax, and runtime guide for Mesgjs.
    *   **When to Read:** Essential for any task involving writing or debugging Mesgjs code. This is the source of truth for all language features.

### 2. Architectural Plans (`architectural-plan/`)

This directory contains the collaborative design documents that define the MWI system.

*   **Overall Architecture:**
    *   `MWI-Architecture-v3-Core.md`: High-level system structure.
    *   `Naming-Conventions.md`: Code style and naming rules.
    *   `Security.md`: Defines data sanitization rules and responsibilities.
    *   `Error-Handling-Strategy.md`: Defines the unified strategy for fatal and non-fatal errors.
*   **VNode and Rendering:**
    *   `MWI-Architecture-v3-VNode.md`: The core Virtual Node concept.
    *   `MWI-Architecture-v3-VNode-Implementation.md`: Specific implementation details for VNodes.
*   **Component System:**
    *   `MWI-Component-System.md`: The single, authoritative document for the component system architecture.
    *   `MWI-Component-Tutorial.md`: A canonical guide with "Hello, MWI" and bilingual "Counter" examples.
    *   `MWI-Semantic-Component-Architecture.md`: Architecture for high-level semantic components.
    *   `Semantic-Components-Requirements.md`: Requirements for the semantic component library.
*   **Reactivity:**
    *   `MWI-Architecture-v3-Reactive.md`: The core reactive system design.
*   **Client-Side, Hydration, and Synchronization:**
    *   `MWI-Client-Side-Interaction-Architecture.md`: Authoritative guide for client-side events (direct and pub/sub).
    *   `MWI-Architecture-v3-Hydration.md`: How client-side code takes over from SSR.
    *   `MWI-MUM-Plan.md`: The definitive hybrid architecture for the Mount/Unmount Monitor.
    *   `SSR-CSR-Sync-Issues.md`: Known issues related to server/client state synchronization.
*   **Resource Management & Bundling:**
    *   `MWI-Architecture-v3-Resources.md`: Plan for managing CSS, JS, and other assets.
    *   `Bundling-Design-Proposal.md`: Proposal for the module bundling strategy.
*   **Planning & Issue Tracking:**
    *   `load-plans.md`: Documentation for loading strategies.
    *   `Open-Issues.md`: A list of open architectural issues and questions.

### 3. Shared Code (`src/shared/`)

*   **Shared Constants:** `src/shared/constants.esm.js`
    *   **Content:** Centralized constants to avoid magic strings (e.g., feature promise names, HTML element IDs).
    *   **When to Read:** When you need to reference a system-wide constant.

### 4. Quick-Reference Guides

*   **Legal:** For copyright and licensing questions, see the `Legal` section at the end of this document.

## Legal

*   **Copyright:** All copyright notices should use "Kappa Computer Solutions, LLC and Brian Katzung". There is no "Mesgjs Project" legal entity.