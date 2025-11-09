# Mesgjs Web Interface (MWI) Slotting

## What Is Slotting, And Why Is It Used?

**Slotting** is MWI's mechanism for passing content and attributes between components, enabling flexible, reusable component composition. It allows template components to define "slots" where content can be inserted, and enables attributes to be passed from a parent context into child components.

Slotting solves several key problems:

1. **Component Reusability**: Templates can define generic structures that accept different content in different contexts
2. **Attribute Propagation**: Attributes set on a template can be passed through to elements within the template
3. **Content Composition**: Parent components can provide content that gets rendered in specific locations within child templates
4. **Hierarchical ID Management**: Unique IDs can be composed hierarchically through nested template instances

### The Slot Source Concept

At the heart of slotting is the **slot source**. When a component has a slot source:
- **Content slotting** (`m.slot`) can pull content from the slot source's attributes or children
- **Attribute slotting** (`m.slat`, `m.coat`) can access the slot source's attributes

The slot source creates a **slotting boundary** - a point where the context for attribute and content resolution changes.

## Types Of Slotting

### Content Slotting

Content slotting uses the `m.slot` component to insert content from a slot source into a template. There are two types:

#### Unnamed (Default) Slots

An unnamed slot (no `name` attribute) renders the slot source's natural children:

```
[my.card
    [h.p "Card content"]
]
```

With template definition:
```
[h.div class=card
    [m.slot]  // Renders the [h.p "Card content"]
]
```

Renders as:
```html
<div class="card"><p>Card content</p></div>
```

#### Named Slots

A named slot (with `name` attribute) renders content from a matching attribute on the slot source:

```
[my.card
    c.header=[
        [h.h2 "Title"]
    ]
    c.footer=[
        [h.p "Footer"]
    ]
    [h.p "Body content"]
]
```

With template definition:
```
[h.div class=card
    [h.header [m.slot name=c.header]]
    [h.div class=body [m.slot]]
    [h.footer [m.slot name=c.footer]]
]
```

Renders as:
```html
<div class="card">
  <header><h2>Title</h2></header>
  <div class="body"><p>Body content</p></div>
  <footer><p>Footer</p></footer>
</div>
```

**Convention**: Named slots typically use the `c.` prefix (e.g., `c.header`, `c.footer`) to distinguish them from regular attributes.

#### Fallback Content

Slots can provide fallback content that renders when no source content is available:

```
[h.div class=card
    [m.slot name=c.header
        [h.h2 "Default Title"]  // Fallback if c.header not provided
    ]
    [m.slot
        [h.p "Default content"]  // Fallback if no children provided
    ]
]
```

### Attribute Slotting

Attribute slotting copies or computes attributes from a slot source to a target element.

#### With `m.slat`

`m.slat` (slot attributes) directly copies attributes from the slot source:

**Syntax:** `m.slat=[target=[source? else=default?]...]`

- `target` - Attribute name in current element
- `source` - Attribute name in slot source (defaults to `target` if omitted)
- `else` - Default value if source attribute is missing

**Example:**

Template definition:
```
[h.input m.slat=[type=[else=text] placeholder=[] value=[]]]
```

Usage:
```
[my.input type=email placeholder="Enter email"]
```

Renders as:
```html
<input type="email" placeholder="Enter email">
```

#### With `m.coat`

`m.coat` (computed attributes) assembles string attributes from slot source values using an expression syntax:

**Syntax:** `m.coat=[target=expr...]`

**Expression Syntax:**
- `<name>` - Value of named attribute, or ""
- `<name|else>` - Value if not undefined/false, or "else"
- `<name||else>` - Value if not undefined/false/"", or "else"
- `<name?then>` - "then" if not undefined/false, or ""
- `<name??then>` - "then" if not undefined/false/"", or ""
- `|` or `||` after first test toggles output state

**Special Escapes:**
- `<.aa>` → `@@`, `<.ap>` → `@#`
- `<.gt>` → `>`, `<.lt>` → `<`, `<.qm>` → `?`, `<.vb>` → `|`
- `<.un>` → Returns undefined

**Shortcuts (expanded before expression parsing):**
- `@@` → Slot source's component ID
- `@#` → Slot source's element ID

**Example:**

Template definition:
```
[h.button m.coat=[class="btn <type|primary>-btn <size>"]]
```

