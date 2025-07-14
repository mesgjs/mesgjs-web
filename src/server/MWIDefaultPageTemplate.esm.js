/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 *
 * This file is part of the Mesgjs Web Interface (MWI).
 *
 * The MWI is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * @license MIT
 */

export class MWIDefaultPageTemplate {
    _head = [];
    _body = [];
    _bodyAttrs = {};
    _htmlAttrs = {};
    _title = '';

    addContent (position, content) {
        if (position === 'body') {
            this._body.push(content);
        }
    }

    addToHead (tag, content, attrs = {}) {
        this._head.push({ tag, content, attrs });
    }

    injectHydrationPoints (points) {
        if (points.size === 0) return;

        // Convert Map to an object for JSON serialization
        const data = Object.fromEntries(points);

        this.addToHead('script', JSON.stringify(data, null, 2), {
            type: 'application/json',
            id: 'mwi-hydration'
        });
    }

    injectModMeta (modMeta) {
        if (!modMeta) return;

        this.addToHead('script', `window.msjsModMeta = ${JSON.stringify(modMeta, null, 2)};`, {
            type: 'text/javascript',
            id: 'mwi-mod-meta'
        });
    }

    render () {
        const headContent = this._head.map(({ tag, content, attrs }) => {
            const attrStr = Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ');
            return `<${tag} ${attrStr}>${content || ''}</${tag}>`;
        }).join('\n');

        const bodyAttrs = Object.entries(this._bodyAttrs).map(([key, value]) => `${key}="${value}"`).join(' ');
        const htmlAttrs = Object.entries(this._htmlAttrs).map(([key, value]) => `${key}="${value}"`).join(' ');

        return `<!DOCTYPE html>
<html ${htmlAttrs}>
<head>
    <title>${this._title}</title>
    ${headContent}
</head>
<body ${bodyAttrs}>
    ${this._body.join('\n')}
</body>
</html>`;
    }

    set (key, value) {
        if (key === 'title') {
            this._title = value;
        }
    }
}