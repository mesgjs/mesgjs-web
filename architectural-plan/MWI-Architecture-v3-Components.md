# MWI Component Lifecycle

This document details the component lifecycle system for the Mesgjs Web Interface (MWI), focusing on component handlers, state management, and the mount/unmount system.

## Component Types

```mermaid
graph TD
    subgraph "Component Categories"
        A[Component] --> B[Smart Component]
        A --> C[Declarative Component]
        B --> D[Event Handling]
        B --> E[Direct Validation]
        B --> F[State Management]
        C --> G[Composition Based]
        C --> H[Template Driven]
    end
```

### Smart Components
- Full lifecycle control
- Direct event handling
- Reactive state management
- Fine-grained dependency tracking
- Shadow DOM support
- Direct DOM updates via eager reactives

### Declarative Components
- Template-based rendering
- Composition with smart components
- Static structure
- Resource declarations
- Reactive value consumption
- Automatic dependency tracking

## Mount/Unmount System

### Mount Monitor (MUM)

```mermaid
graph TD
    A[DOMContentLoaded] --> B[Process Empty ID]
    B --> C[Initial Mount Pass]
    C --> D[MutationObserver]
    D --> E[Mount Events]
    D --> F[Unmount Events]
```

1. **Subscription Types:**
   ```typescript
   type EventType = 'mount' | 'unmount';
   
   interface MountHandler {
       module: string;
       interface: string;
       message: any;
       type: EventType;
       once?: boolean;
   }

   class MWIMUM {
       private subscriptions: Map<string, Set<MountHandler>>;
       
       subscribe(
           elementId: string,
           handler: MountHandler
       ): Symbol {
           const id = Symbol();
           if (!this.subscriptions.has(elementId)) {
               this.subscriptions.set(elementId, new Set());
           }
           this.subscriptions.get(elementId)!.add(handler);
           return id;
       }
   }
   ```

2. **Event Processing:**
   ```typescript
   class MWIMUM {
       private async processMutation(mutation: MutationRecord) {
           if (mutation.type === 'attributes') {
               // Handle ID attribute changes
               const element = mutation.target as Element;
               const newId = element.id;
               const oldId = mutation.oldValue;

               if (oldId && this.subscriptions.has(oldId)) {
                   // Process unmount for old ID
                   await this.processHandlers(element, 'unmount');
               }
               if (newId && this.subscriptions.has(newId)) {
                   // Process mount for new ID
                   await this.processHandlers(element, 'mount');
               }
               return;
           }

           // Handle added/removed nodes
           const processNodes = (nodes: NodeList, type: EventType) => {
               for (const node of nodes) {
                   if (!(node instanceof Element)) continue;
                   
                   // Only process if node has ID and we have subscriptions
                   const id = node.id;
                   if (id && this.subscriptions.has(id)) {
                       this.processHandlers(node, type);
                   }

                   // Check children with IDs
                   const children = node.querySelectorAll('[id]');
                   for (const child of children) {
                       const childId = child.id;
                       if (childId && this.subscriptions.has(childId)) {
                           this.processHandlers(child, type);
                       }
                   }
               }
           };

           processNodes(mutation.addedNodes, 'mount');
           processNodes(mutation.removedNodes, 'unmount');
       }

       private async processHandlers(element: Element, type: EventType) {
           const id = element.id;
           if (!id || !this.subscriptions.has(id)) return;

           const handlers = this.subscriptions.get(id)!;
           for (const handler of handlers) {
               if (handler.type !== type) continue;

               try {
                   await this.executeHandler(handler, element);
                   if (handler.once) {
                       handlers.delete(handler);
                   }
               } catch (error) {
                   this.handleError(id, handler, error);
               }
           }
       }
   }
   ```

3. **Initialization:**
   ```typescript
   class MWIMUM {
       init() {
           // Process empty ID handlers first
           this.processHandlers(document.documentElement, 'mount');
           
           // Process mount subscriptions by ID lookup
           for (const [id, handlers] of this.subscriptions) {
               if (id === '') continue; // Skip empty ID, already processed
               
               const element = document.getElementById(id);
               if (element) {
                   this.processHandlers(element, 'mount');
               }
           }
           
           // Start observing
           this.observer.observe(document.body, {
               childList: true,
               subtree: true,
               attributes: true,
               attributeFilter: ['id'] // Only watch id changes
           });
       }
   }
   ```

## Component Handler Structure

