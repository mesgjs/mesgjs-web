# MWIAggrScript - Script/Style Aggregation

**Interface:** `MWIAggrScript`  
**Component Types:** `m.script`, `m.style`  
**Source:** [`src/mwi-aggr-comp.msjs`](../../src/mwi-aggr-comp.msjs)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

`MWIAggrScript` implements **smart script and stylesheet aggregation** with automatic deduplication. This interface handles both `m.script` and `m.style` components, similar to how [`MWIHTMLScript`](MWIHTMLScript-script-style.md) handles `h.script`, `h.style`, and `h.title`.

Key features:
- **Automatic deduplication:** Scripts/stylesheets with the same `src`/`href` URL or `m.text` content are deduplicated across the document
- **`to`/`from` aggregation pattern:** Collect scripts from components and render them in `<head>` or other locations
- **Content escaping:** Inline content automatically escapes problematic closing tags (`</script>` and `</style>`)
- **CSR/SSR parity:** Works seamlessly in both server-side and client-side rendering

The components operate in two modes:
- **`to` mode** (`[m.script to=bufferName? src=URL]` or `[m.script to=bufferName? m.text=code]`): Aggregates the script/stylesheet to the specified buffer
- **`from` mode** (`[m.script from=bufferName]`): Renders the aggregated scripts from the specified buffer

The **default buffer name** is `head` (unlike `m.aggr` which defaults to `default`). A `from` attribute is required to render; without it, the node is in `to` mode.

## Component Types

### `m.script` - Smart Script Aggregation

Aggregation-aware variant of `h.script`:
- **External scripts:** `[m.script to=bufferName? src=URL otherProps...]` — Deduplicated by URL
- **Inline scripts:** `[m.script to=bufferName? m.text=content otherProps...]` — Deduplicated by content
- **Rendering:** `[m.script from=bufferName]` — Renders aggregated scripts

### `m.style` - Smart Stylesheet Aggregation

Aggregation-aware variant of `h.style` and `h.link`:
- **External stylesheets:** `[m.style to=bufferName? href=URL otherProps...]` — Renders as `<link rel="stylesheet">`, deduplicated by URL
- **Inline styles:** `[m.style to=bufferName? m.text=content otherProps...]` — Renders as `<style>`, deduplicated by content
- **Rendering:** `[m.style from=bufferName]` — Renders aggregated stylesheets

## Behavior

### SSR Behavior

- **`to` mode:** 
  - Renders the script/style tag to HTML
  - Stores the rendered tag in the document's aggregation map with the deduplication key (`src`/`href` URL or `m.text` content)
  - If a duplicate key already exists in the buffer, skips rendering (deduplication)
  - Invalid nodes (no `src`/`href` or `m.text`) are silently skipped
  - Auto-assigns `m.id` for DOM sync support
  - Returns empty string
- **`from` mode:** Renders a placeholder `<{bufferId}>` for later substitution by `MWIDocument.getHTML()`
- **`m.csr` attribute:** If set to a truthy value, suppresses all SSR output

### CSR Behavior

- **`to` mode:** Registers this node with the reactive buffer on `getDOM()` call. Returns an empty reactive NANOS (the `to` node itself renders nothing).
- **`from` mode:** Reactively renders the buffer's current content in node-path order with real-time deduplication. Returns a reactive NANOS that updates as the buffer changes.
- **CSR-only fallback:** In `from` mode, if the buffer is empty, the node falls back to rendering its own sub-doc (SSR does not support conditional aggregate rendering).
- **Actual content rendering:** Uses custom `getSubDOM()` handler to render the appropriate tag (`<script>`, `<style>`, or `<link>`) with proper attributes and content.

### Deduplication

**Uniqueness is based on:**
- **External scripts/styles:** The `src` or `href` URL
- **Inline scripts/styles:** The `m.text` content

**Deduplication timing:**
- **SSR:** During aggregation (duplicate tags are not added to the buffer)
- **CSR:** During rendering (duplicate nodes are filtered out before DOM creation)

The first occurrence in tree-traversal order wins. Subsequent duplicates are silently skipped.

### Content Escaping

To prevent premature tag closing in inline content:

- **`m.script`:** Escapes `</script>` as `\x3c/script>` (JavaScript string syntax)
- **`m.style`:** Escapes `</style>` as `\3c /style>` (CSS string syntax)

### `autoDoc: false`

