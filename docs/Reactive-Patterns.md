# MWI Reactive Patterns

This document describes reactive programming patterns used in MWI for both development and testing.

## Core Reactive Concepts

### Eager vs Lazy Reactives

**Eager (`eager: true`)**
- Forces reactive demand - ensures evaluation happens
- Critical for side effects (DOM updates, attribute changes)
- DOM-related reactives MUST be eager because the DOM is non-reactive consumer
- Updates automatically even when nobody's actively observing

**Lazy (default)**
- Only computes when something demands it
- Used for internal state like `getSubDoc()` which only needs to be current when accessed
- More efficient when value might not be needed

### `.rv` - Synchronous Access

- Independent of eagerness setting
- Means "give me the computed reactive value NOW (synchronously)"
- Waits for the reactive to complete if it's still computing
- Creates immediate demand for the current value

**Example:**
```javascript
// Lazy reactive - only computes when .rv is accessed
if (p.has('_subDoc')) return p.at('_subDoc').rv;

p.set('_subDoc', reactive({ def: () => { ... }}));

// Eager reactive - computes automatically, .rv gets current snapshot
if (p.has('_dom')) return p.at('_dom').rv;

p.set('_dom', reactive({ eager: true, def: () => { ... }}));
```

> **IMPORTANT:** In order to avoid creating huge networks of duplicate reactive calculations, make sure you always use the same reactive object for any given property.

### `reactive.wait()` - Waiting for Updates

**Purpose:** Waits for pending reactive recalculations to complete.

**When NOT needed:**
- After calling `getDOM()` - it returns `.rv` which is already synchronous
- After calling `getHTML()` - not reactive at all (static snapshot)
- When calling `getDOM()` again - you get a fresh `.rv` snapshot

**When needed:**
- You want to observe reactive updates to a PREVIOUSLY OBTAINED result
- In tests when verifying reactive changes have propagated

**Example:**
```javascript
// Pattern 1: Call getDOM() again - NO reactive.wait() needed
const domNodes = node.getDOM();  // Current snapshot via .rv
node.setAttr('class', 'updated');
const domNodes2 = node.getDOM();  // New snapshot, internal .rv handles sync

// Pattern 2: Reuse previous result - YES, reactive.wait() needed
const domNodes = node.getDOM();  // Current snapshot
node.setAttr('class', 'updated');
await reactive.wait();  // Wait for eager reactives to update previous result
// Now domNodes has been reactively updated (same DOM nodes, updated attributes)
```

## Development Patterns

### DOM Synchronization Pattern

DOM operations use eager reactives with immediate `.rv` access.

**Pattern: Short-Circuit with Double Resync**

Always check if the reactive has already been created before creating a new one:

```javascript
// Work with the same previously-created reactive values if called before
if (p.has('_dom')) {
    p.at('_domAttrs').rv;  // Wait on any pending attribute updates
    return p.at('_dom').rv;  // Return (same) DOM nodes after any pending content updates
}

// Create once and cache
const elem = document.createElement(tag), nodes = new NANOS([elem]);
const _dom = reactive({ eager: true, def: () => {
    // Setup / update the element (same one every time)
    return nodes; // This is what _dom.rv returns
}});

const _domAttrs = setDOMAttrs(elem, attrs, schema); // Internal .rv

p.push({ _dom, _domAttrs });
return _dom.rv;  // Synchronous DOM node
```

**Key points:**
- Check `p.has('_dom')` first to avoid creating duplicate reactives
- DOM element creation is eager (side effects)
- Both `.rv` calls ensure synchronous completion
- Subsequent changes update DOM automatically (eager)

### Managed Region Pattern

For `m.head` and `m.body`, content is synchronized within boundary markers.

**Example:**
```javascript
const elem = isHead ? document.head : document.body;
const nodes = new NANOS([ elem ]);
const _dom = reactive({ eager: true, def: () => {
    const children = d.rr('getSubDOM');
    domSyncManagedChildren(elem, children);
    return nodes;
}});
```

