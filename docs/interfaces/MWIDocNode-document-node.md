# MWIDocNode - Base Document Node Interface

**Interface:** `MWIDocNode`  
**Source:** [`src/mwi-doc-node.msjs`](../src/mwi-doc-node.msjs)  
**Status:** ACTIVE

## Overview

`MWIDocNode` is the base interface for all document nodes in MWI. It provides core functionality for attribute management, sub-content handling, slot source tracking, and rendering coordination.

## Key Responsibilities

- Attribute management (get/set/has)
- Sub-spec and sub-doc management
- Slot source tracking
- Special attribute processing (`m.id`, `m.percl`, `m.slat`, `m.coat`)
- HTML and DOM rendering coordination

## Core Operations

### Attribute Management

**`(getAttr name)` / `getAttr(name)`**
- Returns attribute value or `undefined`
- Supports reactive tracking

**`(setAttr name value coat=@t)` / `setAttr(name, value, { coat=true })`**
- Sets attribute value
- Triggers special processing for `id`, `class`, `style`, `m.slat`, `m.coat`, `m.id`, `m.percl`
- Updates reactive wrappers

**`(hasAttr name)` / `hasAttr(name)`**
- Returns `true` if attribute exists (and is not `undefined` / `@u`)
- Returns `false` otherwise

### Spec Management

**`(setSpec spec)` / `setSpec(spec)`**
- Sets node spec (attributes + sub-spec)
- Extracts attributes from spec
- Calls `setSubSpec` for natural children
- Type must match existing type (immutable)

**`(setSubSpec spec1 spec2...)` / `setSubSpec(spec1, spec2, ...)` / `setSubSpec({ subSpec })` / `setSubSpec({ spec })`**
- Three calling patterns supported:
  1. Multiple positional parameters
  2. Named `subSpec` parameter
  3. Named `spec` parameter
- Clears existing sub-doc
- Converts to sub-doc nodes if `autoDoc !== false`
- Sets `subDoc.live = true` if conversion happens

**`(getSpec)` / `getSpec()`**
- Returns reactive spec for node and subtree
- Reconstructs from current state

**`(getSubSpec)` / `getSubSpec()`**
- If `subDoc.live` is falsy → Returns `subSpec` directly
- If `subDoc.live` is truthy → Reconstructs from `subDoc` nodes

### Content Management

**`(append node...)` / `append(...nodes)`**
- Appends doc-nodes to sub-doc
- Sets `subDoc.live = true`
- Accepts multiple nodes

**`(hasChildren)` / `hasChildren()`**
- Returns `true` if node has sub-doc content
- Returns `false` otherwise

### Rendering

**`(getHTML)` / `getHTML()`**
- Returns HTML string for node and subtree
- Synchronous operation
- **Always a snapshot at the time of the call**
- **Not reactive** - subsequent changes to attributes or content are not reflected
- Must call `getHTML()` again to get updated HTML

**`(getDOM)` / `getDOM()`**
- Returns reactive NANOS of DOM nodes
- Synchronous initial render
- **Reactive updates automatic** - DOM updates when attributes or content change
- Changes propagate to browser DOM in real-time

**`(getSubDOM)` / `getSubDOM()`**
- Returns reactive NANOS of sub-doc DOM nodes
- Used internally for child rendering

### Properties

**`(type)` / `.type`**
- Returns component type (e.g., `'h.div'`, `'m.t'`)
- Read-only (immutable)

**`(root)` / `.root`**
- Returns root interface instance
- Synchronous property access

**`(subSlotSrc)` / `subSlotSrc()`**
- Returns slot source for sub-content
- Default: `d.rr` (node itself)
- Overridden by fragments (pass-through) and HTML elements (pass-through)

## Special Attributes

### `m.ci` - Component ID

This returns the component ID of the component, as assigned by the registry (`MWIRegistry`).

- Via `getAttr`, this returns the component ID of the node itself. (This will *always* be defined.)
- Since `m.coat` and `m.slat` work with the node's slot source, `<m.ci>` (for `m.coat`) or `m.ci=[]` (for `m.slat`) will reflect the component ID of the slot source. (This will be undefined for nodes without a slot source.)
- This value is read-only.

### `m.id` - Mandatory Element ID

- If the node does not already have an assigned, non-empty, standard `id` attribute, a unique one is automatically generated and assigned.
- The value of the `id` attribute (whether user-specified or automatically generated) is then returned.
- This value is read-only (but with side effects; use the `id` attribute directly to set a value).

### `m.percl` - Permanent Classes

