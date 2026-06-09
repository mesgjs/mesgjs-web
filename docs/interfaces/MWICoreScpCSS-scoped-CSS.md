# MWICoreScpCSS - Scoped CSS Aggregator

**Interface:** `MWICoreScpCSS`  
**Component Type:** `m.scpcss`  
**Attributes:** Void  
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 172-241)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

Aggregates scoped CSS from all component types used in a document. Each component can register with a `scopedCSS` property containing CSS rules. The `@@` placeholder in the CSS is replaced with the component's unique ID, enabling component-scoped styling.

## Behavior

- **Void:** Cannot have children (`schema.void = true`)
- **Reactive:** Automatically updates when new component types are used
- **Deduplication:** CSS is generated once per component *type*, not per instance
- **Aggregation:** Collects CSS from all used component types in the document

## Component ID System

The scoped CSS system integrates with component IDs through:

1. **`@@` Placeholder Substitution:** In `scopedCSS` strings, `@@` is replaced with the component's unique ID (e.g., `_MO_0`)
2. **`m.ci` Virtual Attribute:** Read-only attribute providing access to the component ID
3. **`m.coat` Integration:** Dynamic attribute computation using `<m.ci>` to reference component IDs

### Component ID Format

Component IDs follow the pattern `_MO_<base36>` where the base36 portion is a unique identifier.

## Attributes

None. The `m.scpcss` component has no configurable attributes.

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for:
- `(getAttr name)` / `getAttr(name)`
- `(setAttr name value)` / `setAttr(name, value)`
- `(hasAttr name)` / `hasAttr(name)`
- `(type)` / `.type`
- `(root)` / `.root`

### Scoped CSS Specific

**`(getHTML)` / `getHTML()`**
- Returns `<style>...aggregated CSS...</style>` with all component CSS
- Returns empty string if no components with `scopedCSS` are used
- Escapes `</style>` sequences as `\3c /style>` to prevent premature tag closure
- CSS blocks are concatenated with newlines

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- Returns NANOS with single `<style>` element containing aggregated CSS
- Returns empty NANOS if no components with `scopedCSS` are used
- Style element content updates reactively when components are added
- Returns empty NANOS in non-browser environment

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (void element, ignores children)

## CSS Aggregation Process

1. Reads `typesUsed` from the document to determine which component types are present
2. For each used type, retrieves `scopedCSS` from the registry entry
3. Replaces all `@@` occurrences with the component's unique ID
4. Concatenates all CSS blocks with newlines
5. Renders as `<style>` element (SSR) or updates style element content (CSR)

## Usage Examples

### Basic Usage

```javascript
const doc = getInstance('MWIDocument');

// Register component with scoped CSS
registry.register('my.card', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
    'scopedCSS', '.@@ { border: 1px solid #ccc; padding: 1rem; }'
]));

// Create component instance
doc.createNode('my.card');

// Add scoped CSS aggregator (typically in document head)
const scpNode = doc.createNode('m.scpcss');
doc('append', scpNode);

// SSR: <style>._MO_0 { border: 1px solid #ccc; padding: 1rem; }</style>
// CSR: <style> element with same content, updates reactively
```

### Multiple Components

```javascript
// Register multiple components with scoped CSS
registry.register('my.button', ls([
    'tpl', ps('[( [h.button m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
    'scopedCSS', '.@@ { padding: 0.5rem 1rem; border-radius: 4px; }'
]));

registry.register('my.input', ls([
    'tpl', ps('[( [h.input m.coat=[m.percl="<m.ci>"]] )]'),
    'scopedCSS', '.@@ { border: 1px solid #ddd; padding: 0.5rem; }'
]));

// Use components
doc.createNode('my.button');
doc.createNode('my.input');

// Add scoped CSS aggregator
const scpNode = doc.createNode('m.scpcss');

// Output includes CSS for both components
// <style>
// ._MO_0 { padding: 0.5rem 1rem; border-radius: 4px; }
// ._MO_1 { border: 1px solid #ddd; padding: 0.5rem; }
// </style>
```

