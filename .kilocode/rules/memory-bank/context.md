# Current Context

**SUBTASK:** Architect a proper workflow for testing `.msjs` files. This will likely involve updating `test.esm.js` to support a transpiler function that returns data URLs for modules without directly importing them. This will be implemented in a new task.

**CHECKPOINT:** The current testing approach for `.msjs` files is flawed. The work on this has been stopped, and the next step is to revert the testing files to a stable state.

---

**BLOCKED:** The architectural simplification task is currently blocked by an issue in the `msjstrans` tool. The tool is failing to resolve its internal dependencies when run from outside its own directory, which prevents the successful transpilation of the new `mwi-component-registry.msjs` module.

This issue must be resolved in the upstream Mesgjs project before testing and final validation of the architectural changes can proceed.

## Key Outcomes (So Far)

*   `MWIComponentFactory.esm.js` has been removed.
*   `MWIComponentRegistry.esm.js` has been refactored into a canonical Mesgjs module: `mwi-component-registry.msjs`.
*   `MWISSR.esm.js` has been updated to use the component registry directly.
*   A new test file, `test/server/MWISSR.test.js`, has been created.
*   The `architecture.md` file has been updated to reflect the removal of the factory and the streamlined component resolution process.

## Next Steps (When Unblocked)

1.  Transpile the new `mwi-component-registry.msjs` and `mwi-html-script.msjs` modules using the fixed `msjstrans` tool.
2.  Run the tests in `test/server/MWISSR.test.js` to validate the entire refactored component resolution flow.
3.  Once tests are passing, this preempting task will be complete, and the original `h.script` refactor follow-on task can be resumed.