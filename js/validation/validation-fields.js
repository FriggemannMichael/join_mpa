// common/validation-fields.js
import { report } from "./validation-core.js";
import { DEFAULT_MIN_LENGTH } from "./validation-config.js";

export function validateRequiredEl(el, label, opts) {
  const ok = (el?.value ?? "").toString().trim().length > 0;
  return report(el, ok, `${label} is required`, opts);
}

export function validateMinLengthEl(el, min = DEFAULT_MIN_LENGTH, label, opts) {
  const v = el?.value?.trim?.() || "";
  const m = Number.isFinite(min) ? min : DEFAULT_MIN_LENGTH;
  const ok = v.length >= m;
  return report(el, ok, `${label}: at least ${m} characters`, opts);
}

export function validateDateNotPastEl(el, label, opts) {
  const v = el?.value || "";
  if (!v) return report(el, false, `${label} is required`, opts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  const ok = d >= today;
  return report(
    el,
    ok,
    `${label} must not be in the past`,
    opts
  );
}

export function validatePriorityGroup(groupEl, label, opts) {
  const ok = !!groupEl?.querySelector(".priority-btn.active");
  return report(groupEl, ok, `Please select ${label}`, opts);
}

/**
 * Validates email format
 * @param {HTMLElement} el - Input element
 * @param {string} label - Field label for error message
 * @param {Object} opts - Options including show flag
 * @returns {boolean} True if valid
 */
export function validateEmailEl(el, label, opts) {
  const RX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const v = el?.value?.trim() || "";
  const ok = v.length > 0 && RX_EMAIL.test(v);
  return report(
    el,
    ok,
    `${label}: Please enter a valid email address`,
    opts
  );
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