### Using m.ci with m.coat

The typical pattern uses `m.percl` (permanent classes) to ensure the component-scoped class is never accidentally removed:

```javascript
registry.register('my.component', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] "Content"] )]'),
    'scopedCSS', '.@@ { color: blue; }'
]));

const node = doc.createNode('my.component');
// The div will have class="_MO_0" (permanent, cannot be removed)
// CSS: ._MO_0 { color: blue; }
```

### Nested Selectors

```javascript
registry.register('my.card', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [h.div class="header" "Title"] [h.div class="body" "Content"]] )]'),
    'scopedCSS', `
        .@@ { border: 1px solid #ccc; }
        .@@ .header { font-weight: bold; }
        .@@ .body { padding: 1rem; }
    `
]));

// Output:
// ._MO_0 { border: 1px solid #ccc; }
// ._MO_0 .header { font-weight: bold; }
// ._MO_0 .body { padding: 1rem; }
```

### Pseudo-classes and Pseudo-elements

```javascript
registry.register('my.button', ls([
    'tpl', ps('[( [h.button m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
    'scopedCSS', `
        .@@ { background: #007bff; color: white; }
        .@@:hover { background: #0056b3; }
        .@@:active { background: #004085; }
        .@@::before { content: "→ "; }
    `
]));

// All @@ occurrences are replaced with the component ID
```

### Media Queries

```javascript
registry.register('my.responsive', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
    'scopedCSS', `
        .@@ { width: 100%; }
        @media (min-width: 768px) {
            .@@ { width: 50%; }
        }
    `
]));
```

### Keyframe Animations

```javascript
registry.register('my.animated', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
    'scopedCSS', `
        @keyframes slide-@@  {
            from { left: 0; }
            to { left: 100%; }
        }
        .@@ { animation: slide-@@ 1s; }
    `
]));

// Note: @@ in keyframe name creates unique animation per component
```

### Reactive Updates (CSR)

```javascript
const doc = getInstance('MWIDocument');
const scpNode = doc.createNode('m.scpcss');

// Initially empty
let dom = scpNode('getDOM');
// dom.size === 0

// Add component with scoped CSS
doc.createNode('my.card');
await globalThis.reactive.wait();

// Style element now exists with CSS
dom = scpNode('getDOM');
// dom.size === 1
// dom.at(0) is <style> element with card CSS
```

### Multiple m.scpcss Nodes

```javascript
const doc = getInstance('MWIDocument');

// Add m.scpcss in head
const headScpNode = doc.createNode('m.scpcss');
doc('append', headScpNode);

// Add m.scpcss in body (for some reason)
const bodyScpNode = doc.createNode('m.scpcss');
doc('append', bodyScpNode);

// Both will independently aggregate the same CSS
// This is expected behavior - each m.scpcss node is independent
```

## CSS Deduplication

The system automatically deduplicates CSS by component *type*, not by component *instance*:

```javascript
registry.register('my.card', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]'),
    'scopedCSS', '.@@ { border: 1px solid #ccc; }'
]));

// Create multiple instances
doc.createNode('my.card');
doc.createNode('my.card');
doc.createNode('my.card');

const scpNode = doc.createNode('m.scpcss');
const html = scpNode('getHTML');

// CSS appears only once, not three times
// All instances share the same component ID and CSS
```

## Edge Cases

### Empty Document

```javascript
const doc = getInstance('MWIDocument');
const scpNode = doc.createNode('m.scpcss');

const html = scpNode('getHTML');
// Returns empty string (no <style> tag)

const dom = scpNode('getDOM');
// Returns empty NANOS (no style element)
```

### Components Without scopedCSS

```javascript
registry.register('my.plain', ls([
    'tpl', ps('[( [h.div "No styles"] )]')
    // No scopedCSS property
]));

doc.createNode('my.plain');
const scpNode = doc.createNode('m.scpcss');

// m.scpcss renders nothing (component has no scoped CSS)
```

### CSS with Special Characters

```javascript
registry.register('my.special', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"]] )]'),
    'scopedCSS', '.@@ { content: "test\'s \\"quoted\\" & <text>"; }'
]));

// Special characters in CSS strings are preserved as-is
```

### CSS Containing </style>

```javascript
registry.register('my.tricky', ls([
    'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"]] )]'),
    'scopedCSS', '.@@ { content: "</style>"; }'
]));

const scpNode = doc.createNode('m.scpcss');
const html = scpNode('getHTML');

// Output: <style>._MO_0 { content: "\3c /style>"; }</style>
// The </style> in content is escaped to prevent premature tag closure
```

## Best Practices

### 1. Use m.percl for Component Classes

Always use `m.percl` (permanent classes) rather than `class` to ensure the component-scoped class cannot be accidentally removed:

```javascript
// Good: Uses m.percl
'tpl', ps('[( [h.div m.coat=[m.percl="<m.ci>"] [m.slot]] )]')

// Avoid: Uses class (can be overwritten)
'tpl', ps('[( [h.div m.coat=[class="<m.ci>"] [m.slot]] )]')
```

### 2. Place m.scpcss in Document Head

For optimal performance and proper CSS cascade, place `m.scpcss` early in the document:

```javascript
const doc = getInstance('MWIDocument');
const scpNode = doc.createNode('m.scpcss');
doc('append', scpNode); // Add to document root (head position)

// Then add body content with styled components
```

### 3. Scope All Selectors

Always prefix selectors with `@@` to ensure proper scoping:

```javascript
// Good: All selectors scoped
'scopedCSS', `
    .@@ { color: blue; }
    .@@ > .child { color: red; }
    .@@:hover { color: green; }
`

// Avoid: Unscoped selectors (will affect entire page)
'scopedCSS', `
    .@@ { color: blue; }
    .child { color: red; }  // Not scoped!
`
```

### 4. Use Descriptive Class Names

Even though classes are scoped, use descriptive names for maintainability:

```javascript
'scopedCSS', `
    .@@ { /* Component root */ }
    .@@ > .card-header { /* Header section */ }
    .@@ > .card-body { /* Body section */ }
    .@@ > .card-footer { /* Footer section */ }
`
```

### 5. Consider CSS Organization

For complex components, organize CSS logically:

```javascript
'scopedCSS', `
    /* Layout */
    .@@ { display: flex; flex-direction: column; }
    
    /* Typography */
    .@@ > .title { font-size: 1.5rem; font-weight: bold; }
    
    /* Colors */
    .@@ { background: #fff; color: #333; }
    
    /* States */
    .@@:hover { background: #f5f5f5; }
    .@@:active { background: #e5e5e5; }
    
    /* Responsive */
    @media (min-width: 768px) {
        .@@ { flex-direction: row; }
    }
`
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIRegistry`](MWIRegistry-registry.md) - Component registration with `scopedCSS`
- [`MWIDocument`](MWIDocument-document.md) - Document management and `typesUsed` tracking
- [`MWICoreTpl`](MWICoreTpl-template.md) - Template components that use scoped CSS
- [`MWIHTML`](MWIHTML-HTML-elements.md) - HTML elements with `m.coat` and `m.percl`

## Testing

Comprehensive test coverage is provided in:
- [`test/core/scoped-css.test.js`](../test/core/scoped-css.test.js) - Core interface tests
- [`test/ssr-html/scoped-css.test.js`](../test/ssr-html/scoped-css.test.js) - SSR HTML rendering tests
- [`test/ssr-html/compound-scoped.test.js`](../test/ssr-html/compound-scoped.test.js) - SSR compound integration tests
- [`test/csr-dom/scoped-css.test.js`](../test/csr-dom/scoped-css.test.js) - CSR DOM rendering tests
- [`test/csr-dom/compound-scoped.test.js`](../test/csr-dom/compound-scoped.test.js) - CSR compound integration tests

See [`v5-arch/scoped-css-tests.md`](../v5-arch/scoped-css-tests.md) for complete test plan documentation.
