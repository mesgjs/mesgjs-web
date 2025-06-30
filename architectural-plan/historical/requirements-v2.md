# Mesgjs Web Interface (MWI) Requirements (Version 2)

## Overview

The goal of this project is to architect and implement a set of "bilingual" JavaScript-and-Mesgjs interfaces implementing a web interface for Mesgjs-based applications.

The implementation must support both server-side and client-side rendering. Content for rendering will be presented in the form of structured data.

This document represents the consolidated requirements for the MWI project, incorporating decisions made to resolve initial open issues.

## Resolved Issues

*   **User-defined component sandboxing:** Resolved through a layered approach combining Mesgjs language-level sandboxing and Deno's process-level sandboxing with strict permissions. Account policies will further mitigate risks.
*   **XSS/Code Injection in Attributes:** Resolved by ensuring all DOM changes are routed through system-supplied components that perform rigorous data sanitization and validation. Modules will be loaded from a catalog with integrity checks.
*   **API for validator/event discovery:** Resolved by implementing a three-layered architecture (Catalog, Mapping/Alias, Registry/Runtime) for module registration and resolution. This provides a unified API for looking up components, validators, and event handlers.
*   **Integration Concern:** Resolved by the architectural plan. The three-layer module resolution system and messaging-based architecture provide dedicated channels and policy enforcement for integrating permission-based messaging.
*   **Performance:** Resolved by the architectural plan, which outlines that the module resolution system will support rate limiting and resource quotas.
*   **Error/Warning Reporting:** Resolved by the architectural plan. The messaging-based system allows for dedicated channels for errors and warnings to be surfaced to the UI or logs.
*   **SSR Child Node Processing:** Resolved by the architectural plan. The rendering walkthrough demonstrates that component handlers are responsible for processing their own children, giving them full control.
*   **CSR Dynamic Content:** Resolved by the architectural plan, which specifies the use of the `@reactive` interface for efficient updates of dynamic content.
*   **Component Factory Extensibility:** Resolved by the architectural plan. The unified `get(symbolicName)` method on the factory allows for new resource types to be added to the module system without changing the factory's interface.
*   **Async Handling in Factory:** Resolved by the architectural plan. The factory's `get()` method returns a `Promise` that resolves to `undefined` if a component is not found, providing a clear mechanism for handling unavailable components and errors.

## Remaining Open Issues

*   **SAAS Gap:** Collaborative editing and multi-media messaging requirements from SAAS context are not explicitly addressed in the main requirements.
*   **Best Practice:** Minimum browser capabilities and trade-offs for CSR are not defined; need to clarify support for shims and build steps.
*   **SSR Hydration:** How will SSR handle hydration for real-time media content (e.g., video, audio) to ensure seamless transition to CSR?
*   **CSR Browser Support:** What is the minimum set of browser capabilities required for CSR, and what shims (if any) will be provided to support older browsers?

## Project Elements Needed To Be Created

- An event-handler mechanism
- An input-validation mechanism
- Additional structured-document-data conventions related to event handlers and input validators
- A server-side renderer (SSR)
- A client-side renderer (CSR)
- The SSR-related aspects of an interface specification for component-handler factories
- The SSR-related aspects of an interface specification for page-template objects
- A document schema mechanism (description and implementation)

## Page-Description Requirements

- A `NANOS`-based page-description must be accepted: `[tag named-attributes... child-nodes...]`
- Text-nodes must be supported as strings and in a tag-based format for annotating dynamic content.
- An optional JS array+object-based description should be supported: `[tag, {attributes}, child-nodes...]`
- Event-handling and input-validation will be specified via a mapping layer, not directly in the page-description data, to enhance security and maintainability.
- Any attributes including code must be interpreted as Mesgjs and transpiled to JavaScript. Direct JavaScript entry is forbidden to prevent injection attacks. All data will be sanitized by system components before rendering.

## Event-Handler And Input-Validation Requirements

- Event handlers and validators will be referenced by symbolic names (e.g., `:validate.phoneNumber`, `:click`).
- These symbolic names are resolved at runtime through a multi-layered system (Catalog -> Mapping -> Registry) to the actual module implementation. This allows for central management, versioning, and security policy enforcement.
- Input-validation must support both reusable (e.g., for phone numbers, email addresses) and one-off-validation (e.g., regex-matching) modes.

