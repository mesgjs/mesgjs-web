# MWI Rendering Engine: Core Requirements

**Date:** 2025-06-19

This document outlines the foundational requirements for the Mesgjs Web Interface (MWI) rendering engine. It serves as the primary reference for all architectural decisions to ensure the final implementation is robust, flexible, and meets the needs of all target users.

## 1. Core Principles

*   **Bilingual by Design:** The entire rendering pipeline must be fully "bilingual," supporting both native JavaScript (Arrays, Objects, Functions) and Mesgjs (`@list`/NANOS, `@function`) at every level. This includes page data, component definitions, and handler interfaces.
*   **Programmer Efficiency:** The system must be designed to minimize boilerplate and streamline common tasks. APIs should be intuitive and efficient. Where copying is necessary, it should be abstracted away within the core interfaces.
*   **Dual Audience Support:** The architecture must cater to both experienced software engineers and less technical web developers. This means providing both powerful, low-level control ("smart" components) and simple, declarative options ("low-code" components).

## 2. Functional Requirements

### 2.1. Data Input
*   The rendering pipeline must accept page description data in either standard JSON (Arrays/Objects) or Mesgjs's SLID/NANOS format.

### 2.2. Component Architecture
*   **Declarative ("Low-Code") Components:** The system must support a purely declarative component form. These components are defined as data structures (Array or NANOS) and must provide a simple, intuitive mechanism (e.g., a `m.slot` token) to specify where the component instance's children should be rendered within the template.
*   **Programmatic ("Smart") Components:** The system must support components defined as functions. These handlers provide maximum flexibility for complex logic.
    *   **Bilingual Handlers:** "Smart" handlers must be invokable whether they are native JavaScript functions or Mesgjs `@function` instances.
    *   **Unified Interface:** The arguments passed to and the values returned from these handlers must be accessible and usable from both JavaScript and Mesgjs.

### 2.3. Rendering Logic
*   **In-Place Modification:** To maximize efficiency, the system should allow for in-place modification of virtual nodes wherever possible. Since the `VirtualNode` is already a copy of the initial page data, handlers should be able to directly manipulate the node they receive.
*   **Streamlined Primitives:** Common operations, such as creating primitive HTML elements (e.g., `h.div`), should be highly streamlined and require minimal boilerplate.

## 3. Non-Functional Requirements

*   **Maintainability:** The architecture must be easy to understand, debug, and extend. Logic should be centralized where appropriate to avoid duplication.
*   **Consistency:** The Server-Side Rendering (SSR) and Client-Side Rendering (CSR) pipelines should be as architecturally similar as possible to ensure consistent behavior and a unified developer experience.