Usage:
```
[my.button type=danger size=small]
```

Renders as:
```html
<button class="btn danger-btn small"></button>
```

#### Automatic `m.coat`-Style Slotting

Several attributes automatically use `m.coat` expression syntax when set (unless `setAttr` option `coat=@f` / `coat: false` is specified):

- **`id`**
  - `<m.id>` and `@#` shortcut access the mandatory ID (auto-generated if needed)
- **`class`** and **`m.percl`**
  - `<m.ci>` and `@@` shortcut access the component ID
- You can calculate any (or all) with explicit `m.coat` for more-complicated use-cases.

**Example:**

```
[h.div id="@#-container" class="@@-item"]
```

If used in a template with ID `card-1` and component ID `my.card`, renders as:
```html
<div id="card-1-container" class="my.card-item"></div>
```

## Slotting Boundaries And "Slotting Through"

### Components That Create New Slotting Sources

Only certain components create new slotting boundaries (become slot sources for their content):

- **All template components**
  - The template node itself becomes the slot source for its internal content
- **`m.slot`**
  - The slot node becomes the slot source for the content it renders

Notably, the `h.*` HTML components **do not** create new slotting sources - they pass through their parent's slot source.

### The "Slotting Through" Pattern

When content is placed in a slot within a template, and you need to slot attributes from the template into that content, you must **slot the attributes through the slot first**. This is because the slot itself becomes a slotting boundary.

**Example:**

Template definition:
```
[m.slot m.slat=[in=[] in1=[] in2=[]]]
```

This slots attributes from the template node to the slot, making them available to content within the slot.

**Why this is necessary:**

```
Template Node (has attribute: in=value)
    ↓ slotSrc
Internal Fragment
    ↓ contains
Slot Node (needs: m.slat=[in=[]])
    ↓ slotSrc (NEW BOUNDARY)
Slot Content (can now access 'in')
```

Without slotting through the slot, the content inside the slot cannot access the template's attributes because the slot creates a new slotting boundary.

### Assigning Hierarchies Of Unique IDs In Reusable, Nested Template Instances

One powerful use of slotting is creating hierarchical ID structures in nested, reusable templates:

**Card template:**
```
[h.div id="@#-card" class="@@-card"
    [h.header id="@#-header" [m.slot name=c.header]]
    [h.div id="@#-body" class="@@-body" [m.slot]]
]
```

**List template:**
```
[h.ul id="@#-list" class="@@-list"
    [m.slot]
]
```

**Usage:**
```
[my.list id=main-list
    [my.card id=card-1
        c.header=[[h.h3 "Card 1"]]
    ]
    [my.card id=card-2
        c.header=[[h.h3 "Card 2"]]
    ]
]
```

**Renders with hierarchical IDs:**
```html
<ul id="main-list-list" class="my.list-list">
  <div id="card-1-card" class="my.card-card">
    <header id="card-1-header">...</header>
    <div id="card-1-body" class="my.card-body">...</div>
  </div>
  <div id="card-2-card" class="my.card-card">
    <header id="card-2-header">...</header>
    <div id="card-2-body" class="my.card-body">...</div>
  </div>
</ul>
```

**Key points:**

- `@#` expands to the template node's ID (e.g., `card-1`)
- `@@` expands to the component's registry ID (e.g., `my.card`)
- This creates unique, hierarchical IDs even with multiple instances
- IDs are predictable and can be targeted for styling or scripting

### Slotting Transparency

Different component types handle slotting differently:

- **Templates and slots**: Create new slotting boundaries (become slot sources)
- **HTML elements (`h.*`)**: Pass through their parent's slot source (transparent)
- **Fragments (`m.frg`)**: Pass through their parent's slot source (transparent)

This design ensures that:
- Templates and slots create clear composition boundaries
- HTML elements and fragments don't interfere with slotting
- The slotting hierarchy remains predictable and composable

## Summary

Slotting in MWI provides a powerful, flexible system for component composition:

1. **Content slotting** (`m.slot`) enables templates to accept and position content
2. **Attribute slotting** (`m.slat`, `m.coat`) enables attribute propagation and computation
3. **Slotting boundaries** (templates and slots) create clear composition points
4. **Hierarchical IDs** enable unique identification in nested, reusable components

Understanding slotting is essential for creating reusable, composable MWI components.
