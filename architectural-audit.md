## HTML Core Component Architecture Unification

- **Issue:** The list of core HTML tags is registered in `src/shared/components/mwi-html-core.esm.js`, but the critical list of `voidTags` (e.g., `<hr>`, `<img>`) is defined separately and only exists in the server-side component handler (`src/server/component-handlers/h.esm.js`). This violates SSR/CSR parity and creates a maintenance bottleneck.
- **Approved Plan:**
    1.  **Co-locate Metadata:** The `voidTags` list will be defined directly within `src/shared/components/mwi-html-core.esm.js`, making the module the single, self-contained source of truth for core HTML component definitions.
    2.  **Enrich Payload with `noClose`:** During registration, the logic within `mwi-html-core.esm.js` will use its local `voidTags` list to add the existing `noClose: true` property to the `protoPayload` of all void elements. This avoids introducing a redundant `isVoid` property and leverages the existing VNode API.
    3.  **Refactor Server Handler:** The server-side component handler (`src/server/component-handlers/h.esm.js`) will be refactored to remove its local `voidTags` list and its associated logic. The rendering behavior will be correctly driven by the `noClose` property provided by the registered component.
- **Status:** **Resolved (2025-07-15):** The plan has been implemented. The `voidTags` list is now centralized in `mwi-html-core-registrar.esm.js`, which enriches the component payloads. The server-side handler has been simplified to rely on the incoming `noClose` property.

---
# MWI Architectural Audit

This document presents an audit of the MWI architectural plans, comparing them against each other and the core Mesgjs language specification.

## 1. VNode Implementation vs. Architecture

The VNode architecture shows strong internal consistency. The implementation plan in `MWI-Architecture-v3-VNode-Implementation.md` is a faithful realization of the concepts in `MWI-Architecture-v3-VNode.md`.

*   **Positive:** The `fromData` static method is correctly specified to handle both Array and NANOS data, fulfilling a key architectural goal. The copy-on-write strategy is also well-defined.
*   **Observation:** The validation regex for type names (`/^[a-zA-Z0-9@:.+-]+$/`) is permissive. This seems intentional to support names like `@string` and `h.div`, but should be noted.

*   **Observation:** The collective architectural documents imply a tiered naming convention for component types, but this is not explicitly consolidated or defined in `Naming-Conventions.md`. The observed-but-unwritten convention appears to be:
    *   **Prefixed Collections:** `prefix.*` for families of primitive components (e.g., `h.div`, with a potential for future sets like `f.input`).
    *   **camelCase:** For library-supplied semantic components (e.g., `datePicker`, `formValidator`).
    *   **PascalCase:** For user-defined, application-specific components, treating them like classes.
*   **Resolution (2025-07-11):** This tiered component naming strategy was formalized and added to `Naming-Conventions.md`. The section is now considered complete.
## 2. Component System Consistency

The component-related documents are generally aligned, but there are areas that require clarification.

*   **Conflict:** `MWI-Component-Guidelines.md` specified that smart components receive a *copy* of NANOS input. However, the more detailed `MWI-Component-Authoring-Guide.md` and `MWI-Semantic-Component-Architecture.md` imply that components operate on the data they are given, with the rendering pipeline being responsible for managing the data structure. The "copy-on-write" VNode strategy is the ultimate arbiter here, making the explicit NANOS copy redundant.
*   **Resolution (2025-07-11):** The `MWI-Component-Guidelines.md` document has been updated to remove the concept of an explicit NANOS copy. It now correctly states that data immutability is handled by the VNode's copy-on-write mechanism, simplifying the component developer's mental model. The section is now considered complete.

## 3. Client-Side Architecture Conflicts

The client-side plans are mostly synergistic.

*   **Potential Issue:** `CSR-Event-And-State-Plan.md` described an outdated "handshake" mechanism for pub/sub, which conflicted with the definitive reactive model in `MWI-PubSub-Architecture.md`.
*   **Resolution (2025-07-11):** The outdated "handshake" model was archived to `historical/CSR-State-Handshake-Model-ARCHIVED-20250711.md`. The main `CSR-Event-And-State-Plan.md` was updated to reflect the canonical reactive pub/sub architecture, resolving the conflict. The section is now considered complete.

## 4. SSR/CSR Synchronization

