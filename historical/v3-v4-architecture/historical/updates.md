# To-Do

## SSR

- Before the recent SSR redesign (when MWISSR was SsrRenderer), it supported the ability for component definitions to return payloads that could include such things as scopedCss. We need to rearchitect that capability back into the new (MWISSR) implementation.
- Components should be able to include a list of unique, external stylesheets.
- Components should be able to include a list of unique Mesgjs modules.
- ~~Both declarative and smart components need to be able to specify event and validation handlers (to be architected).~~
  - ~~Probably~~ accept a static template or payload for declarative; accept a vnode/vnodes or payload from smart handlers \[still relevant\]
  - ~~Possibly~~ NO - remove any code added for these (more info below):
    - `<tag :events=StringSet>`
    - payload registers `events: { interface: { handler: [event, ...] } }`
- As these are component-related resources, they should be accumulated (and deduplicated, where applicable) in the renderer (prior to passing to the page template), not stored as part of the vnode.
- Can probably just use a Set where uniqueness is required.
- Event and validation support will only be directly available in smart components.
- Declarative components will only have access to event and validation support through composition (inclusion of smart components in the template)

## CSR

- The current CSR implementation was written based on the previous SsrRender implentation and is now out-of-date as well as incomplete.
- It needs to use the vnode concept instead of props + children.
- It needs to use MWICSR* classes analogous to the MWISSR* ones.

## Hydration

- Hydration will be keyed off of element ids
  - In particular, CSR should have the option to replace a placeholder node with a different node, taking over the assigned id
- If an element needs an id for hydration purposes but isn't already assigned a fixed id as part of the "template", the component should assign it the next unique id
- SSR should generate unique id attributes "MWS$" + counter
- CSR should generate unique id attributes "MWC$" + counter
- MWIMUM (the mount/unmount monitor, "MUM" for short in the requirements) will accept mount/unmount subscriptions
  - Initial subscriptions will be passed as static data (in a format similar to static page content) from SSR\
  `[module parameters...]`
  - Like components, hydration modules should be registered and retrieved through the component factory
  - Responding event handlers can subscribe to further events (`mount` and `unmount`, with or without a `once` option) with either a static subscription (as from SSR), a JS callback function, or a Mesgjs callback `@function`.
  - Each subscription should return a unique id (Symbol) that can be used to cancel the subscription
- There need to be a page template slots for `mount` and `mountOnce` hyrdration points, keyed by element id
- The MUM should be activated upon `DOMContentLoaded`, making an immediate initial pass through the `mount` and `mountOnce` hydration lists to hydrate components already connected to the DOM.
- As a special case, static, declarative, `mountOnce` subscriptions to the empty id (`''`) will be run first (at `DOMContentLoaded`). This can be used for e.g. `<head>` content like live `<title>` data-bindings or general, non-element-specific cases.
- The MUM will then use a MutationObserver targeting the node tree rooted at `document.body` to detect subsequent mount and unmount events (checking element ids against its subscriptions) and respond accordingly.

## Event Handling And Validation

- Looking at the options, declarative events and validation feel (with some exceptions, but for the most part) like an inefficient, alternate representation of code, so let's (mostly) avoid going that direction
- Event handling and validation will be supported through "smart" (code-based) components
- Declarative components will rely on composition, composing smart components to indirectly handle events and validation

## Forms

\[Let's focus on getting the updated rendering pipeline working first\]

Note: These are component-level concerns, not rendering-level concerns.

- Two-way, reactive data binding via `%*MWIData(at some/binding/path)`\
`[... m.bind=some/binding/path ... ]`
- Basic text-field-level validation\
`[... m.valid=[min=length max=length len=length ire=pattern are=pattern req=@t] ...]`
  - `min` - minimum length
  - `max` - maximum length
  - `len` - exact length
  - `ire` - incremental input validation regex
    - incremental input is rejected if value+input wouldn't match
    - ex: adding to an incomplete phone number
  - `are` - acceptance regex
    - field value is unacceptable if value doesn't match
    - ex: a complete phone number
  - `req` - required (@t/@f)
- Show/hide by flag or data presence \[should this apply to most standard, MWI components?\]
  - `m.show` or `m.hide`, values `@t`, `@f`, or a data path
- Enable/disable by flag
  - `m.enabled` or `disabled`, values `@t` or `@f`
- Optional submit to handler (will need (module, interface, message)) instead of the standard `<form action>`
- Labeling and i18n via keys\
`[... m.i18n=i18n/key/path ...]`
  - Might have sub-paths, e.g. `/text`, `/title`, `/aria` for different element properties/attributes
- Standard field types (text, checkbox, select, etc)
- Static layout (rows, columns, groups)
  - Probably via standard `<fieldset>`, grid, flex, etc
- Class-based styling

## Additional Requirements

- The main classes should be MWISSR and MWICSR
- The factory classes (if there will indeed be two of them) should be MWISSRFactory and MWICSRFactory (otherwise MWIComponentFactory)
- It must be possible to have single-file components (more specifically, supporting scoped CSS, SSR, and CSR out of one file)
- The virtual node (vnode) classes should be MWISSRVNode and MWICSRVNode
- Scoping should use a simple `MWI-*counter*-` prefix for `@@` substitution in HTML and CSS
- Some files are under git management. When changing file names, attempt a "git mv" first.
- Keep in mind that user data may be presented either in JS Array+Object structure or as nested NANOS. This was one of several driving factors behind the vnode concept.
- Ultimately, the rendering pipeline must be usable directly from Mesgjs
- Be sure to use the resolved component name for checking the scope-id cache so that different instances of a given component reuse the same scope id
- Rendering modules must **not** be able to load inline or external `<script>` content directly (this is a Mesgjs security requirement)

## Notes

- Eventually, the modules need to be Mesgjs-loadable modules. The layout for these modules will likely be as follows:

```mesgjs
[(
    /* In *module*.msjs... */
    /* SLID-encoded module path, version, features etc. here */
)]
'' @js{
    if (!mid) throw new Error('Required Mesgjs module management is not active');
    // JS classes here
    // Wrap interface setup in $c.fwait('feature', ...).then(...) as needed
    const interface = $c.getInterface('my-interface-name');
    interface.set({ ... });
    // Other object instances via $c.getInstance('other-interface', optInitParam)
    $c.fready(mid, 'interface-or-feature');
@}
```

Even though the content for our purposes will be essentially all JS, this Mesgjs-JS-embed format will allow the Mesgjs build tools to checksum, catalog, etc. - everything required for Mesgjs module loading.

The `''` is a simple non-comment to force the JS embed out of the module preamble and into the `export function loadMsjs (mid)` section.

- I want to be able to support "private form fields" using shadow DOM to prevent unrelated objects on the page from being to access the data
  - This implies a requirement to support standard, direct handler attachment
  - Consider optionally supporting shared event handlers (binding higher in the document) in a later phase