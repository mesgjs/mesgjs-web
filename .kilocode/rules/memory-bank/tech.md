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

*   **MANDATORY: Mesgjs Language & Runtime Bible:** `resources/mesgjs/docs/MWI-Training-Data.md`
    *   **Content:** This is the **ABSOLUTE SOURCE OF TRUTH** for the Mesgjs language, syntax, runtime, and core interaction patterns. It is not optional.
    *   **When to Read:** **MUST READ an APPROPRIATE SECTION of THIS DOCUMENT BEFORE EVERY TASK that involves writing or debugging Mesgjs or JavaScript that interoperates with it.** Failure to do so will result in incorrect code and wasted time.

### 2. Architectural Plans (`architectural-plan/`)

This directory contains the collaborative design documents that define the MWI system.

#### Overall Architecture & Process

*   **Document:** `architectural-plan/MWI-Architecture-v3-Core.md`
    *   **Status:** SUPERSEDED by `architectural-plan/MWI-V4-Core-Architecture.md`
    *   **Scope:** The core system architecture for the Mesgjs Web Interface (MWI), covering rendering, components, hydration, and security.
    *   **Related:** `MWI-Architecture-v3-VNode.md`, `MWI-Architecture-v3-Hydration.md`, `MWI-Architecture-v3-Reactive.md`, `MWI-Architecture-v3-Resources.md`

*   **Document:** `architectural-plan/MWI-V4-Core-Architecture.md`
    *   **Status:** ACTIVE
    *   **Scope:** The core system architecture for the Mesgjs Web Interface (MWI), addressing new requirements and enhancements.
    *   **Related:**

*   **Document:** `architectural-plan/Naming-Conventions.md`
    *   **Status:** STANDARD
    *   **Scope:** The official naming conventions for the MWI project, covering identifiers, files, classes, components, and attributes.
    *   **Related:**

*   **Document:** `architectural-plan/Security.md`
    *   **Status:** STANDARD
    *   **Scope:** Outlines the explicit security policies and responsibilities for the MWI to ensure data is handled safely.
    *   **Related:**

*   **Document:** `architectural-plan/MWI-Raw-Content-Security.md`
    *   **Status:** ACTIVE
    *   **Scope:** Defines the security architecture for controlling the `rawContent` rendering feature via a namespaced `caps` list in the module's SLID metadata.
    *   **Related:** `MWI-Architecture-v3-Core.md`, `MWI-Component-System.md`

*   **Document:** `architectural-plan/Error-Handling-Strategy.md`
    *   **Status:** ACTIVE
    *   **Scope:** Defines the unified error handling strategy for the Mesgjs Web Interface (MWI).
    *   **Related:**

*   **Document:** `architectural-plan/decision-log.md`
    *   **Status:** STANDARD
    *   **Scope:** An immutable log of architecturally significant decisions.
    *   **Related:**

*   **Document:** `architectural-plan/Documentation-Process.md`
    *   **Status:** STANDARD
    *   **Scope:** A one-sentence summary of the document's purpose.
    *   **Related:**

*   **Document:** `architectural-plan/Implementation-Status.md`
    *   **Status:** REVIEW
    *   **Scope:** A dashboard tracking the implementation status of all ACTIVE architectural documents. This should be updated whenever a major feature system is completed or requires significant re-architecture.
    *   **Related:**

#### VNode and Rendering

*   **Document:** `architectural-plan/MWI-Architecture-v3-VNode.md`
    *   **Status:** SUPERSEDED by `architectural-plan/MWI-V4-Core-Architecture.md`
    *   **Scope:** Describes the high-level architecture of the MWI VNode system, including the decision to use a purpose-built VNode over a NANOS-centric approach.
    *   **Related:** `MWI-Architecture-v3-Core.md`, `MWI-Architecture-v3-VNode-Implementation.md`

