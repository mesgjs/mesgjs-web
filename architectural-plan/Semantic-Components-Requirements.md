- Central theming (Material-ish)
  - Built-in light and dark theme support
  - Primary, secondary, and tertiary colors for buttons
- Needs to support a11y (best-effort WCAG 2.2)
  - Probably use `a.` prefix for accessability-related attributes that don't have industry-standard names (if needed)
- REM-based sizing for root-based scaling
- Semantic buttons should be able to generate button-styled links if an href attribute is provided
- Text input fields should support "v." validation
  - `v.min`, `v.len`, `v.max` - length limits
  - `v.ire` - incremental input validation regex
  - `v.are` - acceptance validation regex
- Input fields should support bidirectional binding with `%*MWIData` at the `d.value` attribute path.
- If a text input is active, programmatic changes should be saved, but not applied unless the input is aborted by pressing the Escape key.
- Pressing Escape in an active text input should revert the input to its previous value (or pending programmatic value).
- Form fields should subscribe to the form to report whether the field is valid and hance whether the form submit should be disabled.
- Components may start out with a JS-first (or only) design, but ultimately need to end up as Mesgjs-first modules
  - Try to avoid generating so much technical debt that solutions have to be completely rearchitected
- To minimize the number of files, components should be grouped together where it makes reasonable sense (such as components for form fields)
- The `msjsload` command works from a single module catalog at a time (not collections of catlogs)
- Catalog entries are generated and added from information in the module's (component's) `.msjs` and `.slid` files at `msjstrans` transpilation time
- Let's switch to using a `d.` ("data") prefix for values bound to `%*MWIData` paths.
  - This provides a clean separation from `v.*` (for validation), and things like `m.attr` (slotted attributes).
- Important note: We need to restore the accidentally-dropped content (node) and attribute slotting support, but let's take the opportunity to re-specify this:
  - `[m.slot name=cs.default default content]` - a content slot in a declarative template (default slot name is `cs.default`)
    - Gets replaced by either matching content (by attribute name) or its default content
    - Since Mesgjs named-values support compound values, there's no need to scan children for a `slot` attribute; just fill the slot from the matching attribute.
    - By *convention*, content slot names should use a `cs.` prefix; attribute slot names should use an `as.` prefix.
  - `[component cs.header=[header content] cs.footer=[footer content] cs.default default slot content]`
    - `[m.slot name=cs.header slot default content]` will be populated from the `cs.header` attribute (falling back to `slot default content`)
    - `[m.slot name=cs.footer slot default content]` will be populated from the `cs.footer` attribute (falling back to `slot default content`)
    - `[m.slot slot default content]` or `[m.slot name=cs.default slot default content]` will be populated from either the `cs.default` attribute (if present, like normal) **or (special case) the parent's positional parameters 1-n (if present)** (falling back to `slot default content`)
  - `[component as.name=[attr=value ...]]` - attribute/value pairs for attribute-slotting (positional values are ignored)
    - `as.` prefix-convention suggests intent to use for attribute slotting.
  - `[tagOrComponent m.attr=as.name;attrList ...]` - merge attributes from attribute `as.name`
    - The comma-separated attribute list specifies which attributes are allowed to be (or prohibited from being, in the case of a `@not:` prefix) merged.
    - Classes and styles are merged (when allowed/not prohibited) using the `editClass` and `editStyle` mechanisms, respectively
  - Slotting substitutions should happen automatically for declarative components.
  - Smart components should have access to helper functions/methods for merging attribute slot content.
    - The helper should accept a vnode attribute value (NANOS), a `m.attr`-ish allow/prohibit list (comma-separated, but without a leading attribute name + `;`, as the smart component just picks the desired attribute from its vnode), and a target vnode to merge the allowed/non-prohibited attributes into.
    - The helper should also understand the `@not:` prefix for the allow-to-prohibit change in interpretation of subsequent attribute names.
- Pub/sub rendez-vous points should be efficient
  - E.g. a form component should be able to publish to a single form path, e.g. `d.pub=forms.contactForm`
  - All the fields in the form should be able to subscribe to that same rendez-vous point, e.g. `d.sub=forms.contactForm`
  - Once a field has access to the publisher's receiver object, it can send messages as required
  - As long as communications are between Mesgjs objects (using the d.sm function), the publisher can save and reply to the sender (d.sr) as necessary
