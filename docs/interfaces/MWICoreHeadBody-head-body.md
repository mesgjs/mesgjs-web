# MWICoreHeadBody - Head and Body Components

**Interface:** `MWICoreHeadBody`  
**Component Types:** `m.head`, `m.body`  
**Attributes:** Container (with managed-region boundary markers)  
**Source:** [`src/mwi-core-comp.msjs`](../src/mwi-core-comp.msjs) (lines 170-268)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

`m.head` and `m.body` are managed-region components that render the HTML `<head>` and `<body>` elements respectively. Unlike the standard HTML components `h.head` and `h.body`, they use boundary markers to create a *managed region* for MWI-controlled children and *protected regions* on either side where externally-injected content (e.g., from Google Tag Manager or browser extensions) is safe from being removed by MWI reactive updates.

The managed region is delimited by `<script type="x" data-mwi="begin">` and `<script type="x" data-mwi="end">` elements. MWI only synchronizes children within this region, leaving content in the protected regions untouched.

## Behavior

- **Managed Region:** Normal children are rendered between `begin` and `end` boundary markers; reactively synchronized during CSR
- **Protected Regions:** Content before `begin` and after `end` is never touched by MWI reactive updates
- **SSR Static Content:** `m.ssrStatic` content is rendered after the `end` marker during SSR only
- **CSR Static Content:** `m.csrStatic` content is appended after the `end` marker during CSR initialization only (non-reactively)
- **DOM Adoption:** During CSR, `m.head` and `m.body` adopt the existing `document.head` / `document.body` elements rather than creating new ones
- **Attribute Filtering:** `m.ssrStatic` and `m.csrStatic` are MWI-internal (dot-prefixed) and are never rendered as HTML attributes

## Attributes

**`m.ssrStatic`** (NANOS list)
- Content rendered statically during SSR into the second protected region (after the `end` boundary marker)
- Not rendered during CSR
- Useful for scripts that inject content relative to `document.currentScript` (e.g., Google Tag Manager)

**`m.csrStatic`** (NANOS list)
- Content rendered once (non-reactively) during CSR initialization into the second protected region (after the `end` boundary marker)
- Not rendered during SSR
- Rendered once at CSR initialization time; not updated if the attribute changes later

**Standard HTML attributes**
- All standard HTML attributes (e.g., `lang`, `class`, `id`) are rendered on the `<head>` or `<body>` element as usual

**Normal children**
- Rendered into the managed region (between the `begin` and `end` boundary markers)
- Reactively synchronized during CSR

## Rendered Structure

### SSR Output

```html
<head>
  <script type="x" data-mwi="begin"></script>
  <!-- managed content (normal children) -->
  <script type="x" data-mwi="end"></script>
  <!-- m.ssrStatic content (if any) -->
</head>
```

### CSR DOM Structure

```
<head>
  [first protected region — external content may appear here]
  <script type="x" data-mwi="begin">  ← boundary marker
  [managed region — MWI-controlled children, reactively synchronized]
  <script type="x" data-mwi="end">    ← boundary marker
  [second protected region — m.ssrStatic (from prior SSR) + m.csrStatic + external content]
</head>
```

## Operations

### Inherited from MWIHTML / MWIDocNode

See [`MWIHTML`](MWIHTML-HTML-elements.md) and [`MWIDocNode`](MWIDocNode-document-node.md) for inherited operations.

### Head/Body-Specific

**`(getHTML)` / `getHTML()`**
- Returns the full HTML for the `<head>` or `<body>` element
- Emits the `begin` boundary marker, managed children, `end` boundary marker, and `m.ssrStatic` content (if any)
- `m.csrStatic` content is **not** included in SSR output

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- Returns a NANOS containing the existing `document.head` or `document.body` element
- Inserts boundary markers if not already present
- Sets up reactive synchronization of managed children
- Appends `m.csrStatic` content (if any) after the `end` marker, once, non-reactively

