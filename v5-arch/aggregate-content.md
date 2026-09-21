# Aggregate Content

## Problem Summary

- Sometimes you want to aggregate content such as script tags, navigation links, sidebar content, etc
- Sometimes you want content to be rendered in a document tree at a position where the content might be still be unknown (or only partially known)
- Reactive handling for CSR already provides a mechanism for aggregate data to arrive after the rendering point (the rendering will automatically be updated as content arrives), but SSR does not currently have any corresponding mechanism
- For SSR, it is crucial that style information appears before affected content in order to avoid FOUC

## SSR Proposal

- Modify the `MWIDocument` version of `getHTML` to add per-call aggregate-content support.
- Non-reentrant; throws an error if called while a call is already in progress (i.e. if aggregate state is already present upon entry)
- Aggregate-content (and buffer ID mapping) storage is added to the document object at the start of the call.
- HTML content is generated with aggregate rendering points returning `<{bufferID}>` placeholders (e.g. `<{25}>`).
- `getHTML` replaces the placeholders with the aggregated content before returning the HTML.
  - Replacement is performed until all nested placeholders have been processed
  - Placeholder content is only replaced once. Subsequent (including nested cyclic) references log a one-time warning (per document `getHTML` call) and are stripped from the string (replaced with nothing).
  - Replacement specifically skips comments and in-line scripts and stylesheets where syntax permits content that can mimic a placeholder
- The aggregate-support storage is removed (via `try`/`final`) when the call returns or throws.
- `(getHTML forNode?)` will accept an optional starting node for sub-tree HTML generation (default is doc root).
- All nodes know their associated document. Aggregators can query the document for the placeholder ID associated with a buffer name.
- As output is unexpected at aggregation source sites, aggregators will not render anything if the document is not in aggregation mode (i.e. `getHTML` was called directly on a node rather than on the document).
- MWIDocument `(aggregator)` returns a JS `Map` instance when aggregating or `@u`/`undefined` otherwise
  - Keys are the tag name (e.g. `m.aggr`); values are tag-specific
- MWIDocument `(getAggrBufferId namespace bufferName)` assigns the next sequential buffer ID if necessary and returns it
  - The `namespace` will typically be the aggregator tag name (e.g. `m.aggr`, `m.script`)
  - Internally, `m.script:head` is different from `m.style:head`
  - Related tags could potentially designate a primary tag in order to share a namespace

### Pros

- The "string surgery" approach is essentially "one and a half passes"
- There are no double rendering passes or advanced, special-case tree-walks
- Most existing tags and interfaces will be unaffected and completely oblivious to the aggregation process
- Placeholders only appear in internal results; all placeholders are resolved before returning from the user's call
- No client-side assembly/hydration required (simple sites can be generated without the need for JS)
- Sub-tree HTML generation is possible, even though the user messages the document
- All content is aggregated during the rendering tree-walk (before placeholder replacement), so content is automatically in the correct (tree) order

## CSR Proposal (In Progress)

- Assumption: The doc tree is the source of truth. The DOM is a rendering-generated projection.
- Aggregated doc tree content should "live" at the original nodes. Only the DOM is reordered.
- Unlike SSR aggregation state, the document object maintains permanent CSR aggregation state (a list of content nodes per namespace + buffer name).
- State is added whenever a new namespace and buffer name is referenced (either by an aggregator or a renderer).
- Nodes register when added to the doc tree and unregister when removed.
- Each content node has a reactively-computed "node path" which is a reactive list of node indexes, top-down, from the root node
  - These are dependent on reactive `subDoc` properties up to the root, triggering recalculation if impacted by structural changes
  - Aggregate content is displayed in node order (example: content for a node with path `[1 1 3 5]` comes before one with path `[1 1 4]`)

## Specific Aggregators

- General content
  - `[m.aggr to=bufferName content...]` aggregates content to the specified buffer
  - `[m.aggr from=bufferName]` renders the content from the specified buffer
- "Smart" Scripts
  - An aggregation-aware variant of the low-level `h.script` tag
  - `[m.script to=bufferName? m.text=content otherProps...]` aggregates an in-line script (unique by `m.text`)
  - `[m.script to=buffername? src=URL otherProps...]` aggregates an external script (unique by URL)
  - `[m.script from=bufferName]` renders aggregated script content
  - The default buffer name for aggregation is `head`; a `from` is required for rendering
  - Support for multiple buffers allows adding different scripts in different places (e.g. `HEAD`, `BODY`)
  - Script uniqueness is based on the `m.script` namespace
  - Users do not need to create or coordinate "uniqueness keys"
- "Smart" Stylesheets
  - An aggregation-aware variant of the low-level `h.link` and `h.style` tags
  - `[m.style to=bufferName? m.text=content otherProps...]` aggregates an in-line stylesheet (style, unique by `m.text`)
  - `[m.style to=bufferName? href=URL otherProps...]` aggregates an external stylesheet (link, unique by URL)
  - `[m.style from=bufferName]` renders aggregated stylesheet content
  - Default buffer name is also `head`
  - Stylesheet uniqueness is based on the `m.style` namespace

## "Orphan" Handling

- It's completely valid for there to be no aggregated content to render. The absence of content does not generate any type of warning or error.
- Aggregated content might or might not be rendered. The absence of a rendering tag does not generate any type of warning or error (any aggregated content is simply never rendered).
- A valid example scenario:
  - Some content is aggregated during SSR (there's no rendering tag yet, so nothing is rendered)
  - Additional content is aggregated during CSR (still no rendering tag yet)
  - A rendering tag is added for the first time during CSR; existing aggregated content gets rendered
  - Additional content is aggregated during CSR (the rendering updates)

## Notes

- `m.script` and `m.style` are aggregation-aware variants of the low-level `h.script`/`h.link`/`h.style` tags. They internally use the corresponding `h.*` tags for rendering. `h.script` and `h.style` can still be used directly for scripts/styles that should always appear at their tree position (no aggregation).
