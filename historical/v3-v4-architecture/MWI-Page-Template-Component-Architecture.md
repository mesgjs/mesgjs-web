---
**Status:** ACTIVE
**History:**
- 2025-07-29: ACTIVE
**Scope:** Proposes treating page templates as standard MWI components, unifying the rendering model.
**Replaces:**
**Replaced by:**
**Related:** MWI-Component-System.md, MWI-Slot-System.md
---
# MWI Page Template Component Architecture

## 1. Executive Summary

This document proposes a fundamental shift in how page templates are handled within the MWI system. The core concept is to treat a page template not as a special string-based entity, but as a standard MWI component. This architectural simplification unifies the rendering model, enhances flexibility, and maintains the security guarantees of the component system.

## 2. Core Principles

The `PageTemplate` is a declarative component whose root is a fragment containing the entire document structure, from `<!DOCTYPE html>` to `</html>`. It uses the standard MWI slotting mechanism (`m.slot` and `m.attr`) to position content and attributes.

A minimal page template component's `content` payload would be structured as follows:

```javascript
[ 'h.FRAG',
    [ 'h.doctype' ],
    [ 'h.html', { 'm.attr': 'as.html' },
        [ 'h.head',
            [ 'm.slot', { name: 'cs.head' } ]
        ],
        [ 'h.body', { 'm.attr': 'as.body' },
            [ 'm.slot', { name: 'cs.default' } ]
        ]
    ]
]
```

## 3. The `PageContextService`

To decouple page-level concerns (like resource management) from individual components, a new, short-lived `PageContextService` will be introduced.

*   **Lifecycle:** A new instance is created for each top-level `render()` call. It is passed through the entire rendering process via the shared `context` object.
*   **API:** It provides methods for collecting page-level data before the final template is rendered.
    *   `setTitle(string)`: Sets the `<title>` of the document.
    *   `setHtmlAttr(key, value)` / `setBodyAttr(key, value)`: Adds attributes to the `<html>` and `<body>` tags.
    *   `addHeadContent(vnode)`: Adds a VNode (e.g., a `<style>` or `<script>` tag) to be rendered inside the `<head>`.
    *   `addBodyContent(vnode)`: Adds a VNode to be rendered inside the `<body>` (for default content).
*   **Role:** It acts as the central "property bag" for the final page. Services like `MWIResourceCollectorService` will add their contributions (CSS, JS) to this context. The final page template component will then read from this context during its rendering pass.

## 4. `MWISSR` Rendering Flow

The `MWISSR.render` method is refactored to orchestrate this new two-pass flow:

**Pass 1: Content & Resource Rendering**
1.  A new `PageContextService` instance is created.
2.  The main page content (the `pageData` passed to `render`) is rendered.
3.  During this pass, components and services interact with the `PageContextService` via the `context` object to populate it with the title, head content, attributes, etc.

**Pass 2: Page Template Rendering**
1.  The `pageTemplate` component (specified in the `render` options) is retrieved.
2.  The content collected in the `PageContextService` from the first pass is now formatted and passed into the page template component via its attributes. For example, all body content is gathered and passed into the `default` slot.
3.  The page template component is rendered, pulling its data from its attributes and the `PageContext`, producing the final, complete `VNode` for the entire page.
4.  The `.outerHTML` of this final `VNode` is returned.

```mermaid
graph TD
    subgraph "Input"
        PageData["Page Content"]
        RenderOptions["{ pageTemplate: 'my-layout' }"]
    end

    subgraph "MWISSR Orchestrator"
        Render[render()]
        CreateCtx[1. Create PageContext]
        RenderPass1[2. Render Content Pass]
        RenderPass2[3. Render Template Pass]
    end

    subgraph "Services"
        PageCtx[PageContext Instance]
        ResourceServices["Resource/CSS Services"]
    end

    subgraph "Component System"
        ComponentFactory[Component Factory]
        PageTemplateComp["Page Template Component"]
    end

    PageData & RenderOptions --> Render
    Render --> CreateCtx --> PageCtx

    Render --> RenderPass1
    RenderPass1 -- populates --> PageCtx
    ResourceServices -- also populate --> PageCtx

    Render --> RenderPass2
    RenderPass2 -- reads from --> PageCtx
    RenderPass2 -- renders --> PageTemplateComp

    RenderPass2 --> FinalHTML["Final HTML Output"]
```

## 5. Security Model

*   **Explicit Registration:** A component must be explicitly marked with `type: 'page'` in the component registry to be usable as a `pageTemplate`. The `MWISSR` will reject any attempt to use a non-page component in this role.
*   **No Direct Tag Creation:** Page templates do not render arbitrary HTML. They use the standard `h.*` primitive components, ensuring that all output passes through the `MWISSRVNode`'s sanitization and escaping logic. Content like `<script>` tags are not created by the template, but are passed *into* the template from trusted services via the `PageContext`.

This architecture provides a flexible, powerful, and secure foundation for page templating that is fully aligned with the core principles of MWI.