import { toggleError } from "./valdiation-ui.js";

/**
 * Reports validation state for a form field
 * Shows errors only when show === true, otherwise checks silently and returns boolean
 *
 * @param {HTMLElement} el - The input element to validate
 * @param {boolean} ok - Whether the field is valid
 * @param {string} msg - The error message to display if invalid
 * @param {Object} options - Validation options
 * @param {boolean} options.show - Whether to show error messages visually
 * @returns {boolean} The validation result
 */
export function report(el, ok, msg, { show = false } = {}) {
  if (show) return toggleError(el, ok, ok ? "" : msg);
  return ok;
}
