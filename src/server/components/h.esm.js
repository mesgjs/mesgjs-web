/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung.
 *
 * This file is part of the Mesgjs Web Interface (MWI).
 *
 * The MWI is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * @license MIT
 */

/**
 * Generic server-side component handler for all `h.*` (HTML primitive)
 * components.
 *
 * @param {VirtualNode} vnode - The virtual node representing the component.
 * @returns {VirtualNode} The processed virtual node.
 */
export default function (vnode) {
    // For SSR, the h.* components are essentially pass-throughs.
    // The VirtualNode and SsrRenderer handle the heavy lifting of attribute
    // processing and HTML generation.
    // We just need to set the tag name for the final output.
    vnode.opts.tag = vnode.type.substring(2);

    return vnode;
}