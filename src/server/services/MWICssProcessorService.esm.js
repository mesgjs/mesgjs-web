/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @license MIT
 */

/**
 * Takes collected scoped CSS and scope IDs and generates the final CSS string.
 */
class MWICssProcessorService {
    constructor () {
        // No-op
    }

    /**
     * Generate the final, scoped CSS string.
     * @param {Map<string, string>} cssMap - A map of scope IDs to CSS templates.
     * @returns {string} The processed CSS string.
     */
    generateScopedCss (cssMap) {
        if (!cssMap || cssMap.size === 0) {
            return '';
        }

        const cssParts = [];
        for (const [scopeId, template] of cssMap.entries()) {
            cssParts.push(template.replace(/@@/g, scopeId));
        }

        return cssParts.join('\n');
    }
}

export { MWICssProcessorService };