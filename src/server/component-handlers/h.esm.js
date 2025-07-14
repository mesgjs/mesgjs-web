import { MWISSRVNode } from "mesgjs-web/src/server/MWISSRVNode.esm.js";

const voidTags = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

function h (data, payload) {
    const { type } = data;
    const tag = type.substring(2);

    if (tag === 'script' || tag === 'style') {
        throw new Error(`Generic h.* handler cannot be used for ${tag}. Use the dedicated handler.`);
    }

    const opts = { tag, noClose: payload?.noClose };

    if (voidTags.has(tag)) {
        opts.noClose = true;
    }

    return MWISSRVNode.fromData(data, opts);
}

export default h;