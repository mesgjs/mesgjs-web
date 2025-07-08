/* eslint-disable class-methods-use-this */

const { getInstance, fwait, fready } = globalThis.$c;

const FEATURE_PROMISE = "mwi.components.mwiHtmlCore";
const REGISTRY_READY_PROMISE = "mwi.registry.ready";
const REGISTRY_INTERFACE_NAME = "mwi.registry";

const CORE_HTML_MAP = {
    // Document metadata
    "head": {}, "title": {}, "base": {}, "link": {}, "meta": {},
    "style": {},
    // Sectioning root
    "body": {},
    // Content sectioning
    "address": {}, "article": {}, "aside": {}, "footer": {}, "header": {},
    "h1": {}, "h2": {}, "h3": {}, "h4": {}, "h5": {}, "h6": {}, "main": {},
    "nav": {}, "section": {},
    // Text content
    "blockquote": {}, "dd": {}, "div": {}, "dl": {}, "dt": {},
    "figcaption": {}, "figure": {}, "hr": {}, "li": {}, "ol": {}, "p": {},
    "pre": {}, "ul": {},
    // Inline text semantics
    "a": {}, "abbr": {}, "b": {}, "bdi": {}, "bdo": {}, "br": {}, "cite": {},
    "code": {}, "data": {}, "dfn": {}, "em": {}, "i": {}, "kbd": {}, "mark": {},
    "q": {}, "s": {}, "samp": {}, "small": {}, "span": {}, "strong": {},
    "sub": {}, "sup": {}, "time": {}, "u": {}, "var": {}, "wbr": {},
    // Image and multimedia
    "area": {}, "audio": {}, "img": {}, "map": {}, "source": {}, "track": {},
    "video": {},
    // Demarcating edits
    "del": {}, "ins": {},
    // Table content
    "caption": {}, "col": {}, "colgroup": {}, "table": {}, "tbody": {}, "td": {},
    "tfoot": {}, "th": {}, "thead": {}, "tr": {},
};

console.log('loading module mwi-html-core');
function loadMsjs (mid) {
    console.log('mwi-html-core mid', !!mid);
    fwait(REGISTRY_READY_PROMISE).then(() => {
        const registry = getInstance(REGISTRY_INTERFACE_NAME);

        for (const [tagName, protoPayload] of Object.entries(CORE_HTML_MAP)) {
            registry("registerComponent", [`h.${tagName}`, protoPayload]);
        }
        fready(mid, FEATURE_PROMISE);
    });
}

export { loadMsjs };
