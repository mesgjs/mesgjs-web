const ehMap = { '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' };

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
        if (typeof type === 'string' && /^[a-zA-Z0-9@:.+-]+$/.test(type)) {
            this.type = type;
        } else {
            throw new TypeError(`Invalid virtual node name: ${type}`);
        }
        this.opts = opts;
        this.attributes = new Map();
        this.classNames = new Set();
        this.children = [];                 // Rendered children
        this.rawChildren = [];              // Unrendered children
        this.scope = undefined;
        this.styles = new Map();
    }

    append (...children) {
        this.children.push(...children);
        return this;
    }

    appendRaw (...children) {
        this.rawChildren.push(...children);
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
                const entries = (typeof styleObj.entries === 'function') ? styleObj.entries() : Object.entries(styleObj);
                for (const [key, value] of entries) {
                    if (!value) this.styles.delete(key);
                    else if (/^[a-zA-Z0-9_-]+$/.test(key)) this.styles.set(key, value);
                }
            }
        }
        return this;
    }

    static fromData (data) {
        let node;
        if (Array.isArray(data)) {
            for (const item of data) {
                const type = typeof item, subtype = item?.constructor?.name;
                if (type === 'string' && !node) {
                    node = new VirtualNode(item);
                } else if (node) {
                    if (item instanceof Map || (type === 'object' && (!subtype || subtype === 'Object'))) {
                        const entries = (typeof item.entries === 'function') ? item.entries() : Object.entries(item);
                        for (const [key, value] of entries) {
                            node.setAttribute(key, value);
                        }
                    } else {
                        node.appendRaw(item);
                    }
                }
            }
        } else if (typeof data?.values === 'function' && typeof data?.namedEntries === 'function') {
            const [type, ...rawChildren] = data.values();
            node = new VirtualNode(type);
            node.appendRaw(...rawChildren);
            for (const [key, value] of data.namedEntries()) {
                node.setAttribute(key, value);
            }
        }
        return node;
    }

    // Get an attribute ("prop") value
    getAttribute (name) {
        switch (name) {
        case 'class':
            return this.class || undefined;
        case 'style':
            return this.style || undefined;
        default:
            return this.attributes.get(name);
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

        // Attribute-order-preserving active class and style (if any)
        this.attributes.set('class', this.class || null);
        this.attributes.set('style', this.style || null);

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

    // Parse a style string into a setting: value map
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

    // Remove classes based on Arrays or strings of space-separated values
    removeClass (...namesList) {
        for (let names of namesList.flat(Infinity)) {
            if (typeof names === 'string') {
                names = names.split(/\s+/).filter(Boolean);
            }
            if (Array.isArray(names)) {
                for (const name of names) {
                    this.classNames.add(name);
                }
            }
        }
        return this;

    }

    // Set an attribute ("prop") value (or remove it if the value is false/null)
    setAttribute (name, value) {
        switch (name) {
        case 'class':
            this.clearClass();
            this.editClass(value);
            return;
        case 'style':
            this.clearStyle();
            this.editStyle(value);
            return;
        }
        if (value === false || value === null) {
            this.attributes.delete(name);
        } else if (/^[a-zA-Z0-9_-]+$/.test(key)) {
            if (value === true) {
                this.attributes.set(name, true);
            } else {
                this.attributes.set(name, value);
            }
        }
    }

    // Return the active styles as a string
    get style () {
        return Array.from(this.styles.entries())
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
    }

    // Set the text content (for text nodes)
    set textContent (text) {
        this.children = [text];
    }

}