```typescript
interface ComponentHandler {
    // Required: Main render function
    render(data: any): ComponentPayload | any;
    
    // Optional: Lifecycle hooks
    mount?(): void;
    unmount?(): void;
}

interface ComponentPayload {
    content: any;
    scopedCss?: string;
    stylesheets?: Set<string>;
    modules?: Set<string>;
    
    // Mount/unmount handlers
    mount?: {
        [elementId: string]: Array<{
            module: string;
            interface: string;
            message: any;
            once?: boolean;
        }>;
    };
    
    unmount?: {
        [elementId: string]: Array<{
            module: string;
            interface: string;
            message: any;
            once?: boolean;
        }>;
    };

    // Reactive bindings
    reactiveBindings?: {
        [key: string]: Reactive;
    };
}

// Smart component with reactive support
interface SmartComponentHandler extends ComponentHandler {
    defineState(key: string, options: ReactiveOptions): Reactive;
    getState(key: string): Reactive;
    batchUpdate(callback: () => void): void;
}
```

## State Management

### Component State

The SmartComponent base class provides a sophisticated reactive state management system:

```typescript
class SmartComponent {
    private reactiveState: Map<string, Reactive>;
    private domUpdaters: Set<Reactive>;
    
    protected defineState(key: string, options: {
        value?: any,
        def?: (oldValue: any) => any,
        eager?: boolean,
        compare?: (a: any, b: any) => boolean
    }) {
        const r = reactive(options);
        this.reactiveState.set(key, r);
        return r;
    }

    protected getState(key: string): Reactive {
        return this.reactiveState.get(key);
    }

    // Batch multiple state updates
    protected batchUpdate(callback: () => void) {
        reactive.batch(callback);
    }
}
```

### Reactive Component Example

```typescript
class UserProfileComponent extends SmartComponent {
    constructor() {
        super();
        // Define reactive state
        this.defineState('firstName', { value: '' });
        this.defineState('lastName', { value: '' });
        
        // Computed values with automatic dependency tracking
        this.defineState('fullName', {
            def: () => {
                const first = this.getState('firstName').rv;
                const last = this.getState('lastName').rv;
                return `${first} ${last}`;
            }
        });

        // Reactive class bindings
        this.defineState('inputClasses', {
            def: () => ({
                'empty': !this.getState('firstName').rv,
                'modified': this.getState('lastName').rv !== ''
            })
        });
    }

    render(data: any) {
        const firstName = this.getState('firstName');
        const lastName = this.getState('lastName');
        const fullName = this.getState('fullName');
        const inputClasses = this.getState('inputClasses');
        
        return {
            content: ['h.div', {}, [
                ['h.input', {
                    value: firstName,  // Reactive value
                    class: inputClasses,  // Reactive class binding
                    onInput: (e) => firstName.wv = e.target.value
                }],
                ['h.input', {
                    value: lastName,
                    onInput: (e) => lastName.wv = e.target.value
                }],
                ['h.div', {}, fullName]  // Reactive content
            ]]
        };
    }
}
```

### Key Features

1. **Fine-grained Reactivity**
   - Automatic dependency tracking
   - Computed/derived values
   - Lazy and eager evaluation options

2. **Direct DOM Updates**
   - Eager reactives for immediate DOM mutations
   - Automatic cleanup on unmount
   - Optimized attribute and content updates

3. **Batch Operations**
   - Group multiple state changes
   - Prevent unnecessary re-renders
   - Maintain consistency during updates

4. **Type Safety**
   - Clear separation between read-only (.rv) and writable (.wv) access
   - TypeScript integration
   - Runtime type checking

## Shadow DOM Integration

### Private Fields

```typescript
class PrivateFieldComponent {
    render(data: any) {
        return {
            content: ['h.div', { attachShadow: 'closed' }, [
                ['h.input', {
                    type: 'text',
                    value: data.value
                }]
            ]],
            scopedCss: `
                :host {
                    display: block;
                }
                input {
                    border: 1px solid #ccc;
                }
            `
        };
    }
}
```

## Error Handling

### Lifecycle Errors

```typescript
class MWIMUM {
    protected handleError(
        elementId: string,
        handler: MountHandler,
        error: Error
    ) {
        console.error(
            `${handler.type} error for ${elementId}:`,
            handler.module,
            error
        );
        
        // Emit warning
        this.emit('warn', {
            code: `${handler.type}-error`,
            elementId,
            module: handler.module,
            message: error.message
        });
        
        // Remove failed handler if once
        if (handler.once) {
            this.subscriptions.get(elementId)?.delete(handler);
        }
    }
}
```

## Future Considerations

1. **Performance:**
    - Further optimize reactive dependency tracking
    - Enhance mount/unmount detection
    - Investigate selective hydration

2. **Features:**
    - Advanced component composition patterns
    - Expanded lifecycle hooks
    - Form validation integration
    - Resource loading optimization

3. **Developer Experience:**
    - Component debugging tools
    - Reactive state inspection
    - Mount/unmount logging
    - TypeScript type generation