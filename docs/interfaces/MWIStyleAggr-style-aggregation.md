# MWIStyleAggr - CSS Style-Value Aggregation

**Interface:** `MWIStyleAggr`  
**Component Type:** `m.stag`  
**Source:** [`src/mwi-style-aggr-comp.msjs`](../../src/mwi-style-aggr-comp.msjs)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

`MWIStyleAggr` implements **CSS style-value aggregation** with automatic deduplication. It allows multiple discrete, distributed components across a document tree to incrementally register CSS attribute values (such as `container-name`, `counter-reset`, `anchor-name`, etc.) for shared selectors (e.g., `:root`, `#main`), assembling them into a single consolidated `<style>` element.

CSS does not natively support incremental declarative aggregation across distinct rules (for example, registering multiple `container-name` identifiers on `:root` from separate components). `MWIStyleAggr` bridges this gap with full SSR and reactive CSR parity.

Key features:
- **Collector Mode & Render Mode:** Collector nodes register selector-attribute-value tuples; a single bare render node specifies where the aggregated `<style>` element is placed.
- **Automatic Deduplication:** Component values are deduplicated per `(selector, attribute)` pair, preserving first-seen order.
- **Rule Grouping & Clean Formatting:** Multiple attributes for the same selector are grouped within a single CSS rule block. Rules are ordered by tree-traversal order of the first occurrence of each selector.
- **SSR Dynamic Placeholder Protocol:** Renders a placeholder `<{id}>` during SSR and integrates with `MWIDocument` dynamic callback substitution.
- **CSR Reactivity & DOM Sync Hydration:** Uses an internal managed `h.style` node, supporting seamless SSR-to-CSR hydration without DOM node replacement and real-time reactive stylesheet updates.
- **Closing Tag Sanitization:** Content automatically inherits closing tag escaping (`</style>` is escaped as `\3c /style>`).

## Component Modes & Syntax

The `m.stag` component operates in two distinct modes depending on positional arguments in its sub-spec:

### 1. Collector Mode

`[m.stag selector attribute value...]`

Registers one or more values for the given selector and CSS attribute.
- **Positional parameters:**
  - Positional 0: `selector` (e.g., `:root`, `#counter-list`, `body`)
  - Positional 1: `attribute` (e.g., `container-name`, `counter-reset`)
  - Positional 2+: `values` (e.g., `group1`, `'page 1' 'item 1'`)
- Collector nodes render as an empty string in SSR and return an empty NANOS in CSR.

### 2. Render Mode

`[m.stag]`

A bare `m.stag` node without positional arguments represents the render location of the aggregated `<style>` element (typically placed in `<head>`).
- Emits a placeholder `<{id}>` during SSR.
- Renders and reactively updates the aggregated `<style>` DOM element in CSR.

## Supported CSS Attributes & Separators

`MWIStyleAggr` supports the following CSS attributes and delimiter rules:

| CSS Attribute | Separator | Description / Example |
| :--- | :--- | :--- |
| `anchor-name` | `, ` (comma) | Comma-separated anchor names (e.g., `--anchor1, --anchor2`) |
| `anchor-scope` | `, ` (comma) | Comma-separated anchor scopes |
| `container-name` | ` ` (space) | Space-separated container query identifiers (e.g., `group1 group2`) |
| `container-type` | ` ` (space) | Space-separated container types (e.g., `inline-size`) |
| `counter-increment` | ` ` (space) | Space-separated counter increments (e.g., `page 1 item 2`) |
| `counter-reset` | ` ` (space) | Space-separated counter resets, supports `reverse(...)` (e.g., `page 1 reverse(item)`) |
| `counter-set` | ` ` (space) | Space-separated counter sets (e.g., `page 1`) |
| `timeline-scope` | `, ` (comma) | Comma-separated timeline names |
| `view-timeline-name` | `, ` (comma) | Comma-separated view timeline names |

### Unsupported Attributes
Attributes not in the supported list (including `scroll-timeline-name`) are explicitly unsupported. Attempting to aggregate an unsupported attribute name logs an error (`console.error`) and the node is ignored.

## Behavior

### SSR Behavior

- **Collector Mode:**
  - Records the selector, attribute, and values into the document's SSR aggregation state.
  - Ensures dynamic callback registration on `doc.getAggr()` under buffer key `m.stag`.
  - Returns `''` (empty string).
- **Render Mode:**
  - Maps an aggregation buffer ID via `doc.mapAggrBuffer('m.stag')`.
  - Emits the placeholder `<{bufferId}>`.
  - When `MWIDocument.getHTML()` processes placeholders, the registered callback formats all aggregated CSS rules, assigns the result to the managed `h.style` node's `m.text`, and returns the `<style>...</style>` HTML string.
