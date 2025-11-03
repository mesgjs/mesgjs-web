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

**`(setAttr name value)` / `setAttr(name, value)`**
- Sets attribute value
- Triggers special processing for `m.slat`, `m.coat`, `m.id`, `m.percl`
- Updates reactive wrappers

**`(hasAttr name)` / `hasAttr(name)`**
- Returns `true` if attribute exists (not `undefined`)
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
- Snapshot only (not reactive)

**`(getDOM)` / `getDOM()`**
- Returns reactive NANOS of DOM nodes
- Synchronous initial render
- Reactive updates automatic

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

### `m.id` - Element ID Assignment

Assigns unique element ID to node:
- If value is `true` → Auto-generates ID via `doc.nextId()`
- If value is string → Uses provided ID
- ID stored in regular `id` attribute

### `m.percl` - Permanent Classes

Space-separated list of classes that must always be present:
- Typically includes component scope class
- Classes always appear in `class` attribute
- Adding permanent classes guarantees presence
- Removing permanent classes doesn't auto-remove from `class`

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
- `<name>` - Simple substitution
- `<name|else>` - Presence-based fallback
- `<name||else>` - Value-based fallback
- `<name?then>` - Presence-based conditional
- `<name??then>` - Value-based conditional
- `<name?then|else>` - Conditional with fallback

**Special Escapes:**
- `<.lt>` → `<`
- `<.gt>` → `>`
- `<.qm>` → `?`
- `<.vb>` → `|`

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
- If `false` - Sub-specs stored, conversion deferred

**`void`** (boolean, default `false`)
- If `true` - Node cannot have children
- Sub-specs rejected

**`htmlAllowAttr`** (Set, optional)
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
