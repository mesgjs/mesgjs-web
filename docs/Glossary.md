# Glossary Of Terms And Concepts

- **`@@` shortcut**: In `m.coat` expressions, `class` attributes, `m.percl`, and `id` attributes, `@@` expands to the slot source's component ID (`m.ci`) before expression parsing. Used to scope CSS classes to a specific component type. See also: `@#` shortcut, `m.coat`, `m.ci`.

- **`@#` shortcut**: In `m.coat` expressions, `class` attributes, `m.percl`, and `id` attributes, `@#` expands to the slot source's mandatory element ID (`m.id`) before expression parsing. Used to build hierarchical element IDs. See also: `@@` shortcut, `m.coat`, `m.id`.

- **`autoDoc`**: A schema property on doc nodes (default `true`). When `true`, sub-specs are immediately converted to live sub-doc nodes when set. When `false`, sub-specs are stored without conversion (lazy instantiation). Template components (`MWICoreTpl`) disable `autoDoc` to defer sub-spec conversion.

- **Attribute slotting**: The mechanism by which attributes are copied or computed from a slot source to a target node. Implemented via `m.slat` (direct copy) and `m.coat` (computed/assembled). See also: `m.slat`, `m.coat`, slotting.

- **Bilingual interface**: A Mesgjs interface that exposes both a Mesgjs message API and a JavaScript property/method API on the same object. MWI doc nodes are bilingual — e.g., `node('getAttr', ['class'])` and `node.getAttr('class')` are equivalent.

- **Borg render**: A CSR (client-side rendering) in "borg" mode. Assimilates existing DOM nodes via parallel tree-walking during the render so that CSR can "resume" where SSR (server-side rendering) left off. \[Not yet implemented\]

- **`c.` prefix**: Convention for naming attributes used as named slot targets. For example, `c.header` and `c.footer` are typical named slot attribute names. The prefix distinguishes slot-content attributes from regular element attributes.

- **Component**: A registered, reusable UI building block in MWI. Components are identified by a type string (e.g., `h.div`, `m.slot`, `my.button`) and are backed by either a Mesgjs interface (`if`) or a template spec (`tpl`). Components are registered in the `MWIRegistry`.

- **Component ID (`m.ci`)**: A unique, read-only identifier assigned to each registered component *type* by the registry at registration time. Format: `_MO_<base36>`. Used for scoped CSS class names and the `@@` shortcut. All instances of the same component type share the same component ID. See also: element ID, `m.ci`, scoped CSS.

- **Component registry**: See `MWIRegistry`.

- **Content slotting**: The mechanism by which a template's `m.slot` component selects and renders content from its slot source. Named slots pull from a matching attribute; unnamed slots pull from the slot source's natural children. See also: `m.slot`, slot source, slotting.

- **CSR**: Client-side rendering. The process of rendering MWI document nodes into live browser DOM nodes via `getDOM()`. CSR output is reactive — DOM updates are performed automatically when doc-node attributes or content change. Contrast with SSR.

- **`data-mwi-defer`**: An HTML attribute rendered by `MWICoreDefer` placeholder nodes. Its value is the original (deferred) component type string, allowing identification of deferred components in the DOM.

- **Deferred component**: A component registered in the registry with a feature promise (`ftr`) but without an interface or template yet loaded. When `createNode()` is called for a deferred component, an `MWICoreDefer` placeholder is created instead. The actual component loads asynchronously when its feature promise resolves.

- **Doc node**: A node in an MWI document tree. All doc nodes implement the `MWIDocNode` base interface and have a type, attributes, and optional sub-content. Doc nodes are created via `MWIDocument.createNode()`. See also: `MWIDocNode`.

- **Doc spec**: A NANOS list (or string) describing a doc node and its content. Format: `[type attr=value... children...]`. A plain string is shorthand for `[m.t t="string"]`. Doc specs are the "blueprint" for creating doc nodes. See also: sub-spec, `MWIDocNode`.

