# Mesgjs Web Interface (MWI) Requirements

## Introduction

- This is a SSR/CSR hybrid rendering library for the Mesgjs language.
- It supports static SSR rendering, SSR with client-side hydration, and pure CSR rendering.
- The system is built on the following core interfaces:
  - `MWIVendor` - a vendoring interface for providing access to external resources
  - `MWIRegistry` - a singleton registry for components and their associated interfaces and scoped CSS
  - `MWIDocument` - a resource coordinator for a single document
  - `MWIDocNode` - the base interface for document nodes
  - `MWICore` - MWI core components (e.g. `m.slot`)
  - `MWIHTMLCore` - MWI HTML core components (e.g. `h.div`, `h.span`, etc.)
  - `MWIMUM` - the "Mount/Unmount Monitor" handles mounting and unmounting of components
    - This also triggers the initial client-side hydration of server-rendered content as needed
  - Various component handler (Mesgjs) interfaces

## General

- SSR generates HTML (potentially with hydration points + additional CSR)
  - hybrid rendering requires passing client module-metadata in the HTML, client-loading the Mesgjs runtime, etc.
- CSR reactively generates and manages DOM nodes
- Component types are immutable
- No code-valued attributes; all code support (interactivity, reactivity, etc.) is handled via code-backed "smart" components
- HTML-generatoring components (HGCs) are responsible for generating HTML and DOM nodes
- Non-HGCs recursively expand to the HGCs responsible for their content
- During rendering, content not currently used might reactively be needed later
- The SSR and CSR rendering processes should be as similar as possible
  - As a consequence, the generated HTML from a reactive doc spec should probably be reactive as well
- The system supplies a handler for template components
- The implementation is based on single-file-components (SFCs)
  - Generators consist of a single file containing the HTML, styling, and any required executable code.
- Scoped-ids must be managed by the class-attribute and CSS-code-block managers, and must work for both HTML and DOM-node generation.
  - The scope-id must change with component boundaries.

## Process Overview

- Runtime loads required modules
- Registry opens, records components, reports ready
- User creates MWIDoc instance
- User passes doc-spec (data) page description to doc object to create doc nodes
- User calls toHTML to SSR document for transmission to the browser

## Implementation Environment

- MWI will be written primarily in JavaScript, embedded in Mesgjs modules (i.e. JavaScript embeds `@js{ ... @}` in Mesgjs `.msjs` and `.slid` files).
- The Mesgjs interface and message passing system shall be the first and primary instantiation and communications mechanism.
- Modules must be designed to be loaded via the standard (asynchronous) module loading system of the Mesgjs runtime.
- Inter-module dependencies will be coordinated using the Mesgjs feature synchronization system (`fready` and `fwait`).

## Document Description

- Instead of HTML or JSX/TSX, the document description is supplied as a nested data structure.
  - It is similar to using JavaScript-style `[type, {attributes}, children...]` array + plain-object structures, but is based on Mesgjs lists (`NANOS` objects at the JS-level), and may contain reactive values.
- The top level of a document or sub-document description is always provided as a node *container* (i.e., a *collection* of nodes), never as a single node.
  - In particular, if text appears at index 0, it is interpreted as text content (e.g. it will be converted to an `h.Text` node), not as a component type.
- A node container may include any combination of strings or nested lists.
  - String values within the container are converted to `h.Text` nodes.
  - List values within the container are interpreted as nodes as follows:
    - The first positional value is the component type.
    - Additional position values, if any, are the node's "natural children".
    - Named values, if any, are the node's attributes.
      - If list-valued, a named (attribute) value may be used as a template for content slotting (i.e. interpreted as a node container).
- Logic is generally handled within component handlers (or invoked from there). In contrast to many other systems, it is never included directly in the document description (e.g. MWI does not use any variant of `<component event={hander}>`).

## Components

- All content is (ultimately) generated based on "components". There are three types of components.
  - "Template components" consist of a content template (`template`), optionally with scoped CSS (`scopedCSS`).
    - A system-supplied template-component handler is responsible for slotting content into copies of the template and recursively processing nested content.
    - Template components depend on nested "smart" or "generator" components to implement any other necessary logic (including validation or application logic).
    - Template components generate content only indirectly through recursive template expansion.
  - "Smart components" are similar to template components, but also include a Mesgjs or JavaScript-based interface (`interface`) to implement any required logic in lieu of the standard template handler used by template components.
    - In addition to any other relevant logic, smart components determine which content (in the form of either their natural children or attribute values), if any, is to be rendered.
    - Smart components may use one or more templates internally, in conjunction with rendering support functions, as part of their implementation.
  - "Generator components" are a subcategory of smart components.
    - Generator components are the only components that generate actual HTML or DOM node content.
