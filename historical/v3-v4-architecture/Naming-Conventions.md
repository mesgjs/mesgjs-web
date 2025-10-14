---
**Status:** STANDARD
**History:**
- 2025-07-29: STANDARD
**Scope:** The official naming conventions for the MWI project, covering identifiers, files, classes, components, and attributes.
**Replaces:**
**Replaced by:**
**Related:**
---
# MWI Naming Conventions

This document outlines the official naming conventions for the Mesgjs Web Interface (MWI) project. Adhering to these conventions is crucial for maintaining code consistency, readability, and long-term maintainability.

## Guiding Principles

1.  **Consistency:** Identifiers should follow a single, predictable pattern within a given context.
2.  **Clarity:** Names should clearly communicate their purpose and scope.
3.  **Extensibility:** Conventions should be able to accommodate new features without creating conflicts.

---

## Programmatic Identifiers: `camelCase`

All programmatic identifiers, such as variables, functions, methods, and properties, **MUST** use `camelCase`. This unifies the style across both JavaScript and Mesgjs portions of the codebase.

*   **Context:** JavaScript and Mesgjs code.
*   **Examples:** `componentName`, `reactiveState`, `defineState`, `batchUpdate`.

User-facing MWI classes or interfaces should include an `mwi` or `MWI` prefix to identify them as part of the MWI library.

---

## File Naming: `kebab-case.extension` or `PascalCase.extension`

Filenames may use `kebab-case` or `PascalCase`. These conventions improve readability in the file system, especially for files with multiple descriptive words.

*   **Context:** All files in the repository.
*   **Examples:** `MWI-Architecture-v3-Core.md`, `mwi-html-core.esm.js`, `ConfigurationService.esm.js`.

---

## Class Naming: `PascalCase`

All JavaScript class names **MUST** use `PascalCase`. This is a standard convention in the JavaScript community that clearly distinguishes classes from other constructs.

*   **Context:** JavaScript class definitions.
*   **Examples:** `MWISSR`, `MWICSR`, `SmartComponent`, `MWIComponentRegistry`.

---

## Mesgjs Interface Naming: `camelCase` or `PascalCase`

Mesgjs interface names, which act as identifiers for component handlers and other services, **MUST** use either `camelCase` or `PascalCase`.

*   **Context:** Mesgjs `getInterface('...')` calls.
*   **`PascalCase`** is preferred for interfaces that represent complex entities or "proper names" that are part of the MWI system.
    *   **Examples:** `MWISSRVNode`, `MWIComponentRegistry`
*   **`camelCase`** is suitable for simpler, more functional, or application-specific interfaces.
    *   **Examples:** `datePicker`, `formValidator`

---

## Component Type Naming

Component type names, as used in the first position of a NANOS structure, **are VERY STRONGLY ENCOURAGED to** follow a three-tiered convention to clarify their origin and purpose.

| Convention             | Style        | Context                                                | Example(s)                          |
| :--------------------- | :----------- | :----------------------------------------------------- | :---------------------------------- |
| **Prefixed Collection**| `prefix.*`   | Families of primitive or related library components.   | `h.div`, `h.span`, `f.input`        |
| **Semantic Component** | `camelCase`  | Library-supplied, high-level semantic components.      | `datePicker`, `userProfile`         |
| **User Component**     | `PascalCase` | Application-specific components created by end-users.  | `MyCustomWidget`, `InvoiceDetail`   |

This tiered system provides a clear, at-a-glance understanding of a component's role and source within the MWI ecosystem.

## Constants: `SCREAMING_SNAKE_CASE`

Constants that represent fixed, unchanging values **MUST** use `SCREAMING_SNAKE_CASE`. This makes them clearly identifiable and distinguishes them from dynamic variables.

*   **Context:** JavaScript and Mesgjs code.
*   **Examples:** `COMPONENTS_READY_PROMISE`, `REGISTRY_INTERFACE_NAME`.

---

## MWI Attributes: `prefix.` Namespace

To avoid collisions with standard HTML attributes and provide a clear namespace for MWI-specific functionality, a `prefix.` convention **MUST** be used for attributes that control MWI behavior.

