# MWI Form Components

**Status:** DRAFT  
**Last Updated:** 2026-07-13

## Overview

This document specifies the MWI form component system, providing semantic form controls with reactive data binding and accessibility features. The system builds on the V5 foundation to deliver a complete, production-ready form handling solution.

## Data Binding System (`d.*` attributes)

### Overview

The `d.*` attribute system provides declarative reactive bindings between form components and the `%*MWIData` reactive data store in global shared storage (`$gss`). Binding names are event-based: the event that triggers a write (if any) is named directly, and combined read/write bindings compose the write-event name with `From`.

### Binding Types

**`d.from` - One-Way (Data → UI)**
- Reactively syncs component value from MWIData
- User input does NOT update MWIData
- Use for display-only or controlled inputs
- Available on all data-bound components (`m.check`, `m.input`, `m.select`, `m.textarea`)
- Values update regardless of `disabled` or `readonly` status

**`d.input` - One-Way (UI → Data), write on `input` event**
- Reactively syncs MWIData from component value as the user types
- Programmatic MWIData changes do NOT update component
- Only available for text-based inputs: `m.input`, `m.textarea`
- Use for write-only scenarios (rare)

**`d.change` - One-Way (UI → Data), write on `change` event**
- Reactively syncs MWIData from component value when the change is committed
- Programmatic MWIData changes do NOT update component
- Available on all data-bound components; the only write event for `m.check` and `m.select`
- Use for write-only scenarios (rare)

**`d.inputFrom` - Two-Way (Data ↔ UI), write on `input` event**
- Equivalent to `d.input` + `d.from` for the same MWIData key
- Only available for text-based inputs: `m.input`, `m.textarea`
- Bidirectional synchronization

**`d.changeFrom` - Two-Way (Data ↔ UI), write on `change` event**
- Equivalent to `d.change` + `d.from` for the same MWIData key
- Available on all data-bound components; most common binding type overall
- Bidirectional synchronization

### Binding Syntax

```javascript
node.setAttr('d.changeFrom', 'user.email');
// Binds to %*[MWIData user.email]
```

```msjs
[m.input d.changeFrom=user.email]
```

**Notes:**
- Bindings are scalar-valued, not list-valued
- Binding to a non-string value (e.g. list) is currently unsupported and does not create the binding
- `d.from`, `d.input`, and `d.change` *may* bind to different values
- Bindings are structurally flat. Use of "separator characters" such as period, slash, etc. are for visual organizational effect only

## Reactive Value Outputs (`changeValue` / `inputValue`)

### Overview

In addition to the declarative `d.*` binding system (which reads/writes the shared `%*MWIData` reactive store), form components expose a second, direct mechanism for code to interact with input values: reactive value output operations/properties. These provide programmatic, reactive read access to a specific component's current value **without** involving `%*MWIData` or any other shared/global storage.

This is especially useful for scenarios such as login forms, where it is undesirable to have clear-text password values exposed under `%*MWIData` via `d.*` bindings.

### `(changeValue)` / `.changeValue`

- Available on all data-bound components (`m.check`, `m.input`, `m.select`, `m.textarea`)
- Reactively reflects the component's current value, updated when a `change` event commits (same trigger as `d.change`)
- Accessing the operation/property returns the underlying reactive's `.rv` — i.e. the current value, synchronously, while still creating reactive demand for future updates
- `m.check` returns its `value` if checked/selected and not disabled, or `null` otherwise; unlike data binding, there is no same-name value aggregation
- `m.select` in `multiple` mode returns a reactive NANOS list of selected values

### `(inputValue)` / `.inputValue`

- Available only on text-based inputs: `m.input`, `m.textarea`
- Reactively reflects the component's current value as the user types, updated on every `input` event (same trigger as `d.input`)
- Accessing the operation/property returns the underlying reactive's `.rv`

### Relationship to `d.*` Bindings

- `changeValue`/`inputValue` are entirely independent of any `d.*` MWIData bindings configured on the same component; a component may have both, either, or neither active simultaneously
- Unlike `d.*` bindings, `changeValue`/`inputValue` never write to `%*MWIData`, so there's no risk of accidentally exposing sensitive input values in global storage