- Components may aggregate nodes (or other content, such as stylesheet or script links) for output in other places.
  - These components are singleton interfaces so that all requests go through the same interface.
  - The components aggregate *per document*.
  - These can be used to divert content to the `<head>` section or special content planes (e.g. modal planes).
- Component types are immutable (they cannot be reactive), but a component *can* return different content based on (potentially reactive) values, so it is possible to have a `case`-like component that reactively returns different content trees.

### Single-File Components

- Components are generally fully-contained within a single file.
- Components register (a payload) with an `MWIRegistry` singleton instance
  - templates
  - scoped CSS
  - interfaces
  - stylesheets
  - external scripts
  - initialization (interface + (default?) message?)
    - can be used for e.g. setting up delegated event handlers
  - schema
  - other?
- `MWIDocument` instances access the necessary component information via the `MWIRegistry` singleton instance.

## Naming Conventions

### Component Naming Conventions

- An `h.` prefix is used for "raw HTML"-related components:
  - E.g. `h.h1`, `h.div`, `h.img`
  - Also `h.Com` (comments), `h.Text` (text nodes), `h.Frag` (document fragments)
- An `m.` prefix is used for MWI core-feature components (e.g. `m.slot`).
- Names without a prefix beginning with a lower-case letter represent system-supplied semantic components (e.g. `button` and other wrappers around low-level HTML generators).
- Other names beginning with a lower-case letter are reserved for "official"/system-supplied components and component categories.
- Other names beginning with an upper-case letter are reserved for "unofficial"/user-supplied components and component categories.

Notes:

- The MWI library itself does not enforce these conventions (though specific deployments might, through other means).
- Operational aspects of a component should always be based on explicit configuration, never on its name.

### Attribute Naming Conventions

- The `c.` prefix is used to communicate content-slotting intent.
- The `m.` prefix is used for general MWI core attributes (e.g. `m.slot`).
- The `v.` prefix is used for validation-related attributes.
- Other prefixes beginning with lower-case should be reserved for official libraries.
- Unprefixed lower-case names should generally be reserved for standard HTML attributes.
- Capitalized prefixes or attribute names are recommended for custom, third-party attributes.

## MWIRegistry

`MWIRegistry` contains the component registry.

- Executes `fready` for feature `mwi.compRegOpen` (component registry open).
- Executes `fwait` on all preload `mwi.comp.*` features.
  - All accessible components must register, even if only a `feature` for deferred loading.
    - This could be done by a bulk pre-registration (preload) module.
  - Then executes `fready` on feature `mwi.compRegReady` (component registry ready).
