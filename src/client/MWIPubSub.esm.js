import { NANOS, getInstance } from 'mesgjs-web/src/shared/vendor.esm.js';

const getMWIData = () => {
    if (!globalThis.$gss) {
        throw new Error('$gss not found on globalThis');
    }
    if (!globalThis.$gss.has('MWIData')) {
        globalThis.$gss.set('MWIData', new NANOS());
    }
    return globalThis.$gss.at('MWIData');
};

const getOrCreateReactive = (path) => {
    const mwiData = getMWIData();
    let rval = mwiData.at(path);

    if (!rval) {
        // Create a bilingual @reactive instance.
        rval = getInstance('@reactive');
        mwiData.set(path, rval);
    }
    return rval;
};

/**
 * Publishes a component's interface to a shared path. On unmount, the
 * caller is responsible for calling this again with an undefined receiver.
 * @param {string} path The path to publish to.
 * @param {Function|undefined} receiver The component's receiver function or undefined.
 */
export const publish = (path, receiver) => {
    const rval = getOrCreateReactive(path);
    rval.set(receiver); // Use the JS method on the bilingual instance
};

/**
 * Creates follower reactives that track published interfaces.
 * @param {string|NANOS} subs The subscription configuration.
 * @returns {NANOS} A NANOS list of follower reactives, indexed by name.
 */
export const subscribe = (subs) => {
    const followers = new NANOS();
    let subList;

    if (typeof subs === 'string') {
        // Handle single, default subscription
        subList = new NANOS({default: subs});
    } else {
        subList = subs;
    }

    for (const [name, path] of subList.entries()) {
        // Create a bilingual, definition-based @reactive instance.
        const follower = getInstance('@reactive', { def: getOrCreateReactive(path) });
        followers.set(name, follower);
    }

    return followers;
};