The sync plan correctly identifies and provides a path to resolve the issues.

*   **Observation:** The plan in `SSR-CSR-Sync-Plan.md` is high-level. It correctly identifies the need for naming alignment, scope ID synchronization, and abstraction parity. The successful execution of this plan is critical. The "Open Issues" document anoints this as a major concern, and the plan seems to address the whats, if not the hows.

## 5. Bundling and Loading

The bundling and loading documents are consistent. `Bundling-Design-Proposal.md` proposes an in-ecosystem approach using `msjstrans`, which aligns with the project's "no external build step" philosophy.

## 6. Naming Conventions

The architectural documents themselves are not perfectly compliant with the `Naming-Conventions.md` file.

*   **Minor Inconsistency (Self-Correction):** The initial audit claimed an inconsistency in `MWI-Architecture-v3-VNode-Implementation.md`. A detailed review shows the `fromData` method correctly uses `const node = new MWIVNode(type)`, which is compliant with the `camelCase` convention for instances. The audit was in error on this point.
*   **Confirmation:** The audit confirms that `MWI-MUM-Plan.md` correctly refers to `mountMessage` and `unmountMessage` using `camelCase`, serving as a good example of the standard.
*   **Suggestion:** A minor pass over the architectural documents to align variable names in examples with the convention would be beneficial.

## 7. Syntax and Language Usage

The Mesgjs syntax is used consistently across all documents and aligns with the `MWI-Training-Data.md` specification. The use of SLID for configuration and examples is correct.

## 8. Open Issues Analysis

Analyzing `Open-Issues.md` against the other documents reveals:

*   **Partially Resolved:** The issue of component communication is addressed by `MWI-PubSub-Architecture.md`.
*   **Partially Resolved:** The issue of SSR passing scope IDs to CSR is addressed in `SSR-CSR-Sync-Plan.md`.
*   **Actionable:** The issue "v3 Resources is still referring to VirtualNode; this should be MWICSRVNode" is a straightforward documentation bug to be fixed in `MWI-Architecture-v3-Resources.md`.
*   **Confirmed:** The issue about avoiding `['something', {}, ...]` is valid. The VNode architecture, specifically the `fromData` method, is designed to handle this normalization. This reinforces the importance of adhering to the VNode pattern.
*   **Confirmed:** The `Text Node Normalization Guards` issue is a subtle but critical implementation detail for the `MWICSRVNode` and its handling of reactive text content. This is not explicitly addressed in the VNode implementation doc and should be added.

## 9. Summary of Recommendations

9.1. **Clarify VNode Copy Mechanism:** Update `MWI-Component-Guidelines.md` to state that copy-on-write is handled by the VNode, not an explicit NANOS copy.
9.2. **Unify Pub/Sub Architecture:** Update `CSR-Event-And-State-Plan.md` to reference the reactive pub/sub model from `MWI-PubSub-Architecture.md` as the definitive approach.
9.3. **Documentation Cleanup:**
    *   Perform a consistency pass on variable names in code examples across all architectural documents to align with `Naming-Conventions.md`.
    *   In `MWI-Architecture-v3-Resources.md`, replace references to `VirtualNode` with `MWIVNode` or its specific variants (`MWISSRVNode`, `MWICSRVNode`) where appropriate.
*   **Resolution (2025-07-11):** A full audit was performed. Incorrect references were found and corrected in `MWI-Architecture-v3-Reactive.md` and `MWI-Semantic-Component-Architecture.md`. The original item in `Open-Issues.md` has been marked as resolved. This item is now considered complete.
9.4. **Enhance VNode Implementation:** Add the "Text Node Normalization Guards" requirement from `Open-Issues.md` to the `MWI-Architecture-v3-VNode-Implementation.md` to ensure this critical detail is not missed.
*   **Resolution (2025-07-11):** The implementation plan has been updated with a more explicit definition of this requirement. The item is now considered complete.

## 10. Detailed Audit of Naming Conventions and Syntax (Follow-up)

This section provides a more granular analysis based on the feedback provided.

### 10.1. Naming Convention Violations (Filename vs. Pseudo-path)

The `Naming-Conventions.md` file clearly distinguishes between `kebab-case` or `PascalCase` for filenames and `dot.separated` for pseudo-paths like feature promises or data bindings. The following files contain examples that violate this rule:

*   **`Bundling-Design-Proposal.md`**:
    *   **Incorrect:** Refers to `mwi.ssr.msjs`, `mwi.csr.msjs`, `mwi.shared.msjs`, `mwi.html.core.msjs`, and `mwi.semantic.core.msjs`.
    *   **Correct Convention:** These should be `mwi-ssr.msjs`, `mwi-csr.msjs`, `mwi-shared.msjs`, `mwi-html-core.msjs`, and `mwi-semantic-core.msjs` respectively. The Mermaid diagram and the example for `mwi-ssr.msjs` also use the incorrect `.` separator. This needs to be corrected to avoid confusion between module file paths and module logical paths.
    *   **Resolution (2025-07-11):** The `Bundling-Design-Proposal.md` document has been updated to use the correct `kebab-case` convention for all filenames. This item is now considered complete.
*   **`MWI-Component-Authoring-Guide.md`**:
    *   **Incorrect:** The example path `src/shared/components/mwi-hello-world.msjs` is correct, but the SLID `modpath` is `mwi/components/helloWorld`. This is good, it shows the difference between the filesystem path and the logical module path. However the `featpro` is `'mwi.components.helloWorld'`. The internal interface name is `mwiComponentHelloWorld`. This seems inconsistent.
    *   **Suggestion:** The `featpro` should likely be `mwi.components.mwi.helloWorld` for consistency with other examples like `mwi.components.mwi.html.core`. The interface identifier should also be `mwiHelloWorld` or `MWIHelloWorld` (PascalCase for complex entities). This needs to be clarified and applied consistently.
    *   **Resolution (2025-07-15):** The primary `MWI-Component-Architecture.md` document establishes the correct pattern. Later audit resolutions (11.4) confirmed that the patterns in other documents were also correct after context was clarified. This item is considered complete.
*   **`MWI-Component-Architecture.md`**:
    *   **Correct:** The document correctly shows a `featpro` example of `mwi.components.<unique.moduleName>` and provides a valid instance: `mwi.components.mwi.html.core`. This establishes the correct pattern and can be used as a reference.

### 10.2. Mesgjs Syntax and Pattern Correctness

A detailed review against `MWI-Training-Data.md` reveals several instances of incorrect or outdated syntax in the examples.

*   **`Bundling-Design-Proposal.md`**:
    *   **Incorrect Syntax:** The Mesgjs example uses `;;` for comments. Per `MWI-Training-Data.md`, valid comments are `//` for single-line and `/* ... */` for multi-line.
    *   **Incorrect Syntax:** The example uses `(@interface (@main ...))`. `(@main)` is not a standard message for the `@interface` interface. The structure for defining an interface is `(@c(interface name)(set [handlers=[...]]))`.
    *   **Incorrect Syntax:** It uses `($c.fwait ... ($c.get @js) 'getSsrApi')` and `(|> ... )`. `$` is not a valid character to start a variable name, it should be `@c` or another valid object. The `|>` is not a defined operator or message. This appears to be a mix of incorrect and possibly pseudo-code that could be very misleading.
*   **`MWI-Component-Authoring-Guide.md`**:
    *   **Incorrect Pattern:** The line `if (!mid) throw new Error(...)` is inside an `@js{ ... @}` block that is documented to be wrapped in a `loadMsjs(mid)` function. So `mid` will always be defined. The check is redundant. `loadMsjs` itself is what receives `mid`. The text says "This code is implicitly wrapped in `export function loadMsjs (mid) { ... }`". This is a subtle but important distinction in the documentation.
    *   **Incorrect Handler Signature:** The example `handler: d => d.js.render(d.mp)` is a correct JavaScript lambda.
    *   **Inconsistent Example:** The example shows `registry('register', { component: mwiComponentHelloWorld, init: opInit });`. The parameters for register should be a list `[component=... init=...]`. So it should be `registry(register [component=... init=...])`. The JS equivalent in `sendAnonMessage` would be `registry('register', ls(['component', mwiComponentHelloWorld, 'init', opInit]))`. The `{}` suggests a plain JS object which is not the same as a Mesgjs list.
    *   **Resolution (2025-07-13):** The issues identified in this section were addressed by the resolutions for items 11.3 and 11.4. The syntax in `Bundling-Design-Proposal.md` was corrected, and the patterns in `MWI-Component-Authoring-Guide.md` were confirmed to be correct after further clarification. This section is now considered resolved.