- `(register)` / `register(name, { feature, interface, template, scopedCSS })`
  - With `feature`, registers a module feature to demand-load (via `fwait`) that will register the component `interface` or `template`.
  - With `interface`, registers an interface that handles a code-backed "smart" component or generator.
  - With `template`, registers a template component (structured data (doc-spec)).
    - A built-in handler coordinates rendering template-based components.
    - A fresh node set is created for each template instance.
    - The context provided to the handler must include the invoking node (this will be the template's slotting source).
- Component IDs
  - The registry assigns a unique component ID of the form `_MO_<base-36 counter>` to each new component as it's registered. This is available as the `id` key when looking up the component.
  - Component IDs assigned during SSR must be synchronized to the client so that client references to the same component use the same scope ID.
    - This comes from the positional list of component names in `globalThis.mwiServer.at('components')`
- `(nextId)` / `.nextId()` - returns the next unique element ID
  - `_MS_<base-36 counter>` on the server
  - `_ML_<base-36 counter>` on the client
  - These should be used as the "base" ID for a component instance. If multiple elements within a component need an ID, the base ID should be used as a prefix to generate a sub-ID with a suffix of `_<base-36 counter>` (e.g. `_MS_1j_2` would be the third sub-ID of base ID `_MS_$1j`).
  - As the client and server use different instance ID namespaces, no client-server synchronization is required here.

## MWIDocument

MWIDocument coordinates document content and the resources for rendering.
\[Note: Specification here is out of date\]

- `(nextId)` - returns/assigns the next unique instance ID
- `(root)` - returns document root list/NANOS
- `(toDoc docSpec)` - converts doc spec to doc nodes (with slotting)

- `load(docSpec)` loads the structured document specification
- `setRootType(type)` sets the root component-type for final HTML rendering
- `mount(docNodeId, domNodeOrId)` client-side mount a document sub-tree on a DOM node
- `toHTML()` returns the document HTML
- `getScopeId(modpath)` returns the (new or existing) CSS scope ID for the given `modpath` (`MWI-<hex-counter>-`)
  - Scope IDs must "synchronize-and-resume", server to client.
- `newElementId()` returns a new element ID (`MWS$<hex-counter>` or `MWC$<hex-counter>`)
  - Separate client and server namespaces prevent collisions
- `getNodeById(id)` returns the MWIDocNode with the associated id
  - `MWIDocument` must maintain a map for this
- `createDocNode(type, { attr, subdoc })` creates a new node

## MWIDocNode

MWIDocNode represents content in the document tree.

- This manages the type (HTML tag or component), attributes, sub-document (subdoc) spec, and generated doc (and client-side DOM) nodes.
- Uses handlers from `MWIRegistry` based on the component type.
- Supports reactive values.
- Supports attribute-slotting as part of the attribute interface.
- Special-case handling is provided for classes and styles.
- Class attribute
  - Class names prefixed with `!` are removed.
  - If the class string begins with `+`, existing classes are not cleared first.
  - `+` elsewhere in the string is ignored.
- Style attribute
  - Styles with an empty value (`style: ;`) are removed.
  - If the style string begins with `+`, existing styles are not cleared first.
  - `+` before a style elsewhere in the string is ignored.
- `getAttr(name)` - get an attribute's value
- `hasAttr(name)` - returns whether the node has the named attribute
- `setAttr(name, value)` - set an attribute value
- `type` - (getter) the type (tag or component) of the node

## Template Content-Slotting

Template content-slotting allows portions of default template content to be replaced with content from the attributes or natural children of the invoking node ("slot source").

- Content slotting uses a custom `m.slot` *component*: `[m.slot name=slotName? default content?]`
  - For an "unnamed" slot (`name` attribute is absent or empty):
    - If the slot source has natural children, they are rendered
    - Otherwise, if the `m.slot` node has natural children, they are rendered
    - Otherwise, nothing is rendered
  - For a "named" slot (non-empty value for the `name` attribute)
    - If the slot source has an attribute with the matching name and it has a list value, it is rendered
    - Otherwise, if the `m.slot` node has natural children, they are rendered
    - Otherwise, nothing is rendered
  - It is recommended that names of attributes to be used for content slotting (and thus their corresponding slot names) begin with a `c.` prefix (e.g. `c.heading`, `c.caption`) to signal intent.

## Template Attribute-Slotting

Template attribute-slotting allows the default attribute values of nodes within template content to be replaced with attribute values from the invoking node ("slot source").

This process does not modify (or combine) source attribute values in any way before assignment.

- Attribute slotting is controlled by an optional `m.slat` *attribute*:\
`[... m.slat=[entry...] ...]`
  - Each `entry` takes one of the following forms:
    - `target=[source? else=default?]`
    - `target` represents the name of a target attribute in the node being processed.
    - `source` represents the name of a slot-source attribute, and defaults to the target if not supplied.
  - If the source attribute is present and not undefined, the target attribute value is set from the source attribute value.
  - If the source attribute is absent or undefined, the target attribute value is either set to the `default` value or is removed (unset) if no default value has been provided (except for a `class` target, which will persist if there are any `m.percl` (permanent) classes).

## Template Computed-Attributes

Template computed-attributes provide a mechanism for rudimentary assembly of string-valued content template attributes based on attributes from the invoking node ("slot source") and the node being processed.

- Computed attributes are controlled by an optional `m.coat` *attribute*:\
`[... m.coat=[target=expr...] ...]`
- Each `expr` is a string that may contain any number of the following, in any order:
  - **Plain text:** Included literally in the output.
  - **Substitution expressions:** `<-expr->`
- The `name` part of an expression is always a literal identifier and cannot be a nested expression.
- The grammar supports two types of checks:
  - **Presence Check:** Considers an attribute valid if it exists on the slot source (i.e., is not `undefined`).
  - **Value Check:** Considers an attribute valid if it exists *and* is not an empty string (`""`).
- **Expression Syntax:**
  - `<name>`: Simple substitution. Evaluates to the attribute value or an empty string.
  - Presence-Based Fallback (`|`):
    - `<name|elseExpr>`: Evaluates to the value of `name` if it is present, otherwise recursively evaluates `elseExpr`.
  - Value-Based Fallback (`||`):
    - `<name||elseExpr>`: Evaluates to the value of `name` if it has a value, otherwise recursively evaluates `elseExpr`.
  - Presence-Based Conditional (`?`):
    - `<name?mainExpr>`: Evaluates `mainExpr` if `name` is present.
    - `<name?mainExpr|elseExpr>` / `<name?mainExpr||elseExpr>`: Evaluates `mainExpr` if `name` is present, otherwise evaluates `elseExpr`. The type of fallback operator (`|` or `||`) does not alter the primary conditional logic.
  - Value-Based Conditional (`??`):
    - `<name??mainExpr>`: Evaluates `mainExpr` if `name` has a value.
    - `<name??mainExpr|elseExpr>` / `<name??mainExpr||elseExpr>`: Evaluates `mainExpr` if `name` has a value, otherwise evaluates `elseExpr`.
- **Special Escapes:**
  - `<.lt>`: `<` ("less-than")
  - `<.gt>`: `>` ("greater-than")
  - `<.qm>`: `?` ("question mark")
  - `<.vb>`: `|` ("vertical bar")

## Sub-Spec And Slotting

Void HTML Components
- Slot the current doc-node against the slot-source, if provided
- No children; discard sub-spec, if any

Container HTML Components
- Slot the current doc-node against the slot-source, if provided
- Add the top level of the sub-spec as doc-node children
  - Pass the current slot-source, if provided, to the children

Template (Non-HTML) Components
- Slot the current doc-node against the slot-source, if provided
- Any sub-spec is stored (as-is) for possible unnamed-content-slotting in the template
- The current doc-node becomes the slot-source for the template
- Add the top level of the template as doc-node children

## Special Nodes And Attributes

### `h.` Component Collection

These represent standard HTML tag and non-tag elements.

- `[h.br]`, `[h.div]`, etc. - corresponding to standard, tagged HTML nodes (these will all be "generator" components)
- `[h.doctype type=text]`
- `[h.title title=text]`
- `[h.script m.body=content? children...]`
- `[h.style m.body=CSS? children...]`
- `[h.Com text=text? children...]` - a comment node (generator)
  - Renders its `text` attribute or string-valued natural children as `<!--content-->`
    - Any occurences of `&` or `-->` in the content shall be encoded `&amp;` or `--&gt;`, respectively.
- `[h.Frag children...]` - a document fragment (generator)
  - Renders its content, if any
- `[h.Text text=text children...]` - a text node (generator)
  - Renders its `text` attribute or string-valued natural children as escaped text

### `m.` Component Collection

These represent MWI-supplied special-purpose core components.

- `[m.slot name=slotName default content]` - handles content slotting
  - If the component's slot-source has a list-valued attribute `slotName`, it's value is used as the slot content. Otherwise, the default content is used.
  - If the `name=slotName` attribute is absent, the slot-source's natural children are used if there are any. Otherwise, the default content is used.
  - By convention, content slot names should begin with `cs.` to indicate that they are being used for content slotting.

## Special Attributes

- `class` (string-valued; a space-separated list of class names)
  - The string is processed in order, from left-to-right.
  - If the string is empty (but not undefined) or contains only whitespace, all current classes are cleared. Otherwise, string processing begins in the "conditional clear" state (see below).
  - Special tokens
    - `==`: unconditional clear (all prior classes are immediately cleared)
	- `=`: conditional clear (all prior classes are cleared *if* additional classes (but no `+` token) follow)
	- `+`: update mode (subsequent classes will supplement, instead of replacing, prior classes)
  - Modifiers
    - `!`: the following class is removed rather than added
	- `~`: the following class is toggled (removed if previously present or added if previously absent)
	- No modifier: the class is added
  - Missing or removed *permanent* classes (see below) are added/restored.
- `style` (string-valued; a semi-colon-separated list of styles)
  - The string is processed in order, from left-to-right.
  - If the string is empty (but not undefined) or contains only whitespace, all current styles are cleared. Otherwise, string processing begins in the "conditional clear" state (see below).
  - Special tokens
    - `==`: unconditional clear (all prior styles are immediately cleared)
	- `=`: conditional clear (all prior styles are cleared *if* additional styles (but no `+` token) follow)
	- `+`: update mode (subsequent styles will supplement, instead of replacing, prior styles)
    - The next (non-white-space) token, if any, should follow immediately (with no intervening `;`)
  - If a style has a value after the `:`, the style is added to the result.
  - If a style does not have a value after the `:`, it is removed from the result.

### `m.` Attributes

- `m.attr=[attr... localAttr=sourceAttr...]` - attribute slotting (list-valued)
  - Attributes in the current node will be replaced (or possibly merged) with attribute values from the slot-source.
    - Positional values are attribute names that will copy (or merge) directly: `attr` in the referencing node will be copied (or merged) from `attr` in the slot source.
    - Named values are treated as local/source pairs: `localAttr` in the referencing node will be copied (or merged) from `sourceAttr` in the slot source.
  - By convention, attribute slot names should begin with `as.` to indicate that they are being used for attribute slotting.
- `m.percl` - permanent classes (string-valued)
  - This string-valued attribute contains a space-separated list of classes that should permanently be included in the `class` attribute value.
  - This will typically include the registry-assigned unique component class (`MW-xxx`) and a component element identifier class (serving the "E" function of "BEM").
  - Classes included here will always appear *somewhere* in the `class` attribute, though they may appear in any position and order.
  - The attribute value is expected to be very stable in practice.
  - *Adding* permanent classes guarantees that those classes will also be present in the `class` attribute value.
  - In contrast, *removing* permanent classes does **not** automatically remove them from the `class` attribute value. Such classes will remain in the `class` attribute value until removed by an appropriate replace-mode or merge-mode setting of the `class` attribute.

## Rendering Notes

- Client-side rendering is an "on-going reactive result". As reactive recalculations may occur at any time, any document-traversal state presented to nodes as part of rendering (such as "current slotting source", for example) must be presented as a "snapshot", not references to data that varies over the rendering traversal process.
- Template component: Returns a template (composed of any combination of template components, smart components, or generators) with no associated code.
- Smart component: Just like a template component, but with the addition of code, which can adjust content and/or add interactivity and/or reactivity.
- Generator: Capable of generating HTML code and DOM nodes.
  - Template components and smart components must not be able to directly alter HTML or DOM nodes.
  - Generators should probably deliver these results through a path independent of template or smart components, via some sort of output tree or stream.
- Need to have aggregator components that accept content via slotting and then re-slot the aggregated content elsewhere.
  - In order to have access to the content and to be able to aggregate/repackage it, these need to have `mwi.htmlGenerator` caps.

## Sample Page Description

```
[H.frag
    [c1 [c2]]
    [c3 [c4]]
]
c1:
[H.frag
    [h.h1 header]
    [h.div [h.span class='something' 'span text']]
]
```

A generator might have template-component children that have geneator children.

A generator provides a container node for subrendering, passed to other generator sub-nodes.

# Component Schema Notes

(ProseMirror-like)

- Name
- Version
- Allowed attributes and types/constraints
- Attribute slots
- Content slots and constraints
- Editability
- Allowed parent/child relationships

# Framework Comparison

| MWI Concept                 | Closest Framework Analogies |
|-----------------------------|-----------------------------|
|Single-File Components       | Vue `.vue` files; Svelte `.svelte` files<br>MWI difference: no build step, no inline JS in templates
|Declarative Markup           | Angular templates; JSX/TSX (React/Solid) as structure<br>MWI difference: strictly declarative, no `{}` code
|Fine-grained Reactivity      | SolidJS signals; Svelte compiled reactivity<br>MWI difference: runtime-driven, not compiler-transformed
|Hybrid SSR + CSR             | Next.js/Nuxt hydration; Marko streaming hydration<br>MWI difference: no VDOM diffing, hydration = reactive resume
|Component Schema             | ProseMirror schema; JSON Schema<br>MWI difference: schema describes renderability + editability
|Slotting / Composition       | Web Components `<slot>`; React/Vue children/props<br>MWI difference: any attribute can hold compound values
|Styling / Theming            | CSS Modules; Tailwind variants<br>MWI difference: automatic unique classes (MW-0, MW-1…)
|Messaging Runtime            | Redux/Flux actions; Elm messages<br>MWI difference: first-class Mesgjs lists, list-op dispatch
