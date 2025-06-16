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
*   **QJSON (Quasi-JSON):** A relaxed JSON-like format supported by NANOS that allows for unquoted keys and values, optional commas, and other conveniences, making it easier to write manually.

## Key Architectural Patterns

*   **Server-Side Rendering (SSR):** The system can render full HTML pages on the server for fast initial loads.
*   **Client-Side Rendering (CSR) / Hydration:** The client-side can take over from the server-rendered page to provide full interactivity, or render pages from scratch.
*   **Component-Based Architecture:** The UI is built from small, reusable, and sandboxed components.
*   **Messaging-Based Communication:** Components and services interact via synchronous messaging. The message sender does not continue execution until a reply (even if the value is `@u`/`undefined` or a `Promise`) is received.
*   **Reactivity:** The system includes a reactive value library for creating values and data structures (including NANOS objects) that can have dependencies on each other, with support for lazy and eager evaluation. This allows for building dynamic and responsive user interfaces.

## Reference Materials

This section provides a summary of the documents and source code located in the `reference-materials/` directory.

### Language and Syntax

*   **[`Mesgjs-Syntax.md`](reference-materials/Mesgjs-Syntax.md:1):** Defines the formal grammar of the Mesgjs language. It covers fundamental constructs like blocks, message chains, comments, literals, and variable naming conventions.
*   **[`Mesgjs-Language-Overview.md`](reference-materials/Mesgjs-Language-Overview.md:1):** Provides a high-level conceptual overview of Mesgjs, explaining its object-message model, literals, variables, storage scopes, and the role of core interfaces.
*   **[`Mesgjs-For-JavaScript-Programmers.md`](reference-materials/Mesgjs-For-JavaScript-Programmers.md:1):** A comparative guide that maps JavaScript concepts (scopes, functions, loops, operators) to their Mesgjs equivalents, facilitating the transition for JS developers.
*   **[`Mesgjs-Text-And-Numbers.md`](reference-materials/Mesgjs-Text-And-Numbers.md:1):** Details the syntax for numeric literals and the four types of text strings (single-quoted, double-quoted, operator-style words, and regular-style words).
*   **[`Static-List-Data-SLID-Format.md`](reference-materials/Static-List-Data-SLID-Format.md:1):** Describes the SLID format, a serialization format for Mesgjs lists (`NANOS` objects), covering its syntax, value types, and comment conventions.

### Core Concepts and Interfaces

*   **[`Mesgjs-Messaging-Overview.md`](reference-materials/Mesgjs-Messaging-Overview.md:1):** Explains the core messaging pipeline, detailing the roles of the message-receiver function, dispatch object, and message handlers, and distinguishes between anonymous and attributed messages.
*   **[`interfaces/@code-@function.md`](reference-materials/interfaces/@code-@function.md:1):** Documents the `@code` interface for executing code blocks (`(run)`) and creating functions (`(fn)`), and the `@function` interface for invoking functions (`(call)`).
*   **[`interfaces/@core-etc.md`](reference-materials/interfaces/@core-etc.md:1):** Details the `@core` singleton (`@c`), which provides essential operations like conditionals (`if`, `case`), logical operators, object instantiation (`get`), and type introspection.
*   **[`interfaces/@dispatch-@module.md`](reference-materials/interfaces/@dispatch-@module.md:1):** Describes the "bilingual" `@dispatch` interface for accessing message context and the `@module` interface that defines the scope for top-level module code.
*   **[`interfaces/@kvIter.md`](reference-materials/interfaces/@kvIter.md:1):** Documents the `@kvIter` interface for iterating over lists, providing `(for)` and `(rev)` messages for forward and reverse iteration.
*   **[`interfaces/@list.md`](reference-materials/interfaces/@list.md:1):** Provides a comprehensive reference for the `@list` interface, which is used for all list and storage namespace manipulations.
*   **[`interfaces/@loop.md`](reference-materials/interfaces/@loop.md:1):** Describes the `@loop` interface for general-purpose looping, supporting both fixed-iteration and conditional loops.
*   **[`interfaces/@number.md`](reference-materials/interfaces/@number.md:1):** Details the extensive `@number` interface, which provides a rich set of mathematical and bitwise operations.
*   **[`interfaces/@promise.md`](reference-materials/interfaces/@promise.md:1):** Describes the `@promise` interface for handling asynchronous operations, mirroring JavaScript's `Promise` API.
*   **[`interfaces/@reactive.md`](reference-materials/interfaces/@reactive.md:1):** Documents the `@reactive` interface for creating and managing reactive values that can be defined by formulas and automatically update when dependencies change.
*   **[`interfaces/@string-@regex.md`](reference-materials/interfaces/@string-@regex.md:1):** Details the `@string` interface for string manipulation and the `@regex` interface for pattern matching.
*   **[`interfaces/@try.md`](reference-materials/interfaces/@try.md:1):** Describes the `@try` interface for structured error handling, providing `try...catch...finally` style logic.

### JavaScript Implementation

*   **[`src/nanos.esm.js`](reference-materials/src/nanos.esm.js:1):** The core JavaScript implementation of the `NANOS` class, which provides the foundation for Mesgjs lists. Includes parsing logic for SLID.
*   **[`msjs-list.esm.js`](reference-materials/msjs-list.esm.js:1):** The Mesgjs interface wrapper for the `NANOS` class, mapping `@list` messages to the underlying JavaScript methods.
*   **[`src/reactive.esm.js`](reference-materials/src/reactive.esm.js:1):** The core JavaScript implementation of the reactive value library, managing dependencies and evaluation.
*   **[`msjs-reactive.esm.js`](reference-materials/msjs-reactive.esm.js:1):** The Mesgjs interface wrapper for the reactive library, bridging the `@reactive` interface to the JavaScript implementation.
*   **[`msjs-promise.esm.js`](reference-materials/msjs-promise.esm.js:1):** The JavaScript implementation of the `@promise` interface, providing a promise-like API for asynchronous operations in Mesgjs.

## Legal

*   **Copyright:** All copyright notices should use "Kappa Computer Solutions, LLC and Brian Katzung". There is no "Mesgjs Project" legal entity.