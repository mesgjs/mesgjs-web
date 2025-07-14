import { MWISSRVNode } from "mesgjs-web/src/server/MWISSRVNode.esm.js";

function hStyle (data) {
    const node = MWISSRVNode.fromData(data, {
        tag: "style",
        rawContent: true
    });

    // Sanitize to prevent XSS. Truncate at the first closing tag.
    if (Array.isArray(node.children)) {
        let content = node.children.join('');
        const closeTagIndex = content.search(/<\/style\s*>/i);

        if (closeTagIndex !== -1) {
            content = content.slice(0, closeTagIndex);
        }

        node.children = [ content ];
    }

    return node;
}

export default hStyle;