| Prefix | Name        | Context                                                                      | Example(s)                          |
| :----- | :---------- | :--------------------------------------------------------------------------- | :---------------------------------- |
| `m.`   | **M**WI     | Core MWI attributes for pub/sub, internationalization (i18n), and other features. | `m.pub`, `m.sub`, `m.i18n`     |
| `d.`   | **D**ata    | Attributes related to data binding.                                          | `d.value`, `d.disabled`       |
| `v.`   | **V**alidate | Attributes related to data validation.                                       | `v.req`, `v.type=email`       |
| `e.`   | **E**vent   | Declarative event bindings. (Note: This is for simple cases; most event logic resides in Smart Components). | `e.click`, `e.input`                |

This prefix-based system is extensible and prevents ambiguity. While `e.` exists for simple cases, the architectural standard is to handle complex event logic within `SmartComponent` implementations for better separation of concerns.

---

## "Pseudo-Path" Values: `.`-Separated

- Components expected to register with the MWI component registry
  - `mwi.components.mwi.html.core`
  - `mwi.components.user.defined.component`
- `%*MWIData` data-binding paths
  - `contactForm.email`, `contactForm.address1`
- Note: module paths reflect actual filesystem paths and therefore follow file-naming conventions rather than pseudo-path conventions

---

## System-Generated IDs: `$` Prefixes

Element IDs automatically generated by the MWI rendering engines **MUST** use a prefix ending with a dollar sign (`$`). This convention ensures that the generated IDs are valid JavaScript identifiers, allowing them to be used as properties on a proxy object (e.g., `window.MWS$0`) for easy DOM element access.

*   **`MWS$`**: For elements rendered on the **S**erver (`MWISSR`).
*   **`MWC$`**: For elements rendered on the **C**lient (`MWICSR`).

---

### Plan Summary Diagram

This diagram visualizes the updated naming conventions.

```mermaid
graph TD
    subgraph "Naming Conventions"
        A("<b>camelCase</b><br/>JS/Mesgjs Identifiers")
        B("<b>PascalCase</b><br/>JS Classes")
        C("<b>kebab-case</b><br/>Filenames")

        subgraph "MWI Attribute Namespace (`prefix.`)"
            D("<b>m.</b><br/>Core (e.g., m.pub, m.sub)")
            F("<b>d.</b><br/>Data Binding (e.g., d.value)")
            E("<b>v.</b><br/>Validation (e.g., v.req)")
            F("<b>e.</b><br/>Events (e.g., e.click)")
        end

        subgraph "Component Types"
            I("<b>prefix.*</b><br/>Prefixed Collections")
            J("<b>camelCase</b><br/>Semantic Components")
            K("<b>PascalCase</b><br/>User Components")
        end

        subgraph "Generated Element IDs"
            G("<b>MWS$</b><br/>Server-Side IDs")
            H("<b>MWC$</b><br/>Client-Side IDs")
        end
    end

---

## Sorting Conventions

To ensure consistency in sorted lists of identifiers (e.g., in documentation, catalogs, or UI elements), the following sorting rules **MUST** be applied.

### Case-Based Capitalization (`camelCase`, `PascalCase`)

Sorting **MUST** be performed in a case-insensitive, lexicographical order.

*   **Context:** `camelCase` or `PascalCase` identifiers.
*   **Example:** `loggedType` comes before `logInterfaces` (because `g` comes before `i`).

### Separator-Based Capitalization (`kebab-case`, `snake_case`)

Sorting **MUST** be performed by comparing the "words" of the identifier, which are separated by the relevant separator (`-` or `_`).

*   **Context:** `kebab-case` or `snake_case` identifiers.
*   **Example:** `log-interfaces` comes before `logged-type` (because `log` comes before `logged`).

### Hybrid Conventions

When an identifier uses a mix of conventions (e.g., dot-separated `camelCase` terms), sorting rules **MUST** be applied hierarchically.

*   **Context:** `%*MWIData` paths, feature-promise names.
*   **Example:** For `a.loggedType` and `a.logInterfaces`, the first segment (`a`) is identical. The second segment is then sorted using case-based rules, meaning `a.loggedType` comes before `a.logInterfaces`.
## JavaScript Function And Method Declarations

Place a space between the function or method name and the parameter list to help distinguish between a definition and a use in intra-file text searches.

- `function name (...params) { ... }`, `methodName (...params) { ... }`
- `name(...params)`, `object.methodName(...params)`

[supplemental keywords: hydration, scopedCss, dollar sign, sorting, lexicographical, case-insensitive]
