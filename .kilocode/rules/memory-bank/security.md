# MWI Security Policies

This document outlines key security decisions and policies implemented within the Mesgjs Web Interface (MWI) to ensure the integrity and safety of the rendering process.

## Attribute Rendering Security

To provide a better developer experience, the renderer supports special, prefixed attributes that are processed during rendering (e.g., the `:class` attribute). This processing introduces a potential vector for attribute injection if not handled with extreme care.

### The `:class` Attribute Security Policy

The `:class` attribute allows developers to provide a list of CSS class names that the renderer will concatenate into a final `class` string. To prevent XSS and other attribute injection attacks, the following strict, multi-layered policy is enforced by the `h.*` primitive component handlers:

1.  **Process Indexed Values Only:** The renderer will only process the indexed values from the `:class` list (via the NANOS `.values()` iterator). Any named values (e.g., `onmouseover=...`) are completely ignored, defeating attempts to create new event handler attributes directly.

2.  **Strict Input Validation:** Each individual indexed value from the list is validated against a regular expression that only permits characters valid for CSS class names (e.g., `^-?[_a-zA-Z]+[_a-zA-Z0-9-]*`). Any value containing characters that could be used to break out of the attribute, such as `"` or `=`, will be rejected.

3.  **Correct Output Encoding:** After the validated class names are concatenated into a single string, the entire string is sanitized using **HTML attribute encoding** before being placed in the final document. This ensures that any potentially harmful characters that might have bypassed validation are safely encoded as entities (e.g., `"` becomes `"`).

This combination of ignoring named values, strict input validation, and correct output encoding provides a robust, defense-in-depth strategy that completely mitigates the risk of attribute injection for this feature.