*   **Document:** `architectural-plan/MWI-Architecture-v3-VNode-Implementation.md`
    *   **Status:** SUPERSEDED by `architectural-plan/MWI-V4-Core-Architecture.md`
    *   **Scope:** Specifies the implementation details for the enhanced MWI VNode system, including naming conventions and copy-on-write protection.
    *   **Related:** `MWI-Architecture-v3-Core.md`, `MWI-Architecture-v3-VNode.md`

*   **Document:** `architectural-plan/MWI-Title-And-Slot-Implementation.md`
    *   **Status:** ACTIVE
    *   **Scope:** Defines required bug fixes and implementation plans for the VNode API and the `h.title` and `m.slot` components.
    *   **Related:** `MWI-Architecture-v3-VNode-Implementation.md`, `Core-Components-Requirements.md`

#### Component System

*   **Document:** `architectural-plan/Core-Components-Requirements.md`
    *   **Status:** ACTIVE
    *   **Scope:** Defines the requirements for the foundational `h.*` primitive components.
    *   **Related:** `MWI-Component-Tutorial.md`, `decision-log.md`, `MWI-Architecture-v3-VNode-Implementation.md`

*   **Document:** `architectural-plan/MWI-Component-System.md`
    *   **Status:** ACTIVE
    *   **Scope:** Specifies the definitive architecture for the MWI component system, including its lifecycle, types, and state management.
    *   **Related:** `MWI-Component-Tutorial.md`, `MWI-Architecture-v3-Core.md`

*   **Document:** `architectural-plan/MWI-Component-Tutorial.md`
    *   **Status:** STANDARD
    *   **Scope:** The canonical, step-by-step guide to authoring components for the MWI.
    *   **Related:** `MWI-Component-System.md`
    
*   **Document:** `architectural-plan/MWI-Component-Authoring-Guide.md`
    *   **Status:** STANDARD
    *   **Scope:** The canonical, step-by-step guide to authoring components for the MWI.
    *   **Related:** `MWI-Component-System.md`
*   **Document:** `architectural-plan/MWI-Semantic-Component-Architecture.md`
    *   **Status:** ACTIVE
    *   **Scope:** Outlines the architecture for the MWI's foundational semantic component library, including theming, state management, and data binding.
    *   **Related:** `Semantic-Components-Requirements.md`, `Semantic-Components-Review.md`

*   **Document:** `architectural-plan/Semantic-Components-Requirements.md`
    *   **Status:** ACTIVE
    *   **Scope:** The functional and technical requirements for the MWI's semantic component library.
    *   **Related:** `MWI-Semantic-Component-Architecture.md`, `Semantic-Components-Review.md`

*   **Document:** `architectural-plan/Semantic-Components-Review.md`
    *   **Status:** REVIEW
    *   **Scope:** A review of the `Semantic-Components-Requirements.md` document, identifying architectural inconsistencies and providing recommendations.
    *   **Related:** `Semantic-Components-Requirements.md`, `MWI-Semantic-Component-Architecture.md`, `MWI-Slot-System.md`

*   **Document:** `architectural-plan/MWI-Slot-System.md`
    *   **Status:** ACTIVE
    *   **Scope:** The detailed technical specification for the MWI Slotting System for content and attribute projection.
    *   **Related:** `MWI-Page-Template-Component-Architecture.md`

*   **Document:** `architectural-plan/component-hygiene.md`
    *   **Status:** SUPERSEDED by `MWI-Component-Authoring-Guide.md`
    *   **Scope:** A plan to refactor MWI components into canonical, secure, and logical packages.
    *   **Related:** `MWI-Component-Tutorial.md`

*   **Document:** `architectural-plan/MWI-Private-Component-Communication.md`
    *   **Status:** INCOMPLETE, DEFERRED
    *   **Scope:** Outlines the architecture for private communication between a component and its creator, which is now deferred.
    *   **Related:** `Semantic-Components-Requirements.md`, `Semantic-Components-Review.md`

#### Reactivity

*   **Document:** `architectural-plan/MWI-Architecture-v3-Reactive.md`
    *   **Status:** ACTIVE
    *   **Scope:** Details the integration of the fine-grained reactive library into the MWI architecture.
    *   **Related:** `MWI-Architecture-v3-Core.md`