- **Document**: An `MWIDocument` instance that coordinates rendering for a single page or component tree. Each document has a root `m.frg` fragment and manages node creation, the ID index, and the list of component types used. See also: `MWIDocument`.

- **DOM**: Document Object Model. The browser's live, in-memory representation of an HTML page. In MWI, `getDOM()` returns a reactive NANOS of DOM nodes that stay synchronized with the doc-node tree.

- **Element ID**: A unique identifier for a specific doc-node *instance*, distinct from the component ID which identifies a component *type*. Server-generated element IDs use the prefix `_MS_`; client-generated IDs use `_ML_`. See also: `m.id`, component ID.

- **Fallback content**: Default content defined inside an `m.slot` node that is rendered when the slot source provides no matching content (neither a matching named attribute nor natural children).

- **Feature promise**: A named signal in the Mesgjs runtime (`fready`/`fwait`) used to coordinate asynchronous module initialization. MWI uses feature promises such as `mwi.compRegOpen` and `mwi.compRegReady` to sequence component registration and document rendering. See also: `mwi.compRegOpen`, `mwi.compRegReady`.

- **Fragment**: A "transparent container" doc node (`m.frg`, `MWICoreFrag`) that renders as the combined output of its children with no wrapper element. Fragments pass their slot source through to children unchanged (they do not create a new slotting boundary). Used as the document root and internally by templates and slots.

- **`h.` prefix**: Namespace prefix for standard HTML element component types. For example, `h.div`, `h.span`, `h.button`. All standard HTML5 elements are registered with this prefix. HTML elements are backed by the `MWIHTML` interface.

- **`htmlAllowAttr`**: A schema property (JS `Set` or Mesgjs `@set`) that, when present, restricts which attributes are rendered to HTML output. Used by `MWICoreDefer` to prevent premature rendering of attributes on placeholder nodes.

- **Hydration**: The process of attaching client-side reactivity and event handling to HTML that was initially rendered server-side (SSR). In MWI, this involves the client reading server-assigned component IDs from `globalThis.mwiServer` to ensure consistent component identification. See also: borg render, SSR, CSR.

- **`m.` prefix**: Namespace prefix for built-in MWI component types. For example, `m.frg` (fragment), `m.slot` (slot), `m.t` (text), `m.com` (comment), `m.defer` (deferred placeholder), `m.scpcss` (scoped CSS aggregator).

- **`m.ci`**: Virtual, read-only attribute on doc nodes. Returns the component ID of the node's component type (as assigned by the registry). When accessed via `m.coat` or `m.slat`, reflects the slot source's component ID. See also: component ID, `@@` shortcut.

- **`m.coat`**: "Computed attributes." A special attribute that assembles string attribute values from slot source values using an expression syntax. Format: `[target=expr...]`. Expressions use `<name>`, `<name?then>`, `<name|else>`, etc. to conditionally include slot source attribute values. See also: attribute slotting, `m.slat`, `m.ci`, `m.id`.

- **`m.com`**: The component type for HTML comment nodes (`MWICoreCom`). Renders as `<!-- text -->` in SSR and as a DOM comment node in CSR. The `t` attribute holds the comment text.

- **`m.defer`**: The component type for deferred component placeholders (`MWICoreDefer`). Renders as `<slot id="..." data-mwi-defer="originalType">` in both SSR and CSR. Created automatically by `createNode()` when a component is registered but not yet loaded.

- **`m.frg`**: The component type for fragments (`MWICoreFrag`). A transparent container with no wrapper element in output. See also: fragment.

- **`m.id`**: Virtual, read-only attribute on doc nodes. Returns the node's `id` attribute value, auto-generating and assigning a unique element ID if none has been set. Used with the `@#` shortcut to build hierarchical IDs. See also: element ID, `@#` shortcut.

- **`m.percl`**: "Permanent classes." A special attribute that sets a list of CSS classes guaranteed to always be present in the `class` attribute, even if `class` is subsequently updated. Typically used to apply the component's scoped CSS class. Computed using `m.coat` expression syntax when set. See also: scoped CSS, `m.ci`, `@@` shortcut.

