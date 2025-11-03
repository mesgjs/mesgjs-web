# MWIHTMLScript - Script and Style Elements

**Interface:** `MWIHTMLScript`  
**Component Types:** `h.script`, `h.style`  
**Source:** [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs) (lines 224-274)  
**Extends:** [`MWIHTML`](MWIHTML-HTML-elements.md)  
**Status:** ACTIVE

## Overview

Handles `<script>` and `<style>` elements. Content is provided via the `m.text` attribute rather than as children, and is properly escaped to prevent premature closing tags.

## Behavior

- **No Children:** Cannot have children (content via `m.text` attribute)
- **Escaped Content:** Closing tags escaped to prevent premature termination
- **Reactive Content:** Content updates reactively in DOM

## Attributes

**`m.text`** (string)
- Script or style content
- Optional (defaults to empty string)
- Reactively updates in DOM

**Standard HTML attributes also supported:**
- `h.script`: `src`, `type`, `async`, `defer`, `crossorigin`, `integrity`, etc.
- `h.style`: `media`, `type`, etc.

## Operations

### Inherited from MWIHTML

See [`MWIHTML`](MWIHTML-HTML-elements.md) and [`MWIDocNode`](MWIDocNode-document-node.md) for inherited operations.

### Script/Style-Specific

**`(getHTML)` / `getHTML()`**
- Returns `<script>content</script>` or `<style>content</style>`
- Escapes embedded closing tags:
  - `h.script`: `</script>` → `\x3c/script>`
  - `h.style`: `</style>` → `\3c /style>`

**`(getDOM)` / `getDOM()`**
- Returns NANOS with single `<script>` or `<style>` element
- Sets `innerHTML` with content
- Content updates reactively

**`(getSubSpec)` / `getSubSpec()`**
- Always returns empty NANOS (no children)

**`(setSubSpec ...)` / `setSubSpec(...)`**
- No-op (ignores children)

## Content Escaping

### Script Escaping

Embedded `</script>` tags are escaped using JavaScript string syntax:
```javascript
// Input: alert('</script>')
// Output: alert('\x3c/script>')
```

### Style Escaping

Embedded `</style>` tags are escaped using CSS string syntax:
```javascript
// Input: content: '</style>'
// Output: content: '\3c /style>'
```

## Usage Examples

### Inline Script

```javascript
const doc = getInstance('MWIDocument');
const script = doc.createNode('h.script');
script.setAttr('m.text', `
    console.log('Hello, world!');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Ready');
    });
`);

// SSR: <script>console.log('Hello, world!');...</script>
// CSR: <script>console.log('Hello, world!');...</script>
```

### External Script

```javascript
const script = doc.createNode('h.script');
script.setAttr('src', '/app.js');
script.setAttr('defer', 'true');

// SSR: <script src="/app.js" defer="true"></script>
// CSR: <script src="/app.js" defer="true"></script>
```

### Inline Style

```javascript
const style = doc.createNode('h.style');
style.setAttr('m.text', `
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .button {
        padding: 10px 20px;
        background: blue;
    }
`);

// SSR: <style>.container { max-width: 1200px; ... }</style>
// CSR: <style>.container { max-width: 1200px; ... }</style>
```

### External Stylesheet (use h.link instead)

```javascript
// For external stylesheets, use h.link
const link = doc.createNode('h.link');
link.setAttr('rel', 'stylesheet');
link.setAttr('href', '/styles.css');

// SSR: <link rel="stylesheet" href="/styles.css">
// CSR: <link rel="stylesheet" href="/styles.css">
```

### Reactive Content Updates

```javascript
const script = doc.createNode('h.script');
script.setAttr('m.text', 'console.log("v1");');

const domNodes = script.getDOM();
// <script>console.log("v1");</script>

script.setAttr('m.text', 'console.log("v2");');
// DOM automatically updates to console.log("v2");
```

### Escaped Closing Tags

```javascript
const script = doc.createNode('h.script');
script.setAttr('m.text', `
    const html = '<script>alert("XSS")</script>';
    document.body.innerHTML = html;
`);

// Output escapes the embedded </script>:
// <script>
//     const html = '<script>alert("XSS")\x3c/script>';
//     document.body.innerHTML = html;
// </script>
```

### From Spec

```javascript
const script = doc.from({ 
    item: ps('[h.script m.text="console.log(\\"Hello\\");"]')
});

const style = doc.from({ 
    item: ps('[h.style m.text=".box { color: red; }"]')
});
```

### Module Script

```javascript
const script = doc.createNode('h.script');
script.setAttr('type', 'module');
script.setAttr('m.text', `
    import { init } from './app.js';
    init();
`);

// SSR: <script type="module">import { init } from './app.js';...</script>
```

## Related Interfaces

- [`MWIHTML`](MWIHTML-HTML-elements.md) - Base HTML interface
- [`MWIDocNode`](MWIDocNode-document-node.md) - Base node interface
- [`MWIHTMLTitle`](MWIHTMLTitle-title.md) - Similar pattern for title element
