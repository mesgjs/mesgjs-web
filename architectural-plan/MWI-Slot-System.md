# MWI Slot System Architecture

---
**Status:** ACTIVE
**History:**
- 2025-07-29: ACTIVE
**Scope:** The detailed technical specification for the MWI Slotting System for content and attribute projection.
**Replaces:**
**Replaced by:**
**Related:** MWI-Page-Template-Component-Architecture.md
---

## 1. Introduction

This document provides the detailed technical specification for the MWI Slotting System. It addresses the architectural gap identified in the `Semantic-Components-Review.md` and provides a formal plan for implementing content and attribute slotting for MWI components.

The goal is to enable sophisticated component composition, allowing developers to create flexible and reusable UI elements by passing content and attributes from a parent (the "consumer") to a child component (the "provider").

## 2. Core Concepts & Terminology

*   **Slot Provider:** A component that defines slots in its template to accept external content or attributes.
*   **Slot Consumer:** A component that provides the content or attributes to be placed into the slots of a child component.
*   **Content Slot:** A placeholder for a block of Mesgjs content (a list of nodes).
*   **Attribute Slot:** A mechanism for merging a set of attributes from a consumer onto a specific element within a provider's template.

## 3. Implementation

### 3.1. Content Slotting

#### Defining a Content Slot

A component (provider) defines a content slot by including an `[m.slot]` component in its template.

*   **Syntax:** `[m.slot name=<slot-name> <...default content...>]`
*   **`name`:** The name of the slot. By convention, slot names should use the `cs.` prefix (e.g., `cs.header`).
*   **Default Content:** Any positional content within the `[m.slot]` component serves as the default content if the consumer does not provide any for this slot.
*   **Default Slot:** If the `name` attribute is omitted, it defaults to `cs.default`.

#### Providing Content to a Slot

A component (consumer) provides content to its child by passing attributes.

*   **Syntax:** `[my-component cs.header=[h.h1 "Header"] cs.footer=[p "Footer"]]`
*   The renderer matches the attribute name on the consumer (e.g., `cs.header`) with the `name` of an `[m.slot]` component in the provider's template.
*   **Special Case (Default Slot):** Content for the default slot (`cs.default`) can be provided via the `cs.default` attribute **or** by being passed as the primary positional content to the consumer component.

### 3.2. Attribute Slotting

#### Defining an Attribute Slot Target

A component (provider) defines a target element for attribute slotting by adding an `m.attr` attribute to it.

*   **Syntax:** `<element-tag m.attr="<slot-name>;<policy-list>"> ...`
*   **`<slot-name>`:** The name of the attribute slot the element is targeting. By convention, this should use the `as.` prefix (e.g., `as.input`). This name must match an attribute on the consumer component.
*   **`<policy-list>`:** A comma-separated list that controls which attributes are merged.
    *   **Allow List (Default):** If the list does not start with `@not:`, it is an **allow list**. Only the attributes named in the list will be merged from the slot. Example: `href,target,class`
    *   **Deny List (`@not:`):** If the list begins with `@not:`, it is a **deny list**. All attributes from the slot *except* those named in the list will be merged. Example: `@not:id,style`
    *   Special handling for `class` and `style` attributes (merging, based on `editClass` and `editStyle`, instead of replacing) is always applied when they are allowed by the policy list.

#### Providing Attributes to a Slot

A component (consumer) provides a set of attributes by passing an attribute whose name matches the slot name defined in the provider's `m.attr`.

*   **Syntax:** `[my-component as.input=[type=email disabled=@t]]`
*   The `as.input` attribute on `my-component` contains a NANOS list of attributes that will be merged into the element with `m.attr="as.input;..."` in the child's template, according to the policy list. Note that boolean attributes must be explicit, similar to JavaScript (e.g., `disabled=@t` for true); positional values are always ignored.

## 4. Renderer and Component Integration

The slotting mechanism must function identically for both the Server-Side Renderer (SSR) and the Client-Side Renderer (CSR) to ensure behavioral parity.

*   **Declarative Components:** The slotting process will be handled automatically by the renderer during its single-pass traversal. It will match consumer attributes to provider slots (`m.slot` and `m.attr`) and perform the necessary substitutions and merges.
*   **Smart Components:** A helper function will be provided to smart components to allow them to manually perform attribute merging, giving them programmatic control over the process. This function will accept the source attribute payload (a NANOS list), the policy list, and the target `VirtualNode`.

## 6. Renderer Implementation Plan: The "Pull" Model

To maintain the declarative, single-pass nature of the rendering pipeline, slotting will be implemented using a "pull" model rather than a "push" or pre-processing model. The core principle is that when rendering a component's internal template (the provider), the renderer has access to the original component VNode (the consumer) and pulls slot data from it directly as needed.

### 6.1. Augmenting the Rendering Context

When the renderer begins processing a component handler, the VNode for that component instance (the consumer) will be added to the rendering context that is passed down into the recursive rendering of the component's own template (the provider).

*   **`context.consumerVNode`**: A reference to the VNode that initiated the current component render.

### 6.2. Resolving Slots During Recursive Rendering

As the renderer traverses the provider's template, it will perform the following actions:

1.  **Content Slot (`m.slot`) Resolution:**
    *   When the renderer encounters an `[m.slot name=cs.foo]` component, it will consult the `context.consumerVNode`.
    *   The default slot name is `cs.default`.
    *   It will look for an attribute named `cs.foo` on the `consumerVNode`.
    *   **If the attribute exists:** The renderer recursively processes the *value* of that attribute, discarding the `m.slot`'s default content.
    *   **If the attribute does not exist:** The renderer processes the default content of the `m.slot` component as normal.
    *   **Special Default Slot Handling:** For the default slot (`name=cs.default`), if the `cs.default` attribute is not found on the `consumerVNode`, the renderer will then check for any positional children on the `consumerVNode` and use those.

2.  **Attribute Slot (`m.attr`) Resolution:**
    *   When the renderer encounters an element with an `m.attr="as.bar;..."` attribute, it will consult the `context.consumerVNode`.
    *   It will look for an attribute named `as.bar` on the `consumerVNode`.
    *   **If the attribute exists:** The renderer merges the attributes from the value of the `as.bar` attribute onto the current element, respecting the allow/deny policy list. The `class` and `style` attributes are merged (using `editClass` and `editStyle`), not replaced.

This "pull" approach requires no pre-processing step, keeps the logic localized to the handlers for `m.slot` and `m.attr`, and integrates seamlessly into the existing rendering architecture.

### 6.3. Smart Component Integration

Smart component handlers will also receive the `context.consumerVNode`. This allows them to programmatically inspect the content and attribute slots provided by the consumer before they construct their `content` payload. A smart component could, for example:
- Read the value of a `cs.header` attribute to set a title in its internal state.
- Check for the existence of a default slot's content to conditionally render a wrapper element.
- Directly pass consumer attributes to the helper function for manual attribute slot merging onto a VNode it creates.
## 5. Example

#### Provider: `my-card.msjs` template
```mesgjs
[div class=card]
  [div class=card-header]
    [m.slot name=cs.header [h.h2 "Default Title"]]
  [/div]

  [div class=card-body]
    [m.slot [p "Default body content..."]]
  [/div]

  [div m.attr=as.footer;class class=card-footer]
    [m.slot name=cs.footer]
  [/div]
```

#### Consumer: Using `my-card`
```mesgjs
[my-card
  cs.header=[h.h1 "Custom Title"]
  cs.footer=[p "Custom footer text."]
  as.footer=[class="text-center extra-padding"]

  [p "This is the primary (default) content for the card body."]
  [p "It replaces the default slot's content."]
]