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
 * components. This is a "smart" handler that modifies the vnode in place.
 *
 * @param {VirtualNode} vnode - The virtual node representing the component.
 */
export default async function (vnode, renderer) {
    // Set the tag name for the final output.
    vnode.opts.tag = vnode.type.substring(2);
    // Render the children.
    await vnode.renderChildren(renderer);
    return vnode;
}