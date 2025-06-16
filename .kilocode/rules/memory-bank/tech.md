# MWI Technology Stack

This document outlines the key technologies, languages, and platforms used in the Mesgjs Web Interface (MWI) project.

## Core Technologies

*   **Mesgjs:** A secure, sandboxed language that forms the foundation of the component and event-handling system. It is used for both server-side and client-side logic.
*   **JavaScript (ESM):** The primary language for the overall application structure, particularly for the renderers and core services.
*   **Deno:** The runtime environment for the server-side components. Deno's security features, including process-level sandboxing and permission controls, are critical to the MWI's security model.
*   **HTML5:** The standard for the final rendered output.

## Data Formats

*   **NANOS (Named and numbered ordered storage):** The primary structured data format for describing page content. It has a compact, LISP-like serialization format called SLID (SysCL List Data).
*   **JSON:** An alternative, more JavaScript-friendly format for page descriptions is also supported, which is parsed into NANOS structures.

## Key Architectural Patterns

*   **Server-Side Rendering (SSR):** The system can render full HTML pages on the server for fast initial loads.
*   **Client-Side Rendering (CSR) / Hydration:** The client-side can take over from the server-rendered page to provide full interactivity, or render pages from scratch.
*   **Component-Based Architecture:** The UI is built from small, reusable, and sandboxed components.
*   **Messaging-Based Communication:** Components and services interact via synchronous messaging. The message sender does not continue execution until a reply (even if the value is `@u`/`undefined` or a `Promise`) is received.
*   **Reactivity:** The system includes a reactive value library for creating values and data structures (including NANOS objects) that can have dependencies on each other, with support for lazy and eager evaluation. This allows for building dynamic and responsive user interfaces.