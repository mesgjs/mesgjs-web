# MWI Test-Mode Runtime Architecture

---
**Status:** ACTIVE
**History:**
- 2025-07-29: ACTIVE
**Scope:** Outlines the architecture for a "test mode" and integrated test harness for the MWI system.
**Replaces:**
**Replaced by:**
**Related:**
---

## 1. Introduction

This document outlines the architecture for a "test mode" and integrated test harness for the MWI system. The goal is to enable realistic, integration-style testing by assembling a complete MWI stack using real components and services, with dependency injection used to connect them. This approach minimizes mocking and ensures that tests are run against a configuration that is as close to production as possible.

## 2. Core Concepts: Dependency Injection and the Integrated Stack

The core of this architecture is a test harness that instantiates and "wires up" the various services and components that make up the MWI stack. The key principle is the consistent use of Dependency Injection, allowing for a fully integrated yet testable system.

The test harness will be responsible for:
1.  **Instantiating Services:** Creating instances of all core services (`ConfigurationService`, `MWIComponentFactory`, `MWIResourceCollectorService`, etc.).
2.  **Injecting Dependencies:** Passing service instances into the constructors of their consumers (e.g., injecting the services into `MWISSR`).
3.  **Providing a Testable Surface:** Exposing the fully assembled components (like `ssr` and `registry`) to the tests.

## 3. Test Mode Lifecycle and Workflow

1.  **Harness Initialization:** A test harness file (`test/harness.js`) will import and initialize the real Mesgjs runtime.
2.  **Test-Specific Configuration:** A new `setupTestRuntime` helper function within the harness will accept a configuration object, primarily a list of feature strings (e.g., `['mwi.components.my-component']`). It will call `globalThis.$c.setModMeta` to configure the runtime with this feature list.
3.  **Dynamic Module Loading:** The test itself will use dynamic `import()` to load the specific component modules it needs to test.
4.  **Feature Readiness:** The dynamically imported modules will call `$c.fready()` as they normally would (feature ownership is not verified when `testMode` is set in the module metadata configuration, as is the case for the test harness, so any module id (mid) placeholder value will do).
5.  **Coordination with `fwait`:** The test will use the real `$c.fwait()` to wait for the expected features to be ready before creating component instances or running assertions.

## 4. Architectural Diagram: Test Harness Assembly

This diagram shows how the test harness assembles the MWI stack.

```mermaid
graph TD
    subgraph "Test Harness (`setupTestRuntime`)"
        A(Start) --> B[Instantiate ConfigurationService];
        A --> C[Instantiate MWIComponentFactory];
        A --> D[Instantiate MWICssProcessorService];
        A --> E[Instantiate MWIResourceCollectorService];
        A --> F[Instantiate MWIScopeManagerService];
        A --> G[Instantiate MWIUrlValidatorService];

        B --> H{MWISSR};
        C --> H;
        D --> H;
        E --> H;
        F --> H;
        G --> H;

        H --> I[Return {ssr, registry, ...} to test];
    end
```

## 5. Proposed `test/harness.js` API

The API of `test/harness.js` will be updated to reflect the new, integrated approach. It will be responsible for the complete instantiation and dependency injection of the MWI stack.

```javascript
// test/harness.js (Conceptual)
import { MWISSR } from 'mesgjs-web/src/server/MWISSR.esm.js';
import { ConfigurationService } from 'mesgjs-web/src/shared/ConfigurationService.esm.js';
import { MWIComponentFactory } from 'mesgjs-web/src/shared/MWIComponentFactory.esm.js';
// ... other service imports ...

export async function setupTestRuntime(testConfig = {}) {
    // 1. Instantiate Services
    const configService = new ConfigurationService(testConfig.config);
    const componentFactory = new MWIComponentFactory({ configService });
    const resourceCollector = new MWIResourceCollectorService();
    // ... and so on for other services

    // 2. Inject Dependencies into MWISSR
    const ssr = new MWISSR({
        componentFactory,
        resourceCollector,
        // ... and so on for other services
    });

    // 3. Provide the testable surface
    return {
        ssr,
        registry: componentFactory.getRegistry(),
        configService
    };
}
```

This updated harness will provide a realistic and robust platform for writing integration tests that require zero mocks, finally addressing the core testability issues in the system.