- **`m.rns`**: "Rendered node spec." An internal attribute set on template and slot nodes during SSR (`getHTML()`). Stores the sub-spec that was actually rendered, enabling the client to synchronize its doc-node tree with the server-rendered HTML during hydration.

- **`m.scpcss`**: The component type for the scoped CSS aggregator (`MWICoreScpCSS`). Collects and renders CSS from all component types used in the document. Typically placed in the document head. See also: scoped CSS.

- **`m.slat`**: "Slot attributes." A special attribute that directly copies attributes from the slot source to the current node. Format: `[target=[source? else=default?]...]`. The `source` key defaults to `target` if omitted. See also: attribute slotting, `m.coat`.

- **`m.slot`**: The component type for content slots (`MWICoreSlot`). Selects and renders content from its slot source: named slots pull from a matching attribute; unnamed slots pull from the slot source's natural children. Falls back to the slot's own children if no source content is available. See also: content slotting, slot source, slotting boundary.

- **`m.t`**: The component type for text nodes (`MWICoreText`). The `t` attribute holds the text content. In SSR, renders as HTML-escaped text. In CSR, renders as an `<output>` element (or nothing for empty text). Plain strings in doc specs are automatically converted to `m.t` nodes.

- **`mwi.compRegOpen`**: Feature promise signaled by `MWIRegistry` when it is ready to accept component registrations. Component modules must `fwait` on this before registering their components.

- **`mwi.compRegReady`**: Feature promise signaled by `MWIRegistry` after all pre-load component modules have completed registration. Application rendering should not begin until this feature is ready.

- **`MWICoreCom`**: The Mesgjs interface for HTML comment nodes. Component type: `m.com`. See also: `m.com`.

- **`MWICoreDefer`**: The Mesgjs interface for deferred component placeholders. Component type: `m.defer`. See also: deferred component, `m.defer`.

- **`MWICoreFrag`**: The Mesgjs interface for fragment nodes. Component type: `m.frg`. See also: fragment, `m.frg`.

- **`MWICoreScpCSS`**: The Mesgjs interface for the scoped CSS aggregator. Component type: `m.scpcss`. See also: scoped CSS, `m.scpcss`.

- **`MWICoreSlot`**: The Mesgjs interface for slot nodes. Component type: `m.slot`. See also: `m.slot`, content slotting.

- **`MWICoreText`**: The Mesgjs interface for text nodes. Component type: `m.t`. See also: `m.t`.

- **`MWICoreTpl`**: The Mesgjs interface automatically assigned by the registry to template components (those registered with a `tpl` property). Manages template instantiation and slotting. See also: template component.

- **`MWIDocNode`**: The abstract base Mesgjs interface for all MWI document nodes. Provides attribute management, sub-spec/sub-doc management, slot source tracking, and rendering coordination (`getHTML`, `getDOM`). All component interfaces chain from `MWIDocNode`.

- **`MWIDocument`**: The Mesgjs interface for a document coordinator. Manages node creation, the document root fragment, the ID index, and the list of component types used. Each document instance is independent. See also: document.

- **`MWIHTML`**: The Mesgjs interface for standard HTML element components (`h.*`). Handles rendering of HTML tags with attributes and children. HTML elements pass their slot source through to children (they do not create a new slotting boundary).

- **`MWIHTMLDocType`**: The Mesgjs interface for the HTML doctype declaration (`h.doctype`).

- **`MWIHTMLScript`**: The Mesgjs interface for `h.script` and `h.style` elements, which have special content-handling requirements.

- **`MWIHTMLTitle`**: The Mesgjs interface for the `h.title` element.

- **`MWIRegistry`**: The singleton Mesgjs interface that manages all component registrations. Assigns unique component IDs, coordinates module loading via feature promises, and synchronizes server-assigned IDs to the client. See also: component, component ID, feature promise.

