# MWI V5 Core Architecture

**Status:** ACTIVE  
**Last Updated:** 2025-11-03

## Overview

The Mesgjs Web Interface (MWI) is a hybrid SSR/CSR rendering system that transforms structured data specifications into HTML (server-side) or DOM nodes (client-side). The system is built on reactive primitives and supports both static rendering and dynamic updates.

## Core Components

### 1. MWIRegistry (Singleton)

**Purpose:** Central registry for all component definitions and metadata.

**Key Responsibilities:**
- Component registration and lookup
- Unique ID generation (component IDs, element IDs, scope IDs)
- Feature-promise coordination for module loading
- Server-to-client component synchronization

**Lifecycle:**
1. Signals `mwi.compRegOpen` when ready for registrations
2. Waits for all `mwi.comp.*` features from preload modules
3. Signals `mwi.compRegReady` when all components registered

**ID Namespaces:**
- Component IDs: `_MO_<base36>` (assigned at registration)
- Element IDs: `_MS_<base36>` (server) / `_ML_<base36>` (client)
- Scope IDs: `MWI-<base36>-` (for scoped CSS)

### 2. MWIDocument

**Purpose:** Coordinates rendering for a single document instance.

**Key Responsibilities:**
- Doc-node creation and management
- Root fragment management
- Spec-to-node conversion
- Reactive NANOS creation helper

**Key Operations:**
- `(createNode type slotSrc=node?)` / `createNode(type, { slotSrc })` - Synchronous node creation
- `(createNodeWait type slotSrc=node?)` / `createNodeWait(type, { slotSrc })` - Async (waits for deferred components)
- `(from item=spec? list=spec? slotSrc=node?)` / `from({ item, list, slotSrc })` - Convert specs to nodes
- `(append node... item=spec? list=spec? slotSrc=node?)` / `append(nodes)` / `append({ item, list, slotSrc })` - Add content to root

### 3. MWIDocNode (Base Interface)

**Purpose:** Base interface for all document nodes, managing attributes, sub-content, and rendering.

**Key Responsibilities:**
- Attribute management (get/set/has)
- Sub-spec and sub-doc management
- Slot source tracking
- HTML and DOM rendering coordination

**Key Operations:**
- `(getAttr name)` / `getAttr(name)` - Get attribute value
- `(setAttr name value)` / `setAttr(name, value)` - Set attribute value
- `(hasAttr name)` / `hasAttr(name)` - Check if attribute exists
- `(setSpec spec)` / `setSpec(spec)` - Set node spec (attributes + sub-spec)
- `(setSubSpec spec1 spec2...)` / `setSubSpec(spec1, spec2, ...)` - Set sub-spec
- `(append node...)` / `append(...nodes)` - Append child nodes
- `(getHTML)` / `getHTML()` - Generate HTML string
- `(getDOM)` / `getDOM()` - Generate reactive DOM nodes

**Special Attributes:**
- `m.id` - Element ID assignment
- `m.percl` - Permanent classes
- `m.slat` - Attribute slotting
- `m.coat` - Computed attributes
- `class` / `style` - Special merge/update semantics

**State Management:**
- `subDoc.live` - Controls whether sub-spec or sub-doc is source of truth
- WeakMap tracking for spec-to-node reuse

## Component Types

### Core Components (MWICore*)

**MWICoreText** (`m.t`)
- Renders text content
- SSR: Escaped text string
- CSR: `<output>` element (or nothing if empty)

**MWICoreCom** (`m.com`)
- Renders HTML comments
- SSR: `<!-- comment -->`
- CSR: Comment node

**MWICoreFrag** (`m.frg`)
- Transparent container
- Passes slot source through to children
- Renders as combined child content

**MWICoreSlot** (`m.slot`)
- Content slotting mechanism
- Named slots: Use attribute from slot source
- Unnamed slots: Use natural children from slot source
- Fallback: Use slot's own children

**MWICoreTpl** (assigned to template components)
- Manages template instantiation
- Creates internal fragment with static template content
- Slot source is the template invocation node
- Lazy sub-spec conversion (autoDoc disabled)

**MWICoreDefer** (`m.defer`)
- Smart deferred-rendering placeholder for not-yet-loaded components
- Accepts children: carries the full content spec of the deferred component
- SSR: renders nothing (empty string); children preserved in doc-spec for hydration
- CSR: derives required feature name from registry entry for the component type in sub-spec; waits via `fwait(ftr)`; renders children reactively when gate opens
- `autoDoc: false`: children not auto-rendered; rendering is gated on the feature promise

### HTML Components (MWIHTML*)

**MWIHTML** (base for all HTML elements)
- Handles standard HTML tags (`h.div`, `h.span`, etc.)
- Void elements: No children allowed
- Container elements: Accept children and modifications
- Passes slot source through to children

**MWIHTMLScript** (`h.script`, `h.style`)
- Uses `m.text` attribute for content
- No children allowed

**MWIHTMLTitle** (`h.title`)
- Uses `m.text` attribute for content
- No children allowed

**MWIHTMLDocType** (`h.doctype`)
- Renders `<!DOCTYPE html>`
- No attributes or children

## Data Flow

### Spec → Doc-Node → Rendered Output

```
1. Doc-Spec (NANOS)
   ↓
2. MWIDocument.from() / createNode()
   ↓
3. MWIDocNode instances
   ↓
4. getHTML() → HTML string (SSR)
   OR
   getDOM() → Reactive DOM nodes (CSR)
```

### Rendering Modes

**Server-Side Rendering (SSR):**
- `getHTML()` produces HTML string snapshot
- Synchronous operation
- No reactivity (snapshot only)

