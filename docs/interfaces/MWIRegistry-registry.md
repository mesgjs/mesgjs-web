# MWIRegistry - Component Registry

**Interface:** `MWIRegistry`  
**Source:** [`src/mwi-registry.msjs`](../src/mwi-registry.msjs)  
**Type:** Singleton  
**Status:** ACTIVE

## Overview

`MWIRegistry` is the central singleton registry for all MWI component definitions. It manages component registration, ID generation, and coordinates module loading through feature promises.

## Key Responsibilities

- Component registration and lookup
- Unique ID generation (component IDs, element IDs)
- Feature-promise coordination for module loading
- Server-to-client component synchronization

## Lifecycle

1. **Initialization:** Creates singleton instance
2. **Registration Open:** Signals `mwi.compRegOpen` feature
3. **Component Registration:** Modules register components
4. **Registration Complete:** Waits for all `mwi.comp.*` features
5. **Registry Ready:** Signals `mwi.compRegReady` feature

## Operations

### Component Lookup

**`(get name)` / `get(name)`**
- Returns component entry immediately (synchronous)
- If registered and loaded → Returns full entry
- If registered but deferred → Returns partial entry with `ftr` field
- If not registered → Returns `undefined`

**`(getWait name)` / `getWait(name)`**
- Returns promise for component entry (asynchronous)
- Waits for `mwi.compRegReady` if not ready
- Triggers `fwait()` on deferred component's feature
- Returns full entry after load completes
- Returns `undefined` if component doesn't exist

### Component Registration

**`(register name if=ifName? tpl=tplSpec? ftr=feature? allowLate=bool?)` / `register(name, entry)`**
- Registers or updates a component entry
- `if` - Interface name for code-backed components
- `tpl` - Template spec for template components
- `ftr` - Feature promise for deferred loading
- `allowLate` - Allow registration after `mwi.compRegReady` (test mode only)
- Returns registry instance (chainable)
- Assigns unique component ID on first registration

### ID Generation

**`(nextId)` / `nextId()`**
- Returns next unique element ID
- Server: `_MS_<base36>` (e.g., `_MS_0`, `_MS_1j`)
- Client: `_ML_<base36>` (e.g., `_ML_0`, `_ML_a4`)
- Separate namespaces prevent server/client collisions

## ID Namespaces

### Component IDs
- Format: `_MO_<base36>`
- Assigned at registration time
- Must synchronize server-to-client
- Passed via `globalThis.mwiServer.at('components')`

### Element IDs
- Server: `_MS_<base36>`
- Client: `_ML_<base36>`
- No synchronization needed (separate namespaces)

## Feature Promises

### Registry Features
- `mwi.compRegOpen` - Registry ready for registrations
- `mwi.compRegReady` - All preload components registered

### Component Features
- `mwi.comp.<ModuleName>` - Each component module signals ready
- Example: `mwi.comp.MWICore`, `mwi.comp.MWIHTML`

## Server-to-Client Synchronization

**Server Side:**
```javascript
// Component IDs assigned during SSR
// Passed to client via globalThis.mwiServer
globalThis.mwiServer = new NANOS({
    components: new NANOS(['m.t', 'h.div', 'my.component'])
});
```

**Client Side:**
```javascript
// Registry reads globalThis.mwiServer.at('components')
// Assigns same IDs to same components
// Ensures consistent component identification
```

## Test Mode

In test mode (`testMode: true` in module metadata):
- All component features treated as preload
- Allows `allowLate: true` for late registration
- Enables JIT component registration in tests

**Example:**
```javascript
registry.register('test.component', ls([
    'allowLate', true,
    'tpl', ps('[([h.div "Test"])]')
]));
```

## Usage Examples

### Basic Registration

```javascript
// In component module's loadMsjs(mid)
await $c.fwait('mwi.compRegOpen');

const registry = getInstance('MWIRegistry');

// Register template component
registry.register('my.button', ls([
    'tpl', ps('[([h.button [m.slot]])]')
]));

// Register code-backed component
registry.register('my.widget', ls([
    'if', 'MyWidgetInterface'
]));

// Register deferred component
registry.register('my.heavy', ls([
    'ftr', 'mwi.comp.MyHeavy'
]));

$c.fready(mid, 'mwi.comp.MyComponents');
```

### Component Lookup

```javascript
// Synchronous lookup
const entry = registry.get('h.div');
if (entry) {
    const ifName = entry.at('if');
    // Use interface...
}

// Asynchronous lookup (waits for deferred)
const entry = await registry.getWait('my.heavy');
// Component is now loaded
```

### ID Generation

```javascript
const id1 = registry.nextId(); // "_MS_0" or "_ML_0"
const id2 = registry.nextId(); // "_MS_1" or "_ML_1"
```

## Related Interfaces

- [`MWIDocument`](MWIDocument-document.md) - Uses registry for component lookup
- [`MWIDocNode`](MWIDocNode-document-node.md) - Created via registry entries