- **Named slot**: An `m.slot` node with a `name` attribute. Renders the slot source's attribute whose name matches the slot's `name` attribute (if that attribute is list-valued). Falls back to the slot's own children if no matching attribute is found. See also: unnamed slot, content slotting.

- **Permanent classes**: See `m.percl`.

- **Reactive NANOS (`rxNANOS`)**: A NANOS list instance configured with `autoReactive: true` and a reactive interface object (RIO). Used throughout MWI for attributes, sub-doc, and sub-spec storage so that changes automatically propagate to reactive computations and DOM updates.

- **Rendered node spec**: Rendered node specification. See the entry for the `m.rns` attribute.

- **`scopedCSS`**: A property in a component's registry entry containing CSS rules for that component. The `@@` placeholder in the CSS string is replaced with the component's unique ID when rendered by `m.scpcss`. See also: scoped CSS, `m.scpcss`, `@@` shortcut.

- **Scoped CSS**: A CSS isolation mechanism in MWI. Components register CSS rules with `@@` placeholders that are replaced by the component's unique ID at render time. The `m.scpcss` aggregator collects and renders all scoped CSS for components used in a document. CSS is deduplicated per component type (not per instance). See also: `m.scpcss`, `scopedCSS`, `m.percl`, component ID.

- **Slot source**: The doc node that provides content and attributes for slotting operations. When a template component is instantiated, the template node itself becomes the slot source for its internal content. When an `m.slot` renders content, the slot node becomes the slot source for that content. See also: slotting boundary, slotting through.

- **Slotting**: MWI's mechanism for passing content and attributes between components. Enables template components to define "slots" where content can be inserted, and allows attributes to be propagated from a parent context into child components. See also: content slotting, attribute slotting, slot source.

- **Slotting boundary**: A point in the component tree where the slot source changes. Only template components and `m.slot` nodes create new slotting boundaries (become slot sources for their content). HTML elements (`h.*`) and fragments (`m.frg`) are transparent — they pass their parent's slot source through unchanged.

- **Slotting through**: The pattern of explicitly forwarding attributes across a slotting boundary using `m.slat` or `m.coat`. Required when content inside a slot needs access to attributes from the template node, because the slot itself creates a new slotting boundary that would otherwise block access. See also: slotting boundary, `m.slat`, `m.coat`.

- **SSR**: Server-side rendering. The process of rendering MWI document nodes to an HTML string via `getHTML()`. SSR output is a static snapshot at the time of the call — it is not reactive. Contrast with CSR.

- **Sub-doc**: The live, instantiated collection of child doc nodes for a given doc node. When `subDoc.live` is `true`, the sub-doc is the authoritative source of sub-content (overriding the sub-spec). Stored as a reactive NANOS.

- **Sub-spec**: The template (blueprint) for a doc node's sub-content, stored as a NANOS list of doc specs. When `subDoc.live` is `false`, the sub-spec is the authoritative source of sub-content. When `autoDoc` is `true`, setting a sub-spec immediately converts it to a live sub-doc.

- **Template component**: A component registered in the registry with a `tpl` property containing a doc spec. The registry automatically assigns `MWICoreTpl` as the interface for template components. The template node itself becomes the slot source for its internal content. See also: `MWICoreTpl`, slot source.

- **`typesUsed`**: A reactive NANOS (keyed by component type string) maintained by `MWIDocument` that tracks which component types have been instantiated in the document. Used by `m.scpcss` to determine which scoped CSS blocks to aggregate.

- **Unnamed slot**: An `m.slot` node without a `name` attribute. Renders the slot source's natural children (if any). Falls back to the slot's own children if the slot source has no children. See also: named slot, content slotting.

- **Void node**: A doc node with `schema.void = true`. Void nodes cannot have children — `append()` and `setSubSpec()` are no-ops. Examples: `m.t`, `m.com`, `m.scpcss`, and HTML void elements like `h.br`, `h.img`, `h.input`.
