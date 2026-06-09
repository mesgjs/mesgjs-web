# MWIHTML - HTML Elements

**Interface:** `MWIHTML`  
**Component Types:** `h.div`, `h.span`, `h.button`, etc. (all standard HTML elements)  
**Attributes:** *(Varies)*
**Source:** [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs) (lines 154-200)  
**Extends:** [`MWIDocNode`](MWIDocNode-document-node.md)  
**Status:** ACTIVE

## Overview

`MWIHTML` is the base interface for all standard HTML element components. It handles rendering of HTML tags with attributes and children, supporting both void and container elements.

## Behavior

- **Pass-through:** Slot source passed to children unmodified
- **Container Elements:** Accept children and modifications
- **Void Elements:** No children allowed (e.g., `h.br`, `h.img`, `h.input`)
- **Reactive Attributes:** Attributes sync to DOM reactively
- **Reactive Children:** Children sync to DOM reactively

## Void Elements

The following elements are void (no children):
- `h.area`, `h.base`, `h.br`, `h.col`, `h.embed`, `h.hr`, `h.img`, `h.input`, `h.link`, `h.meta`, `h.source`, `h.track`, `h.wbr`

## Operations

### Inherited from MWIDocNode

See [`MWIDocNode`](MWIDocNode-document-node.md) for:
- `(getAttr name)` / `getAttr(name)`
- `(setAttr name value)` / `setAttr(name, value)`
- `(hasAttr name)` / `hasAttr(name)`
- `(setSpec spec)` / `setSpec(spec)`
- `(setSubSpec ...)` / `setSubSpec(...)`
- `(append node...)` / `append(...nodes)`
- `(getSpec)` / `getSpec()`
- `(getSubSpec)` / `getSubSpec()`
- `(hasChildren)` / `hasChildren()`
- `(type)` / `.type`
- `(root)` / `.root`

### HTML-Specific

**`(subSlotSrc)` / `subSlotSrc()`**
- Returns `slotSrc` (pass-through, not self)
- HTML elements don't become slot sources

**`(getHTML)` / `getHTML()`**
- Returns HTML string for element
- Format: `<tag attrs>children</tag>` (container)
- Format: `<tag attrs>` (void)

**`(getDOM sync=domSync?)` / `getDOM({ sync? })`**
- Returns NANOS with single DOM element
- Attributes sync reactively
- Children sync reactively (container elements only)

## Registered Components

All standard HTML5 elements are registered with `h.` prefix:

**Structure:** `h.div`, `h.span`, `h.section`, `h.article`, `h.aside`, `h.header`, `h.footer`, `h.nav`, `h.main`

**Text:** `h.p`, `h.h1`-`h.h6`, `h.blockquote`, `h.pre`, `h.code`, `h.em`, `h.strong`, `h.small`, `h.mark`, `h.del`, `h.ins`, `h.sub`, `h.sup`

**Lists:** `h.ul`, `h.ol`, `h.li`, `h.dl`, `h.dt`, `h.dd`

**Tables:** `h.table`, `h.thead`, `h.tbody`, `h.tfoot`, `h.tr`, `h.th`, `h.td`, `h.caption`, `h.colgroup`, `h.col`

**Forms:** `h.form`, `h.input`, `h.button`, `h.select`, `h.option`, `h.optgroup`, `h.textarea`, `h.label`, `h.fieldset`, `h.legend`

**Media:** `h.img`, `h.audio`, `h.video`, `h.source`, `h.track`, `h.picture`

**Embedded:** `h.iframe`, `h.embed`, `h.object`, `h.canvas`

**Interactive:** `h.details`, `h.summary`, `h.dialog`, `h.menu`

**Metadata:** `h.html`, `h.head`, `h.body`, `h.link`, `h.meta`, `h.base`

> **Note on `h.head` and `h.body`:** For browser-bound use, prefer [`m.head` and `m.body`](MWICoreHeadBody-head-body.md) over `h.head` and `h.body`. The `m.*` variants use managed-region boundary markers to protect externally-injected content (e.g., from Google Tag Manager or browser extensions) from being removed by MWI reactive updates. `h.head` and `h.body` are appropriate only for contexts where client-side rendering is not used.

