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

## Reference Materials

The following reference materials are available in the `reference-materials/` directory:

*   **Language Documentation:** `MWI-Training-Data.md` contains detailed Mesgjs language documentation
*   **Interface Documentation:** Documentation for core interfaces like `@list`, `@reactive`, etc.
*   **Implementation Details:** Source code and documentation for key system components

## Legal

*   **Copyright:** All copyright notices should use "Kappa Computer Solutions, LLC and Brian Katzung". There is no "Mesgjs Project" legal entity.