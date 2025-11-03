# MWI Reactive DOM System

**Status:** ACTIVE  
**Last Updated:** 2025-11-03

## Overview

The reactive DOM system enables automatic DOM updates in response to doc-node state changes. This document covers the reactive architecture, patterns, and requirements for CSR (client-side rendering).

## Reactive Data Flow

### Three-Layer Architecture

```
Spec Changes → Doc-Node Updates → DOM Updates
```

**1. Spec Layer (Source of Truth)**
- Changes to `spec` or `subSpec` NANOS trigger reactivity
- Attribute changes propagate to doc-node
- Sub-spec changes trigger sub-doc regeneration

**2. Doc-Node Layer (Reactive Middle)**
- Reacts to spec changes
- Maintains reactive wrappers for attributes and sub-docs
- Bridge between specs and DOM

**3. DOM Layer (Rendered Output)**
- Reacts to doc-node changes
- Attributes sync with doc-node
- Children sync with sub-doc
- Updates batched for performance

## Core Reactive Primitives

### Reactive Interface Object (RIO)

Created via `getInstance('@reactive')`, provides:
- Dependency tracking
- Automatic recalculation on changes
- Batching for performance
- Untracked execution

### The `rxNANOS()` Helper

MWIDocument provides `rxNANOS()` to create reactive NANOS instances:

```javascript
// Create reactive NANOS
const attrs = doc.rxNANOS();

// With initial values
const attrs = doc.rxNANOS(['initial', 'values']);

// Used in doc-node initialization
p.push({
    attrs: doc.rxNANOS(),      // Reactive attributes
    subDoc: doc.rxNANOS(),     // Reactive sub-doc
    subSpec: doc.rxNANOS(),    // Reactive sub-spec
});
```

## Key Reactive Patterns

### 1. Reactive Relay Pattern

Separates reactive calculation from result updates to prevent circular dependencies:

```javascript
const relay = getInstance('@reactive');
relay('set', {
    eager: true, def: () => {
        // Phase 1: Collection (tracked)
        const newValue = computeReactiveValue();
        
        // Phase 2: Update (untracked)
        relay('unbatch', () => {
            result.clear();
            result.push(newValue);
        });
    }
});
relay('rv'); // Wait for initial execution
```

**Why This Pattern:**
- `eager: true` - Schedules immediate execution
- `('rv')` - Waits for first result (synchronous completion)
- `relay('unbatch', ...)` - Combines untracked + batch operations atomically

**Note on Reactive Execution:** While reactions may be *scheduled* asynchronously by the reactive queue runner, they must execute synchronously to completion. Immediate prerequisite dependencies ("providers") will also execute/complete synchronously. "Consumer" dependencies might run later in the queue.

### 2. Reactive List Pattern

For conditional rendering with reactive lists:

```javascript
async function opGetDOM (d) {
    const p = d.p, doc = p.at('doc'), nodes = doc.rxNANOS();
    const output = document.createElement('output');
    
    getInstance('@reactive')('set', {
        eager: true, def: () => {
            const text = d.rr('getAttr', [ 't' ]) || '';
            if (text !== '') {
                output.textContent = text;
                nodes('set', new NANOS(0, { to: output }));
            } else {
                nodes('clear');
            }
        }
    })('rv');
    
    return nodes;
}
```

## Attribute Reactivity

### Flux Tracking

Attributes are promoted to individual reactors based on change frequency:

- **Low-flux** (≤3 changes): Share main-group reactor
- **High-flux** (>3 changes): Get individual reactor

### HTML Attribute Filtering

Only valid HTML attributes (matching `/^[0-9a-z:_-]*$/`) sync to DOM. Additionally, components may specify `htmlAllowAttr` in their schema to further restrict which attributes render to HTML (e.g., `MWICoreDefer` only allows `id` and `data-mwi-defer`).

### Special Attribute Handling

