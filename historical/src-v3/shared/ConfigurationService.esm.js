/**
 * MWI Configuration Service
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @license MIT
 */

import { MWIError } from 'mesgjs-web/src/shared/errors/MWIError.esm.js';

export class ConfigurationService {
    _config;

    constructor (config = {}) {
        this._config = config;
    }

    /**
     * Check if the MWI environment is set to 'development'.
     * @returns {boolean} True if in development mode.
     */
    isDevelopment() {
        return this.get('MWI_ENV') === 'development';
    }

    /**
     * Handles error reporting based on the current environment.
     * In development, it logs the full error. In production, it remains silent
     * (but could be configured to send to a remote service).
     * @param {Error|MWIError} err - The error to report.
     * @param {string} [context] - An optional string providing context for the error.
     */
    reportError(err, context) {
        if (this.isDevelopment()) {
            console.error(`[MWI Error]${context ? ` ${context}` : ''}:`, err);
        }
        // In a production environment, this is where we would send
        // the error to a remote logging service.
    }

    /**
     * Get a configuration value.
     * @param {string} key The configuration key to retrieve.
     * @param {*} [defaultValue] The value to return if the key is not found.
     * @returns {*} The configuration value.
     */
    get (key, defaultValue = undefined) {
        return this._config[key] ?? defaultValue;
    }

    /**
     * Set a configuration value.
     * @param {string} key The configuration key to set.
     * @param {*} value The value to set.
     */
    set (key, value) {
        this._config[key] = value;
    }

    /**
     * Returns the entire configuration object.
     * Used for serialization and passing to the client.
     * @returns {object} The configuration object.
     */
    getAll () {
        return { ...this._config };
    }
}
