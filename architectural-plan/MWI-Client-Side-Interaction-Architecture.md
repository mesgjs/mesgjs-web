# MWI Client-Side Interaction Architecture

This document outlines the architecture for client-side component interaction within the MWI environment. It covers two primary mechanisms:
1.  **Publish/Subscribe:** For decoupled, many-to-many communication between components.
2.  **Direct Event Handling:** For a component's direct interaction with its own DOM elements.

## I. Reactive Pub/Sub System

The pub/sub system is mediated by a central, globally-accessible data store. Components "publish" their public message-passing interface to a well-known location. Other components can then "subscribe" to that location to receive the interface and send messages to it.

The central store is a `NANOS` instance stored in the global shared storage (`$gss`) under the key `MWIData`.

### A. Publishing an Interface (`m.pub`)

Components publish their interface using the `m.pub` attribute. The process is managed by a helper function that leverages the `@reactive` library to handle the component lifecycle.

#### Publisher Process Flow

1.  **Symmetric Creation:** On `mount`, a publisher component calls the `publish` helper. This helper idempotently gets or creates a reactive value (`R.rv`) at the specified path within `%*MWIData`.
2.  **Set Value:** The helper sets the reactive value to the component's public receiver function (`d.rr`).
3.  **Cleanup:** On `unmount`, the publisher is responsible for calling the helper again to set the reactive value at the same path back to `@u` (Mesgjs `undefined`), signaling its departure.

### B. Subscribing to an Interface (`m.sub`)

Components subscribe to published interfaces using the `m.sub` attribute. This creates a live link to the published receiver, which updates automatically as the publisher mounts and unmounts.

#### Subscriber Syntax

The `m.sub` attribute supports two forms:

*   **Single Subscription:** `m.sub="path.to.interface"`
    *   This subscribes to a single publisher. The resulting follower reactive is stored under the name `"default"`.
*   **Multiple Subscriptions:** `m.sub=[form=path.to.form validator=path.to.validator]`
    *   This subscribes to multiple publishers. The `m.sub` value is a NANOS list of key-value pairs, where the key is the local name for the subscription and the value is the path in `%*MWIData`.

#### Subscriber Process Flow

1.  **Symmetric Creation:** A subscriber component's handler calls a `subscribe` helper. This helper also idempotently gets or creates the reactive value (`R.rv`) at the specified path if it doesn't already exist.
2.  **Follower Reactives:** For each requested subscription (named or default), the `subscribe` helper creates a "follower" reactive. A follower is a reactive computation (`R.def`) whose definition function simply gets and returns the current value of the primary reactive from `%*MWIData`.
    ```javascript
    // Pseudocode for the follower's definition
    follower.def = mwiData.at(path);
    ```
3.  **Return Value:** The `subscribe` helper returns a `NANOS` list containing the follower reactives, indexed by their local subscription names.
4.  **Component Usage:** The component can then create its own eager reactive computations that depend on these followers. Because the followers depend on the primary reactive, any change in the primary (e.g., the publisher mounting or unmounting) will propagate, causing the component's own computation to re-run.

This reactive linkage elegantly solves the service discovery and timing problem, allowing subscribers and publishers to come online and go offline in any order.

## II. Direct Event Handling via VNode

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

## III. Architecture Diagram

```mermaid
graph TD
    subgraph "State & Validation (Reactive Pub/Sub)"
        I(h.input) -- "Performs validation" --> J{Sends (updateFieldState)};
        J -- "to reactively subscribed formAPI" --> K(form);
        K -- "Updates its own @reactive state" --> L((Form Internal State));
        L --"Change propagates through reactive graph"--> M[submitButton becomes enabled];
    end

    subgraph "Event Handling (VNode Manages Self)"
        A[Component Mounts] --> B{Receives its VNode};
        B -- "Sends message" --> C{"VNode(on click ...)"};
        C -- "Calls addEventListener" --> D(DOM Element);
        E[User Clicks Element] --> D;
        F[Component Unmounts] --> G{MWIMUM sends (unmount) to VNode};
        G -- "VNode calls (off) on self" --> H{Calls removeEventListener};
    end