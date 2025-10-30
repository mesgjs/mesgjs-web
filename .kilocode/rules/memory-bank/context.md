# Current Context

**CONTEXT:** Completed comprehensive template tests for MWICoreTpl interface. Both core and SSR test files created with full coverage. Updated memory bank with key architectural insights about slotSrc behavior and test-mode late registration. Ready to continue with remaining test coverage.

**COMPLETED ACTIONS (2025-10-30):**
1. Created `test/ssr-html/template.test.js` (348 lines, 38 test steps)
   - Basic HTML rendering (simple, empty templates)
   - Multiple items and nested structure rendering
   - Mixed content types (text, comments, fragments)
   - Slot integration (template as slotSrc for its content)
   - Named slots filled from template attributes
   - Default slots with natural children
   - HTML elements rendering
   - Template attributes don't render in output
   - Attribute slotting with m.slat (remapping from slotSrc)
   - Special characters and HTML entity escaping
   - Template with external slotSrc property
   - All tests use `allowLate: true` for dynamic registration
   - All tests pass successfully
2. Updated `test/core/template.test.js` (330 lines, 47 test steps)
   - Converted from separate test components module to inline `allowLate` registration
   - Cleaner, more maintainable test structure
   - All tests pass successfully
3. Updated memory bank with key learnings:
   - Added lesson #28: SlotSrc is interface-specific (documented behavior for each interface type)
   - Added lesson #29: Test-mode late-component-registration pattern
   - Clarified that template node itself becomes slotSrc for its content (line 229: `const slotSrc = d.rr`)

**CURRENT STATUS:**
- MWICoreTpl: COMPLETE (core tests complete, SSR tests complete)
- MWICoreSlot: COMPLETE (implementation fixed, SSR tests complete, core tests complete)
- Test plan document: Current
- Memory bank: Updated with architectural insights

**NEXT STEPS:**
1. Continue expanding test coverage per detailed specifications:
   - Registry tests: Add ID generation, component retrieval (`getSync`), hydration tests
   - Document tests: Create dedicated test files for `MWIDocument` interface
   - SSR doc-node tests: Expand per `doc-node-tests.md` SSR section
   - Compound tests: Create high-level rendering tests
2. Begin CSR/DOM testing (entire `test/csr-dom/` directory)

**IMPORTANT NOTES:**
- Test files follow dual-syntax pattern: Mesgjs messages first, then JS methods
- Core tests focus on interface behavior and spec management
- SSR tests focus on HTML rendering output
- Test-mode late registration (`allowLate: true`) enables cleaner test organization
- SlotSrc behavior is interface-specific: base nodes are sources, fragments/HTML pass through, templates/slots create internal fragments with self as source

---

## Recently Completed Major Milestones

1. **MWICoreSlot Core Tests Created (2025-10-29)** - Comprehensive core-level testing for slot interface with 47 test steps covering all interface behaviors
2. **Test Plan Documentation Updated (2025-10-29)** - Corrected outdated information about MWICoreSlot implementation and test status
3. **Reactive DOM Requirements Enhancement (2025-10-29)** - Comprehensive source code audit and documentation update with critical reactive patterns
4. **Test Plan Comprehensive Review (2025-10-25)** - Reviewed and updated all test plan documents to align with current source code implementation
5. **MWICoreSlot Implementation Fix (2025-10-25)** - Fixed inconsistent message sending in slot attribute retrieval
6. **Test File Consolidation (2025-10-25)** - Properly organized test files by interface, removed redundant files
7. **Slot Test Completion (2025-10-25)** - Added dual-syntax coverage and uncommented all tests