## 11. Summary of New Recommendations

11.1. **Correct Filename Examples:** Update `Bundling-Design-Proposal.md` to use `kebab-case` for all `.msjs` filenames in its examples and diagrams.
11.2. **Standardize `featpro` Naming:** Clarify the `featpro` naming convention. The pattern `mwi.components.mwi.helloWorld` seems more consistent than `mwi.components.helloWorld`. Update the authoring guide accordingly.
11.3. **Fix Mesgjs Syntax in `Bundling-Design-Proposal.md`:** The Mesgjs example in this document needs a complete rewrite to use valid comment syntax (`//` or `/* */`), correct interface definition (`@c(interface ...)(set ...)`), and valid message sending syntax (`@c(fwait ...)`). The `|>` operator needs to be removed or replaced with a valid construct.
*   **Resolution (2025-07-11):** The example has been rewritten to use correct Mesgjs syntax for comments, interface definitions, and promise handling. The speculative JS-bridge logic has been replaced with comments acknowledging the pattern is TBD. This item is now considered complete.
11.4. **Refine `MWI-Component-Authoring-Guide.md` Example:**
    *   Clarify the role of the `if (!mid)` check. It's likely illustrative but technically redundant inside `loadMsjs`.
    *   Correct the `registry('register', ...)` call to use a proper Mesgjs list literal `[...]` or an equivalent `ls()` call in JS for the parameters, not a JS object `{}`.
*   **Resolution (2025-07-11):** This audit item was based on a misunderstanding. Further clarification revealed:
    *   The `if (!mid)` check is correct and necessary, as it handles cases where a module is loaded in an unmanaged environment without a `mid`.
    *   The `registry('register', { ... })` call is also correct. The JS-to-Mesgjs bridge can accept a plain JavaScript object for message parameters, which is then handled by a `UnifiedList` interface.
    *   Therefore, the original code was correct, and this item is considered resolved with no changes needed to the authoring guide.

This deeper audit reveals critical inconsistencies that, if left unaddressed, would undoubtedly lead to confusion and incorrect implementations.

## 12. Follow-up Audit Results

This section contains the results of the approved, more comprehensive audit factors.

### 12.1. "Magic String" and Constant Management

An analysis of repeated string literals across the architectural documents reveals several candidates for conversion to centrally-managed constants.

*   **Feature Promises:** The string `'mwi.registry.ready'` appears in both `MWI-Component-Architecture.md` and `MWI-Component-Authoring-Guide.md`. Similarly, `'mwi.components.ready'` and patterns like `'mwi.components.<unique.moduleName>'` are central to the component lifecycle.
*   **Pub/Sub Channels:** `MWI-PubSub-Architecture.md` and `MWI-Semantic-Component-Architecture.md` reference pub/sub channel paths like `'forms.<form-name>'`.
*   **Interface Names:** The name `'MWIComponentRegistry'` is used to get the registry instance in the authoring guide.
*   **HTML IDs:** The hydration system relies on `'mwiHydration'` and `'mwiModules'` as `id` attributes for script tags (`MWI-Architecture-v3-Hydration.md`, `MWI-Architecture-v3-Resources.md`).

**Recommendation:** A new shared module, e.g., `src/shared/constants.esm.js`, should be created to house these values. This would make the system more robust and easier to refactor.
*   **Resolution (2025-07-11):** The file `src/shared/constants.esm.js` has been created, and the identified constants have been added. The audit's suggestion for a `PUBSUB_FORMS_PREFIX` was determined to be unnecessary as the full channel name is user-defined. This item is now considered complete.

### 12.2. API Surface Consistency

The documents propose a "bilingual" JS/Mesgjs pattern, but the exact API exposed to JavaScript is not perfectly consistent.

