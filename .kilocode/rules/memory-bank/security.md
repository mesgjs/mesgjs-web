# MWI Security Policies

This document outlines key security decisions and policies implemented within the Mesgjs Web Interface (MWI) to ensure the integrity and safety of the rendering process.

## Attribute Rendering Security

The `VirtualNode` class is responsible for handling attribute rendering. It provides methods for setting attributes, which includes sanitizing values to prevent XSS and other injection attacks. All attribute values are HTML-escaped before being rendered into the final document.