Both `m.script` and `m.style` use `autoDoc: false`, meaning children are stored in the sub-spec but are **not** auto-rendered. Rendering is controlled by the `getHTML`/`getDOM`/`getSubDOM` handlers.

### `subSlotSrc` (pass-through)

Both components are non-source nodes: `subSlotSrc` returns the parent's `slotSrc`, making them transparent to the slotting hierarchy.

## Schema

```javascript
{
  autoDoc: false  // Children not auto-rendered; rendering is controlled by handlers
}
```

## Attributes

**`from`** (string, optional)
- Puts the node in `from` mode: renders content from the named buffer
- If absent, the node is in `to` mode

**`to`** (string, optional)
- In `to` mode: specifies the named buffer to aggregate content into
- If absent in `to` mode, uses the default buffer (`head`)

**`src`** (string, optional - `m.script` only)
- URL of an external script file
- Used as the deduplication key for external scripts
- Results in `<script src="..."></script>` tag

**`href`** (string, optional - `m.style` only)
- URL of an external stylesheet file
- Used as the deduplication key for external stylesheets
- Results in `<link rel="stylesheet" href="...">` tag

**`m.text`** (string, optional)
- Inline script or stylesheet content
- Used as the deduplication key for inline content
- Results in `<script>...</script>` or `<style>...</style>` tag
- Content is automatically escaped to prevent premature tag closing

**`m.csr`** (boolean, optional)
- If truthy, suppresses all SSR output
- Useful for scripts/styles that should only load in CSR

**Other HTML attributes** (optional)
- Standard HTML attributes (`type`, `async`, `defer`, `media`, etc.) can be set and will be rendered in the HTML output via `getAttrHTML()`

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for basic node operations (attribute management, etc.).

### Script/Style-Specific

**`(getHTML)` / `getHTML()`**
- **`to` mode:** Renders script/style tag to HTML, stores in aggregation map (if not duplicate), returns `''`
- **`from` mode:** Returns `<{bufferId}>` placeholder string
- **`m.csr` set:** Returns `''` regardless of mode
- **Invalid node:** Returns `''` (no URL or m.text)

**`(getDOM)` / `getDOM()`**
- **`to` mode:** Registers this node in the reactive buffer, returns empty reactive NANOS
- **`from` mode:** Returns reactive NANOS of DOM nodes from all registered `to` nodes (sorted by node path, deduplicated)
- **`from` mode (empty buffer):** Falls back to rendering own sub-doc (CSR-only fallback)
- Result is cached: subsequent calls return the same NANOS instance

**`(getSubDOM)` / `getSubDOM()`**
- Custom handler for rendering the actual script/style/link DOM element
- Determines correct tag based on component type and presence of `href`:
  - `m.script` → `<script>`
  - `m.style` with `href` → `<link rel="stylesheet">`
  - `m.style` without `href` → `<style>`
- Sets attributes via `setDOMAttrs`
- For inline content (no `href`/`src`), reactively updates `textContent` from `m.text` attribute
- Result is cached: subsequent calls return the same NANOS instance

## MWIDocument Integration

`MWIAggrScript` works in conjunction with `MWIDocument` for SSR placeholder replacement:

**`(getAggr)` / `getAggr()`**
- Returns the document's aggregation `Map<bufferKey, bufferData>`
- Buffer key format: `<namespace>:<bufferName>`
  - `m.script` namespace: `m.script` (e.g., `m.script:head`)
  - `m.style` namespace: `m.style` (e.g., `m.style:head`)
- SSR buffer values are `Map<dedupeKey, renderedHTML>` (deduplicating by URL or content)
- CSR buffer values are reactive NANOS lists of doc-tree nodes

**`(mapAggrBuffer name)` / `mapAggrBuffer(name)`**
- Maps a buffer key string to a numeric buffer ID
- Used by `from` mode to generate placeholders

**`(getHTML)` / `getHTML()`** (document-level)
- After rendering, replaces `<{bufferId}>` placeholders with aggregated content
- Processes placeholders recursively
- Skips placeholders inside HTML comments, `<script>`, and `<style>` tags

## Usage Examples

### Basic Script Aggregation