**`class` Attribute:**
- `=` - Conditional clear (clears if more classes follow)
- `==` - Unconditional clear
- `+` - Update mode (merge with existing)
- `!` - Remove class
- `~` - Toggle class

**`style` Attribute:**
- Same tokens as `class`
- Empty value after `:` removes style
- Non-empty value sets style

## Sub-Doc Reactivity

### Identity Tracking

WeakMap maintains spec-to-node mappings for reuse:
- **Key:** Original NANOS from sub-spec
- **Value:** Corresponding doc-node

### Change Detection

When sub-spec changes:
1. Scan new sub-spec NANOS instances
2. Check WeakMap for existing nodes
3. Reuse existing nodes where possible
4. Create new nodes for new specs
5. Remove orphaned nodes

### Live State Machine

`subDoc.live` controls source of truth:

- **`live` = falsy:** `subSpec` is source of truth
- **`live` = truthy:** `subDoc` is source of truth

**State Transitions:**
- `append()` → Sets `live = true`
- `setSubSpec()` with `autoDoc=true` → Sets `live = true`
- `setSubSpec()` with `autoDoc=false` → Keeps `live = false`

## DOM Synchronization

### Reactive DOM Updates

`(getDOM)` / `getDOM()` returns reactive NANOS of DOM nodes that automatically updates when doc-node structure changes.

### Batching Strategy

Use `@reactive` batching for atomic updates:

```javascript
getInstance('@reactive')('batch', () => {
    node.setAttr('class', 'updated');
    node.setAttr('data-value', '42');
});
```

**Benefits:**
- Prevents intermediate visual states
- Reduces browser reflows
- Improves performance

## Type Immutability

Component types are **not** reactive:

- Node `type` set during `@init`, cannot change
- Cannot reactively change from `h.div` to `h.span`
- Use conditional components for dynamic type selection
- Attempting to change type throws `TypeError`

## Error Handling

### Reactive Calculation Errors

```javascript
getInstance('@reactive')('set', {
    eager: true,
    def: () => {
        try {
            return computeValue();
        } catch (error) {
            console.error('Reactive calculation failed:', error);
            return undefined; // Fallback
        }
    }
})
```

### Circular Dependencies

The `@reactive` interface handles circular dependencies automatically:
- Circular updates detected and prevented
- Warning logged if detected
- Maximum recursion depth enforced

## Testing Reactive Behavior

### Test Harness Support

```javascript
import { setupRuntime, renderDOM, simulateBrowser } from '../harness.esm.js';

await setupRuntime();
await simulateBrowser();

const domNodes = await renderDOM(ps('[([h.div class=initial "Content"])]'));
const div = domNodes.at(0);

// Wait for reactive recalculations
await globalThis.reactive.wait();

assertEquals(div.className, 'initial');
```

**Test-Mode Component Registration:**

For test-mode component registration, include `allowLate: true` in the component entry to allow registration after `mwi.compRegReady`. This is required for production compatibility:

```javascript
registry.register('test.component', ls([
    'allowLate', true,
    'tpl', ps('[([h.div "Test"])]')
]));
```

### Key Testing Utilities

- `simulateBrowser()` - Sets up JSDOM environment
- `renderDOM(content)` - Creates document and renders to DOM
- `globalThis.reactive.wait()` - Waits for reactive recalculations

## Performance Considerations

- Track attribute change frequency with flux counter
- Promote high-flux attributes to individual reactors
- Uses `ATTR_LOW_FLUX = 3` as promotion threshold
- Batch DOM updates to minimize reflows
- Remove "extra" DOM attributes not in doc-node

## Related Documentation

- [Core Architecture](core-architecture.md) - System overview
- [Synchronous Rendering](sync-rendering.md) - Sync/async API design
- Full reactive requirements in [`v5-init-arch/Reactive-DOM-Reqs-Rev1.md`](../v5-init-arch/Reactive-DOM-Reqs-Rev1.md)