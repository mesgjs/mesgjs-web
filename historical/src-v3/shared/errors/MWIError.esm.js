/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @author Brian Katzung <briank@kappacs.com>
 * @license MIT
 *
 * This file implements the MWIError class as specified in the
 * Error-Handling-Strategy.md architectural document.
 */

/**
 * Custom error class for the Mesgjs Web Interface.
 *
 * Provides a structured way to represent MWI-specific errors, including a
 * machine-readable error code and contextual details.
 */
class MWIError extends Error {
  /**
   * @param {string} message - A human-readable error message.
   * @param {string} code - A machine-readable error code (e.g., 'COMPONENT_RENDER_FAILED').
   * @param {object} details - An object containing contextual information.
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'MWIError';
    this.code = code;
    this.details = details;
  }
}

export { MWIError };