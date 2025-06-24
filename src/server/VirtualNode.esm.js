const ehMap = { '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' };
// Escape special HTML characters in a string
function escapeHtml (str) {
    return String(str).replace(/[&"'<>]/g, (match) => ehMap[match]);
}

/**
 * Represents a virtual DOM node for server-side rendering.
 * This class is used to create a structure that can be rendered
 * into HTML strings, similar to how a DOM node would be structured.
 * 
 * Value storage is deliberately output-agnostic (i.e. not
 * pre-HTML-escaped) to potentially support other output formats in the
 * future (e.g. JSON or SLID).
 *
 * @class VirtualNode
 */
export class VirtualNode {
    constructor (type, opts = {}) {
        // Consider h.FRAG(MENT) for fragments?
        if (typeof type === 'string' && /^[a-zA-Z0-9@:.+-]+$/.test(type)) {
            this.type = type;
        } else {
            throw new TypeError(`Invalid virtual node name: ${type}`);
        }
        this.opts = opts;
        this._attributes = new Map();
        this.classNames = new Set();    // Active class names
        this.children = [];             // Child nodes
        this.scope = undefined;         // Optional scope prefix for @@ replacements
        this.styles = new Map();        // Active styles
    }

    // Append children
    append (...children) {
        this.children.push(...children);
        return this;
    }

    // Return the internal attribute Map
    get attributes () {
        // Sync the current active class and style first
        this._attributes.set('class', this.class || null);
        this._attributes.set('style', this.style || null);
        return this._attributes;
    }

   // Return active classes as a string.
    get class () {
        return Array.from(this.classNames).join(' ');
    }

    clearClass () {
        this.classNames.clear();
        return this;
    }

    clearStyle () {
        this.styles.clear();
        return this;
    }

    /*
     * Add/edit classes based on Arrays or space-separated strings of class names.
     * A ! in front of a class name removes it.
     */
    editClass (...namesList) {
        for (let names of namesList.flat(Infinity)) {
            if (typeof names === 'string') {
                names = names.split(/\s+/).filter(Boolean);
            }
            if (Array.isArray(names)) {
                for (const name of names) {
                    if (name.startsWith('!')) {
                        this.classNames.delete(name.slice(1));
                    } else if (/^[a-zA-Z0-9@_-]+$/.test(name)) {
                        this.classNames.add(name);
                    }
                }
            }
        }
        return this;
    }

    /*
     * Add styles via a string, iterable, or (setting, value) pair.
     * An empty value removes the associated style.
     */
    editStyle (...styleSpec) {
        if (styleSpec.length === 2 && typeof styleSpec[0] === 'string') {
            const [key, value] = styleSpec;
            styleSpec = [{ [key]: value }];
        }
        if (styleSpec.length === 1) {
            if (typeof styleSpec[0] === 'string') {
                const [styles] = styleSpec;
                styleSpec = [this.constructor.parseStyles(styles)];
            }
            if (typeof styleSpec[0] === 'object') {
                const [styleObj] = styleSpec;
                const entries = (typeof styleObj?.entries === 'function') ? styleObj.entries() : Object.entries(styleObj);
                for (const [key, value] of entries) {
                    if (!value) this.styles.delete(key);
                    else if (/^[a-zA-Z0-9_-]+$/.test(key)) this.styles.set(key, value);
                }
            }
        }
        return this;
    }

    // Return a document fragment (h.FRAG) node
    static fragment (...children) {
        const node = new VirtualNode('h.FRAG', { noOpen: true, noClose: true });
        node.append(...children);
        return node;
    }

    // Create a VirtualNode from structured data (JS Array or NANOS)
    static fromData (data) {
        if (Array.isArray(data)) {
            const [type, ...rest] = data;
            const node = new VirtualNode(type);
            for (const item of rest) {
                const itemType = typeof item;
                const subtype = item?.constructor?.name;
                if (itemType === 'object' && item !== null && (!subtype || subtype === 'Object' || item instanceof Map)) {
                    const entries = (typeof item.entries === 'function') ? item.entries() : Object.entries(item);
                    for (const [key, value] of entries) {
                        node.set(key, value);
                    }
                } else {
                    node.children.push(item);
                }
            }
            return node;
        } else if (typeof data?.values === 'function' && typeof data?.namedEntries === 'function') {
            const [type, ...children] = data.values();
            const node = new VirtualNode(type);
            node.children.push(...children);
            for (const [key, value] of data.namedEntries()) {
                node.set(key, value);
            }
            return node;
        }
        return undefined;
    }

    // Get an attribute ("prop") value
    get (name) {
        switch (name) {
        case 'class':
            return this.class || undefined;
        case 'style':
            return this.style || undefined;
        default:
            return this._attributes.get(name);
        }
    }

    // Return the HTML encoding of all child content
    get innerHTML () {
        return this.children.map(child => (typeof child === 'string') ? escapeHtml(child) : child.outerHTML).join('');
    }

    // Return the HTML encoding of the current node and all child content
    get outerHTML () {
        const tag = this.opts.tag || this.type;
        const openOpen = !this.opts.noOpen ? `<${tag}` : '';
        const openClose = !this.opts.noOpen ? '>' : '';
        const close = !this.opts.noClose ? `</${tag}>` : '';
        const attrs = [];

        for (const [key, value] of this.attributes.entries()) {
            if (value === true) {
                attrs.push(' ', escapeHtml(key));
            } else if (value !== false && value != null) {
                attrs.push(` ${escapeHtml(key)}="${escapeHtml(value)}"`);
            }
        }

        const html = `${openOpen}${attrs.join('')}${openClose}${this.innerHTML}${close}`;
        return (this.scope ? html.replace(/@@/g, this.scope) : html);
    }

    // Parse a style string into a { setting: value } map
    static parseStyles(styleString) {
        const result = new Map();
        // Match key: value; where ; is not inside quotes
        const regex = /(?:^|;)\s*([^\s:;]+)\s*:\s*((?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^;])*)/g;
        for (const m of styleString.matchAll(regex)) {
            const key = m[1];
            if (key) {
                let value = m[2].trim();
                if (value.endsWith(';')) value = value.slice(0, -1).trim();
                result.set(key, value);
            }
        }
        return result;
    }

    async renderChildren(renderer) {
        this.children = await Promise.all(this.children.map(c => renderer._renderNode(c)));
        return this;
    }

    // Remove classes based on Arrays or strings of space-separated values
    removeClass (...namesList) {
        for (let names of namesList.flat(Infinity)) {
            if (typeof names === 'string') {
                names = names.split(/\s+/).filter(Boolean);
            }
            if (Array.isArray(names)) {
                for (const name of names) {
                    this.classNames.delete(name);
                }
            }
        }
        return this;

    }

    // Set an attribute ("prop") value (or remove it if the value is false/null)
    set (name, value) {
        switch (name) {
        case 'class':
            this.clearClass();
            if (value) this.editClass(value);
            return this;
        case 'style':
            this.clearStyle();
            if (value) this.editStyle(value);
            return this;
        }
        if (value === false || value === null) {
            this._attributes.delete(name);
        } else if (/^[a-zA-Z0-9_-]+$/.test(name)) {
            if (value === true) {
                this._attributes.set(name, true);
            } else {
                this._attributes.set(name, value);
            }
        }
        return this;
    }

    // Return the active styles as a string
    get style () {
        return Array.from(this.styles.entries())
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
    }

    // Set the text content (for standalone text nodes)
    set textContent (text) {
        this.children = [text];
    }

    // Return a plain-text (h.TEXT) node
    static textNode (text) {
        const node = new VirtualNode('h.TEXT', { noOpen: true, noClose: true });
        node.textContent = text;
        return node;
    }

}