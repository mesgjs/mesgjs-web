# Architectural Synthesis for `h.script` Refactoring (FINAL)

This document provides the definitive architectural synthesis for refactoring the `h.script` component, based on a full-stack review from the component authoring guide down to the `MWIVNode` implementation. It corrects previous misunderstandings and establishes a clear path forward that respects existing interfaces while integrating the new SFC packaging standard.

## 1. The Core Misunderstanding: Handler vs. Factory

My initial approach was flawed because I conflated the role of the component **handler** with the role of the VNode **factory** (`MWISSRVNode.fromData`).

-   The **VNode Factory** is responsible for creating a VNode instance *from* raw data and applying fundamental options (like `rawContent: true`).
-   The **Component Handler** is responsible for applying business logic and security constraints *to* an already-created VNode instance.

## 2. The Missing Link: Component Specifications

The `MWISSR` currently calls `MWISSRVNode.fromData(nodeData)` without any special options. However, as seen in the original `hScript` handler, creating a `<script>` VNode requires `rawContent: true`.

The critical insight is that the **Component Registry** must become the source of truth not just for handlers, but for component **specifications**. When the `MWIComponentFactory` retrieves a component, it must also retrieve the `opts` payload required by the `MWIVNode.fromData` factory method.

The rendering pipeline must be updated as follows:

1.  **Component Registration**: An SFC registers not just its handler, but a full specification object, e.g., `{ handler: hScriptHandler, options: { rawContent: true } }`.
2.  **Component Factory**: The `MWIComponentFactory.get(type)` method returns the full `spec` object.
3.  **Renderer (`MWISSR._renderNode`)**:
    -   Before creating the VNode, it calls `this._componentFactory.get(vnode.type)`.
    -   It then calls `const vnode = MWISSRVNode.fromData(nodeData, spec?.options || {})`.
    -   It then proceeds to call `spec.handler(vnode, context)` if a handler exists.

This change correctly centralizes the responsibility for VNode creation options within the component's own definition, keeping the renderer generic.

## 3. Final `h.script` Implementation

Based on this corrected understanding, the refactoring is now clear.

### `mwi-html-script.slid`

This file remains as previously designed:
```slid
[(
    modreq = 'mwi/registry 0.1.0'
)]
```

### `mwi-html-script.msjs`

The implementation will register the full component spec.

```javascript
[(
    modpath = mwi/html/script
    version = 0.1.0
    featpro = "mwi.components.mwi.html.script"
    featreq = "mwi.componentRegistryReady"
)]

@js{
    /**
     * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
     * @license MIT
     */
    const { getInstance, fwait, fready } = globalThis.$c;

    function loadMsjs(mid) {
        if (!mid) throw new Error('Cannot load mwiHtmlScript without module management');

        fwait('mwi.componentRegistryReady').then(() => {
            const registry = getInstance('MWIComponentRegistry');

            /**
             * The handler for h.script. It receives a pre-constructed VNode
             * and enforces security constraints by sanitizing its content.
             */
            const hScriptHandler = (vnode, context) => {
                if (Array.isArray(vnode.children)) {
                    let content = vnode.children.join('');
                    const closeTagIndex = content.search(/<\/script\s*>/i);

                    if (closeTagIndex !== -1) {
                        content = content.slice(0, closeTagIndex);
                    }
                    // Replace children with the single sanitized string.
                    vnode.children = [ content ];
                }
                return vnode;
            };

            // Register the full component specification. The `options` will
            // be used by MWISSRVNode.fromData() before the handler is called.
            const componentSpec = {
                handler: hScriptHandler,
                options: {
                    rawContent: true, // Prevents the renderer from HTML-escaping the content.
                    tag: 'script' // Ensures the correct tag is used, overriding the type.
                }
            };

            registry("registerComponent", "h.script", componentSpec);
            fready(mid, "mwi.components.mwi.html.script");
        });
    }

    export { loadMsjs };
@}
```

## 4. Plan of Action

1.  **Create `src/shared/components/mwi-html-script/mwi-html-script.slid`**.
2.  **Create `src/shared/components/mwi-html-script/mwi-html-script.msjs`** with the final, correct implementation above.
3.  **Delete the old handler file**: `src/server/components/mwi-html-script-handler.esm.js`.
4.  Acknowledge that **follow-on work is required** in `MWIComponentFactory` and `MWISSR` to support passing the `spec.options` to the `MWISSRVNode.fromData` method. This task is confined to refactoring the component itself. I will add this to the "verify" step to ensure it is not forgotten.

This plan is now architecturally sound and respects all existing interfaces and patterns.

[Looks good. FYI, these arch synth reviews are usually short-lived and just presented in the chat.]