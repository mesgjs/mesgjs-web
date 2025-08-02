---
**Status:** ACTIVE
**History:**
- 2025-07-30: ACTIVE
**Scope:** Defines the requirements for the foundational `h.*` primitive components.
**Replaces:**
**Replaced by:**
**Related:** MWI-Component-Tutorial.md, decision-log.md, MWI-Architecture-v3-VNode-Implementation.md
---
# MWI Core Component Requirements

This document defines the requirements for the foundational `h.*` primitive components, which form the basis of all HTML rendering in the MWI system. Future development must also incorporate schema validation (e.g., block vs. inline context, allowed children) into these handlers.

## 1. General `h.*` Handler (Allow-List)

The default handler for generic `h.*` components (e.g., `h.div`, `h.p`) **MUST** operate on a strict "allow-list" basis.

*   **Security:** This handler is responsible for rendering only a pre-configured, enumerated set of known safe HTML tags. It **MUST NOT** render any tag that has its own specialized handler (e.g., `h.script`, `h.style`, `h.title`). This prevents the injection of unexpected or unsafe elements.
*   **Behavior:** The handler simply passes through the tag name, attributes, and children to the `VNode` for rendering, relying on the VNode's built-in HTML escaping for security.

## 2. Specialized Non-Element Handlers

The following `h.*` components do not represent standard HTML elements and **MUST** have their own dedicated, declarative handlers.

*   **`h.FRAG` (Fragment):**
    *   **Purpose:** Renders its children directly without a wrapping element.
    *   **Implementation:** The handler should return a `VNode` created with the `noTag: true` option.
*   **`h.TEXT` (Text Node):**
    *   **Purpose:** Explicitly renders its content as a text node, ensuring that any contained characters are properly escaped and not interpreted as HTML.
    *   **Attribute:** It **MUST** accept its content via a `text` attribute (e.g., `[h.TEXT text="Some content"]`). Children are ignored.
    *   **Reactivity (CSR):** The client-side handler **MUST** support a (browser-normalization-guarded) reactive value for the `text` attribute.
*   **`h.COMMENT` (HTML Comment):**
    *   **Purpose:** Renders its content safely inside an HTML comment.
    *   **Security:** To prevent "comment jailbreak" injection attacks, the content **MUST** be HTML-escaped before being placed inside the comment delimiters.
    *   **Attribute:** It **MUST** accept its content via a `text` attribute. Children are ignored.
    *   **Implementation:** The handler should return a `VNode` using the `openOpen` and `close` options (e.g., `new MWIVNode('h.COMMENT', { openOpen: '<!--', close: '-->' })`).

## 3. Specialized Element Handlers

The following `h.*` components have unique behavior and **MUST** have their own handlers.

*   **`h.title`:**
    *   **Purpose:** Manages the document's `<title>` tag. On the server, it sets the title on the `PageContextService`. On the client, it directly updates `document.title`.
    *   **Attribute:** It **MUST** accept its content via a `text` attribute. Children are ignored.
    *   **Reactivity (CSR):** The client-side handler **MUST** support a reactive value for the `text` attribute.

## 4. Security-Sensitive Element Handlers

The following handlers deal with content that has significant security implications. They must be isolated in their own modules and implement strict sanitization logic.

*   **`h.script`:**
    *   **Module:** Due to its inherent risks, the `h.script` handler **MUST** reside in a separate, optional module (e.g., `mwi-html-script.msjs`).
    *   **Behavior:** The handler uses the VNode's `rawContent: true` option to prevent HTML-escaping of the script body.
    *   **Security:** To mitigate XSS risks from malformed data, the handler **MUST** sanitize its content by truncating it at the first occurrence of a closing `</script>` tag.

*   **`h.style`:**
    *   **Behavior:** The handler uses the VNode's `rawContent: true` option to prevent HTML-escaping of the stylesheet content.
    *   **Security:** To prevent XSS via style tag breakout, the handler **MUST** sanitize its content by truncating it at the first occurrence of a closing `</style>` tag.