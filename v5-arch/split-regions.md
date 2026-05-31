# Managed Regions

**Status:** APPROVED  
**Created:** 2026-05-30

---

## 1. Problem Summary

Google Tag Manager, browser extensions, etc. need to be able to add content, untracked by MWI, to DOM nodes (notably for the `<head>` and `<body>`).

Typical MWI client-side rendering fully synchronizes node children, which would remove the unrecognized, externally-added children.

---

## 2. Proposed Solution

MWI custom `m.head` and `m.body` tags will generate "extended" head and body tags/nodes with one managed region and two protected regions.

As long as external code adds nodes to the top or bottom of the rendered nodes (within the protected regions), they will be isolated from MWI reactive updates.

```html
<head>
<!-- First protected region -->
<script type='x' data-mwi='begin'></script>
<!-- Managed region -->
<script type='x' data-mwi='end'></script>
<!-- Second protected region -->
<!-- "[m.slot name=m.ssrStatic]" content -->
<!-- "[m.slot name=m.csrStatic]" content -->
</head>
```

- `[(m.head m.csrStatic=[...] m.ssrStatic=[...] content...)]`
  - `m.csrStatic` is statically (non-reactively) CSR'd (appended into the second protected region)
  - `m.ssrStatic` is statically SSR'd (appended into the second protected region)
  - Normal content is rendered in the managed region (reactively, as usual, in the case of CSR)
- `[(m.body m.csrStatic=[...] m.ssrStatic=[...] content...)]` works similarly

While most external scripts typically add nodes at the beginning or end of the head or body nodes, some might append after `document.currentScript` instead. These added nodes would become part of the managed region for normal content, putting them at risk of being removed during a content update. The `m.csrStatic` and `m.ssrStatic` attributes allow doc-spec content to be statically rendered into the second protected region if necessary.

A new `domSyncManagedChildren` function will add managed-region markers if not yet present and subsequently only synchronizes children between the markers.

---

## 3. Component Design

### 3.1 Component Tags

Two new component tags are introduced:

- **`m.head`** — A managed `<head>` element
- **`m.body`** — A managed `<body>` element

Both share the same interface (`MWICoreHeadBody`) and differ only in the HTML tag they render.

### 3.2 Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `m.ssrStatic` | NANOS list | Content rendered statically during SSR into the second protected region (after the `end` boundary marker). Not rendered during CSR. |
| `m.csrStatic` | NANOS list | Content rendered statically during CSR into the second protected region (after the `end` boundary marker). Not rendered during SSR. |
| All other attributes | — | Passed through as HTML attributes on the rendered `<head>` or `<body>` element. |
| Normal children | — | Rendered into the managed region (between the `begin` and `end` boundary markers). |

### 3.3 Rendered Structure

#### SSR Output

```html
<head>
  <script type="x" data-mwi="begin"></script>
  <!-- managed content (normal children) -->
  <script type="x" data-mwi="end"></script>
  <!-- m.ssrStatic content (if any) -->
</head>
```

#### CSR DOM Structure

```
<head>
  [first protected region — external content may appear here]
  <script type="x" data-mwi="begin">  ← boundary marker
  [managed region — MWI-controlled children]
  <script type="x" data-mwi="end">    ← boundary marker
  [second protected region — m.ssrStatic content (if any, from prior SSR) + m.csrStatic content + external content]
</head>
```

### 3.4 Boundary Marker Design

The boundary markers are `<script type="x" data-mwi="begin|end">` elements. The `type="x"` attribute ensures browsers do not attempt to execute them as scripts. The `data-mwi` attribute is used to locate them during CSR.

Using `<script>` elements (rather than comments) for boundary markers has several advantages:
- They are proper DOM elements, not text nodes, so they are stable across browser normalization
- They are easily located via `parent.children` (element-only iteration, skipping text nodes)
- They survive `innerHTML` round-trips
- They are not confused with MWI comment nodes (`m.com`)

---

## 4. SSR Behavior

### 4.1 `getHTML` Implementation

The `m.head` / `m.body` `getHTML` handler:

1. Opens the HTML tag with attributes (e.g., `<head>` or `<body lang="en">`)
2. Emits the `begin` boundary marker: `<script type="x" data-mwi="begin"></script>`
3. Renders normal children (the managed region content) via the standard sub-doc HTML generation
4. Emits the `end` boundary marker: `<script type="x" data-mwi="end"></script>`
5. Renders `m.ssrStatic` content (if present) — these are rendered as a doc-spec list, not reactively
6. Closes the HTML tag (e.g., `</head>` or `</body>`)

`m.csrStatic` content is **not** rendered during SSR.

