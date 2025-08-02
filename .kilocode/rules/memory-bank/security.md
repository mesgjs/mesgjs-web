# MWI Security Policies

This document outlines key security decisions and policies implemented within the Mesgjs Web Interface (MWI) to ensure the integrity and safety of the rendering process.

## HTML Element Security

### Tag Name Integrity
- HTML primitive components (h.*) enforce strict tag name correspondence
- Tag names cannot be overridden through options to prevent:
  - Injection of unexpected elements
  - Bypass of content security policies
  - Creation of invalid/malicious HTML structures
- Use appropriate h.* primitive or semantic component for intended element
- Use CSS for styling/layout needs
- Use noTag option if element wrapper needs to be removed

## Attribute Rendering Security

The `MWIVNode` class and its server-side extension `MWISSRVNode` are responsible for handling attribute rendering. The base class provides methods for setting attributes, which includes sanitizing values to prevent XSS and other injection attacks. The server-side implementation ensures all attribute values are HTML-escaped before being rendered into the final document.

### System-Generated IDs

-   **Prefix Convention:** To ensure SSR/CSR stability and prevent ID collisions, system-generated `id` attributes **MUST** adhere to the established convention:
    -   `MWS$<counter>` for server-rendered elements.
    -   `MWC$<counter>` for client-rendered elements.
-   **Reference:** For detailed reasoning behind this convention, see the [`Naming-Conventions.md`](../../architectural-plan/Naming-Conventions.md) document.
-   **Usage:** These IDs are intended for internal MWI mechanisms like hydration and eventing. User-facing hash links should rely on manually-assigned, static IDs.

### Primitive Handler Security (Allow-List)

-   **Policy:** The default handler for `h.*` primitive components **MUST** operate on a strict "allow-list" basis. It is only permitted to render a pre-configured, enumerated set of known safe HTML tags.
-   **Reasoning:** This prevents the rendering of unexpected or dangerous tags that do not have their own specialized, security-hardened handlers (e.g., `h.script`). A "deny-list" approach is insufficient as it can be bypassed by techniques like using custom elements that extend unsafe tags (e.g., `<x-script extends HTMLScriptElement>`).

### Comment Content Security

-   **Policy:** The content of `h.COMMENT` components **MUST** be HTML-escaped before being rendered inside the `<!-- ... -->` delimiters.
-   **Reasoning:** While standard HTML behavior does not escape comment content, the MWI enforces this rule to prevent "comment jailbreak" XSS attacks, where malicious code could prematurely close the comment and inject active HTML. Security takes precedence over standard behavior in this case.

### Primitive Handler Security (Allow-List)

-   **Policy:** The default handler for `h.*` primitive components **MUST** operate on a strict "allow-list" basis. It is only permitted to render a pre-configured, enumerated set of known safe HTML tags.
-   **Reasoning:** This prevents the rendering of unexpected or dangerous tags that do not have their own specialized, security-hardened handlers (e.g., `h.script`). A "deny-list" approach is insufficient as new browser features could introduce new tags with security implications.

### Comment Content Security

-   **Policy:** The content of `h.COMMENT` components **MUST** be HTML-escaped before being rendered inside the `<!-- ... -->` delimiters.
-   **Reasoning:** While standard HTML behavior does not escape comment content, the MWI enforces this rule to prevent "comment jailbreak" XSS attacks, where malicious code could prematurely close the comment and inject active HTML. Security takes precedence over standard behavior in this case.
