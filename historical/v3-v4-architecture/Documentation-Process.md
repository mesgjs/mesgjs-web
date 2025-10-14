# MWI Architectural Document Process Enhancement

**STATUS**: STANDARD
**HISTORY**:
- 2025-07-29 ACTIVE
- 2025-07-29 DRAFT (submitted by Kilo Code)

## 1. Problem Statement

A review of the MWI architectural documentation process has determined that the current indexing method and lack of formal process are insufficient. This leads to several issues:

*   **Difficulty in Assessing Document Relevance:** It is hard to determine if a document is a current plan, an outdated idea, or a supplemental guide.
*   **Unclear Internal Progress:** For documents that contain lists of tasks or issues (e.g., reviews, multi-step implementation plans), there is no standard way to track the completion status of individual items, making it difficult to assess overall progress.
*   **Risk of Conflicting Implementations:** Developers may consult and implement obsolete or draft-status plans, leading to wasted effort and architectural drift.

## 2. Recommendations

To address these issues, I propose a new, four-part documentation process.

### 2.1. Recommendation 1: Adopt an In-File Metadata Block

Every architectural document in the `architectural-plan/` directory **must** begin with a structured metadata block.

**Format:**
```markdown
---
**Status:** [DRAFT | ACTIVE | SUPERSEDED | ARCHIVED | STANDARD | REVIEW]
**History:**
- YYYY-MM-DD: [STATUS]
**Scope:** [A one-sentence summary of the document's purpose.]
**Replaces:** [Link to document, if any]
**Replaced by:** [Link to document, if any]
**Related:** [Link(s) to related documents]
---
```

### 2.2. Recommendation 2: Implement a Formal Document Lifecycle

A formal lifecycle must be adopted. The `Status` field indicates the current state, and the `History` block provides a complete log of all status changes.

1.  **`[DRAFT]`:** A new proposal under discussion. Not to be implemented against.
2.  **`[ACTIVE]`:** A current, approved architectural plan that must be followed. The approval process **must** include an audit of the new plan against all other `[ACTIVE]` and `[STANDARD]` documents to identify and resolve any introduced conflicts or redundancies. Any documents that are superseded by the new plan must be updated to `[SUPERSEDED]` status as part of this step.
3.  **`[SUPERSEDED]`:** Replaced by a newer document. Must not be implemented against.
4.  **`[ARCHIVED]`:** Kept for historical context only. The file is moved to `architectural-plan/historical/`.
5.  **`[STANDARD]`:** An authoritative document defining a mandatory implementation pattern (e.g., a tutorial). It is a required standard.
6.  **`[REVIEW]`:** A document, such as a code review or issue list, that contains a set of actionable items. Its lifecycle is governed by the status of its internal tasks (see section 2.3).

### 2.3. Recommendation 3: Standardize Intra-Document Status Tracking

For documents that contain lists of actionable items (typically those with `Status: [REVIEW]`), a standard format for tracking the state of each item and summarizing the overall progress must be used.

#### 2.3.1. Item-Level Annotations
Each actionable item, section, or list item should be annotated with its current status and the date of the last update.

**Format:**
- **`Status (YYYY-MM-DD):`** [PENDING | DONE | DEFERRED] - *Description of the finding or action item.*

**Example:**
> -   **Status (2025-07-29):** DONE - *Resolve Data Binding: Formally adopt the `d.*`/`v.*` attribute prefix scheme.*
> -   **Status (2025-07-29):** DEFERRED - *Defer Private Inputs: Postpone the implementation of `private-input-*` components.*

The absence of a status annotation implies that the task has not been initiated.

#### 2.3.2. Document Summary Footer
Every `[REVIEW]` or multi-step-implementation document **must** end with a summary block that gives an at-a-glance overview of its state. The `Last Updated` field in this footer tracks updates to the *internal tasks* of the document, distinct from the overall document lifecycle status tracked in the header `History`.

**Format:**
```markdown
---

## Summary of Status

**Overall Status:** [Not Started | In Progress | Completed | Completed with Deferrals]
**Last Updated:** YYYY-MM-DD

**Key Outcomes:**
- [Summary of what has been completed.]

**Deferred Items:**
- [List of any items marked as DEFERRED, with a brief note on why.]
```

### 2.4. Recommendation 4: Revise the `tech.md` Index

The `tech.md` memory bank file must be updated to use a structured format reflecting this new metadata.

**Proposed `tech.md` Index Format:**
```markdown
#### [System or Feature Area]

*   **Document:** `[Link to file]`
    *   **Status:** [DRAFT | ACTIVE | SUPERSEDED | ARCHIVED | STANDARD | REVIEW]
    *   **Scope:** [A one-sentence summary of the document's purpose.]
    *   **Relationships:** [Links to related documents.]
```

## 3. Next Steps

1.  **Adoption:** Formally adopt this proposal as the official process. [2025-07-29: DONE]
2.  **Implementation:** Create a new task to audit all existing documents, add the required metadata and summary blocks, and update the `tech.md` index.
3.  **Maintenance:** Adhere to this process for all future architectural changes and reviews.