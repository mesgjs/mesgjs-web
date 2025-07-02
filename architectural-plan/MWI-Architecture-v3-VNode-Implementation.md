# MWI VNode Implementation Specification

## Overview

This document specifies the implementation details for the enhanced MWI VNode system, including the new naming convention and copy-on-write protection.

## Core Classes

### VNodeStorage

```typescript
class VNodeStorage {
    #attributes: Map<string, any>;
    #classes: Set<string>;
    #styles: Map<string, string>;
    #copied: boolean = false;

    constructor() {
        this.#attributes = new Map();
        this.#classes = new Set();
        this.#styles = new Map();
    }

    protected ensureMutable(): void {
        if (!this.#copied) {
            this.#attributes = new Map(this.#attributes);
            this.#classes = new Set(this.#classes);
            this.#styles = new Map(this.#styles);
            this.#copied = true;
        }
    }
}
```

### MWIVNode Base Class

```typescript
class MWIVNode {
    readonly type: string;
    readonly opts: Record<string, any>;
    #storage: VNodeStorage;
    children: Array<MWIVNode | string>;
    scope?: string;

    constructor(type: string, opts = {}) {
        if (typeof type !== 'string' || !/^[a-zA-Z0-9@:.+-]+$/.test(type)) {
            throw new TypeError(`Invalid virtual node name: ${type}`);
        }
        this.type = type;
        this.opts = opts;
        this.#storage = new VNodeStorage();
        this.children = [];
    }

    // Attribute Methods
    getAttr(name: string): any {
        switch (name) {
            case 'class':
                return this.class || undefined;
            case 'style':
                return this.style || undefined;
            default:
                return this.#storage.getAttr(name);
        }
    }

    setAttr(name: string, value: any): this {
        switch (name) {
            case 'class':
                this.clearClass();
                if (value) this.editClass(value);
                break;
            case 'style':
                this.clearStyle();
                if (value) this.editStyle(value);
                break;
            default:
                this.#storage.ensureMutable();
                if (value === false || value === null) {
                    this.#storage.deleteAttr(name);
                } else if (/^[a-zA-Z0-9_-]+$/.test(name)) {
                    this.#storage.setAttr(name, value);
                }
        }
        return this;
    }

    // Class Methods
    addClass(...names: string[]): this {
        this.#storage.ensureMutable();
        for (const name of names) {
            if (/^[a-zA-Z0-9@_-]+$/.test(name)) {
                this.#storage.addClass(name);
            }
        }
        return this;
    }

    removeClass(...names: string[]): this {
        this.#storage.ensureMutable();
        for (const name of names) {
            this.#storage.removeClass(name);
        }
        return this;
    }

    // Style Methods
    setStyle(property: string, value: string): this {
        this.#storage.ensureMutable();
        if (/^[a-zA-Z0-9_-]+$/.test(property)) {
            this.#storage.setStyle(property, value);
        }
        return this;
    }

    getStyle(property: string): string | undefined {
        return this.#storage.getStyle(property);
    }

    // Child Management
    append(...children: Array<MWIVNode | string>): this {
        this.children.push(...children);
        return this;
    }

    // Static Factories
    static fromData(data: any): MWIVNode {
        if (Array.isArray(data)) {
            const [type, ...rest] = data;
            const node = new MWIVNode(type);
            for (const item of rest) {
                if (typeof item === 'object' && item !== null) {
                    for (const [key, value] of Object.entries(item)) {
                        node.setAttr(key, value);
                    }
                } else {
                    node.children.push(item);
                }
            }
            return node;
        }
        // Handle NANOS format
        if (typeof data?.values === 'function' && typeof data?.namedEntries === 'function') {
            const [type, ...children] = data.values();
            const node = new MWIVNode(type);
            node.children.push(...children);
            for (const [key, value] of data.namedEntries()) {
                node.setAttr(key, value);
            }
            return node;
        }
        return undefined;
    }
}
```

## Implementation Notes

1. **Copy-on-Write Strategy**
   - Storage objects are immutable until first modification
   - Copying happens automatically on first write
   - Each storage type (attributes, classes, styles) copied independently

2. **Method Naming**
   - Primary attribute methods: `getAttr`/`setAttr`
   - Class manipulation: `addClass`/`removeClass`
   - Style handling: `setStyle`/`getStyle`

3. **Validation**
   - Type names: `/^[a-zA-Z0-9@:.+-]+$/`
   - Attribute names: `/^[a-zA-Z0-9_-]+$/`
   - Class names: `/^[a-zA-Z0-9@_-]+$/`
   - Style properties: `/^[a-zA-Z0-9_-]+$/`

4. **Special Handling**
   - Class and style attributes have dedicated methods
   - Boolean attributes handled specially (true = present, false/null = absent)
   - Scope replacement for @@ tokens

## Migration Path

1. Create new base class implementation
2. Update SSR/CSR implementations to extend base
3. Deprecate old method names
4. Update component handlers to use new names

## Next Steps

1. Switch to Code mode to implement MWIVNode base class
2. Create test suite for new implementation
3. Update SSR/CSR implementations
4. Update documentation