```javascript
const doc = getInstance('MWIDocument');

// `from` node: renders aggregated scripts here (typically in <head>)
const scriptsFrom = doc.createNode('m.script');
scriptsFrom.setAttr('from', 'head');

// `to` nodes: contribute scripts to the buffer
const script1 = doc.createNode('m.script');
script1.setAttr('src', '/lib/jquery.js');

const script2 = doc.createNode('m.script');
script2.setAttr('src', '/app.js');

const script3 = doc.createNode('m.script');
script3.setAttr('src', '/lib/jquery.js'); // Duplicate - will be deduplicated

doc.append(scriptsFrom, script1, script2, script3);

const html = doc.getHTML();
// html includes:
// <script src="/lib/jquery.js"></script>
// <script src="/app.js"></script>
// (third script is deduplicated)
```

### Inline Script with Content Escaping

```javascript
const inlineScript = doc.createNode('m.script');
inlineScript.setAttr('m.text', 'var x = "</script>"; console.log(x);');

// SSR renders as:
// <script>var x = "\x3c/script>"; console.log(x);</script>
// (closing tag in content is escaped)
```

### Stylesheet Aggregation

```javascript
// External stylesheet
const externalStyle = doc.createNode('m.style');
externalStyle.setAttr('href', '/theme.css');
externalStyle.setAttr('media', 'screen');

// Renders as: <link rel="stylesheet" href="/theme.css" media="screen">

// Inline stylesheet
const inlineStyle = doc.createNode('m.style');
inlineStyle.setAttr('m.text', 'body { margin: 0; }');

// Renders as: <style>body { margin: 0; }</style>
```

### Named Buffers

```javascript
// Aggregate footer scripts separately
const footerScript = doc.createNode('m.script');
footerScript.setAttr('to', 'footer');
footerScript.setAttr('src', '/analytics.js');

const footerScriptsFrom = doc.createNode('m.script');
footerScriptsFrom.setAttr('from', 'footer');

// Scripts in 'head' buffer and 'footer' buffer are kept separate
```

### Component-Level Script Injection

```javascript
// Each component can inject its required scripts
const myComponent = doc.createNode('m.frag');
myComponent.setSubSpec({ subSpec: ps(`[(
  [m.script src=/components/my-component.js]
  [h.div class=my-component
    Component content here
  ]
)]`) });

// The script is automatically aggregated to the head buffer
// and deduplicated if multiple instances of the component exist
```

### SLID Syntax

```
[m.script from=head]                          // from mode: render head scripts
[m.script src=/app.js]                        // to mode: external script (default head buffer)
[m.script to=footer src=/analytics.js]        // to mode: external script (named buffer)
[m.script m.text="console.log('hello');"]     // to mode: inline script

[m.style from=head]                           // from mode: render head styles
[m.style href=/theme.css]                     // to mode: external stylesheet
[m.style m.text="body { margin: 0; }"]        // to mode: inline style
```

## Ordering and Deduplication

**Ordering:**
- In CSR, content from multiple `to` nodes is sorted by **node path** (tree-traversal order) before deduplication and rendering
- This ensures consistent ordering regardless of when nodes are registered

**Deduplication:**
- The first occurrence (in tree-traversal order) of a given URL or content wins
- Subsequent duplicates are silently filtered out
- In CSR, deduplication happens reactively as nodes are added/removed from the buffer

## Comparison with h.script and h.style

| Feature | `h.script` / `h.style` | `m.script` / `m.style` |
|---------|------------------------|------------------------|
| **Positioning** | Renders at tree position | Aggregates to buffer, renders at `from` node |
| **Deduplication** | No | Yes (automatic) |
| **Multiple Buffers** | N/A | Yes (`head`, `footer`, etc.) |
| **Content Escaping** | Yes | Yes |
| **Use Case** | Fixed scripts/styles | Dynamic component scripts/styles |

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIAggr`](MWIAggr-aggregate-content.md) - General content aggregation (no deduplication)
- [`MWIHTMLScript`](MWIHTMLScript-script-style.md) - Low-level `h.script` / `h.style` / `h.title` interface
- [`MWIDocument`](MWIDocument-document.md) - Provides `getAggr()`, `mapAggrBuffer()`, and placeholder-replacing `getHTML()`
- [`v5-arch/aggregate-content-v2.md`](../../v5-arch/aggregate-content-v2.md) - Architectural plan

## Supplemental Keywords

[supplemental keywords: script injection, style injection, head management, deduplication, content aggregation, external scripts, inline scripts, external stylesheets, inline styles, component dependencies, dynamic loading, script hoisting, style hoisting]