**Why eager:**
- DOM must update even when code isn't actively observing
- User-visible changes must happen automatically
- Boundary markers protect external content

## Testing Patterns

### Pattern 1: Fresh Snapshots (No `reactive.wait()`)

When you call `getDOM()` or similar methods each time, no waiting needed:

```javascript
test("Attribute updates reflected in new getDOM() calls", () => {
    const node = doc.createNode('h.div');
    node.setAttr('class', 'initial');
    
    const dom1 = node.getDOM();  // .rv gives synchronous snapshot
    assertEquals(dom1.at(0).className, 'initial');
    
    node.setAttr('class', 'updated');
    const dom2 = node.getDOM();  // New .rv snapshot, already updated
    assertEquals(dom2.at(0).className, 'updated');
});
```

### Pattern 2: Observing Reactive Updates (Yes `reactive.wait()`)

When you keep a reference and want to see it update:

```javascript
test("Previously obtained DOM nodes update reactively", async () => {
    const node = doc.createNode('h.div');
    node.setAttr('class', 'initial');
    
    const domNodes = node.getDOM();  // Keep this reference
    const elem = domNodes.at(0);
    assertEquals(elem.className, 'initial');
    
    node.setAttr('class', 'updated');
    await reactive.wait();  // Wait for eager reactive to update elem
    
    assertEquals(elem.className, 'updated');  // Same elem, updated attributes
});
```

> Note: Alternatively, you can just call `node.getDOM()` again (to wait for the updates) but look at the original result, which will have reactively updated. `await reactive.wait()` is less work than waiting for several independent updates invidually (and may be better at self-documenting intent).

### Pattern 3: SSR-CSR Hydration (Minimal `reactive.wait()`)

Sync operations are synchronous; only wait when testing reactive updates:

```javascript
test("CSR sync preserves SSR nodes", () => {
    // SSR - no reactivity
    const html = ssrHTML(spec);
    loadSSRIntoDOM(html);
    const ssrDiv = document.body.firstChild;
    
    // CSR sync - synchronous via .rv
    const { domNodes } = csrSync(spec, ssrDiv);
    
    assertStrictEquals(domNodes.at(0), ssrDiv);  // No wait needed
});

test("Reactive updates after hydration", async () => {
    const html = ssrHTML(spec);
    loadSSRIntoDOM(html);
    const ssrDiv = document.body.firstChild;
    
    const { domNodes } = csrSync(spec, ssrDiv);
    const elem = domNodes.at(0);
    
    node.setAttr('class', 'updated');
    await reactive.wait();  // Wait for reactive update
    
    assertEquals(elem.className, 'updated');
});
```

### Pattern 4: Content Changes (Yes `reactive.wait()`)

After `append()` or other content modifications:

```javascript
test("Child append updates DOM", async () => {
    const parent = doc.createNode('h.div');
    const domNodes = parent.getDOM();
    const elem = domNodes.at(0);
    
    assertEquals(elem.children.length, 0);
    
    const child = doc.createNode('h.span');
    child.append('Text');
    parent.append(child);
    await reactive.wait();  // Wait for DOM update
    
    assertEquals(elem.children.length, 1);
});
```

## Summary

**Key Principles:**
1. DOM updates are eager - they happen automatically
2. `.rv` makes access synchronous - gives you current value now
3. `reactive.wait()` is for observing updates to previous results
4. Calling `getDOM()` again gives you a fresh snapshot - no wait needed

**Quick Reference:**
- **Fresh `getDOM()` call** → No `reactive.wait()`
- **Reusing previous result** → Yes `reactive.wait()`
- **After `setAttr()`/`append()`** → Yes `reactive.wait()` (if observing previous result)
- **SSR operations** → No `reactive.wait()` (not reactive)
- **Initial CSR sync** → No `reactive.wait()` (synchronous via `.rv`)