## Document Schema Requirements

- Different users can have access to different (sub)sets of components based on permissions and policies.
- Users may create their own components, which will be managed within the module catalog.
- New components can be added without altering or rebuilding the application.
- A document schema is constructed dynamically based on schema elements associated with the components.
- **Security:** User-defined components are sandboxed using a layered approach:
    1.  **Mesgjs Sandboxing:** Restricts code to a safe subset of APIs.
    2.  **Deno Sandboxing:** Runs components in separate processes with strict, minimal permissions (no file, network, or env access unless explicitly granted).
    3.  **OS-level limits:** CPU and memory limits are applied to each process.
    4.  **Account Policies:** Free accounts are limited to curated components, while paid accounts are metered, discouraging abuse.

## SSR Requirements

- The SSR will be supplied with structured data representing the page.
- The SSR will use a component-handler factory to get component handlers.
- The SSR must include a minimalist default page template (`<!doctype>`, `<head>`, `<body>`).
- Page templates must include positions for different content types (main content, scripts, styles, etc.).
- The SSR traverses the page data, instantiating and messaging component handlers.
- The final result is HTML, ready for browser rendering or CSR hydration.
- **Security:** Scripts and modules are loaded only from a trusted catalog with integrity checks (sha512) to prevent supply chain attacks and ensure code integrity.

## CSR Requirements

- CSR must support scenarios from no-action (static SSR) to full client-side rendering and interactivity.
- CSR must support standard browser events and allow Mesgjs event handlers.
- CSR must support dynamic/reactive content via the Mesgjs `@reactive` interface.
- Components are responsible for managing their own DOM updates for reactive content.
- **Security:** Mesgjs code executed on the client is sandboxed to prevent privilege escalation or data leakage, following the same principles as SSR.

## Component-Handler Factory and Module Resolution

- A unified "resource factory" will be used for discovering and instantiating components, validators, and event handlers.
- This is implemented via a three-layer architecture:
    1.  **Module Catalog:** The source of truth for all available modules, tracking metadata like version, trust level, and ACLs.
    2.  **Mapping/Alias Layer:** Maps symbolic names used in documents (e.g., `button`, `:validate.email`) to specific module versions. This allows for central updates and policy enforcement.
    3.  **Registry/Runtime Layer:** At runtime, resolves symbolic names via the mapping layer, enforces policies, and loads the module.
- The factory will return a `Promise` that resolves to the requested handler or `undefined` if not found.

## Component Schema

- The component schema will include: ID, name, description, tags, image URL, allowed parent/child groups, and event registrations.
- Events include standard HTML events (`click`, `input`), Web Interface events (`:render`, `:validate`), and user-defined events.

## Page-Template Interface Requirements

- Must provide messages for:
    - Reporting available content positions.
    - Setting content in each position.
    - Returning the final page HTML.

## General Requirements

- Direct loading of JavaScript must be preventable for security. Any permitted script loading must be filtered through the SSR/CSR and the module catalog's integrity checks.
- Renderers should traverse non-recursively to minimize overhead.
- Component handlers should be stateless singletons where practical.
- Content requests (scripts, styles) must be de-duplicated.
- `[client ...]` and `[server ...]` pseudo-components must be supported to direct rendering.
- Errors should be `throw`n or handled via Mesgjs' `@try` interface. Renderers should accept `(error)` and `(warn)` messages for non-fatal issues.

## Performance Requirements

- Pages must support real-time media content (`<video>`, etc).
- Aim for "reasonable best effort" performance, with no specific quantitative targets.

## Documentation And Testing Requirements

- Early interface documentation is required.
- Tests should be deferred until the interface stabilizes.

## Accessibility And Internationalization

- a11y and i18n are critical features.
- Components should be able to report a11y issues (e.g., missing `alt` attribute) as non-fatal warnings.
- The system must support in-place i18n for shared components (e.g., login forms).

## References And Resources

- [Mesgjs github repo](https://github.com/mesgjs/mesgjs)
- [NANOS github repo](https://github.com/mesgjs/nanos)
- [reactive github repo](https://github.com/mesgjs/reactive)

---