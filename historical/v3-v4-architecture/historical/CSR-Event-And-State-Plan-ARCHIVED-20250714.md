# MWI Client-Side Event and State Architecture

This document specifies the official architecture for client-side event handling, state management, and component communication within the Mesgjs Web Interface (MWI). The architecture is designed to be secure, ergonomic, and robust, with a layered approach that supports both simple declarative use cases and advanced programmatic control.

## I. The Event System: An Intrinsic VNode Capability

Event management is not a separate interface but a core responsibility of the client-side Virtual Node (`VNode`) itself. This approach mirrors the native DOM, where nodes manage their own listeners, providing a simple and intuitive API.

### A. The `MWICSRVNode` Interface

The `MWICSRVNode` is the Mesgjs interface for a `VNode` object that represents a live DOM element on the client side. It is created by the `MWICSR` for each rendered element.

*   **Integrated API:** The `MWICSRVNode` interface directly includes messages for event management.
    *   `%myVNode(on eventName bubbles=@f preventDefault=@t handler=mesgjsReceiver)`: A component sends this message *directly to the VNode* to attach an event listener. The VNode's handler accesses its own internal DOM element reference (e.g., from `d.octx.element`) and calls `addEventListener`.
        *   `eventName`: A word-literal matching a standard DOM event (e.g., `click`, `input`).
        *   `handler`: An optional Mesgjs receiver. Defaults to the message sender (`d.sr`).
    *   `%myVNode(off)`: Removes **all** event listeners attached to this VNode.
    *   `%myVNode(off eventName handler=mesgjsReceiver)`: Removes a single, specific event listener.

### B. Component Lifecycle Integration

The `VNode`'s lifecycle is tied to the `MWIMUM` (Mount/Unmount Monitor), which makes cleanup automatic and robust.

*   **On Mount:** A component's `mount` handler receives a reference to the `MWICSRVNode` for its root element, which it should store in its persistent storage (`%`). It can then send `(on)` messages directly to it.
*   **On Unmount:** When the `MWIMUM` detects that an element has been removed from the DOM, it will send an `(unmount)` message to its corresponding `VNode`. The default handler for `(unmount)` on the `MWICSRVNode` interface will automatically call `(off)` on itself, ensuring all listeners are cleaned up without requiring manual intervention from the component developer.

### C. The `mwiEventDelegator` (Fallback)

A global delegator service remains on `document.body` as a listener of last resort for events that have bubbled up completely unhandled, suitable for global UI actions.

## II. State Management: The Reactive Pub/Sub Model

To ensure strict component isolation and handle lifecycle timing issues, all container/sub-component communication is handled via a secure, reactive, message-passing publish/subscribe pattern.

> **Note:** The authoritative document for this system is `MWI-PubSub-Architecture.md`. The historical "handshake" model has been archived.

### A. The Reactive Mechanism

The system works by using `@reactive` values as a service bus, elegantly solving discovery and timing challenges.

1.  **The Central Store:** A global `NANOS` object, `%*MWIData`, holds reactive values that act as "channels."
2.  **Container Publishes API (`m.pub`):** A container component (e.g., a `form`) uses a helper to publish its message-passing API (`d.rr`) to a reactive value at a known path (e.g., `forms.contactForm`). On unmount, the helper automatically sets this value back to `undefined`.
3.  **Field Subscribes to API (`m.sub`):** A field component (e.g., an `input`) uses a helper to create a "follower" reactive that mirrors the value at the container's path.
4.  **Live Binding:** Because the field's follower reactively depends on the container's published reactive, the field automatically and safely receives the container's API whenever it becomes available and sees it disappear upon unmount. This allows the publisher and subscriber to mount and unmount in any order without errors.

### B. The Communication Protocol

The protocol is based on one-way state announcements from fields to the container.

1.  **Field Validates:** An `input` component performs its own validation. For declarative components, this is handled via `v.*` attributes. Smart component authors are free to implement programmatic validation instead if they choose.
2.  **Field Publishes:** After validation, the input sends an `(updateFieldState)` message to the container's API (which it has reactively subscribed to) with its new status.
3.  **Container Subscribes & Updates:** The `form` receives the message, trusts the report, and updates its internal `@reactive` state. This change propagates through the reactive graph, automatically updating any dependent UI, such as enabling or disabling a submit button.

## III. Final Architecture Diagram

```mermaid
graph TD
    subgraph "Event Handling (VNode Manages Self)"
        A[Component Mounts] --> B{Receives its VNode};
        B -- "Sends message" --> C{"VNode(on click ...)"};
        C -- "Calls addEventListener" --> D(DOM Element);
        E[User Clicks Element] --> D;
        F[Component Unmounts] --> G{MWIMUM sends (unmount) to VNode};
        G -- "VNode calls (off) on self" --> H{Calls removeEventListener};
    end

    subgraph "State & Validation (Reactive Pub/Sub)"
        I(h.input) -- "Performs validation" --> J{Sends (updateFieldState)};
        J -- "to reactively subscribed formAPI" --> K(form);
        K -- "Updates its own @reactive state" --> L((Form Internal State));
        L --"Change propagates through reactive graph"--> M[submitButton becomes enabled];
    end
```

This final architecture provides a secure, robust, and maintainable foundation for all client-side interactions in MWI, balancing ease of use with powerful extensibility.