**Other:** `h.a`, `h.abbr`, `h.address`, `h.b`, `h.bdi`, `h.bdo`, `h.br`, `h.cite`, `h.data`, `h.datalist`, `h.dfn`, `h.figure`, `h.figcaption`, `h.hr`, `h.i`, `h.kbd`, `h.map`, `h.meter`, `h.noscript`, `h.output`, `h.progress`, `h.q`, `h.rp`, `h.rt`, `h.ruby`, `h.s`, `h.samp`, `h.search`, `h.slot`, `h.template`, `h.time`, `h.u`, `h.var`, `h.wbr`

## Usage Examples

### Basic Element

```javascript
const doc = getInstance('MWIDocument');
const div = doc.createNode('h.div');
div.setAttr('class', 'container');
div.setAttr('id', 'main');

// SSR: <div class="container" id="main"></div>
// CSR: <div class="container" id="main"></div>
```

### With Children

```javascript
const div = doc.createNode('h.div');
const span = doc.createNode('h.span');
span.setAttr('t', 'Hello');

div.append(span);

// SSR: <div><span>Hello</span></div>
// CSR: <div><span>Hello</span></div>
```

### Void Element

```javascript
const img = doc.createNode('h.img');
img.setAttr('src', '/image.jpg');
img.setAttr('alt', 'Description');

// SSR: <img src="/image.jpg" alt="Description">
// CSR: <img src="/image.jpg" alt="Description">
```

### From Spec

```javascript
const div = doc.from({ 
    item: ps('[(h.div class=box [h.span "Content"])]')
});

// Creates h.div with h.span child
```

### Reactive Attributes

```javascript
const div = doc.createNode('h.div');
div.setAttr('class', 'initial');

const domNodes = div.getDOM();
const element = domNodes.at(0);
// <div class="initial"></div>

div.setAttr('class', 'updated');
// DOM automatically updates to class="updated"
```

### Reactive Children

```javascript
const div = doc.createNode('h.div');
div.setSubSpec(ps('[([h.span "First"])]'));

const domNodes = div.getDOM();
// <div><span>First</span></div>

div.setSubSpec(ps('[([h.span "Second"])]'));
// DOM automatically updates to <div><span>Second</span></div>
```

### Complex Structure

```javascript
const doc = getInstance('MWIDocument');

const page = doc.from({ list: ps(`[(
    [h.div class=page
        [h.header
            [h.h1 "Page Title"]
            [h.nav
                [h.a href=/ "Home"]
                [h.a href=/about "About"]
            ]
        ]
        [h.main
            [h.article
                [h.h2 "Article Title"]
                [h.p "Article content..."]
            ]
        ]
        [h.footer
            [h.p "© 2025"]
        ]
    ]
)]`)});

doc.append(...page);
const html = doc.getHTML();
```

## Special HTML Elements

Some HTML elements have specialized interfaces:
- [`h.doctype`](MWIHTMLDocType-doctype.md) - `MWIHTMLDocType`
- [`h.script`, `h.style`](MWIHTMLScript-script-style.md) - `MWIHTMLScript`
- [`h.title`](MWIHTMLTitle-title.md) - `MWIHTMLTitle`
- [`m.head`, `m.body`](MWICoreHeadBody-head-body.md) - `MWICoreHeadBody` (preferred over `h.head`/`h.body` for browser-bound use)

## Related Interfaces

- [`MWIDocNode`](MWIDocNode-document-node.md) - Base interface
- [`MWIHTMLDocType`](MWIHTMLDocType-doctype.md) - Doctype element
- [`MWIHTMLScript`](MWIHTMLScript-script-style.md) - Script and style elements
- [`MWIHTMLTitle`](MWIHTMLTitle-title.md) - Title element
- [`MWICoreHeadBody`](MWICoreHeadBody-head-body.md) - Head and body elements with protected regions