Space-separated list of classes that must always be present:
- Typically includes component scope class
- Classes always appear in `class` attribute
- Adding permanent classes guarantees presence
- Note: Removing permanent classes does not automatically remove them from `class`
- **Computed when set:** Uses `m.coat` expression syntax (unless `coat: false` is specified)
- Unlike `m.coat`, only the computed result is stored (not the expression)
- Not fully reactive - only recomputed when explicitly set again

### `m.slat` - Attribute Slotting

Copies attributes from slot source to target node:

```javascript
// Format: [target=[source? else=default?]...]
node.setAttr('m.slat', ps('[(class=[] id=[elemId else=default-id])]'));
```

- `target` - Attribute name in current node
- `source` - Attribute name in slot source (defaults to target if `[]`)
- `else` - Default value if source attribute missing

**Processing:**
- Triggered immediately when `m.slat` is set
- Source attribute value copied to target
- If source missing, uses `else` value or removes attribute
- List-valued attributes preserved as NANOS

### `m.coat` - Computed Attributes

Assembles string attributes from slot source values:

```javascript
// Format: [target=expr...]
node.setAttr('m.coat', ps('[(class="btn <type>-btn <size?large>")]'));
```

**Expression Syntax:**
- `<name>` - Value of named attribute, or ""
- `<name|else>` - Value of named attribute if not undefined/false, or "else" otherwise
- `<name||else>` - Value of named attribute if not undefined/false/"", or "else" otherwise
- `<name?then>` - "then" if named attribute is not undefined/false, or "" otherwise
- `<name??then>` - "then" if named attribute is not undefined/false/"", or "" otherwise
- `|` (or, identically, `||`) after the first test toggles the output state
  - `<name?then|else>` - "then" if value is not undefined/false, or "else" otherwise
  - `<name??then|else>` - "then" if value is not undefined/false/"", or "else" otherwise

**Special Escapes:**
- `<.aa>` → `@@` (at-at escape)
- `<.ap>` → `@#` (at-pound escape)
- `<.gt>` → `>` (greater-than)
- `<.lt>` → `<` (less-than)
- `<.qm>` → `?` (question-mark)
- `<.un>` → Returns undefined (Mesgjs `@u`) as the final result
- `<.vb>` → `|` (vertical bar)

**Shortcut:**
- `@@` → Expands to the slot-source's component ID (before expression parsing)
- `@#` → Expands to the slot-source's doc-node ID (before expression parsing)

### `id` - Node ID Attribute

**Type Checking and Normalization:**
- Accepts string or number values (numbers normalized to strings)
- Clears attribute if set to `undefined`, `null`, or `false`
- Ignores other types (no error, no change)

**Computed when set:** Uses `m.coat` expression syntax (unless `coat: false` is specified)
- Unlike `m.coat`, only the computed result is stored (not the expression)
- Not fully reactive - only recomputed when explicitly set again

**ID Index and Lookup:**
- Document maintains an index of all nodes with `id` attributes
- Use `document.getDocById(id)` to retrieve nodes by ID
- Numeric IDs automatically normalized to strings for lookup
- Returns the doc-node or `undefined` if not found

