---
**Status:** REVIEW
**History:**
- 2025-07-29: REVIEW
**Scope:** A system-wide audit of testability issues, with recommendations to refactor key services using Dependency Injection.
**Replaces:**
**Replaced by:**
**Related:** MWI-Test-Runtime.md
---
# MWI Testability Audit Recommendations

## 1. Executive Summary

A system-wide audit was conducted to address the testability issues and "fragile mocks" identified during the development of the SSR slotting system. The audit concludes that the root cause of these issues is not the individual components themselves, but rather a systemic reliance on direct instantiation and singleton patterns, which violate the principle of Dependency Injection.

This document proposes a series of refactorings to address these issues. The core principle of these recommendations is to consistently apply Dependency Injection across the system, enabling true unit testing and making the system more robust, maintainable, and easier to develop.

## 2. Key Findings and Recommendations

### 2.1. `MWISSR` Service Orchestrator

*   **Problem:** The `MWISSR` class directly instantiates its four service dependencies (`MWIResourceCollectorService`, `MWIScopeManagerService`, `MWICssProcessorService`, `MWIUrlValidatorService`), making it impossible to test the orchestrator's logic in isolation.
*   **Recommendation:** Refactor the `MWISSR` constructor to accept its service dependencies as arguments.

**Current Code:**
```javascript
// src/server/MWISSR.esm.js
constructor (componentFactory) {
    this._componentFactory = componentFactory;
    this._resourceCollector = new MWIResourceCollectorService();
    this._scopeManager = new MWIScopeManagerService();
    this._cssProcessor = new MWICssProcessorService();
    this._urlValidator = new MWIUrlValidatorService();
}
```

**Proposed Refactor:**
```javascript
// src/server/MWISSR.esm.js
constructor ({ componentFactory, resourceCollector, scopeManager, cssProcessor, urlValidator }) {
    this._componentFactory = componentFactory;
    this._resourceCollector = resourceCollector;
    this._scopeManager = scopeManager;
    this._cssProcessor = cssProcessor;
    this._urlValidator = urlValidator;
}
```

### 2.2. `ConfigurationService`

*   **Problem:** The `ConfigurationService` is tightly coupled to global objects (`Deno`, `location`) and is exported as a singleton instance. This makes it and its consumers extremely difficult to test.
*   **Recommendation:**
    1.  **Export the Class:** The module should export the `ConfigurationService` class, not a singleton.
    2.  **Inject Configuration Sources:** The constructor should accept a configuration object, rather than reading from global sources itself. The logic for reading from the environment and URL should be extracted into separate, testable functions.

**Current Code:**
```javascript
// src/shared/ConfigurationService.esm.js
class ConfigurationService {
    constructor(initialConfig = {}) {
        // Complex logic that reads from Deno.env and location.search
    }
}
export const configService = new ConfigurationService();
```

**Proposed Refactor:**
```javascript
// src/shared/ConfigurationService.esm.js

// Export the class for instantiation
export class ConfigurationService {
    constructor(config = {}) {
        this._config = config;
    }
    // class methods like get(), set(), getAll()
}

// A default instance can be created in the main application entry point,
// but this singleton should not be used by other modules.
export const defaultConfigurationService = new ConfigurationService({
    /* ... logic to read from env/url ... */
});
```

### 2.3. `MWIComponentFactory`

*   **Problem:** The real `MWIComponentFactory`, responsible for module resolution and component instantiation, has not yet been built. The system is relying on two different placeholder mocks (`MWISSRFactory` and the fake in `test/harness.js`). This is a major gap in the architecture and a primary blocker to true integration testing.
*   **Recommendation:** Prioritize the implementation of the real `MWIComponentFactory` as defined in the system architecture. This is the most critical step toward enabling robust integration tests. The new test harness should be updated to use this real factory.

### 2.4. `PageTemplate` Testability

*   **Problem:** The current tests use a simple, ad-hoc mock for the `PageTemplate` object. This is inefficient and brittle, as tests must be updated whenever the real `PageTemplate` interface changes.
*   **Recommendation:** The `MWIDefaultPageTemplate` should be made more robust so it can be used directly in tests. It should be capable of operating in a "test mode" where it can be inspected without rendering a full HTML document. The `ssr.render` method should accept a real, configurable `PageTemplate` instance.

### 2.5. `MWIComponentFactory`

*   **Problem:** The real `MWIComponentFactory`, responsible for module resolution and component instantiation, has not yet been built. The system is relying on two different placeholder mocks (`MWISSRFactory` and the fake in `test/harness.js`). This is a major gap in the architecture and a primary blocker to true integration testing.
*   **Recommendation:** Prioritize the implementation of the real `MWIComponentFactory` as defined in the system architecture. This is the most critical step toward enabling robust integration tests. The new test harness should be updated to use this real factory.

## 3. Mesgjs Packaging Considerations

A core architectural constraint is that the entire MWI system must ultimately be packaged as Mesgjs modules. To facilitate sharing classes and services across these modules, the following pattern must be adopted:

*   **Service Interfaces:** Core services and classes (like `ConfigurationService`, `MWISSRVNode`, etc.) should be attached as public JavaScript properties to singleton Mesgjs interfaces.
*   **Dependency Injection via Interfaces:** Modules will consume these services by importing the singleton Mesgjs interface and accessing the class/service from its properties.

This approach allows for a clean separation of concerns and leverages the Mesgjs module system for managing dependencies, while still allowing for the use of standard JavaScript classes. All proposed refactoring must be compatible with this packaging strategy.

## 4. Impact on Test Harness

The proposed changes will necessitate an update to the `test/harness.js`. The `setupTestRuntime` function should be updated to:
1.  Instantiate the real `MWIComponentFactory`.
2.  Instantiate the refactored `ConfigurationService`.
3.  Instantiate the four SSR services.
4.  Instantiate the `MWISSR` and inject all of its dependencies.

This will create a `test/harness.js` that assembles a complete, integrated instance of the MWI stack, enabling tests that are both realistic and robust.
---

## Summary of Status

**Overall Status:** Not Started
**Last Updated:** 2025-07-29

**Key Outcomes:**
- None.

**Deferred Items:**
- None.