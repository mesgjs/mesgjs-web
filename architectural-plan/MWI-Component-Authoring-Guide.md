# MWI Component Authoring Guide

## 1. The MWI Component Philosophy

This document is the definitive guide for authoring components and modules for the Mesgjs Web Interface (MWI).

### The "No Build Step" Mandate
MWI operates on a "no build step" philosophy. There are no external bundlers like Rollup or Webpack. Every module must be a single, self-contained `.msjs` file that is directly loadable by the Mesgjs runtime via `msjstrans`.

### The Single-File Model
All logic for a module, including complex JavaScript, must be embedded within its single `.msjs` file using `@js{...*...*@}` blocks. The `msjstrans` transpiler wraps this JavaScript in a `loadMsjs(mid)` function, making the module's `mid` and runtime functions available to the embedded code.

### The Mesgjs Interface as a Public API
The Mesgjs interface is the public API contract for an MWI module. Communication between modules happens exclusively through the Mesgjs runtime's feature-promise mechanism (`fwait`/`fready`) and its `getInstance` factory.

## 2. Anatomy of a Single-File MWI Module

All MWI modules are defined in a single `.msjs` file with a specific structure that the `msjstrans` transpiler understands.

```mesgjs
/* 1. In-Source SLID Configuration. This is not part of the source unit. */
[(
    modpath = 'mwi/core/myModule'
    version = '1.0.0'
    featpro = 'mwi.core.myModule' // Public feature promise name
)]

/* 2. An empty string. This is a Non-Comment Line (NCL) that tells the
   transpiler to place the subsequent @js block INSIDE the generated
   loadMsjs(mid) function. */
''

/* 3. A single @js{...*...*@} embed containing all JavaScript for the module. */
@js{*
    // This code is implicitly wrapped in `export function loadMsjs (mid) { ... }`

    if (!mid) {
        throw new Error('myModule requires Mesgjs module management to be active.');
    }

    // `getInterface` uses the camelCase private identifier.
    const myInterface = getInterface('myModule'); 
    myInterface.set({ /* ... */ });
        
    // `fready` uses the public, dot.separated.camelCase featpro string.
    fready(mid, 'mwi.core.myModule');
*@}
```

## 3. The MWI "Import/Export" Pattern

All module interactions follow the same `fwait` -> `getInstance` flow. There is an important distinction between the public `featpro` and the internal interface name.

*   **Feature Promise (`featpro`):** A public, `dot.separated.camelCase` string used for discovery and dependency management (`fwait`/`fready`). e.g., `'mwi.components.helloWorld'`.
*   **Interface Identifier:** An internal, `camelCase` string used to get a handle to the interface definition within the module itself (`getInterface`). e.g., `'mwiHelloWorld'`.

### Pattern A: "Exporting" an Instantiable Component

*   **Provider Module (`*.msjs`):**
    1.  Define a public `featpro` in the SLID config.
    2.  Inside `@js`, get the interface with `getInterface('myComponent')`.
    3.  The interface's `@init` handler creates a `new MyComponentHandler()` and attaches it **immutably** to the object context: `setRO(d.octx, 'js', instance);`.
    4.  Call `fready(mid, 'mwi.components.myComponent')` with the `featpro` string.

### Pattern B: "Exporting" a Singleton Service (JS Class/Constants)

*   **Provider Module (`*.msjs`):**
    1.  Define a public `featpro` in the SLID config.
    2.  Inside `@js`, get the interface with `getInterface('myUtility')`.
    3.  Define the interface as a **`singleton: true`**.
    4.  Its `@init` handler binds the JS class definition directly to the singleton instance: `setRO(d.rr, 'MyUtilityClass', MyUtilityClass);`.
    5.  Call `fready(mid, 'mwi.services.myUtility')`.

*   **Consumer Module (for Singleton Service):**
    1.  `await fwait('mwi.services.myUtility')`.
    2.  `const myUtilityService = getInstance('myUtility');`
    3.  `const MyUtil = myUtilityService.MyUtilityClass; const u = new MyUtil();`.

## 4. Complete "Hello, MWI" Component Example

**File: `src/shared/components/mwi-hello-world.msjs`**
```mesgjs
[(
    modpath = 'mwi/components/helloWorld'
    version = '1.0.0'
    featpro = 'mwi.components.helloWorld' // Public feature name: dot.separated.camelCase
)]

// This empty string is CRITICAL for placing the JS inside loadMsjs.
''

@js{*
    // This code will be wrapped in `export function loadMsjs(mid) { ... }`
    if (!mid) {
        throw new Error('mwiHelloWorld requires Mesgjs module management to be active.');
    }

    class HelloWorldHandler {
        constructor (componentInstance) {
            this.component = componentInstance;
            this.config = this.component('config');
        }

        render (data) {
            const name = data.at('name') || 'World';
            const greeting = this.config.at('greeting');
            const message = `${greeting}, ${name}!`;

            // This handler returns a simple 'content' payload.
            // The renderer will see this data structure and recursively call the
            // handler for the ':h.span' primitive component with the message.
            return [ 'h.span', message ];
        }
    }

    function opInit (d) {
        // Best practice: Set the JS handler instance as a read-only property.
        setRO(d.octx, 'js', new HelloWorldHandler(d.rr));
    }
    
    const mwiComponentHelloWorld = {
        name: ':hello-world', // The tag name for use in page data
        handler: d => d.js.render(d.mp), // The handler is a function
        config: { greeting: 'Hello' },
        schema: { /* ... */ }
    };
    
    // Asynchronously wait for the registry to be ready.
    fwait('mwi.registry.ready').then(() => {
        const registry = getInstance('MWIComponentRegistry');
        registry('register', { component: mwiComponentHelloWorld, init: opInit });
        
        // Signal that our public feature is ready.
        fready(mid, 'mwi.components.helloWorld');
    });
*@}
```