import { report } from "./validation-core.js";
import { DEFAULT_MIN_LENGTH } from "./validation-config.js";
import { validateEmail } from "../common/emailValidator.js";


/**
 * Validates that an input field has a non-empty value.
 * Trims whitespace and reports a required-field error if empty.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} el - Input element to validate.
 * @param {string} label - Field label used in the error message.
 * @param {{ show?: boolean }} opts - Options controlling visible feedback.
 * @returns {boolean} Returns true if the field is not empty, otherwise false.
 */
export function validateRequiredEl(el, label, opts) {
  const ok = (el?.value ?? "").toString().trim().length > 0;
  return report(el, ok, `${label} is required`, opts);
}


/**
 * Validates that an input value meets the specified minimum length.
 * Falls back to DEFAULT_MIN_LENGTH when no valid number is provided.
 *
 * @param {HTMLInputElement} el - Input element to validate.
 * @param {number} [min=DEFAULT_MIN_LENGTH] - Minimum number of characters required.
 * @param {string} label - Field label used in the error message.
 * @param {{ show?: boolean }} opts - Options controlling visible feedback.
 * @returns {boolean} Returns true if the input length meets the minimum requirement.
 */
export function validateMinLengthEl(el, min = DEFAULT_MIN_LENGTH, label, opts) {
  const v = el?.value?.trim?.() || "";
  const m = Number.isFinite(min) ? min : DEFAULT_MIN_LENGTH;
  const ok = v.length >= m;
  return report(el, ok, `${label}: at least ${m} characters`, opts);
}


/**
 * Validates that a date input value is not empty and not in the past.
 * Compares the selected date against today's date (time stripped to midnight).
 *
 * @param {HTMLInputElement} el - The date input element to validate.
 * @param {string} label - Field label used in the error message.
 * @param {{ show?: boolean }} opts - Options controlling whether to show feedback.
 * @returns {boolean} Returns true if the date is valid and not in the past, otherwise false.
 */
export function validateDateNotPastEl(el, label, opts) {
  const v = el?.value || "";
  if (!v) return report(el, false, `${label} is required`, opts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  const ok = d >= today;
  return report(el, ok, `${label} must not be in the past`, opts);
}


/**
 * Validates that a priority option is selected within the given group.
 * Checks for an active `.priority-btn` element and reports the result.
 *
 * @param {HTMLElement} groupEl - Container element holding the priority buttons.
 * @param {string} label - Field label used in the error message.
 * @param {{ show?: boolean }} opts - Options controlling visible feedback.
 * @returns {boolean} Returns true if a priority button is selected, otherwise false.
 */
export function validatePriorityGroup(groupEl, label, opts) {
  const ok = !!groupEl?.querySelector(".priority-btn.active");
  return report(groupEl, ok, `Please select ${label}`, opts);
}

/**
 * Validates email format using robust validator
 * Prevents consecutive dots (..), dots at invalid positions, and other malformed patterns
 *
 * @param {HTMLElement} el - Input element
 * @param {string} label - Field label for error message
 * @param {Object} opts - Options including show flag
 * @returns {boolean} True if valid, false otherwise
 *
 * @example
 * validateEmailEl(emailInput, "Email", { show: true })
 * // Catches: test..@example.com, test@example..com, test@.example.com
 */
export function validateEmailEl(el, label, opts) {
  const v = el?.value?.trim() || "";

  if (v.length === 0) {
    return report(el, false, `${label}: Email address is required`, opts);
  }

  const ok = validateEmail(v);

  let errorMsg = `${label}: Please enter a valid email address`;
  if (!ok && v.includes("..")) {
    errorMsg = `${label}: Email cannot contain consecutive dots (..)`;
  }

  return report(el, ok, errorMsg, opts);
}

/**
 * Validates phone format (optional field)
 * If empty, it's valid. If filled, must match international phone format.
 * Allows +, numbers, spaces, hyphens, and parentheses. Minimum 7 characters.
 * @param {HTMLElement} el - Input element
 * @param {string} label - Field label for error message
 * @param {Object} opts - Options including show flag
 * @returns {boolean} True if valid
 */
export function validatePhoneEl(el, label, opts) {
  const RX_PHONE = /^\+?[0-9\s\-()]{7,}$/;
  const v = el?.value?.trim() || "";
  const ok = v.length === 0 || RX_PHONE.test(v);
  return report(
    el,
    ok,
    `${label}: Please enter a valid phone format (min. 7 characters)`,
    opts
  );
}