## Boundary Marker Design

The boundary markers are `<script type="x" data-mwi="begin|end">` elements:
- `type="x"` prevents browsers from executing them as scripts
- `data-mwi` attribute is used to locate them during CSR
- Using `<script>` elements (rather than comments) makes them stable DOM elements that survive `innerHTML` round-trips and are not confused with MWI comment nodes (`m.com`)

## Usage Examples

### Basic m.head

```javascript
const doc = getInstance('MWIDocument');
const head = doc.createNode('m.head');

const title = doc.createNode('h.title');
title.setAttr('m.text', 'My Page');

const link = doc.createNode('h.link');
link.setAttr('rel', 'stylesheet');
link.setAttr('href', '/app.css');

head.append(title, link);

// SSR output:
// <head>
// <script type="x" data-mwi="begin"></script>
// <title>My Page</title>
// <link rel="stylesheet" href="/app.css">
// <script type="x" data-mwi="end"></script>
// </head>
```

### With m.ssrStatic (Google Tag Manager)

```javascript
const head = doc.createNode('m.head');

// Normal managed content
const title = doc.createNode('h.title');
title.setAttr('m.text', 'My Page');
head.append(title);

// GTM script injected into second protected region during SSR
head.setAttr('m.ssrStatic', ps('[( [h.script src="/gtm.js"] )]'));

// SSR output:
// <head>
// <script type="x" data-mwi="begin"></script>
// <title>My Page</title>
// <script type="x" data-mwi="end"></script>
// <script src="/gtm.js"></script>
// </head>
```

### With m.csrStatic (CSR-only analytics)

```javascript
const head = doc.createNode('m.head');
head.setAttr('m.csrStatic', ps('[( [h.script src="/analytics.js"] )]'));

// SSR output: no analytics script
// CSR: analytics script appended after end marker, once, non-reactively
```

### m.body with class attribute

```javascript
const body = doc.createNode('m.body');
body.setAttr('class', 'dark-theme');

const main = doc.createNode('h.main');
body.append(main);

// SSR output:
// <body class="dark-theme">
// <script type="x" data-mwi="begin"></script>
// <main></main>
// <script type="x" data-mwi="end"></script>
// </body>
```

### From SLID spec

```slid
[([m.head
  m.ssrStatic=[[h.script src="/gtm.js"]]
  [h.title m.text="My Page"]
  [h.link rel=stylesheet href="/app.css"]
])]
```

## Interaction with Hydration

When SSR-to-CSR hydration is active:
- `m.head` / `m.body` adopt the existing `document.head` / `document.body` elements (no replacement needed)
- Boundary markers emitted during SSR are found by `getManagedRegion` during CSR, so the managed region is correctly identified without re-inserting markers
- `m.csrStatic` content is appended after the `end` marker during CSR initialization

## Edge Cases

### Missing Boundary Markers

If the CSR runtime encounters a `<head>` or `<body>` without boundary markers (e.g., a page not rendered by MWI SSR), `domSyncManagedChildren` will insert them at the end of the element. Existing content becomes part of the first protected region.

### Multiple m.head / m.body Nodes

Only one `<head>` and one `<body>` element can exist in a valid HTML document. If multiple `m.head` or `m.body` nodes are created, they will all attempt to adopt the same DOM element. This is a user error; the behavior is undefined.

## Related Interfaces

- [`MWIHTML`](MWIHTML-HTML-elements.md) - Base HTML interface (parent)
- [`MWIDocNode`](MWIDocNode-document-node.md) - Base node interface
- [`MWIHTMLScript`](MWIHTMLScript-script-style.md) - Script/style elements (used in m.ssrStatic / m.csrStatic)

[supplemental keywords: head management, body management, external scripts, Google Tag Manager, browser extensions, protected region, boundary markers, domSyncManagedChildren, m.head, m.body, m.ssrStatic, m.csrStatic, managed region, script injection, tag manager, third-party scripts, hydration]
