# Sample Rendering Walkthrough \[OUT-OF-DATE\]

NOTE: THIS DOCUMENT IS NO LONGER CURRENT

This document provides a step-by-step walkthrough of the server-side rendering process, from the initial page data to the final HTML output. It illustrates how the declarative payload system, component macros, and resource aggregation work together.

## 1. Initial Page Data

The process begins with a user-provided Mesgjs data structure that defines the page.

```mesgjs
// page.msjs
[
    [Page title="My App"
        [UserProfile userId=123]
    ]
]
```

## 2. Component Handlers

The `MWISSRFactory` provides handlers for each component type.

### Semantic Components (Macros)

These handlers return a `content` payload, transforming themselves into more primitive structures.

**`Page` Handler:**
```javascript
// PageHandler(props, children)
return {
    content: [
        'h.html', [
            ['h.head', [
                ['h.title', props.title]
            ]],
            ['h.body', ...children]
        ]
    ],
    resources: { styles: ['/css/main.css'] }
}
```

**`UserProfile` Handler:**
```javascript
// UserProfileHandler(props, children)
const userName = "Alice"; // Data could be fetched here
return {
    content: [
        'h.div', {class: 'profile'},
            `Welcome, ${userName}!`
    ],
    resources: { styles: ['/css/profile.css'] }
}
```

### Primitive Components (Engines)

These `h.*` handlers are the only ones that return an `html` payload. They are responsible for the final render to a string.

**`h.div` Handler (Conceptual):**
```javascript
// h.div_Handler(props, children, renderNode)
const renderedChildren = children.map(c => renderNode(c)).join('');
const attrs = buildAttributeString(props);
return {
    html: `<div${attrs}>${renderedChildren}</div>`
}
```

## 3. MWISSR Execution Trace

1.  **Start:** `MWISSR.render(pageData)` is called. It initializes an empty `MWIDefaultPageTemplate` and master resource sets (e.g., `styles: new Set()`).
2.  **Process `Page`:** `renderNode([Page...])` is called. The `PageHandler` is executed.
    *   It returns its `content` payload (`[h.html...]`).
    *   The renderer adds `/css/main.css` to the master `styles` set.
    *   The renderer sees the `content` payload and **recursively calls `renderNode()`** on the new `[h.html...]` structure.
3.  **Process `h.html`:** `renderNode([h.html...])` is called. The `h.html` handler is executed. It must render its children, so it triggers recursive `renderNode` calls for `[h.head...]` and `[h.body...]`.
4.  **Process `UserProfile`:** During the rendering of the `body`, `renderNode([UserProfile...])` is called.
    *   The `UserProfileHandler` is executed, returning its `content` payload (`[h.div...]`).
    *   The renderer adds `/css/profile.css` to the master `styles` set. The set now contains `['/css/main.css', '/css/profile.css']`.
    *   The renderer recursively calls `renderNode()` on the new `[h.div...]` structure.
5.  **Process `h.div`:** `renderNode([h.div...])` is called. The `h.div` handler is executed.
    *   It calls `renderNode("Welcome, Alice!")`, which simply returns the string.
    *   The handler assembles the final string and returns its `html` payload: `{ html: '<div class="profile">Welcome, Alice!</div>' }`.
6.  **Unwind:** The recursion unwinds. Each `h.*` handler receives the rendered HTML from its children and assembles its own HTML string, passing it up the call stack.
7.  **Final Assembly:** The top-level `render()` call now has the complete HTML for the page body and the deduplicated master resource sets.
    *   The body HTML is added to the `MWIDefaultPageTemplate`.
    *   `<link>` tags for `/css/main.css` and `/css/profile.css` are added to the `head` position of the `MWIDefaultPageTemplate`.
8.  **Finish:** `template.render()` is called, returning the final, complete HTML document.