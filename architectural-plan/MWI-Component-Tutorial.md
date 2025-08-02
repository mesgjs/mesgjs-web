---
**Status:** STANDARD
**History:**
- 2025-07-29: STANDARD
**Scope:** The canonical, step-by-step guide to authoring components for the MWI.
**Replaces:**
**Replaced by:**
**Related:** MWI-Component-System.md
---
# MWI Component Tutorial

This document provides a canonical, step-by-step guide to authoring components for the Mesgjs Web Interface (MWI). It covers a basic content component and a more advanced "bilingual" component that can be controlled from both Mesgjs and JavaScript.

---

## Example 1: A Simple Content Component ("Hello, MWI")

This example demonstrates the fundamental "no build step," single-file module pattern for creating a simple, instantiable MWI component.

### 1. The Component File

All component logic resides in a single `.msjs` file.

**File: `src/shared/components/mwi-hello-world.msjs`**
```mesgjs
/* 1. In-Source SLID Configuration */
[(
    modpath = 'mwi/components/helloWorld'
    version = '1.0.0'
    featpro = 'mwi.components.mwi.helloWorld' // Public feature name
)]

/* 2. Critical Empty String for Transpiler */
// This tells msjstrans to place the following JS inside the loadMsjs function.
''

/* 3. The JavaScript Implementation */
@js{
    // This code will be implicitly wrapped in `export function loadMsjs(mid) { ... }`
    if (!mid) {
        throw new Error('mwiHelloWorld requires Mesgjs module management.');
    }

    // The JavaScript Class for our component's logic
    class HelloWorldHandler {
        constructor (componentInstance) {
            this.component = componentInstance;
            this.config = this.component('config');
        }

        render (data) {
            const name = data.at('name') || 'World';
            const greeting = this.config.at('greeting');
            return [ 'h.span', {}, [ `${greeting}, ${name}!` ] ];
        }
    }

    // The Mesgjs Interface Initialization function
    function opInit (d) {
        setRO(d.octx, 'js', new HelloWorldHandler(d.rr));
    }
    
    // The static definition for our component type
    const mwiComponentHelloWorld = {
        name: ':hello-world',
        handler: d => d.js.render(d.mp),
        config: { greeting: 'Hello' },
        schema: { /* ... */ }
    };
    
    // Register the component with the MWI System
    fwait('mwi.registry.ready').then(() => {
        const registry = getInstance('MWIComponentRegistry');
        registry('register', { component: mwiComponentHelloWorld, init: opInit });
        fready(mid, 'mwi.components.mwi.helloWorld');
    });
@}
```

### 2. Usage in Page Data

Once registered, the component can be used declaratively in any MWI page data.

```javascript
// Example page data: [':hello-world', { name: 'Alice' }]
// Renders to: <span>Hello, Alice!</span>
```

---

## Example 2: A Bilingual "Counter" Component

This example shows how to create a more complex component that can be controlled seamlessly from both Mesgjs and JavaScript.

### The Goal
Our goal is to create a `counter` object that works identically from both environments.

**In Mesgjs:**
```mesgjs
#(nset counter=@c(get counter init=[initialValue=10]))
#counter(increment)
@c(log #counter(value)) // Logs 11
```

**In JavaScript:**
```javascript
const myCounter = getInstance('counter', { initialValue: 10 });
myCounter.jsv.increment();
console.log(myCounter.jsv.value()); // Logs 11
```

### Pattern A: JavaScript-Managed State

This pattern is best for components where state is not sensitive and is primarily managed by JavaScript. The Mesgjs interface acts as a thin wrapper.

**1. The JavaScript Class:**
```javascript
class Counter {
    constructor(initialValue = 0) { this.count = initialValue; }
    increment() { this.count++; }
    value() { return this.count; }
}
```

**2. The Bilingual Interface:**
The `@init` handler creates an instance of the `Counter` class and attaches it to the `.jsv` property for external JS access and the internal `d.js` context for Mesgjs handlers.

```javascript
// Inside loadMsjs()
function opInit_JS(d) {
    const initialValue = d.mp.at('initialValue', 0);
    const jsInstance = new Counter(initialValue);
    setRO(d.octx, 'js', jsInstance);  // For internal handlers
    setRO(d.rr, 'jsv', jsInstance);   // For external JS consumers
}

const counterInterface_JS = getInterface('counter_js');
counterInterface_JS.set({
    handlers: {
        '@init': opInit_JS,
        'increment': d => d.js.increment(),
        'value': d => d.js.value()
    }
});
```

### Pattern B: Mesgjs-Managed State

This pattern is ideal for protecting state with Mesgjs's security model. The state lives in persistent storage (`%p`), and the JavaScript methods simply send messages to the Mesgjs object to trigger the authoritative handlers.

**1. The JavaScript Prototype (Message Senders):**
```javascript
const CounterPrototype = Object.setPrototypeOf({
    increment() { return this('increment'); }, // 'this' is the Mesgjs receiver
    value() { return this('value'); }
}, Function.prototype);
```

**2. The Bilingual Interface (Logic Holders):**
The `@init` handler sets up the private state in `d.p` and attaches the JS prototype.

```javascript
// Inside loadMsjs()
function opInit_Mesgjs(d) {
    d.p.set('count', d.mp.at('initialValue', 0));
    Object.setPrototypeOf(d.rr, CounterPrototype);
}

const counterInterface_Mesgjs = getInterface('counter_mesgjs');
counterInterface_Mesgjs.set({
    handlers: {
        '@init': opInit_Mesgjs,
        'increment': d => { d.p.set('count', d.p.get('count') + 1); },
        'value': d => d.p.get('count')
    }
});
```
This consolidated tutorial now serves as the single source of truth for component authoring patterns.