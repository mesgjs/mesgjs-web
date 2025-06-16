/**
 * @copyright 2025 Mesgjs Project.
 *
 * A modular HTML page template for server-side rendering, inspired by
 * Joomla's template module positions. This class allows for defining
 * content positions within a template and adding content to them dynamically.
 *
 * @license Apache-2.0
 */
class PageTemplate {
    /**
     * @type {Map<string, string[]>}
     * @private
     */
    _positions = new Map([
        ['head', []],
        ['body', []]
    ]);

    /**
     * Adds content to a specified position in the template.
     *
     * @param {string} position The name of the position to add content to.
     * @param {string|string[]} content The content to add.
     * @throws {Error} If the specified position does not exist.
     */
    addContent(position, content) {
        if (!this._positions.has(position)) {
            throw new Error(`Position "${position}" does not exist in the template.`);
        }
        const positionContent = this._positions.get(position);
        if (Array.isArray(content)) {
            positionContent.push(...content);
        } else {
            positionContent.push(content);
        }
    }

    /**
     * Returns a list of available content positions.
     *
     * @returns {string[]} An array of position names.
     */
    getAvailablePositions() {
        return [...this._positions.keys()];
    }

    /**
     * Renders the full HTML document by embedding content into the template.
     *
     * @returns {string} The complete HTML page as a string.
     */
    render() {
        const headContent = this._positions.get('head').join('\n    ');
        const bodyContent = this._positions.get('body').join('\n    ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MWI Page</title>
    ${headContent}
</head>
<body>
    ${bodyContent}
</body>
</html>`;
    }
}

export { PageTemplate };