# MWI Security and Sanitization Policy

This document outlines the explicit security policies and responsibilities for the Mesgjs Web Interface (MWI) to ensure data is handled safely at all stages of the rendering pipeline.

## 1. The Golden Rule: All Data is Untrusted

Every piece of data that enters the MWI system—whether from page data, component attributes, or user input—must be considered untrusted until it has been processed by the appropriate sanitization or validation layer. No component or renderer should ever implicitly trust its inputs.

## 2. Handler Responsibility: Shape and Type Validation

Component handlers are the first line of defense. They are responsible for validating the **shape and type** of the data they receive in their `render` function (`d.mp`).

-   **Schema Validation:** Where applicable, handlers should use the component's defined schema to ensure the input data conforms to the expected structure.
-   **Type Checking:** Handlers must verify that data properties are of the expected type (e.g., a number is actually a number, a string is a string) before operating on them.
-   **Business Logic Validation:** Handlers are responsible for enforcing any business logic constraints on the data (e.g., a value must be within a specific range).

Component handlers **should not** be responsible for HTML escaping. Their focus is on structural and logical integrity.

## 3. Renderer Responsibility: Context-Aware Escaping

The renderers (`MWISSRVNode` and `MWICSRVNode`) are the final gatekeepers and are responsible for preventing Cross-Site Scripting (XSS) attacks through context-aware output escaping.

### 3.1. `MWISSRVNode` (Server-Side)
-   The SSR Node **must** HTML-escape all dynamic data before it is written into the final HTML string. This is a hard requirement.
-   When rendering attributes, values must be properly escaped (e.g., quotes within an attribute value).
-   When rendering content, all text must be escaped to prevent the injection of HTML tags or scripts.

### 3.2. `MWICSRVNode` (Client-Side)
-   The CSR Node **must** use safe DOM manipulation methods.
-   It should always prefer setting `element.textContent` over `element.innerHTML` for inserting content.
-   If `innerHTML` is absolutely required for a specific, trusted use case, the data must first be passed through a robust, context-aware sanitization library.

By strictly separating the responsibilities of structural validation (handlers) and output escaping (renderers), the MWI system ensures a defense-in-depth approach to security.