import { MWISSRVNode } from "mesgjs-web/src/server/MWISSRVNode.esm.js";

function h (data, payload) {
    const { type } = data;
    const tag = type.substring(2);

    if (tag === 'script' || tag === 'style') {
        throw new Error(`Generic h.* handler cannot be used for ${tag}. Use the dedicated handler.`);
    }

    const opts = { tag, noClose: payload?.noClose };

    return MWISSRVNode.fromData(data, opts);
}

export default h;