#### Client-Side, Hydration, and Synchronization

*   **Document:** `architectural-plan/MWI-Client-Side-Interaction-Architecture.md`
    *   **Status:** ACTIVE
    *   **Scope:** Outlines the architecture for client-side component interaction, covering both pub/sub and direct event handling.
    *   **Related:** `MWI-Architecture-v3-Core.md`, `MWI-Architecture-v3-Hydration.md`, `MWI-Architecture-v3-Reactive.md`

*   **Document:** `architectural-plan/MWI-Architecture-v3-Hydration.md`
    *   **Status:** ACTIVE
    *   **Scope:** Details the hydration system that bridges server-side rendering (SSR) and client-side rendering (CSR) in the MWI.
    *   **Related:** `MWI-Architecture-v3-Core.md`, `MWI-MUM-Plan.md`

*   **Document:** `architectural-plan/MWI-MUM-Plan.md`
    *   **Status:** ACTIVE
    *   **Scope:** Outlines the final hybrid architecture for the MWIMUM (Mount/Unmount Monitor), responsible for managing component lifecycle events.
    *   **Related:** `MWI-Architecture-v3-Hydration.md`

*   **Document:** `architectural-plan/SSR-CSR-Sync-Issues.md`
    *   **Status:** REVIEW
    *   **Scope:** An audit of open issues and considerations for synchronizing the Server-Side and Client-Side Renderers.
    *   **Related:** `MWI-Architecture-v3-Hydration.md`

#### Resource Management & Bundling

*   **Document:** `architectural-plan/MWI-Architecture-v3-Resources.md`
    *   **Status:** SUPERSEDED, REQUIRES ATTENTION
    *   **Scope:** Details the resource management system for the MWI, covering CSS, modules, and other resources.
    *   **Related:** `MWI-Architecture-v3-Core.md`, `Bundling-Design-Proposal.md`

*   **Document:** `architectural-plan/Bundling-Design-Proposal.md`
    *   **Status:** ACTIVE
    *   **Scope:** This document proposes a Mesgjs-native approach to bundling MWI JavaScript modules, avoiding external build tools.
    *   **Related:**

#### Testing

*   **Document:** `architectural-plan/MWI-Test-Runtime.md`
    *   **Status:** ACTIVE
    *   **Scope:** Outlines the architecture for a "test mode" and integrated test harness for the MWI system.
    *   **Related:**

*   **Document:** `architectural-plan/MWI-Testability-Audit-Recommendations.md`
    *   **Status:** REVIEW
    *   **Scope:** A system-wide audit of testability issues, with recommendations to refactor key services using Dependency Injection.
    *   **Related:** `MWI-Test-Runtime.md`

### 3. Source Code Paths (`src/`)

*   **V4 Source Root:** `src/`
    *   **Content:** This directory is the root for all V4 MWI source code.
    *   **Structure:** It will contain `client/`, `server/`, and `shared/` subdirectories, similar to the V3 structure.
    *   **When to Read:** When developing or modifying any V4 MWI component or service.

*   **V3 Source Reference (Archived):** `src-v3/`
    *   **Content:** This directory contains the archived V3 MWI source code. It is provided for reference only and should not be modified.
    *   **When to Read:** When referencing previous implementations or debugging V3-related issues.

### 4. Process & Meta-Documents

*   **Process Lessons:** `.kilocode/rules/memory-bank/lessons-learned.md`
    *   **Content:** Accumulates lessons learned about our development process and collaboration.
    *   **When to Read:** To understand the "soft" rules and established patterns of our workflow.

### 5. Quick-Reference Guides

*   **Legal:** For copyright and licensing questions, see the `Legal` section at the end of this document.

## Legal

*   **Copyright:** All copyright notices should use "Kappa Computer Solutions, LLC and Brian Katzung". There is no "Mesgjs Project" legal entity.