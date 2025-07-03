/* eslint-disable class-methods-use-this */

import { MWI_REGISTRY_FEATURE_PROMISE } from "./constants.esm.js";

const { getInstance, getInterface, setRO } = globalThis.$c;

const MWICOMPONENTS_PREFIX = "mwi-components:";
const COMPONENTS_READY_PROMISE = "mwi-components:ready";
const REGISTRY_INTERFACE_NAME = "mwi-registry";

class MWIComponentRegistry {
    #components = new Map();
    #validators = new Map();
    #handlers = new Map();
    #registryMid = null;

    setMid (mid) {
        this.#registryMid = mid;
    }

    registerComponent (name, component) {
        this.#components.set(name, component);
        return true;
    }

    registerValidator (name, validator) {
        this.#validators.set(name, validator);
        return true;
    }

    getComponent (name) {
        return this.#components.get(name);
    }

    waitForComponents () {
        const modMeta = globalThis.$c.getModMeta();
        const modules = modMeta?.at("modules");
        const features = [];

        if (modules) {
            for (const [, moduleInfo] of modules.entries()) {
                const featpro = moduleInfo.at("featpro");
                if (featpro) {
                    for (const feature of featpro.values()) {
                        if (typeof feature === 'string' && feature.startsWith(MWICOMPONENTS_PREFIX)) {
                            features.push(feature);
                        }
                    }
                }
            }
        }

        if (!features.length) {
            queueMicrotask(() => globalThis.$c.fready(
                this.#registryMid,
                COMPONENTS_READY_PROMISE,
            ));
            return;
        }

        globalThis.$c.fwait(...features).then(() => {
            globalThis.$c.fready(
                this.#registryMid,
                COMPONENTS_READY_PROMISE,
            );
        });
    }
}

// --- Mesgjs Interface Handlers ---

function opInit (d) {
    const instance = new MWIComponentRegistry();
    instance.setMid(d.mp.at("mid"));
    setRO(d.octx, 'js', instance);
    setRO(d.rr, 'jsv', instance);
}

function opRegisterComponent (d) {
    return d.js.registerComponent(d.mp.at(0), d.mp.at(1));
}

function opRegisterValidator (d) {
    return d.js.registerValidator(d.mp.at(0), d.mp.at(1));
}

function opGetComponent (d) {
    return d.js.getComponent(d.mp.at(0));
}

function opWaitForComponents (d) {
    d.js.waitForComponents();
}

// --- Module Entry Point ---

function loadMsjs (mid) {
    const registryInterface = getInterface(REGISTRY_INTERFACE_NAME);
    registryInterface.set({
        singleton: true,
        pristine: true,
        lock: true,
        handlers: {
            "@init": opInit,
            "@jsv": d => d.js,
            "register-component": opRegisterComponent,
            "register-validator": opRegisterValidator,
            "get-component": opGetComponent,
            "wait-for-components": opWaitForComponents,
        },
    });

    const registry = getInstance(REGISTRY_INTERFACE_NAME, { mid });
    registry("wait-for-components");

    globalThis.$c.fready(mid, MWI_REGISTRY_FEATURE_PROMISE);
}

function getRegistry () {
    return getInstance(REGISTRY_INTERFACE_NAME)("@jsv");
}

export { loadMsjs, getRegistry };
