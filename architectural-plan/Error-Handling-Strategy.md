# MWI Error Handling Strategy

This document defines the unified error handling strategy for the Mesgjs Web Interface (MWI). Its purpose is to ensure that errors are handled consistently, predictably, and safely across both server-side and client-side components.

## 1. Fatal vs. Non-Fatal Errors

A clear distinction must be made between errors that compromise the integrity of the application and those that represent isolated failures.

### 1.1. Fatal Errors

Fatal errors are those that prevent the MWI from functioning correctly or create a potential security risk. These errors should halt the execution of the current rendering process.

-   **Core Module Failure:** Inability to load or initialize essential modules (e.g., `MWIComponentRegistry`, `MWISSR`, `MWICSR`).
-   **Configuration Errors:** Invalid or missing core configuration required for startup.
-   **Catastrophic Failures:** Unrecoverable conditions within the Mesgjs runtime itself.

### 1.2. Non-Fatal Errors

Non-fatal errors are recoverable and do not compromise the overall application. These should be logged for developers, but the application should continue to function as best as possible.

-   **Individual Component Failure:** An error during the rendering or hydration of a single component. The rest of the page should render correctly.
-   **Resource Loading Failure:** A non-critical CSS or script file fails to load.
-   **Validation Errors:** A component-level data validation fails.
-   **Pub/Sub Errors:** Failure to publish or receive a message on a specific channel.

## 2. Standard Error Object

To facilitate programmatic error handling and debugging, all MWI-specific errors thrown should conform to a standard structure.

```javascript
class MWIError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'MWIError';
    this.code = code; // e.g., 'COMPONENT_RENDER_FAILED'
    this.details = details; // e.g., { component: 'user-profile' }
  }
}
```

-   **`code`**: A machine-readable string literal identifying the error type.
-   **`details`**: An object containing contextual information relevant to the error.

## 3. User-Facing vs. Developer-Facing Errors

The strategy for displaying errors depends on the environment and the nature of the error.

### 3.1. Developer-Facing Errors (Development Environment)

In a development environment (`MWI_ENV=development`), errors should be as verbose as possible to aid in debugging.

-   **Console Logging:** All errors (fatal and non-fatal) should be logged to the console with their full stack trace and details.
-   **Visual Indicators:** A non-fatal component render error could result in the component's region being replaced with a visible error message box.

### 3.2. User-Facing Errors (Production Environment)

In a production environment (`MWI_ENV=production`), user-facing error messages must be generic and avoid exposing implementation details.

-   **Fatal Errors:** Should result in a generic "Something went wrong" page.
-   **Non-Fatal Errors:** Should be logged silently to a remote error tracking service. They should not typically be surfaced to the user unless it's an interactive failure (e.g., "Invalid email address" on a form submission).