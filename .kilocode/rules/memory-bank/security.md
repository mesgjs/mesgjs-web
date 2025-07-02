# MWI Security Policies

This document outlines key security decisions and policies implemented within the Mesgjs Web Interface (MWI) to ensure the integrity and safety of the rendering process.

## HTML Element Security

### Tag Name Integrity
- HTML primitive components (h.*) enforce strict tag name correspondence
- Tag names cannot be overridden through options to prevent:
  - Injection of unexpected elements
  - Bypass of content security policies
  - Creation of invalid/malicious HTML structures
- Use appropriate h.* primitive or semantic component for intended element
- Use CSS for styling/layout needs
- Use noTag option if element wrapper needs to be removed

## Attribute Rendering Security

The `MWIVNode` class and its server-side extension `MWISSRVNode` are responsible for handling attribute rendering. The base class provides methods for setting attributes, which includes sanitizing values to prevent XSS and other injection attacks. The server-side implementation ensures all attribute values are HTML-escaped before being rendered into the final document.
