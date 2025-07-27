# ARCHIVED: MWI Client-Side State Management (Handshake Model)

> **Note:** This document contains a historical, superseded portion of `CSR-Event-And-State-Plan.md`, archived on 2025-07-11. The definitive architecture for this functionality is the reactive model now described in the main document and detailed in `MWI-PubSub-Architecture.md`.

## II. State Management: Secure Pub/Sub via Handshake

To ensure strict component isolation, all container/sub-component communication is handled via a secure, message-passing publish/subscribe pattern.

### A. The "Handshake" Mechanism

Components discover each other's APIs indirectly via a global service locator.

1.  **The Global Store:** `%*MWIData` acts as a registry for component APIs.
2.  **Container Publishes API:** `[form m.pub=contactForm]` places its receiver API (`d.rr`) at the `contactForm` key in `%*MWIData`.
3.  **Field Subscribes to API:** `[h.input m.sub=contactForm]` looks up the `contactForm` key to find the API to message.

### B. The Communication Protocol

The protocol is based on one-way state announcements from fields to the container.

1.  **Field Validates:** The `h.input` component is responsible for its own validation, based on declarative `v.*` attributes.
2.  **Field Publishes:** After validation, the field sends an `(updateFieldState)` message to the container's API with its new status.
3.  **Container Subscribes & Updates:** The `form` receives the message, trusts the report, and updates its private `@reactive` state, which in turn updates any dependent UI elements.