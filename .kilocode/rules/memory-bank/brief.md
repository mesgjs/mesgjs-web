[AI/LLM partners: This is important project information *from the USER*, *to you*. Do not modify this file unless explicitly instructed to do so.]

This project is building the Mesgjs Web Interface (MWI).

It is a "partially-bilingual" (JavaScript-and-Mesgjs, but *Mesgjs-first*) system for hybrid server-side and client-side rendering of web interfaces from structured data.

The project is currently in its fifth major iteration in an attempt to create a viable library. There are no complete, successful prior implementations.

# Architecture / Requirements

Existing requirements may be found in, and newly created requirements should be added to, the `/v5-architecture` directory.

## Basic Project Coding Standards

- Most primary MWI files will be Mesgjs modules (`.msjs` files, some with companion `.slid` files as needed), even those consisting primarily of JavaScript code (via `@js{ ... @}` embed blocks).
- Pure-JavaScript MWI modules, if any, should have `.esm.js` extensions.
- JavaScript test files should use the `Deno` test framework and have `.test.js` extensions.
- Do not use TypeScript in the project (that includes test files).
- To meet the potentially differing accessibility needs of different contributors, the project officially uses tabs as the primary form of code indentation.

## Development Resources

The `/resources` directory is a *local* development reference resource (not officially part of the repo).

- The directory itself and all direct and indirect (linked) content should be treated as **read-only** from the perspective of the MWI project.
- As this is not officially part of the repo, no official project content (code, documentation, etc.) should ever reference this directory or contents.
  - In this project, most modules should be Mesgjs modules loaded by the Mesgjs runtime system.
  - Any other (JavaScript) resources should be properly vendored or (much more rarely) be based on the module import mount points in `deno.json`.
- `NANOS-Training-Data.md` contains AI/LLM training data for the `NANOS` JS class that is the basis for the Mesgjs `@list` interface and used heavily throughout Mesgjs and MWI.
- `Mesgjs-Training-Data.md` contains AI/LLM training data for the Mesgjs language. This file is carefully curated and condensed to provide **ESSENTIAL** context for reading and writing Mesgjs code, and understanding interactions between JavaScript and Mesgjs.
- `escape-js`, `nanos`, and `reactive` link to upstream projects in case you need to reference the current source for additional details

## Testing

- Experience has shown that using the actual Mesgjs and MWI interfaces, runtime, etc. generally works better with less total effort in the long run than trying to "mock" them.
- Leverage the existing test harness. Do not "mock" any interfaces without prior approval from the user.
