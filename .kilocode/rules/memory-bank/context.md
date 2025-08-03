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

**CURRENT DEBUGGING SESSION:**
The `MWISSR.test.js` test is failing. The renderer is producing raw VNode output instead of HTML, indicating a problem in the `MWISSRVNode`'s `outerHTML` implementation. Additionally, the feature promise `mwi.components.ready` was renamed to `mwi.componentsReady` to avoid a prefix collision. The next step is to fix the `outerHTML` getter and update the test to reflect the correct output.
[User note: I think it's actually significantly more likely that the VNode tag formatting options (e.g. `noTag`, `openOpen`) aren't making it through and that the VNode is just falling back to its default formatting. We should check that first.]