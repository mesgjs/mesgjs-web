# Current Context

Permanent note: In general, please do not hyper-link test files. Reasonable exceptions include *while* troubleshooting test cases in a specific file.

**CONTEXT:** Implemented computed attribute enhancements and id attribute system. All code changes complete for `m.percl`/`class` computed attributes, `@@`/`@#` shortcuts with escapes, and full `id` attribute functionality including type checking, computed attribute support, and `document.getDocById()` with WeakRef index tracking.

**COMPLETED ACTIONS (2025-11-08):**

**Computed Attribute Enhancements:**
1. **Updated `computeAttr()` function** in [`src/mwi-doc-node.msjs`](src/mwi-doc-node.msjs:220-232)
   - Implemented functional replacement for `@@` and `@#` shortcuts using switch/case
   - `@@` expands to slot-source component ID (`m.ci`)
   - `@#` expands to slot-source doc-node ID (`m.id`)
   - Only accesses attributes when/if referenced in the computed string

2. **Added escape sequences** in [`getVal()`](src/mwi-doc-node.msjs:234-243)
   - `<.aa>` → `@@` (at-at escape)
   - `<.ap>` → `@#` (at-pound escape)

3. **Updated documentation** in [`docs/MWIDocNode-document-node.md`](docs/MWIDocNode-document-node.md) and AI training docs
   - Documented that `m.percl` and `class` are computed attributes (unless `coat: false`)
   - Added shortcuts and escapes to `m.coat` section
   - Noted that unlike `m.coat`, only the result is stored (not the expression)

**ID Attribute System:**
1. **Implemented type checking and normalization** in [`opSetAttr()`](src/mwi-doc-node.msjs:478-497)
   - Accepts string or number (normalized to string)
   - Clears on undefined/null/false
   - Ignores other types
   - Made `id` a computed attribute (unless `coat: false`)

2. **Created id index system**
   - Added Map of WeakRefs in [`MWIDocument.opInit()`](src/mwi-document.msjs:68)
   - Implemented [`document.getDocById(id)`](src/mwi-document.msjs:206-219) with numeric id normalization
   - Created [`document.updIdIndex()`](src/mwi-document.msjs:221-238) internal message handler
   - Implemented [`updateIdIndex()`](src/mwi-doc-node.msjs:290-293) helper function
   - Updated [`opDelAttr()`](src/mwi-doc-node.msjs:308-315) to handle id deletion

**REMAINING WORK:**
- Update tests for `m.percl`/`class` computed attributes
- Create tests for id attribute functionality
- Document detailed id attribute behavior and patterns

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