### Example: Login Form Password Field

```msjs
[m.input type=password id=pw]
```

```javascript
const pwNode = doc.getDocById('pw');

// Direct, reactive access — never touches %*MWIData
const committedPassword = pwNode.changeValue; // or pwNode(changeValue) in Mesgjs
const livePassword = pwNode.inputValue; // or pwNode(inputValue) in Mesgjs

// React to changes without exposing the value globally
const _check = reactive({ eager: true, def: () => {
	const pw = pwNode.changeValue;
	// ...validate / submit / etc., value never leaves this closure
}});
```

## Core Components

### MWIFormButton (`m.button`)

A semantic button component that renders as either `<button>` or `<a>` depending on how it was created.

**Rendering Logic (Fixed at Creation):**
- **With `href`:** Renders as `<a m.percl='a--button'>` tag
- **Without `href`:** Renders as `<button>` tag
- **No Mode Switching:** The component's element type (`<a>` vs `<button>`) is determined once at creation and never changes afterward — not in response to `disabled` changes, and not in response to `href` being added or removed post-creation. `m.button` remains in whichever mode it was created in.

**Attributes:**
- `href` (string) - If present at creation time, causes the component to render as `<a>`; has no effect on element type if set/changed afterward (the component's mode is already fixed)
- `disabled` (boolean) - Disables button *or link* interaction; never changes the component's underlying element type (see `<a disabled>` implementation below)
- `type` (string) - Button type: `'button'` (default), `'submit'`, `'reset'`; not applicable when rendered as `<a>`
- Standard HTML attributes: `class` (includes `a--button` for `<a>` styling), `id`, `style`, `aria-*`, etc.

**Implementing `<a disabled>`**
- Theme styling should set cursor to `not-allowed`
- Use a global, delegated click handler to `preventDefault` when the associated component's `disabled` state is true
- Force `tabIndex="-1"` and `aria-disabled="true"` while disabled; restore stored `tabIndex`/`aria-disabled` values (if any) while enabled
- Theme should style disabled `<a class="a--button">` elements (e.g. via `[disabled]`) the same as a disabled `<button>`
- This handling is purely CSS + JS (attribute toggling and a delegated click handler); it never involves replacing the `<a>` element with a `<button>` element

**Interface:** `MWIFormButton`
**Component Type:** `m.button`
**Extends:** [`MWIDocNode`](../docs/interfaces/MWIDocNode-document-node.md)

**CSS Notes:**
- Standard page CSS should style `a.a--button` for button-consistent appearance
- Standard page CSS should style disabled-link appearance, e.g. `a.a--button[disabled]`
- Use `m.percl` to apply permanent `a--button` class.

### MWIFormNode (`m.input`, `m.textarea`, `m.check`, `m.select`)

A single, unified semantic form input component that handles all data-bound form controls. It switches its internal behavior dynamically based on the component's `type` (`m.input`, `m.textarea`, `m.check`, or `m.select`).

**Interface:** `MWIFormNode`
**Component Types:** `m.input`, `m.textarea`, `m.check`, `m.select`
**Extends:** [`MWIDocNode`](../docs/interfaces/MWIDocNode-document-node.md)

#### Component Type Variations

The `MWIFormNode` class adapts its behavior based on the component type:

1. **Textual Inputs (`m.input`, `m.textarea`):**
   - **Attributes:** `value`, `placeholder`, `disabled`, `readonly`, `required`, and HTML5 validation attributes (`min`, `max`, `minlength`, `maxlength`, `pattern`, `step`, `rows`, `cols`, `wrap`).
   - **Data Binding:** Supports `d.from`, `d.input`, `d.change`, `d.inputFrom`, `d.changeFrom`.
   - **Reactive Outputs:** Exposes both `.changeValue` (updated on `change` event) and `.inputValue` (updated on `input` event).

2. **Checkable Inputs (`m.check`):**
   - **Attributes:** `type` (`'checkbox'` or `'radio'`), `value`, `checked`, `disabled`, `required`, `name`.
   - **Data Binding:** Supports `d.from`, `d.change`, `d.changeFrom`.
   - **Reactive Outputs:** Exposes `.changeValue` (updated on `change` event).
   - **Value Aggregation:** Checkbox groups (multiple checkboxes sharing the same `name` or bound to the same list key) represent their values as an unordered reactive NANOS list in MWIData.

3. **Select Inputs (`m.select`):**
   - **Attributes:** `value`, `disabled`, `required`, `multiple`, `size`.
   - **Children:** Accepts `h.option` and `h.optgroup` children.
   - **Data Binding:** Supports `d.from`, `d.change`, `d.changeFrom`.
   - **Reactive Outputs:** Exposes `.changeValue` (updated on `change` event).
   - **Multiple Selection:** In `multiple` mode, selected values are represented as a reactive NANOS list.

## Global Event Delegation and Event Handling

To maximize performance and minimize memory overhead, `MWIFormNode` does not register local event listeners on individual DOM elements. Instead, the MWI runtime uses global event delegation to capture user input and deliver it to the corresponding `MWIFormNode` instance.

### Global Event Delegate Setup

The MWI runtime registers single, global event listeners on the `document` for `change` and `input` events. When an event is captured, the delegate uses the `NODE_SYM` (`Symbol.for('MWINode')`) property on the event's target element to locate the associated `MWIFormNode` instance and deliver the event to its `handleDOMEvent` method.

```javascript
// Global event delegation setup in the MWI runtime
const NODE_SYM = Symbol.for('MWINode');
const handler = (event) => {
	const node = event.target[NODE_SYM];

	if (node && typeof node.onDOMEvent === 'function') {
		node.onDOMEvent(event);
	}
};

document.addEventListener('change', handler);
document.addEventListener('input', handler);
document.addEventListener('click', (event) => {
	const target = event.target.closest('a');

	// Disable click-through on <a disabled> links
	if (target?.getAttribute('disabled') != null) event.preventDefault();
});
```

### `onDOMEvent(event, target)` Method

The `MWIFormNode` class implements the `onDOMEvent(event, target)` method to process events delivered by the global delegate. This method:
1. Extracts the current value from the DOM element based on the component's `type`.
2. Updates the corresponding internal reactive value output (`changeValue` or `inputValue`).
3. Writes the updated value back to `%*MWIData` if a write binding (`d.change`, `d.changeFrom`, `d.input`, or `d.inputFrom`) is configured.

```javascript
const MWI_DATA = 'MWIData';

onDOMEvent (event) {
	const target = event.target;

	switch (target.tagName) {
	case 'INPUT':
	{
		switch (target.type) {
		case 'button': // These shouldn't happen
		case 'image':
		case 'reset':
		case 'submit':
			break;
		case 'checkbox':
		case 'radio':
			if (event.type === 'change') this.#onCheckEvent(event);
			break;
		default:
			this.#onTextEvent();
			break;
		}
		break;
	}
	case 'SELECT':
		if (event.type === 'change') this.#onSelectEvent(event);
		break;
	case 'TEXTAREA':
		this.#onTextEvent(event);
		break;
	}
}

#onCheckEvent (event) {
	const target = event.target;
	const checked = target.checked, value = target.value;
	const rxs = this.#ps.at('rxState'), rxsValue = checked ? value : null;
	const dataKey = this.getAttr('d.change') || this.getAttr('d.changeFrom');

	// Update changeValue when changed
	if (rxs.at('changeValue') !== rxsValue) rxs.set('changeValue', rxsValue);

	// Check MWIData value if configured
	if (!dataKey) return;
	
	let mwiData = $gss.at(MWI_DATA);

	if (!mwiData) { // JIT create %*MWIData if necessary
		mwiData = MWIDocument.rxNANOS();
		$gss.set(MWI_DATA, mwiData);
	}
	if (target.type === 'radio') { // Scalar-valued radio
		if (value != null && mwiData.at(dataKey) !== value) mwiData.set(dataKey, value);
		return;
	}

	// List-valued checkbox
	let valueList = mwiData.at(dataKey);

	if (!(valueList instanceof NANOS)) {
		valueList = MWIDocument.rxNANOS();
		mwiData.set(dataKey, valueList);
	}

	if (checked) { // Checked - add value to end of value list
		valueList.push(value);
		return;
	}

	// Unchecked - remove/replace with last value
	const curKey = valueList.lastKeyOf(value, { num: true });
	if (curKey != null) reactive.batch(() => {
		const last = valueList.pop();

		if (valueList.next !== curKey) valueList.set(curKey, last);
	});
}

#onSelectEvent (event) {
	const ps = this.#ps, rxs = ps.at('rxState');
	const target = event.target, multiple = target.multiple, selected = target.selectedOptions;
	const dataKey = this.getAttr('d.change') || this.getAttr('d.changeFrom');
	let mwiData;

	if (dataKey) { // JIT create %*MWIData if it will be needed
		mwiData = $gss.at(MWI_DATA);
		if (!mwiData) {
			mwiData = MWIDocument.rxNANOS();
			$gss.set(MWI_DATA, mwiData);
		}
	}

	if (!multiple) { // Single scalar value
		const value = selected.length ? selected[0].value : null;

		rxs.set('changeValue', value);
		if (dataKey) mwiData.set(dataKey, value);
		return;
	}

	// List value
	const values = Array.from(selected).map((n) => n.value);

	reactive.batch(() => {
		let rxsList = rxs.at('changeValue');

		if (!(rxsList instanceof NANOS)) {
			rxsList = MWIDocument.rxNANOS();
			rxs.set('changeValue', rxsList);
		}
		rxsList.fromEntries(Object.entries(values));
		rxsList.next = values.length;

		if (dataKey) {
			let dataList = mwiData.at(dataKey);

			if (!(dataList instanceof NANOS)) {
				dataList = MWIDocument.rxNANOS();
				mwiData.set(dataKey, dataList);
			}
			dataList.fromEntries(Object.entries(values));
			dataList.next = values.length;
		}
	});
}

#onTextEvent (event) {
	const value = event.target.value;
	const ps = this.#ps, rxs = ps.at('rxState');
	let rxsKey, dataKey;

	switch (event.type) {
	case 'change':
		rxsKey = 'changeValue';
		dataKey = this.getAttr('d.change') || this.getAttr('d.changeFrom');
		break;
	case 'input':
		rxsKey = 'inputValue';
		dataKey = this.getAttr('d.input') || this.getAttr('d.inputFrom');
		break;
	}

	if (rxs.at(rxsKey) !== value) rxs.set(rxsKey, value);
	if (dataKey) {
		let mwiData = $gss.at(MWI_DATA);

		if (!mwiData) { // JIT create %*MWIData if necessary
			mwiData = MWIDocument.rxNANOS();
			$gss.set(MWI_DATA, mwiData);
		}

		if (mwiData.at(dataKey) !== value) mwiData.set(dataKey, value);
	}
}
```

## Button Element Type (Fixed at Creation)

### Overview

The `m.button` component renders as either `<button>` or `<a>` based solely on the presence of an `href` attribute **at creation time**. Once created, the component's underlying element type never changes — there is no dynamic switching between `<button>` and `<a>` in response to attribute changes (including `disabled`).

### Rendering Rules

**Render as `<a>` when:**
- `href` attribute is present at creation time

**Render as `<button>` when:**
- `href` attribute is absent at creation time

### No Node-Type Switching

Because the element type is fixed at creation, the component only ever needs to create a single DOM node (`<a>` or `<button>`, as determined above). There is no JIT creation/reuse of the *other* node type, and no logic for replacing one element type with the other in the DOM.

**Implementation Notes:**
- The element type decision (`<a>` vs `<button>`) is made once, when the component's DOM node is first created, based on whether `href` was supplied
- Subsequent attribute changes (including `href` and `disabled`) update the existing element's attributes only; they never cause element replacement
- `disabled` state on an `<a>`-mode button is handled entirely via CSS/JS (see [Implementing `<a disabled>`](#mwiformbutton-mbutton) above) — never by swapping in a `<button>` element
- Standard page CSS can adjust `a.a--button` styling as required

### Implementation Pattern

The pattern mirrors the existing V4 `getDOM` implementation used for standard `h.*` HTML elements (see [`src/mwi-html-comp.msjs`](../src/mwi-html-comp.msjs:172)), with the tag decided once — based on `href` — instead of coming from the component's fixed `type` string:

```javascript
// Bilingual: (getDOM sync=domSync?) OR .getDOM({ sync })
getDOM (p1) {
	const d = (p1?.msjsType === '@dispatch') ? p1 : undefined;
	const ps = d?.p ?? this.#ps;
	const self = d?.rr ?? this;

	if (ps.has('_dom')) {
		ps.at('_domAttrs').rv;
		return ps.at('_dom').rv;
	}

	// Element type decided once, at creation, and never changes afterward
	const href = self.getAttr('href');
	const tag = href ? 'A' : 'BUTTON';
	const sync = d ? d.mp.at('sync') : p1?.sync;
	let existing = sync?.sync(tag, self);
	const node = existing || document.createElement(tag), nodes = new NANOS(node);

	node[NODE_SYM] = self;

	const rawAttrs = ps.at('attrs');
	const useAttrs = (tag === 'A') ? {
		namedKeys () {
			if (!rawAttrs.at('disabled')) return rawAttrs.namedKeys();

			const keys = new Set(rawAttrs.namedKeys());
			
			// Make sure tabIndex, aria-disabled attributes are included for <a disabled>
			keys.add('tabIndex');
			keys.add('aria-disabled');
			return keys;
		},
		at (name) {
			// <a disabled tabIndex="-1" aria-disabled="true">
			switch (name) {
			case 'tabIndex':
				if (rawAttrs.at('disabled')) return '-1';
				break;
			case 'aria-disabled':
				if (rawAttrs.at('disabled')) return 'true';
				break;
			}
			return rawAttrs.at(name);
		},
	} : rawAttrs;
	const _domAttrs = MWIDocNode.setDOMAttrs(node, useAttrs, ps.at(SCHEMA));
	const _dom = reactive({ eager: true, def: () => {
		const subSync = existing?.firstChild ? getInstance('MWIDOMSync', [existing.firstChild]) : undefined;
		const children = self.getSubDOM({ sync: subSync });

		if (children) {
			MWIDocNode.domSyncChildren(node, children);
			existing = null;
		}
		return nodes;
	}});

	ps.push({ _dom, _domAttrs });
	return _dom.rv;
}
```

**Notes:**
- `href` is only consulted once, at first `getDOM()` call, to pick the tag (`A` or `BUTTON`); it is never re-checked afterward to decide the element type
- Post-creation, `href` and `disabled` (and all other attributes) flow through the normal `_domAttrs` reactive attribute sync — same as any other doc-node — never through element replacement
- `disabled` behavior on an `A`-tag button is implemented separately via the delegated click handler and `tabIndex`/`aria-disabled` toggling described above

## Validation

### HTML5 Native Validation

Form components leverage HTML5 native validation attributes:

**`m.input` Validation:**
- `required` - Field must have a value
- `min` / `max` - Numeric range constraints
- `minlength` / `maxlength` - String length constraints
- `pattern` - Regex pattern matching
- `step` - Numeric step increment
- `type` - Type-specific validation (email, url, tel, etc.)

**`m.textarea` Validation:**
- `required` - Field must have a value
- `minlength` / `maxlength` - String length constraints

**`m.select` Validation:**
- `required` - Must have a selection

**`m.check` Validation:**
- `required` - Checkbox must be checked (or at least one in a group)

### Validation State

Components expose validation state via standard DOM APIs:

```javascript
const input = inputNode.getDOM().at(0);

// Check validity
const isValid = input.checkValidity();

// Get validation message
const message = input.validationMessage;

// Validity state details
const validity = input.validity;
// validity.valueMissing - required field is empty
// validity.typeMismatch - value doesn't match type
// validity.patternMismatch - value doesn't match pattern
// validity.tooLong / tooShort - length constraints
// validity.rangeUnderflow / rangeOverflow - numeric range
// validity.stepMismatch - step constraint
```

### Custom Validation

For custom validation logic, use the Constraint Validation API:

```javascript
const input = inputNode.getDOM().at(0);
// OR doc.getDocById(id).getDOM().at(0);
// OR document.getElementById(id)

// Set custom validity
input.setCustomValidity('Username already taken');

// Clear custom validity
input.setCustomValidity('');

// Report validity (shows browser UI)
input.reportValidity();
```

### Form-Level Validation

Use standard `h.form` with form components:

```msjs
[h.form
	[m.input type=email required=@t d.changeFrom=user.email]
	[m.button type=submit Submit]
]
```

```javascript
const formElem = form.getDOM().at(0);

// Check form validity
const isValid = formElem.checkValidity();

// Report form validity
formElem.reportValidity();

// Handle submit
formElem.addEventListener('submit', (e) => {
	e.preventDefault();
	if (formElem.checkValidity()) {
		// Process form
	}
});
```

## Accessibility

### ARIA Support

All form components support standard ARIA attributes:

**Common ARIA Attributes:**
- `aria-label` - Accessible label
- `aria-labelledby` - Reference to label element
- `aria-describedby` - Reference to description element
- `aria-required` - Required field indicator
- `aria-invalid` - Invalid field indicator
- `aria-disabled` - Disabled state

**Example:**
```msjs
[m.input aria-label="Email address" aria-required=true d.changeFrom=user.email]
```

### Label Association

Use standard `h.label` with `for` attribute, or wrap the input with a label:

```msjs
[h.label for=email-input Email:]
[m.input id=email-input type=email d.changeFrom=user.email]
```

Or:

```msjs
[h.label
	Email:
	[m.input type=email d.changeFrom=user.email]
]
```

### Keyboard Navigation

All form components support standard keyboard navigation:

**`m.input` / `m.textarea`:**
- Tab - Move focus to next field
- Shift+Tab - Move focus to previous field

**`m.select`:**
- Tab - Move focus to next field
- Space / Enter - Open dropdown
- Arrow keys - Navigate options
- Escape - Close dropdown

**`m.button`:**
- Tab - Move focus to next element
- Space / Enter - Activate button
- (When rendered as link) - Standard link navigation

**`m.check`:**
- Tab - Move focus to next field
- Space - Toggle checkbox / select radio
- Arrow keys - Navigate radio group

## SSR/CSR Behavior

### Server-Side Rendering (SSR)

Form components render standard HTML during SSR:

**`m.button` (created with href):**
```html
<a href="/page" class="a--button">Click Me</a>
```

**`m.button` (created with href, disabled):**
```html
<a class="a--button" disabled tabindex="-1" aria-disabled="true">Click Me</a>
```

**`m.button` (created without href):**
```html
<button type="button">Click Me</button>
```

**`m.button` (created without href, disabled):**
```html
<button type="button" disabled>Click Me</button>
```

**`m.input`:**
```html
<input type="text" value="initial" placeholder="Enter text">
```

**`m.check`:**
```html
<input type="checkbox" value="option1" checked>
```

**`m.select`:**
```html
<select>
	<option value="1">Option 1</option>
	<option value="2" selected>Option 2</option>
</select>
```

**`m.textarea`:**
```html
<textarea rows="5">Initial content</textarea>
```

### Client-Side Rendering (CSR)

During CSR, form components:
1. Hydrate existing SSR DOM nodes (when using sync mode)
2. Establish reactive bindings to MWIData
3. Set up event listeners for user input

### Hydration Example

```javascript
// SSR
const html = doc.getHTML();
// <input type="text" value="initial">

// Load into browser
document.body.innerHTML = html;

// CSR sync
const sync = getInstance('MWIDOMSync', [document.body.firstChild]);
const domNodes = inputNode.getDOM({ sync });

// Same DOM node, now reactive
const input = domNodes.at(0);
// input === document.body.firstChild (true)

// Reactive bindings active
inputNode.setAttr('value', 'updated');
await reactive.wait();
// input.value === 'updated'
```

## Implementation Checklist

### Phase 1: Core Components (`mwi-form-comp.msjs`, `mwi-form-comp.slid`)
- [ ] Implement `MWIFormButton` interface
  - [ ] Button/link rendering logic (element type fixed at creation based on `href`)
  - [ ] `<a disabled>` CSS/JS implementation (delegated click handler, tabindex/aria-disabled toggling)
  - [ ] SSR HTML generation
  - [ ] CSR DOM creation and sync
- [ ] Implement `MWIFormNode` interface
  - [ ] Dynamic behavior switching based on component `type` (`m.input`, `m.textarea`, `m.check`, `m.select`)
  - [ ] Value extraction and mapping (`getDOMValue` / `setDOMValue`)
  - [ ] SSR HTML generation for all input types
  - [ ] CSR DOM creation and sync for all input types

### Phase 2: Event Delegation and Data Binding
- [ ] Implement Global Event Delegation
  - [ ] Register global `change` and `input` listeners on `document`
  - [ ] Locate associated `MWIFormNode` via `NODE_SYM`
  - [ ] Deliver events to `handleDOMEvent(event)`
- [ ] Implement `handleDOMEvent(event)` on `MWIFormNode`
  - [ ] Extract DOM value and update `changeValue` / `inputValue` reactives
  - [ ] Write back to `%*MWIData` for write bindings (`d.change`, `d.input`, etc.)
- [ ] Implement `d.from` binding
  - [ ] MWIData reactive subscription
  - [ ] Value synchronization (Data -> UI)
- [ ] Implement `d.input` and `d.inputFrom` bindings (text-based inputs only)
- [ ] Implement `d.change` and `d.changeFrom` bindings (all inputs)

### Phase 3: Testing
- [ ] Core component tests
  - [ ] Button rendering (button vs link, fixed at creation)
  - [ ] Button `disabled` behavior in `<a>` mode (click prevention, tabindex/aria-disabled toggling)
  - [ ] Button `disabled` behavior in `<button>` mode (native `disabled` attribute)
  - [ ] Check checkbox/radio behavior via `MWIFormNode`
  - [ ] Input value handling via `MWIFormNode`
  - [ ] Select option selection via `MWIFormNode`
  - [ ] TextArea multi-line text via `MWIFormNode`
- [ ] Event delegation and data binding tests
  - [ ] Global event delegation for `change` and `input` events
  - [ ] `d.from` one-way binding
  - [ ] `d.input` one-way binding
  - [ ] `d.change` one-way binding
  - [ ] `d.inputFrom` two-way binding
  - [ ] `d.changeFrom` two-way binding
  - [ ] Checkbox groups as NANOS lists
- [ ] SSR/CSR tests
  - [ ] SSR HTML generation
  - [ ] CSR DOM creation
  - [ ] Hydration (sync mode)
  - [ ] Reactive updates after hydration
- [ ] Validation tests
  - [ ] HTML5 validation attributes
  - [ ] Validation state
  - [ ] Custom validation
  - [ ] Form-level validation

### Phase 4: Documentation
- [ ] Interface documentation
  - [ ] `MWIForm-form-fields.md`
- [ ] Data binding guide
  - [ ] `d.*` attribute reference (`d.from`, `d.input`, `d.change`, `d.inputFrom`, `d.changeFrom`)
  - [ ] MWIData integration
  - [ ] Common patterns
- [ ] Examples
  - [ ] Basic form
  - [ ] Login form
  - [ ] Registration form
  - [ ] Dynamic form

## Open Issues

1. **Site Theming:** What will site theming look like? How does CSS styling split between themes and components?

**Current thinking:** Assume site-based theming/styling, not component-based.

2. **MWIData Implementation:** The `%*MWIData` reactive data store specification needs to be drafted as a separate architectural document.

**Current thinking:** Just JIT-create as a `MWIDocument.rxNANOS()`.

## Related Documentation

- [Historical Feature Review](historical-feature-review.md) - Original V3/V4 proposals
- [Core Architecture](core-architecture.md) - System overview
- [Reactive DOM](reactive-dom.md) - Reactive patterns
- [MWIDocNode](../docs/interfaces/MWIDocNode-document-node.md) - Base interface
- [MWIHTML](../docs/interfaces/MWIHTML-HTML-elements.md) - HTML elements

## Supplemental Keywords

forms, inputs, buttons, select, textarea, checkbox, radio, data binding, validation, accessibility, reactive, SSR, CSR, hydration, user input, form controls, semantic components