- **`m.csr` Attribute:**
  - If `m.csr` is truthy on the render node, SSR output is suppressed (returns `''`).

### CSR Behavior

- **Collector Mode:**
  - On `getDOM()`, registers the collector node into the document's reactive collector list (`state.csrNodes`).
  - Returns an empty reactive `NANOS`.
- **Render Mode:**
  - Manages an internal `h.style` doc node.
  - Participates in two-phase CSR: during `doc.initialCSR`, defers CSS rule calculation while collector nodes finish registering.
  - Eagerly evaluates registered collector nodes, sorting them by `nodePath` to ensure deterministic tree-traversal order.
  - Deduplicates values per `(selector, attribute)` pair.
  - Updates the managed `h.style` node's `m.text` attribute with formatted CSS rules.
  - Returns the reactive DOM result of `h.style.getDOM({ sync })`.

### Deduplication and Ordering

1. **Deduplication:**
   - Duplicate identical values for the same `(selector, attribute)` pair are ignored.
   - The first occurrence in document tree order is preserved.
2. **Selector Ordering:**
   - CSS rule blocks are ordered based on tree-traversal order of the first collector node targeting each selector.
3. **Multiple Properties per Selector:**
   - All attributes registered for the same selector are combined into a single CSS rule block:
     ```css
     :root { container-name: group1 group2; counter-reset: page 1; }
     ```

## Schema

```javascript
{
  autoDoc: false  // Positional parameters parsed manually by getHTML / getDOM
}
```

## Attributes

**`m.csr`** (boolean, optional)
- If truthy on a render node, suppresses SSR output.

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for standard doc-node methods (`getAttr`, `setAttr`, `hasAttr`, `nodePath`, etc.).

### Style-Aggregation Specific

**`(getHTML in=buffer?)` / `getHTML({ in? })`**
- In collector mode: records rules into document state and returns `''`.
- In render mode: returns `<{bufferId}>` placeholder string (or `''` if `m.csr` is set).

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- In collector mode: registers node with reactive state and returns empty `NANOS`.
- In render mode: returns reactive `NANOS` containing `<style>` element, delegating to internal `h.style` node. Supports `sync` parameter for SSR-CSR hydration.

## Usage Examples

### Basic Container Query Setup

```javascript
const doc = getInstance('MWIDocument');

// Render node in document head
const renderNode = doc.createNode('m.stag');

// Component 1 registers a root container name
const comp1 = doc.createNode('m.stag');
comp1.setSubSpec({ subSpec: ps('[(:root container-name group1)]') });

// Component 2 registers another root container name
const comp2 = doc.createNode('m.stag');
comp2.setSubSpec({ subSpec: ps('[(:root container-name group2)]') });

doc.append(renderNode, comp1, comp2);

const html = doc.getHTML();
// <style>:root { container-name: group1 group2; }</style>
```

### Multiple Selectors and Counter Resets

```javascript
// Positional arguments in SLID:
// [m.stag '#main' counter-reset 'page 1' 'item 1']
// [m.stag '#main' counter-increment 'item 1']
// [m.stag :root container-name theme]

const comp1 = doc.createNode('m.stag');
comp1.setSubSpec({ subSpec: ps('[(#main counter-reset "page 1" "item 1")]') });

const comp2 = doc.createNode('m.stag');
comp2.setSubSpec({ subSpec: ps('[(#main counter-increment "item 1")]') });

const comp3 = doc.createNode('m.stag');
comp3.setSubSpec({ subSpec: ps('[(:root container-name theme)]') });
```

### SSR-CSR Hydration

```javascript
// Server:
const doc = getInstance('MWIDocument');
doc.append(renderNode, comp1, comp2);
const html = doc.getHTML();

// Client Hydration:
const clientDoc = getInstance('MWIDocument');
clientDoc.append(clientRenderNode, clientComp1, clientComp2);

const sync = getInstance('MWIDOMSync', [existingHeadElement.firstChild]);
const dom = clientDoc.getDOM({ sync });
// Existing <style> DOM element is reused without replacement
```

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIDocument`](MWIDocument-document.md) - Document coordinator with dynamic callback placeholder substitution
- [`MWIAggrScript`](MWIAggrScript-script-style.md) - Script and whole-stylesheet aggregation (`m.script`, `m.style`)
- [`MWICoreScpCSS`](MWICoreScpCSS-scoped-CSS.md) - Component-type scoped CSS aggregator (`m.scpcss`)
- [`MWIHTMLScript`](MWIHTMLScript-script-style.md) - Low-level `h.style` interface
- [`v5-arch/style-aggregation.md`](../../v5-arch/style-aggregation.md) - Architectural plan and specification