*   **`jsv` Property:** The document `Bilingual-Interface-Addendum.md` (referenced from the tutorials) establishes `.jsv` as the standard property for accessing the underlying JavaScript view of a Mesgjs object. However, other documents, like the `counter` example in `Tutorial-Bilingual-Interfaces.md`, use `Object.setPrototypeOf()` to merge the JS class directly with the Mesgjs receiver. This creates an inconsistent API for consumers.
*   **Singleton Service Pattern:** `MWI-Component-Authoring-Guide.md` describes a pattern for exporting a singleton service where the JS Class constructor is attached directly to the Mesgjs instance (e.g., `myUtilityService.MyUtilityClass`). This is a different pattern from the `.jsv` convention.

**Recommendation:** The `.jsv` pattern from the addendum should be formally adopted as the **sole** standard for exposing JS-managed state. The singleton service pattern should be revised to also use `.jsv` (e.g., `myUtilityService.jsv.MyUtilityClass`) to provide a uniform access method. The tutorials should be updated to reflect this unified standard.
*   **Resolution (2025-07-13):** The `Tutorial-Bilingual-Interfaces.md` and `MWI-Component-Authoring-Guide.md` documents have been updated to exclusively use the `.jsv` container pattern. The `Bilingual-Interface-Addendum.md` is now obsolete and pending deletion. This item is considered complete.

### 12.3. Cohesive Error Handling Strategy

The documents describe error handling in isolated contexts, but a unified strategy is not explicitly defined.

*   **Hydration Errors:** `MWI-Architecture-v3-Hydration.md` specifies logging hydration errors and continuing.
*   **Resource Errors:** `MWI-Architecture-v3-Resources.md` also specifies logging resource loading errors and continuing.
*   **Module Management:** The `MWI-Component-Authoring-Guide.md` shows a `throw new Error(...)` if the `mid` is not present, indicating a fatal startup error.
*   **Try/Catch:** The base `@try` interface is well-defined in the training data, but its application at the architectural level is not prescribed.

