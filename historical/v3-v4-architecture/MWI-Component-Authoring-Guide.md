---
**Status:** STANDARD
**Scope:** The canonical, step-by-step guide to authoring components for the MWI. This guide codifies the Single-File Component (SFC) / component package architecture.
**Related:** MWI-Component-System.md, Bundling-Design-Proposal.md
---

# MWI Component Authoring Guide

This document provides the definitive guide for creating MWI-compliant components. All new component development and refactoring must adhere to the patterns established here. This guide formalizes the **Component Package** architecture, which aligns with the project's core principles of "no build step" and "in-source bundling."

## 1. Core Philosophy: Self-Contained Modules

Each MWI component package is a self-contained module composed of two files:
1.  A `.msjs` file containing the implementation.
2.  A companion `.slid` file declaring module dependencies.

This structure ensures that each package is truly standalone and that the `msjsload` tool can build a complete, version-safe dependency graph for any application.

A package should group logically related components. For example, the `mwi-html-core` package contains all the basic `h.*` primitive components. A package should not be confused with a single component.

## 2. The Anatomy of a Component Package

### 2.1. The `.msjs` Implementation File

This file contains the component's logic and self-identification.

#### 2.1.1. In-Source SLID Configuration (`[(...)]`)

This block is mandatory and contains the module's identity.

*   `modpath`: A unique, slash-separated path for the component package (e.g., `mwi/html/core`).
*   `version`: The semantic version of the package.
*   `featpro`: The feature promise this module provides (e.g., `'mwi.components.mwi.html.core'`).
*   `featreq`: A space-separated list of feature promises this module requires (e.g., `'mwi.componentRegistryReady'`).

#### 2.1.2. Embedded JavaScript Block (`@js{...@}`)

This block contains the component package's entire JavaScript implementation, including all necessary handlers. It uses the Mesgjs feature promise system for managing asynchronous dependencies.

### 2.2. The `.slid` Dependency File

This companion file is mandatory for any component package that has dependencies on other Mesgjs modules, such as the component registry. It has the same base name as its corresponding `.msjs` file.

*   `modreq`: A semicolon-separated list of required modules and their compatible version ranges. **All component packages must declare a dependency on the component registry module.**

## 3. Example: Refactoring `h.script`

To refactor `h.script` into a canonical package, we create two files:

### 3.1. `mwi-html-script.slid`

This file declares the dependency on the component registry module.

```slid
[(
    modreq = 'mwi/registry 0.1.0'
)]
```

### 3.2. `mwi-html-script.msjs`

This file contains the implementation and references the features it provides and requires.

```mesgjs
[(
    modpath = mwi/html/script
    version = 0.1.0
    featpro = "mwi.components.mwi.html.script"
    featreq = "mwi.componentRegistryReady"
)]

'' @js{
    /**
     * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
     * @license MIT
     *
     * The `msjstrans` tool wraps this code inside the exported `loadMsjs`
     * function, so only the function body should be provided here.
     */
    if (!mid) throw new Error('Cannot load mwiHtmlScript without module management');

    const { getInstance, fwait, fready } = globalThis.$c;

    fwait('mwi.componentRegistryReady').then(() => {
        const registry = getInstance('MWIComponentRegistry');

        const hScriptHandler = (vnode, context) => {
            // ... handler logic ...
            return vnode;
        };
        
        const spec = {
            handler: hScriptHandler,
            options: { rawContent: true, tag: 'script' }
        };

        registry("registerComponent", "h.script", spec);
        fready(mid, "mwi.components.mwi.html.script");
    });
@}
```

This two-file package structure provides a robust and self-documenting system for managing components and their dependencies.