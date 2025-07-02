# Current Context

## Style Property Handling Patterns

Recent clarifications:
- editStyle/editClass are accumulative operations by design
- setAttr is for complete replacements
- Naming convention reflects behavior:
  - edit* methods accumulate changes
  - set* methods replace entirely
- Style handling options:
  - editStyle for incremental updates
  - setAttr('style', ...) for complete replacement
  - editStyle with empty/null to clear specific properties

## HTML Void Element Handling

Recent clarifications:
- noTag implies noClose (since you would never have a close without an open)
- noClose is used independently for void elements (br, img, input, etc.)
- Void elements should be tested for both:
  - Base functionality (type, options, attributes)
  - HTML rendering (verifying no closing tags)

## Style Property Handling

Recent improvements:
- Style properties are normalized to kebab-case in HTML output
- Tests updated to expect kebab-case format (e.g., font-size)
- Added comprehensive vendor prefix support (-webkit-, -moz-, -ms-, -o-)
- Implemented bidirectional case conversion:
  - Input accepts both kebab-case and camelCase
  - Stored internally in camelCase for consistency
  - Rendered as kebab-case for HTML output
- This better supports:
  - Consistent HTML rendering
  - Client-side DOM manipulation where camelCase is standard
  - Vendor-prefixed properties
  - Mixed format inputs

## HTML Primitive Handler Insights

Recent clarifications:
- Arrays in component data remain arrays until rendering phase
- This preserves data structure integrity and proper separation of concerns
- Storage handles attribute management (excluding arrays)
- VNode handles core functionality
- SSRVNode handles HTML rendering
- Component handlers control rendering options

## Recent HTML Rendering Improvements

Recent progress:
- Restored attribute-updating side effects in storage implementation
- Introduced clearer noTag option for controlling tag rendering
- Fixed component handler to properly set tag options
- Maintained proper separation of concerns throughout

Key lessons:
- Carefully consider the best place to implement changes before making them
  - Initially tried to fix tag handling in SSRVNode when it belonged in component handler
  - Started modifying VNode when the issue was in storage implementation
  - These missteps highlight importance of understanding responsibility boundaries
- Follow the architecture's patterns
  - Storage handles attribute management
  - VNode handles core functionality
  - SSRVNode handles HTML rendering
  - Component handlers control rendering options

## Storage and Validation Understanding

Recent clarifications:
- NANOS is a generic storage mechanism, not responsible for validation
- Validation belongs in context-sensitive code (e.g., VNode for HTML validation)
- Storage choices should be task-appropriate, preferring NANOS when no other factors dictate
- Current CSR implementation is out of date and should not be used as reference
- SSR implementation represents current design direction

## Implementation Status Update

The architectural design for the MWI Component System has been finalized and documented in `architectural-plan/MWI-Component-Architecture.md`. The design is centered around a secure, module-driven system that uses a multi-stage feature-promise handshake for initialization. This aligns with the core principles of the Mesgjs ecosystem.

The previous focus on expanding the SSR component system has now evolved into a complete architectural definition, which is ready for implementation. The decision to solidify this architecture before proceeding with deeper implementation or SSR/CSR synchronization work has been validated.

## Prioritized Implementation Plan

1.  **Implement Core Component Architecture** (Current Focus)
    -   Create the `MWIComponentRegistry` module.
    -   Implement the four-stage feature-promise handshake.
    -   Develop the `mwi-html-core` module to register all standard, safe HTML elements.
    -   Create the `mwi-scripting` module as a separate, secure provider for `<script>` functionality.
    -   Develop a new, metadata-driven generic handler for `h.*` primitives.

2.  **SSR/CSR Synchronization** (On Hold)
    -   Will be revisited after the core component system is implemented and stable.

3.  **Semantic Component Library** (Future)
    -   Design and implement a library of higher-level "smart" components (e.g., `button`, `card`, form elements).

## Next Steps

1.  Begin implementation of the `MWIComponentRegistry` as a new Mesgjs module.
2.  Create the `mwi-html-core` module and its `registerMwiComponents` function.
3.  Establish the initial MWI application bootstrap logic that performs the feature promise handshake.