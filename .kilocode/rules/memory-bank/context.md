# Current Context

Permanent note: In general, please do not hyper-link test files. Reasonable exceptions include *while* troubleshooting test cases in a specific file.

**CONTEXT:** Completed test coverage for computed attribute enhancements and id attribute system. All tests passing (100%).

**COMPLETED ACTIONS (2025-11-09):**

**Test Coverage for Computed Attributes:**
1. **Added `m.percl` with `@@` tests** in test/ssr-html/doc-node.test.js
   - Tests `@@` expansion to `m.ci` in templates
   - Tests `@@` with prefixes/suffixes (e.g., `@@__custom`)
   - 4 test steps covering both Mesgjs and JS APIs

2. **Added `class` with `@@` tests** in test/ssr-html/doc-node.test.js
   - Tests `@@` expansion to `m.ci` in templates
   - Tests `@@` with additional classes
   - 4 test steps covering both Mesgjs and JS APIs

3. **Added `m.coat` escape tests** in test/ssr-html/doc-node.test.js
   - Tests `<.aa>` escape for literal `@@` in computed attributes
   - Tests `<.ap>` escape for literal `@#` in computed attributes
   - 4 test steps covering both Mesgjs and JS APIs

**Test Coverage for ID Attribute:**
1. **Added `id` type checking tests** in test/core/doc-node.test.js
   - Tests string and number acceptance (with normalization)
   - Tests clearing on undefined/null/false
   - Tests ignoring of other types
   - 8 test steps covering both Mesgjs and JS APIs

2. **Added `id` with `@#` tests** in test/ssr-html/doc-node.test.js
   - Tests `@#` expansion to parent `m.id`
   - Tests hierarchical id pattern (e.g., `@#-child-id` → `parent-id-child-id`)
   - Tests `<.ap>` escape for literal `@#`
   - Tests `coat: false` to disable computation
   - 8 test steps covering both Mesgjs and JS APIs

3. **Added `document.getDocById()` tests** in test/core/doc-node.test.js
   - Tests finding nodes by string and numeric ids
   - Tests numeric id normalization for lookup
   - Tests disconnected nodes
   - Tests collision handling (last assignment wins)
   - Tests id clearing and changing
   - 10 test steps covering both Mesgjs and JS APIs

**TEST RESULTS:**
- All new tests passing (100%)
- Total new test steps: 38
- Core doc-node tests: +18 steps
- SSR HTML doc-node tests: +20 steps

**NOTES:**
- `@@` is not a valid class name character, so `<.aa>` escape tests must use `m.coat` with non-class targets
- `m.ci` is immutable (set by registry) and read-only
- `m.id` can change but shouldn't in practice
- Computed attributes (`m.percl`, `class`, `id`) compute once when set, not reactively

**PREVIOUS CONTEXT:** Scoped CSS test suite COMPLETE. Fixed SLID boundary markers in test/core/scoped-css.test.js and updated test plan documentation to reflect 100% completion of all scoped CSS test coverage.

**COMPLETED ACTIONS (2025-11-07):**

**Scoped CSS Test Completion:**
1. **Fixed SLID Boundary Markers in test/core/scoped-css.test.js**
   - Corrected all 14 `ps()` calls to include required `[(` and `)]` boundary markers
   - Preserved inner `[ ]` node boundaries as required by SLID format
   - Example: `ps('[node]')` → `ps('[( [node] )]')`

2. **Updated v5-arch/scoped-css-tests.md**
   - Marked all core interface tests as complete (100%)
   - Marked all m.ci virtual attribute tests as complete (100%)
   - Marked all m.coat with m.ci integration tests as complete (100%)
   - Marked all CSS deduplication tests as complete (100%)
   - Updated overall status to 100% complete across all test categories

**TEST COVERAGE SUMMARY:**
- Core interface tests: 27 test steps (100% complete)
- SSR HTML tests: 100% complete
- SSR compound tests: 100% complete
- CSR DOM tests: 100% complete
- CSR compound tests: 100% complete

**CURRENT STATUS:**
- MWI V5 core implementation: COMPLETE
- Test suite: COMPLETE (30/30 files, 100% passing)
- Scoped CSS system: FULLY TESTED
- All architectural plans: IMPLEMENTED
- Ready for production use

---

## Recently Completed Major Milestones

1. **setSubSpec API Signature Update (2025-11-03)** - Updated all test files to use new setSubSpec signatures, removed outdated async/await, updated documentation, all 29 tests passing
2. **Doc-Node and Document CSR Tests Created (2025-11-03)** - Complete CSR/DOM test coverage for doc-node (40 steps) and document (34 steps) with comprehensive rendering, reactive, and edge-case testing
2. **Defer CSR Tests Created (2025-11-03)** - Complete CSR/DOM test coverage for defer nodes with 24 test steps covering rendering, attribute filtering, and reactive behavior
3. **Template CSR Reactive Slotting Tests (2025-11-03)** - Enhanced template.test.js with comprehensive reactive slotting coverage including attribute changes, sub-spec changes, and sub-doc append operations
3. **MWICoreSlot Core Tests Created (2025-10-29)** - Comprehensive core-level testing for slot interface with 47 test steps covering all interface behaviors
3. **Test Plan Documentation Updated (2025-10-29)** - Corrected outdated information about MWICoreSlot implementation and test status
4. **Reactive DOM Requirements Enhancement (2025-10-29)** - Comprehensive source code audit and documentation update with critical reactive patterns
5. **Test Plan Comprehensive Review (2025-10-25)** - Reviewed and updated all test plan documents to align with current source code implementation
6. **MWICoreSlot Implementation Fix (2025-10-25)** - Fixed inconsistent message sending in slot attribute retrieval
7. **Test File Consolidation (2025-10-25)** - Properly organized test files by interface, removed redundant files
