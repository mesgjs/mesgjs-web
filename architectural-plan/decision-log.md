---
**Status:** STANDARD
**History:**
- 2025-07-29: ACTIVE
**Scope:** An immutable log of architecturally significant decisions.
**Replaces:** 
**Replaced by:** 
**Related:** 
---
# Architectural Decision Log (ADL)

This document serves as an immutable log of architecturally significant decisions made during the project. It is intended to provide context for future development and to record the reasoning behind key choices.

Entries should be added for any decision that has a non-trivial impact on the project's architecture, maintainability, or security. This is the designated location for recording the outcomes of "Intelligent Disobedience" discussions.

---

## 2025-07-29: Hardening of h.* Primitives and Core Handlers

-   **Context:** Following a comprehensive architectural audit, several gaps and potential security weaknesses were identified in the planned implementation of the core `h.*` primitive components.
-   **Discussion:** The primary issue was the implicit behavior of the default `h.*` handler, which could render any tag except those with dedicated handlers (like `script` and `style`). This "deny-list" approach is less secure than an "allow-list." Additionally, core functionalities for fragments, text nodes, comments, and titles were not explicitly defined.
-   **Decision:**
    1.  The standard `h.*` handler **MUST** operate on a strict "allow-list" basis. It will only render a pre-configured, enumerated set of safe HTML tags. It is not responsible for any tag that has a dedicated handler.
    2.  New declarative handlers **MUST** be created for `h.FRAG` (fragment), `h.TEXT` (text node), and `h.COMMENT` (HTML comment).
    3.  A new specialized handler **MUST** be created for `h.title`.
    4.  The `h.title`, `h.TEXT`, and `h.COMMENT` components should accept their content via a `text` attribute, as they do not contain child nodes. The `h.title` and `h.TEXT` handlers' CSR implementations should support a reactive value for this attribute.
-   **Reasoning:** Switching to an "allow-list" model for the `h.*` primitives significantly improves security by default. Explicitly defining handlers for non-element nodes like fragments and comments clarifies the architecture and makes the system more robust. The specialized `h.title` handler is necessary for its unique role in the document `<head>`.