### 4.2 Example SSR Output

Given:
```slid
[(m.head
  m.ssrStatic=[h.script src="/gtm.js"]
  [h.title m.text="My Page"]
  [h.link rel=stylesheet href="/app.css"]
)]
```

SSR produces:
```html
<head>
<script type="x" data-mwi="begin"></script>
<title>My Page</title>
<link rel="stylesheet" href="/app.css">
<script type="x" data-mwi="end"></script>
<script src="/gtm.js"></script>
</head>
```

---

## 5. CSR Behavior

### 5.1 `getDOM` Implementation

The `m.head` / `m.body` `getDOM` handler:

1. Locates (or creates) the actual `<head>` / `<body>` DOM element
2. Calls `domSyncManagedChildren` to synchronize the managed region
3. Appends `m.csrStatic` content (if present) after the `end` boundary marker, once, non-reactively
4. Returns a NANOS containing the `<head>` / `<body>` DOM element

The managed region is kept reactively synchronized with the normal children via `domSyncManagedChildren`.

### 5.2 Locating the DOM Element

Unlike most MWI components, `m.head` and `m.body` do not *create* their DOM element — they *adopt* the existing `document.head` and `document.body` elements respectively. This is because there can only be one `<head>` and one `<body>` in a document, and they are created by the browser's HTML parser.

```javascript
function getTargetElement (type) {
	if (type === 'm.head') return document.head;
	if (type === 'm.body') return document.body;
	return null;
}
```

### 5.3 Reactive Managed-Region Sync

The managed region is synchronized reactively using `domSyncManagedChildren` (see Section 6). The reactive setup follows the standard MWI pattern:

```javascript
getInstance('@reactive')('set', {
	eager: true, def: () => {
		const children = d.sm(d, 'redis'); // sub-DOM children
		domSyncManagedChildren(targetElement, children);
	}
})('rv');
```

### 5.4 Static CSR Content

`m.csrStatic` content is rendered once (non-reactively) and appended after the `end` boundary marker. It is not updated if the `m.csrStatic` attribute changes after initial render. This is intentional — "static" means "rendered once at CSR initialization time."

---

## 6. Implementation Notes

### 6.1 Region-Marker Locator

```javascript
function getManagedRegion (parent) {
	let begin = null, end = null;

	// Scan elements (not all nodes) for boundary markers
	for (const child of parent.children) {
		if (child.tagName !== 'SCRIPT') continue;
		switch (child.dataset.mwi) {
		case 'begin': begin = child; break;
		case 'end': end = child; break;
		}
		if (begin && end) break;
	}
	return { begin, end };
}
```

### 6.2 Synchronizing Managed Children

```javascript
function createDOMBoundary (type) {
	const script = document.createElement('script');
	script.type = 'x';
	script.dataset.mwi = type;
	return script;
}

function domSyncManagedChildren (parent, children) {
	let { begin, end } = getManagedRegion(parent);
	
	// Not ideal, but add managed-region boundary-markers if absent
	if (!begin) {
		begin = createDOMBoundary('begin');
		if (end) parent.insertBefore(begin, end);
		else parent.append(begin);
	}
	if (!end) {
		end = createDOMBoundary('end');
		parent.insertBefore(end, begin.nextSibling);
	}

	// Synchronize children within the managed region (only)
	let prev = begin, child = null;
	for (child of children.values()) {
		domAppendAfter(parent, child, prev);
		prev = child;
	}

	// Remove stale children from the managed region
	while ((child = prev.nextSibling) && child !== end) {
		parent.removeChild(child);
	}
}
```

### 6.3 Interface Registration

`m.head` and `m.body` are registered as components in the core component module (`mwi-core-comp.msjs`):

```javascript
'm.head': ls([INTERFACE, MANAGED_IF]),
'm.body': ls([INTERFACE, MANAGED_IF]),
```

The `MWICoreHeadBody` interface chains from `MWIHTML` (for attribute handling and the standard HTML rendering infrastructure) and overrides `getHTML` and `getDOM`.

### 6.4 Schema

`m.head` and `m.body` are **not** void elements (they have children). Their schema does not set `void: true`. The `m.ssrStatic` and `m.csrStatic` attributes are MWI-internal (dot-prefixed) and are not rendered as HTML attributes.

---

## 7. Interaction with Hydration

When SSR-to-CSR hydration is active (see [`v5-arch/ssr-csr-hydration.md`](ssr-csr-hydration.md)):

- The `m.head` / `m.body` CSR handler adopts the existing `document.head` / `document.body` DOM element rather than creating a new one. This is inherently "hydration-compatible" — no replacement is needed.
- The boundary markers emitted during SSR are found by `getManagedRegion` during CSR, so the managed region is correctly identified without needing to re-insert markers.
- `m.csrStatic` content is appended after the `end` marker during CSR initialization, in the second protected region.