**Recommendation:** Create a brief, top-level `Error-Handling-Strategy.md` document. It should specify:
12.3.1.  **Fatal vs. Non-Fatal Errors:** Define which errors should halt the application (e.g., core module failure) versus which should be logged as warnings (e.g., a single component's hydration failure).
12.3.2.  **Standard Error Object:** Define a standard error object structure for MWI-specific errors, perhaps including an error code, to make programmatic handling easier.
12.3.3.  **User-Facing Errors:** Define a strategy for how and when to display errors to the end-user versus logging them for developers.
*   **Resolution (2025-07-15):** The `Error-Handling-Strategy.md` document has been created in the `architectural-plan/` directory, fulfilling this requirement. This item is now complete.

### 12.4. Documentation Redundancy and Consolidation

There is significant overlap between several documents.

*   **Pub/Sub:** `CSR-Event-And-State-Plan.md` is largely superseded by the more detailed `MWI-PubSub-Architecture.md`.
*   **Component Architecture:** The documents `MWI-Architecture-v3-Components.md`, `MWI-Component-Architecture.md`, and `MWI-Component-Guidelines.md` have overlapping concerns.
*   **Component Examples:** The `Hello, MWI` example in `MWI-Component-Authoring-Guide.md` and the `counter` example in `Tutorial-Bilingual-Interfaces.md` illustrate similar concepts.

**Recommendation:**
12.4.1. Deprecate `CSR-Event-And-State-Plan.md` and mark it as historical. Move any unique, still-relevant concepts into `MWI-PubSub-Architecture.md`.
12.4.2. Consolidate the three main component architecture documents into a single, authoritative `MWI-Component-System.md`.
12.4.3. Combine the simple component examples into a single, canonical tutorial that demonstrates the approved patterns (e.g., `.jsv` convention).
*   **Resolution (2025-07-15):** The documentation consolidation was completed as part of a larger documentation overhaul. The new canonical documents (`MWI-Component-System.md`, `MWI-Client-Side-Interaction-Architecture.md`, `MWI-Component-Tutorial.md`) address these recommendations. This item is now complete.

### 12.5. Explicit Security and Sanitization Rules

The architecture mentions security, but the responsibilities could be more explicit.

*   **Sanitization:** `MWI-Architecture-v3-Core.md` mentions "Sanitized data binding," but doesn't specify *where* or *how* sanitization should occur. It's unclear if this is the component handler's responsibility or the VNode/renderer's.
*   **URL Verification:** `MWI-Architecture-v3-Resources.md` shows a `sanitizeUrl` method in the renderer. This is a good example of an explicit rule.
*   **HTML Escaping:** It is implied that the SSR renderer will escape content to prevent XSS, but this is not explicitly stated as a hard requirement in the core architectural documents.

**Recommendation:** Add a top-level `Security.md` document to the architectural plan. This document should explicitly state:
12.5.1. **The Golden Rule:** "All data is untrusted."
12.5.2. **Handler Responsibility:** Component handlers are responsible for validating the *shape* and *type* of incoming `data`.
12.5.3. **Renderer Responsibility:** The `MWISSRVNode` is responsible for context-aware HTML escaping of all content before it is rendered into the final string. The `MWICSRVNode` is responsible for using safe DOM manipulation methods (e.g., `.textContent` over `.innerHTML` where appropriate).
*   **Resolution (2025-07-15):** The `Security.md` document has been created in the `architectural-plan/` directory, fulfilling this requirement. This item is now complete.

### 12.6. Clarity of Responsibility (Single Responsibility Principle)

`MWIRenderer` in `MWI-Architecture-v3-Resources.md` is a good candidate for this audit.

*   **Multiple Responsibilities:** The class is shown to handle:
    1.  Payload Processing (`processPayload`)
    2.  Scoped CSS ID Generation (`getScopeId`)
    3.  Scoped CSS String Generation (`generateScopedCss`)
    4.  URL Sanitization (`sanitizeUrl`)
*   **SRP Violation:** These are four distinct responsibilities. A change to the URL sanitization policy, for example, requires modifying the renderer, which conceptually has little to do with URL security.

**Recommendation:** Refactor the `MWIRenderer`'s responsibilities into dedicated helper services/classes:
*   `ResourceCollector`: Responsible for iterating payloads and populating collections of stylesheets, modules, and CSS.
*   `ScopeManager`: Manages the mapping of component names to unique scope IDs.
*   `CssProcessor`: Takes the collected scoped CSS and the scope IDs and generates the final CSS string.
*   `UrlValidator`: Contains the logic for sanitizing and validating URLs.

This would make the `MWIRenderer` a simpler orchestrator, delegating tasks to these focused services. The resulting code would be more modular, testable, and maintainable.
---

## 13. Follow-up Audit Items (New)

### 13.1. `h.*` Primitive File Naming Consistency

*   **Issue:** The files responsible for handling the `h.*` HTML primitives are inconsistently named, obscuring their relationship. `src/shared/components/mwi-html-core.esm.js` handles registration, while `src/client/components/h.esm.js` and `src/server/component-handlers/h.esm.js` provide the runtime implementations. The name `h.esm.js` does not clearly link back to the `mwi-html-core` feature set it belongs to.
*   **Suggestion:** The handler files should be renamed for clarity and consistency. The shared file could also be renamed to better reflect its role. A potential improved naming scheme could be:
    *   `src/shared/components/mwi-html-core-registrar.esm.js`
    *   `src/client/components/mwi-html-core-handler.esm.js`
    *   `src/server/component-handlers/mwi-html-core-handler.esm.js`
*   **Observation:** The client-side handler is in `components` while the server-side handler is in `component-handlers`. This is another minor structural inconsistency that could be resolved as part of the renaming.
*   **Resolution (2025-07-15):** This item has been completed. The server-side directory `component-handlers` was merged into `components`. The files were renamed as suggested and relevant import statements in the factory files were updated.
---

## 14. Overall Status and Summary

**Last Updated: 2025-07-15**

This audit is now considered substantially complete. All major implementation mandates, documentation fixes, and critical consistency issues have been addressed and marked with `Resolution` notes.

The remaining open items are primarily minor, "suggestion-level" observations that do not block further development but could be addressed in the future as part of ongoing code quality and documentation maintenance. These include:

*   **Section 6, Suggestion:** A minor pass over the architectural documents to align variable names in examples with the convention would be beneficial.
*   **Section 8, Partially Resolved Items:** The issues of component communication and SSR/CSR scope ID passing are partially resolved by the existence of the relevant architectural plans, but the implementation of those plans is a separate, larger body of work.

The only remaining major, un-implemented recommendation from this audit is **Item 12.6**, the refactoring of the `MWIRenderer` to adhere to the Single Responsibility Principle. This will be tracked as the next major architectural task.