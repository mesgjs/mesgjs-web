# SSR/CSR Synchronization: Open Issues & Considerations

## Current State Assessment

1. **Implementation Age Disparity**
   - Current CSR implementation predates SSR
   - CSR should be considered for complete update/rewrite
   - Need to align with current SSR architecture patterns

2. **Class Naming Consistency**
   - Current naming is outdated (e.g., CsrRenderer)
   - Should follow MWI* prefix pattern
   - Examples:
     - CsrRenderer -> MWICSR
     - ComponentFactory -> MWICSRFactory

3. **Scope ID System**
   - Current simple counter approach works well
   - Proposed hashing adds complexity without clear benefits
   - Question: What problems would hashing solve?

4. **Reactive Support**
   - CSR lacks required reactive value support for:
     - Attribute updates
     - Content changes
   - Need to integrate with @reactive interface

5. **Component Factory Configuration**
   - Server-to-client configuration sync needed
   - Must handle:
     - Component registrations
     - Handler configurations
     - Module resolution settings
     - Access controls
     - Resource definitions

6. **Component Support Gaps**
   - Current SSR mainly supports h.* primitives
   - Need to address:
     - Smart component behavior
     - Component lifecycle
     - State management
     - Event handling

7. **Hydration Architecture**
   - Current proposal is too simplistic
   - Issues:
     - Can't hydrate subtrees from single type
     - Need structured data per component
     - Placeholder system needed
   - Consider:
     - Unique IDs for placeholders
     - Structured state data
     - Tree reconstruction

8. **Event Handler Complexity**
   - Multiple handler types:
     - Initial mount/mountOnce
     - Dynamically added handlers
     - JavaScript functions
     - Mesgjs @function objects
   - Handler attachment timing
   - State preservation

## Key Questions

1. **Component Support Priority**
   - Should we pause SSR/CSR sync to expand SSR component support?
   - What component features are blocking CSR development?

2. **Hydration Design**
   - How should component state be preserved?
   - What's the best placeholder strategy?
   - How to handle partial hydration?

3. **Handler Management**
   - How to serialize Mesgjs @function objects?
   - When/how should dynamic handlers be attached?
   - How to maintain handler references?

## Suggested Next Steps

1. **Review SSR Component Support**
   - Document current capabilities
   - Identify missing features
   - Plan component system expansion

2. **Design Hydration Architecture**
   - Develop placeholder system
   - Define state serialization format
   - Create hydration sequence spec

3. **Plan CSR Modernization**
   - Align with current SSR patterns
   - Add reactive support
   - Update class naming

4. **Component Factory Sync**
   - Design configuration format
   - Plan sync mechanism
   - Consider security implications

## Discussion Points

1. **Component System**
   - Should we complete SSR component support first?
   - What's the minimum viable component feature set?
   - How to handle component versioning?

2. **State Management**
   - How to handle initial state?
   - What state belongs to which layer?
   - How to manage state updates?

3. **Handler System**
   - Best approach for handler serialization?
   - How to maintain security during hydration?
   - Strategy for dynamic handler attachment?

## Next Discussion Topics

1. SSR component system completion requirements
2. Hydration architecture design
3. State preservation strategy
4. Handler serialization approach

Please review these issues and indicate which area should be our primary focus for detailed discussion and planning.