/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @license MIT
 */

/**
 * Contains logic for sanitizing and validating URLs.
 */
class MWIUrlValidatorService {
    _baseUrl;

    constructor ({ baseUrl = null } = {}) {
        this._baseUrl = baseUrl;
    }

    /**
     * Sanitize a URL to prevent common vulnerabilities.
     * @param {string} url - The URL to sanitize.
     * @returns {string|null} The sanitized URL, or null if invalid.
     */
    sanitizeUrl (url) {
        try {
            const parsed = new URL(url, this._baseUrl);
            const protocol = parsed.protocol;

            // Allow https URLs
            if (protocol === 'https:') {
                return url;
            }

            // Allow relative URLs only if a base URL was provided for context
            if (this._baseUrl && !url.includes(':')) {
                return url;
            }

            return null;
        } catch {
            return null; // Invalid URL format
        }
    }
}

export { MWIUrlValidatorService };