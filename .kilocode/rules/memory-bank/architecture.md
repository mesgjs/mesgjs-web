# MWI System Architecture

The Mesgjs Web Interface (MWI) is a partially-bilingual, but Mesgjs-first, JavaScript-and-Mesgjs system for rendering web interfaces from structured data, supporting both server-side (SSR) and client-side (CSR) rendering.

## Pub/Sub Communication

To facilitate loosely-coupled communication between components (e.g., a form input and its parent form), MWI implements a reactive publish-subscribe system. This system allows components to publish their interfaces to a global, path-based registry and subscribe to other interfaces.

The entire mechanism is built on top of the `@reactive` interface, ensuring that timing and mount/unmount lifecycle issues are handled gracefully. Components can reactively appear and disappear without causing errors in their dependents.

## Module & Component Architecture

The MWI component system is designed to be modular, secure, and tightly integrated with the Mesgjs module-loading ecosystem. It uses a multi-stage feature-promise handshake for initialization, ensuring correctness and preventing race conditions.

### Guiding Principles

-   **Build-Time Resolution:** Component availability and versioning are resolved at build time by the `msjsload-cli` tool.
-   **Asynchronous, Race-Free Initialization:** The system uses the Mesgjs feature-promise mechanism (`$c.fwait`/`$c.fready`) to orchestrate a safe, non-blocking startup sequence.
-   **SSR/CSR Parity:** The client hydrates using the exact module metadata and initialization sequence as the server.

### Build & Runtime Lifecycle

#### 1. Build Process & Feature Signaling
The MWI application is built by `msjsload-cli`. Modules providing components must declare a **unique** feature promise in their catalog entry's `featpro` field.

-   **Convention:** `mwi.comp.<unique.moduleName>`
-   **Example:** The `mwi-html-core` module declares `featpro: "mwi.comp.MWIHTMLCore"`.
- In general, hierarchies should be dot-separated, and multi-word levels should be camelCased.

#### 2. The `loadMsjs(mid)` Contract
Every Mesgjs module, when loaded by the runtime, has its exported `loadMsjs` function called with a unique `mid` (module ID). This `mid` is the authorization token required to signal readiness for features declared in that module's metadata via `$c.fready(mid, featureName)`.

#### 3. Runtime Initialization Handshake
The system uses a four-stage, promise-based handshake to initialize correctly.

##### Stage 1: Registry Becomes Ready
The MWI application has a core "registry" module. When its `loadMsjs(mid)` function is called, it instantiates the `MWIComponentRegistry` and immediately signals that the registry is open for component registration:
`$c.fready(mid, 'mwi.compRegOpen');`

##### Stage 2: Component Modules Register Themselves
The `loadMsjs(mid)` function in each component module performs the following actions:
1.  It calls `await $c.fwait('mwi.MWIDocNode', 'mwi.compRegOpen')` (possibly with additional parameters) to wait for the registry to be open and for any prerequisite interfaces to be available.
2.  It registers Mesgjs interfaces for its components.
3.  It registers the components and interfaces in the component registry.
4.  Finally, it signals its own completion using its unique `mid`: `$c.fready(mid, 'mwi.comp.<moduleName>');`

##### Stage 3: Component System Becomes Ready
After signaling its own readiness in Stage 1, the `MWICompOpen` module proceeds to its next task:
1.  It scans the runtime module metadata to get a list of all expected component feature names (i.e., all `featpro` strings starting with `mwi.comp.`).
2.  It calls `$c.fwait()` with this complete list of feature names.
3.  When this second `fwait` promise resolves, it calls `$c.fready()` with its own `mid` to signal that the entire component system is ready: `$c.fready(registryMid, 'mwi.compRegReady');`

##### Stage 4: Application Renders
The main MWI application logic is wrapped in a single, final startup call: `$c.fwait('mwi.compRegReady').then(() => { /* ... start rendering ... */ });`. This ensures that rendering only begins after the entire component system has been safely and fully initialized.

### Server-to-Client Synchronization

Some information must be synchronized from the server to the client. For example, the unique component IDs assigned by the server must be assigned to the same components on the client. This is done by passing the necessary configuration information within the SSR-generated HTML.

When the page is loaded in the browser, the client-side MWI code will process the information sent from SSR.