**Client-Side Rendering (CSR):**
- `getDOM()` produces reactive NANOS of DOM nodes
- Synchronous initial render
- Reactive updates via `@reactive` interface
- DOM automatically syncs with doc-node changes

## Reactive Architecture

### Three-Layer Reactive System

**1. Spec Layer (Source of Truth)**
- Changes to spec NANOS trigger reactivity
- Attribute changes propagate to doc-nodes
- Sub-spec changes trigger sub-doc regeneration

**2. Doc-Node Layer (Reactive Middle)**
- Reacts to spec changes
- Maintains reactive wrappers for attributes and sub-docs
- Bridge between abstract specs and concrete rendering

**3. DOM Layer (Rendered Output)**
- Reacts to doc-node changes
- Attributes sync with doc-node attributes
- Children sync with sub-doc changes
- Updates batched for performance

### Key Reactive Patterns

**Reactive Relay Pattern:**
```javascript
const relay = getInstance('@reactive');
relay('set', {
    eager: true, def: () => {
        // Phase 1: Collect (tracked)
        const newValue = computeReactiveValue();
        
        // Phase 2: Update (untracked)
        relay('untr', () => relay('batch', () => {
            result.clear();
            result.push(newValue);
        }));
    }
});
relay('rv'); // Wait for initial execution
```

**Async Race Detection:**
```javascript
let curIter = 0;
relay('set', {
    eager: true, def: async () => {
        const myIter = ++curIter;
        const result = await asyncOperation();
        if (myIter !== curIter) return; // Abort if stale
        applyResults(result);
    }
});
```

## Slotting System

### Slot Sources

- **Default:** Each node is a slot source for its own content (`subSlotSrc: d.rr`)
- **Pass-through:** Fragments and HTML elements pass slot source to children
- **Override:** Template and slot components set themselves as slot source

### Content Slotting

**Named Slots:**
```
Template: [m.slot name=header]
Invocation: [my.component header=[h.h1 "Title"]]
Result: Renders [h.h1 "Title"] in slot
```

**Unnamed Slots:**
```
Template: [m.slot]
Invocation: [my.component [h.p "Content"]]
Result: Renders [h.p "Content"] in slot
```

### Attribute Slotting (`m.slat`)

Copies attributes from slot source to target node:
```
[h.div m.slat=[class id] class=default]
```
With slot source having `class=active id=main`:
```
Result: [h.div class=active id=main]
```

### Computed Attributes (`m.coat`)

Assembles attributes from slot source:
```
[h.div m.coat=[class="btn <type>-btn"]]
```
With slot source having `type=primary`:
```
Result: [h.div class="btn primary-btn"]
```

## Synchronous Rendering

### Design Principle

All rendering operations are synchronous. Async operations are explicit and separate.

**Synchronous Operations:**
- `(createNode type slotSrc=node?)` / `createNode(type, { slotSrc })` - Creates node (or defer node if not loaded)
- `(from item=spec? list=spec? slotSrc=node?)` / `from({ item, list, slotSrc })` - Converts specs to nodes
- `(append node...)` / `append(...nodes)` - Adds nodes to parent
- `(getHTML)` / `getHTML()` - Generates HTML
- `(getDOM)` / `getDOM()` - Generates DOM

**Asynchronous Operations:**
- `(createNodeWait type slotSrc=node?)` / `createNodeWait(type, { slotSrc })` - Waits for deferred component to load
- `(fromWait item=spec? list=spec? slotSrc=node?)` / `fromWait({ item, list, slotSrc })` - Waits for all deferred components
- `(appendWait node...)` / `appendWait(...nodes)` - Waits then appends

### Deferred Loading

When a component is registered but not yet loaded:
1. `createNode()` creates `MWICoreDefer` placeholder (`m.defer` type)
2. `opFrom` enriches the placeholder with the original spec as its sub-spec (children)
3. SSR: placeholder renders nothing; children preserved in doc-spec for hydration
4. CSR: `getDOM()` derives the required feature from the registry and waits via `fwait(ftr)`; children render reactively when the gate opens
5. `createNodeWait()` bypasses the placeholder entirely — waits for load, creates actual component

## Module Coordination

### Feature Promises

**Registry Lifecycle:**
1. `mwi.compRegOpen` - Registry ready for registrations
2. `mwi.comp.<ModuleName>` - Each component module signals ready
3. `mwi.compRegReady` - All components registered

**Component Registration:**
```javascript
// In component module's loadMsjs(mid)
await $c.fwait('mwi.compRegOpen');
// (register name if=ifName? tpl=tplSpec? ftr=feature?)
registry('register', ls([, 'my.component', 'if', 'MyInterface']));
// or: registry.register('my.component', { if: 'MyInterface' });
$c.fready(mid, 'mwi.comp.MyModule');
```

### Server-to-Client Sync

**Component IDs:**
- Server assigns component IDs during SSR
- IDs passed to client via `globalThis.mwiServer.at('components')`
- Client uses same IDs for same components

**Element IDs:**
- Separate namespaces (server: `_MS_`, client: `_ML_`)
- No synchronization needed

## Implementation Files

- [`src/mwi-registry.msjs`](../src/mwi-registry.msjs) - Component registry
- [`src/mwi-document.msjs`](../src/mwi-document.msjs) - Document coordinator
- [`src/mwi-doc-node.msjs`](../src/mwi-doc-node.msjs) - Base node interface
- [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) - Core components
- [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs) - HTML components

## Related Documentation

- [Reactive DOM Requirements](reactive-dom.md) - Detailed reactive system specs
- [Synchronous Rendering](sync-rendering.md) - Sync/async API design
- Interface documentation in [`docs/`](../docs/) directory