---

## 8. Interaction with Aggregate Content

The `m.head` component is the natural rendering point for aggregated `m.script` and `m.style` content (see [`v5-arch/aggregate-content.md`](aggregate-content.md)). Aggregated content rendered via `[m.script from=head]` or `[m.style from=head]` will appear in the managed region of `m.head`, just like any other child node.

This means aggregated scripts and styles are:
- **SSR:** Rendered between the `begin` and `end` boundary markers
- **CSR:** Reactively synchronized within the managed region

---

## 9. Edge Cases and Design Decisions

### 9.1 Missing Boundary Markers

If the CSR runtime encounters a `<head>` or `<body>` without boundary markers (e.g., a page not rendered by MWI SSR, or a page where the markers were stripped), `domSyncManagedChildren` will insert them. The insertion point is at the end of the element (after any existing children), so existing content becomes part of the first protected region.

### 9.2 Multiple `m.head` / `m.body` Nodes

Only one `<head>` and one `<body>` element can exist in a valid HTML document. If multiple `m.head` or `m.body` nodes are created in the doc tree, they will all attempt to adopt the same DOM element. This is a user error. The behavior is undefined and may result in conflicting reactive updates.

### 9.3 `m.ssrStatic` vs. `m.csrStatic`

These attributes exist to handle the case where external scripts (e.g., Google Tag Manager) inject content relative to `document.currentScript`. Such injected content would land inside the managed region if the injecting script is in the managed region, putting it at risk of being removed during a reactive update.

By placing the injecting script in `m.ssrStatic` (for SSR) or `m.csrStatic` (for CSR), the injected content lands in the second protected region, safely outside the managed region.

### 9.4 Attribute Rendering

Standard HTML attributes on `m.head` and `m.body` (e.g., `lang` on `<html>`, or `class` on `<body>`) are rendered normally. The `m.ssrStatic` and `m.csrStatic` attributes are filtered out of HTML attribute rendering (they are MWI-internal, dot-prefixed attributes).

### 9.5 No `m.html` Component

The `<html>` element itself does not need a managed-region treatment because browser extensions and tag managers do not typically inject content directly into `<html>` (an `<html>` element is technically only permitted to contain one `<head>` element followed by one `<body>` element). The `m.head` and `m.body` components cover the two elements where external injection is common (and allowed).

---

## 10. Implementation Plan

### Phase 1: Core Infrastructure

1. Add `getManagedRegion`, `createDOMBoundary`, and `domSyncManagedChildren` helper functions to `mwi-doc-node.msjs` (alongside the existing `domAppendAfter` and `domSyncChildren` helpers). Expose them on `docNodeProto` for use by component implementations.

2. Implement the `MWICoreHeadBody` interface in `mwi-core-comp.msjs`:
   - `getHTML`: Emits boundary markers and renders managed + `m.ssrStatic` content
   - `getDOM`: Adopts `document.head` / `document.body`, sets up reactive managed sync, appends `m.csrStatic` content

3. Register `m.head` and `m.body` in `coreConfig` in `mwi-core-comp.msjs`.

### Phase 2: Tests

4. Add SSR tests for `m.head` and `m.body` in `test/ssr-html/`:
   - Boundary markers present in output
   - Normal children in managed region
   - `m.ssrStatic` content after `end` marker
   - `m.csrStatic` content absent from SSR output
   - HTML attributes rendered correctly

5. Add CSR/DOM tests for `m.head` and `m.body` in `test/csr-dom/`:
   - Boundary markers inserted if absent
   - Managed region synchronized reactively
   - `m.csrStatic` content appended after `end` marker
   - External content in protected regions preserved across reactive updates

---

## 11. Related Documents

- [`v5-arch/ssr-csr-hydration.md`](ssr-csr-hydration.md) — SSR-to-CSR hydration strategy
- [`v5-arch/aggregate-content.md`](aggregate-content.md) — Aggregate content (m.script, m.style)
- [`v5-arch/reactive-dom.md`](reactive-dom.md) — Reactive DOM system
- [`src/mwi-doc-node.msjs`](../src/mwi-doc-node.msjs) — `domAppendAfter`, `domSyncChildren`
- [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs) — HTML component implementations

[supplemental keywords: head management, body management, external scripts, Google Tag Manager, browser extensions, protected region, boundary markers, domSyncManagedChildren, m.head, m.body, m.ssrStatic, m.csrStatic, managed region, script injection, tag manager, third-party scripts]
