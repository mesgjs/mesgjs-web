# MWI Architectural Feature Audit

**Date:** 2025-07-26

## 1. Introduction

This document is the result of an audit comparing historical architectural plans against the current (v3+) architectural documentation. The goal was to identify any significant, user-facing features that were present in older plans but appear to be missing from the current architecture, and were not explicitly replaced or deprecated.

## 2. Methodology

The audit involved a comprehensive review of all Markdown files within `architectural-plan/` and `architectural-plan/historical/`. Features from historical documents were cataloged and then cross-referenced against the current set of architectural plans (`MWI-Architecture-v3-Core.md`, `MWI-Component-System.md`, `MWI-Semantic-Component-Architecture.md`, etc.).

## 3. Key Findings: Dropped Features

The audit identified one major feature set that appears to have been unintentionally lost during the architectural evolution from v2 to v3.

### 3.1. Declarative Component Slotting (`m.slot` and `m.attrs`)

*   **Description:**
    The `architectural-plan/historical/MWI-Architectural-Plan-v2.md` defined a critical "Slotting Mechanism" for declarative components. This mechanism allowed a component instance to inject both content (nodes) and attributes into its template-defined structure.
    *   **Node Slotting (`m.slot`):** An `m.slot` component within a template would act as a placeholder. It would be replaced by child nodes from the component's instance, identified by a matching `:slot` attribute. This is the standard mechanism for passing child content into a wrapped component.
    *   **Attribute Slotting (`m.attrs`):** An `m.attrs` component in the instance data would contain a set of attributes. These attributes would be merged onto an element in the template that had a matching `:slot` attribute. This allowed for customizing the properties of specific elements deep inside a component's template.

*   **Last Known Location:** `architectural-plan/historical/MWI-Architectural-Plan-v2.md`

*   **Analysis:**
    This entire mechanism is absent from the current v3+ architecture documents. The current plans state that declarative components are "composition-based" and "template-driven," but they do not specify the mechanism by which this composition occurs. The modern "Component Payload" system defines how a component provides its *own* content and resources (`content`, `scopedCss`, etc.), but does not define how a component *consumes* or *places* content passed to it by its user.

*   **Conclusion:** **Feature Accidentally Dropped.** The slotting mechanism is a fundamental capability for a component-based UI framework. Its absence appears to be an oversight rather than a deliberate design decision to remove the functionality. Without it, creating reusable declarative components that wrap user-provided content is not possible as currently architected.

## 4. Recommendations

It is recommended that the component composition model be explicitly defined in the current architecture. The `m.slot`/`m.attrs` model from v2 is a viable candidate for re-introduction, as it provides a clear and powerful solution to the problem. If a different mechanism is preferred, it should be documented to fill this functional gap.