# Single Entry-Point

- .esm.js
  - Resolve dependencies from .slid file
  - Generate modMeta
  - Load and execute the JS code when module loading is complete
- .slid
  - Resolve dependencies from .slid file
  - Generate modMeta
- module path
  - Resolve dependencies based on module catalog
  - Generate modMeta

- If the single-load is a "naive" SSR app:
  - Reuse the server modMeta, as-is, for the client
  - In a single entry-point configuration, MWIMUM, MWICSR, and related would need to be included in the shared modreq list.
  - As client-side modules would get loaded server-side in this configuration, they would need to only activate when window is not undefined.
  - MUM activates declarative entries, which can trigger the subscription of other event handlers.
  - Should a single-load configuration be supported for hybrid SSR/CSR/hydration rendering??
