# MWI Component Development Guidelines

## Data Format and Handling

### Input Format Handling

Components receive input in one of two primary formats:
1. NANOS format (primary/preferred)
2. Array format (automatically converted to NANOS)

The system handles input normalization following these rules:

```mermaid
graph TD
    A[Input Data] --> B{Input Type?}
    B -->|Array| C[Convert to new NANOS]
    B -->|NANOS| D{Smart Component?}
    B -->|Other| F[Use Directly]
    D -->|Yes| E[Create NANOS Copy]
    D -->|No| F
    C --> G[Component Processing]
    E --> G
    F --> G
```

#### Input Processing Rules

```javascript
if (Array.isArray(content)) {
    // Array input: Creates new NANOS automatically
    content = new NANOS(...content.map(v => ...));
} else if (content instanceof NANOS && isSmartComponent) {
    // NANOS input to smart component: Create copy
    content = new NANOS(content);
}
// All other inputs used directly without modification
```

### Smart Component Behavior

Smart components:
- Receive a copy of NANOS input (if input was NANOS)
- Receive a new NANOS (if input was Array)
- Can safely modify their input NANOS in-place
- Can add/remove classes, modify styles, etc.
- May return their modified input as output

### Attribute Handling

- Direct attribute specification is preferred
- No empty attribute objects needed
- Use direct NANOS property access
- Class and style modifications:
  ```javascript
  // Adding classes
  content.set('class', 'new-class additional-class');
  
  // Modifying styles
  content.set('style', 'color: blue; font-size: 16px;');
  ```

## Best Practices

1. **Use NANOS Format**
   - Prefer NANOS format for component input
   - Leverage NANOS methods for property access
   - Take advantage of built-in normalization

2. **Smart Component Design**
   - Expect copied NANOS for modification
   - Use in-place modifications when appropriate
   - Document any persistent state

3. **Attribute Handling**
   - Access attributes directly through NANOS
   - No need for empty attribute objects
   - Use standard patterns for class/style modifications