**Important Behaviors:**
- **User Responsibility:** The user is responsible for ensuring active doc-nodes have unique IDs (it's not enforced by the system); if IDs are not unique, the most recent assignment is (usually) indexed (but see below for exceptions)
- **Live Nodes Only:** Index applies to live doc-nodes, not doc specs
- **Works for Disconnected Nodes:** Even nodes not currently in the rendering tree are indexed
- **No Auto-Replacement:** If an ID collision occurs and *the most recently indexed node* for that ID changes or removes its ID, the index will report **undefined** for that ID until the next time it is assigned (the index will not automatically start returning any of the other nodes)
- **Computed Attribute Pattern:** Since computed attributes (including `id`) are based on the *slotting source's* attributes, you can use `id=@#_subid` (shortcut for `id=<m.id>_subid`) to build a hierarchy of unique IDs, even if the top-most ID was auto-generated
  - Remember to use this pattern to slot IDs through slot-source changes

### `class` - Class Attribute

Special merge/update semantics:

**Tokens:**
- `=` - Conditional clear (clears if more classes follow)
- `==` - Unconditional clear
- `+` - Update mode (merge with existing)

**Modifiers:**
- `!` - Remove class
- `~` - Toggle class
- (none) - Add class

**Computed when set:** Uses `m.coat` expression syntax (unless `coat: false` is specified)
- Unlike `m.coat`, only the computed result is stored (not the expression)
- Not fully reactive - only recomputed when explicitly set again

**Examples:**
```javascript
node.setAttr('class', 'foo bar');        // Set to 'foo bar'
node.setAttr('class', '+ baz');          // Add 'baz' → 'foo bar baz'
node.setAttr('class', '!foo');           // Remove 'foo' → 'bar baz'
node.setAttr('class', '== qux');         // Clear and set → 'qux'
```

### `style` - Style Attribute

Similar semantics to `class`:

**Tokens:**
- `=` - Conditional clear
- `==` - Unconditional clear
- `+` - Update mode

**Syntax:**
- `property: value;` - Set style
- `property: ;` - Remove style

**Examples:**
```javascript
node.setAttr('style', 'color: red; font-size: 14px;');
node.setAttr('style', '+ font-weight: bold;');  // Add
node.setAttr('style', 'color: ;');              // Remove color
```

## Schema Properties

Nodes can define schema to control behavior:

**`autoDoc`** (boolean, default `true`)
- If `true` - Sub-specs immediately converted to sub-doc nodes
- If `false` - Sub-specs stored
  - Sub-specs might or might not be converted to sub-doc nodes later
  - Sub-specs might be converted to sub-doc nodes on a different node or nodes

**`void`** (boolean, default `false`)
- If `true` - Node cannot have children
- Sub-specs and modifications, such as `append`, are ignored

**`htmlAllowAttr`** (JS `Set` or Mesgjs `@set`, optional)
- If present - Only listed attributes render to HTML
- Used by `MWICoreDefer` to filter attributes

## Live State Machine

The `subDoc.live` property controls sub-content source of truth:

**`live` = falsy:**
- `subSpec` is source of truth
- `getSubSpec()` returns `subSpec` directly
- Sub-content not yet instantiated

**`live` = truthy:**
- `subDoc` is source of truth
- `getSubSpec()` reconstructs from `subDoc`
- Sub-content has been instantiated

**Transitions:**
- `append()` → Sets `live = true`
- `setSubSpec()` with `autoDoc=true` → Sets `live = true`
- `setSubSpec()` with `autoDoc=false` → Keeps `live = false`

## Reactive Behavior

### Attribute Reactivity

- Attributes stored in reactive NANOS
- Changes trigger reactive recalculation
- High-flux attributes (>3 changes) get individual reactors
- Low-flux attributes share main-group reactor

### Sub-Doc Reactivity

- Sub-doc stored in reactive NANOS
- Changes trigger DOM updates
- WeakMap tracks spec-to-node mappings for reuse
- Nodes reused when same NANOS instance appears

## Usage Examples

### Basic Node Creation

```javascript
const doc = getInstance('MWIDocument');
const node = doc.createNode('h.div');

node.setAttr('class', 'container');
node.setAttr('id', 'main');

const html = node.getHTML();
// <div class="container" id="main"></div>
```

### Attribute Slotting

```javascript
// Slot source
const source = doc.createNode('h.div');
source.setAttr('class', 'active');
source.setAttr('id', 'item-1');

// Template with slotting
const template = doc.createNode('my.template', { slotSrc: source });
template.setAttr('m.slat', ps('[(class=[] id=[])]'));

// template has class='active' id='item-1'
```

### Computed Attributes

```javascript
const source = doc.createNode('h.div');
source.setAttr('type', 'primary');

const node = doc.createNode('h.button', { slotSrc: source });
node.setAttr('m.coat', ps('[(class="btn <type>-btn")]'));

// node.class = 'btn primary-btn'
```

### Sub-Content Management

```javascript
const parent = doc.createNode('h.div');

// Set sub-spec (converts to nodes if autoDoc=true)
parent.setSubSpec(ps('[([h.span "Child 1"])]'));

// Append additional nodes
const child2 = doc.createNode('h.span');
child2.setAttr('t', 'Child 2');
parent.append(child2);

// Get current sub-spec (reconstructed from sub-doc)
const subSpec = parent.getSubSpec();
```

## Related Interfaces

All MWI node interfaces extend `MWIDocNode`:
- [`MWICoreFrag`](MWICoreFrag-fragment.md) - Fragment component
- [`MWICoreCom`](MWICoreCom-comment.md) - Comment component
- [`MWICoreText`](MWICoreText-text.md) - Text component
- [`MWICoreSlot`](MWICoreSlot-slot.md) - Slot component
- [`MWICoreTpl`](MWICoreTpl-template.md) - Template handler
- [`MWICoreDefer`](MWICoreDefer-defer.md) - Deferred placeholder
- [`MWIHTML`](MWIHTML-HTML-elements.md) - HTML elements
