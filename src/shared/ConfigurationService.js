/*
 * MWI Configuration Service
 * Copyright 2025 by Kappa Computer Solutions, LLC and Brian Katzung
 * Author: Brian Katzung <briank@kappacs.com>
 */

class ConfigurationService {
    _config;

    constructor(initialConfig = {}) {
        // 1. Hardcoded defaults
        let enforceSchema = true;

        // 2. Environment Context (MWI_ENV)
        // This check ensures 'Deno' is not accessed in a browser environment
        if (typeof Deno !== 'undefined' && Deno.env) {
            const env = Deno.env.get('MWI_ENV');
            if (env === 'production') {
                enforceSchema = false;
            } else if (env === 'development') {
                enforceSchema = true;
            }
        }

        // 3. Environment Variable Override (MWI_ENFORCE_SCHEMA)
        if (typeof Deno !== 'undefined' && Deno.env) {
            const envOverride = Deno.env.get('MWI_ENFORCE_SCHEMA');
            if (envOverride) {
                enforceSchema = !(envOverride === 'false' || envOverride === '0');
            }
        }

        // 4. Runtime Override (URL Query Parameter)
        // This check ensures 'location' is available, for browser environments
        if (typeof location !== 'undefined' && location.search) {
            const params = new URLSearchParams(location.search);
            const urlOverride = params.get('mwi_enforce_schema');
            if (urlOverride) {
                enforceSchema = !(urlOverride === 'false' || urlOverride === '0');
            }
        }

        this._config = {
            enforceSchema,
            ...initialConfig
        };
    }

    /**
     * Get a configuration value.
     * @param {string} key The configuration key to retrieve.
     * @param {*} [defaultValue] The value to return if the key is not found.
     * @returns {*} The configuration value.
     */
    get(key, defaultValue = undefined) {
        return this._config[key] ?? defaultValue;
    }

    /**
     * Set a configuration value.
     * @param {string} key The configuration key to set.
     * @param {*} value The value to set.
     */
    set(key, value) {
        this._config[key] = value;
    }

    /**
     * Returns the entire configuration object.
     * Used for serialization and passing to the client.
     * @returns {object} The configuration object.
     */
    getAll() {
        return { ...this._config };
    }
}

export const configService = new ConfigurationService();