- Existing `m.bind` references are *not* a good attribute name for value binding, as there might be several different properties to be bound, e.g.
  - `d.value` (input value binding)
  - `d.disabled` (whether input is enabled or disabled)
  - `d.readonly` (whether input is readonly)
  - `d.class` (external, dynamic class adjustments)
  - `d.hide` (dynamic content hiding)
- Since obvious inverses (like `d.enabled`, `d.show`) don't exist (and would cause precedence issues if they did), allow `@not:` as a boolean-inversion prefix for boolean controls (like some of the examples above)
  - Example: `d.disabled=@not:form.ready`

## Tier 1: Core Components (Critical for MVP)

### Forms & Inputs

* **form fields**

  * Should manage label association, error display, help text, and validation state.
  * Should support disabled and readonly.

* **`input-text` / `input-number` / `input-password` / `input-email` / `text-area`**

  * Each with accessible labeling and value sync.

* **`textarea`**
* **`select` / `dropdown`**

  * Ideally with keyboard navigation and optional multiselect.

* **`checkbox` / `radio-group`**
* **`form`**

  * Coordinates form-field validation (from a submittability perspective), submission, and reset.

### Buttons

* **`button`** (default, link-style, submit, icon(s), etc.)

  * Should support variants (e.g. primary, secondary, ghost, danger).

### Layout & Containers

* **`panel` / `card`**

  * For grouping content, often with header/footer slots.

* **`container`**

  * For basic spacing/layout scaffolding.
  * Should support image and possibly video backgrounds.

### Navigation

* **`tabs` / `tab`**

  * Should be accessible (keyboard support, aria roles).
  * Possibly vertical as well as horizontal??

* **`accordion`**
* **`breadcrumb`**
* **`navbar` / `navigation-menu`**

  * Configurable list of links, optional icons, active state tracking.

---

## Tier 2: Standard Interactive Components (Highly useful)

### Feedback & Messaging

* **`toast` / `notification`**

  * `notification` is probably more clear outside of UI-designer circles.
  * I'm pretty sure WCAG says these shouldn't auto-dismiss. We probably need to queue them.
  * Possibly have a `show=count` attribute to show up-to `count` at a time.

* **`alert` / `banner`**

  * For inline messages (info, warning, error, success).
  * These are probably *variants* supported by other containers (e.g. `div`, `span`, `paragraph`)
  * We want to avoid creating components which boil down to being thematic variations

* **`spinner` / `loader`**

  * Used during async actions.

### Modal & Overlay

* **`dialog` / `modal`**
* **`popover` / `tooltip`**

  * With keyboard/focus management.
  * Manage open/closed status via `%*MWIData` path?

### List & Content Components

* **`list` / `list-item`**

  * Useful for displaying structured reactive lists.

* **`description-list`**

  * For name/value pairs (metadata, user profile info).

* **`table`**

  * With optional sort, pagination, column definitions.

* **`pagination`** (might be separate)

* **`dynamic-text`**

### Icons / Avatars / Media

* **`icon`** wrapper (or support for inline SVG icons)
* **`avatar`**
* **`image`**

  * With fallback handling (e.g. default profile icon)

---

## Tier 3: Enhancement Components (Optional but valuable)

### Additional Form Inputs

* **`input-color` / `input-xy`**

  * `input-color` can leverage the `Hugh` color-picker project.
  * `input-xy` (and `slider`) can leverage the `xyinput` project.

* **`private-input-text` / `private-input-password`**

  * These should render in a *closed* shadow DOM.
  * Their values are **only** accessible to their (e.g. smart component) creators.
  * We'll need to architect how this communication actually takes place.

### Interaction Helpers

* **`menu` / `dropdown-menu`**

  * For actions, contextual menus.

* **`slider`**
* **`progress-bar`**
* **`file-upload`** (with drag/drop or preview options)

### Utility and Structure

* **`grid` / `stack` / `flex`**

  * For layout primitives (could be handled via utility classes if Mesgjs adopts something like Tailwind internally).

* **`section` / `header` / `footer` / `main` / `article`**

  * For semantic page structure (may not need custom components if native HTML is adequate).

---

## Design Considerations

* **Focus management**: `dialog`, `tabs`, and `accordion` should all handle keyboard navigation.
* **Slot support**: especially important for form fields, panels, modals.
* **Style variants**: allow themes or visual intent to be expressed (e.g. `variant="danger"`).
* **Component state wiring**: integrate cleanly with `reactive` or Yjs-driven state for dynamic editing.
* **Form participation**: any input-like component should play nicely with `form`, including `.formData()` compatibility.
