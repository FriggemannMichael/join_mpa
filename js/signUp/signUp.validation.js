import { validateEmail } from "../common/emailValidator.js";


const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();


/**
 * Regular expression for validating proper names.
 * Ensures the name starts with an uppercase letter (including umlauts)
 * and may include additional capitalized parts separated by spaces or hyphens.
 *
 * @constant
 * @type {RegExp}
 */
export const RX_NAME = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;


/**
 * List of disallowed or placeholder email addresses.
 * Used to block common fake or demo accounts during signup or validation.
 *
 * @constant
 * @type {string[]}
 * @example
 * BLOCKED_EMAILS.includes("test@test.de"); // true
 * BLOCKED_EMAILS.includes("user@realmail.com"); // false
 */
const BLOCKED_EMAILS = [
  "test@test.de",
  "example@example.com",
  "no-reply@example.com",
  "admin@admin.com",
  "info@info.de",
  "user@user.com",
  "demo@demo.com",
  "fake@fake.com",
  "123@123.com",
  "placeholder@domain.com",
];


/**
 * Collection of predefined error messages used in form validation.
 * Provides user-friendly feedback for name, email, and password validation errors.
 *
 * @constant
 * @type {Object<string, string>}
 * @property {string} name - Message shown when the name format is invalid.
 * @property {string} email - Message shown when the email format is invalid.
 * @property {string} emailDouble - Message shown when the email contains consecutive dots.
 * @property {string} emailBlocked - Message shown when the email is in the blocked list.
 * @property {string} password - Message shown when the password is too short.
 * @property {string} confirm - Message shown when passwords do not match.
 */
export const ERR = {
  name: "Please enter a valid name (first letter capitalized).",
  email: "Please enter a valid email address.",
  emailDouble: "Email cannot contain consecutive dots (..).",
  emailBlocked: "This email address cannot be used.",
  password: "Password requires at least 6 characters.",
  confirm: "Passwords do not match.",
};


/**
 * Validates a name field against the defined name pattern.
 * Ensures the name is not empty and matches the `RX_NAME` regular expression.
 *
 * @param {string} value - The name input value to validate.
 * @returns {{ ok: boolean, msg: string }} Validation result with success flag and message.
 */
function validateName(value) {
  const ok = !!value && RX_NAME.test(value);
  return { ok, msg: ok ? "" : ERR.name };
}


/**
 * Validates an email address field for format and allowed values.
 * Checks general structure, prevents double dots, and blocks known fake addresses.
 *
 * @param {string} value - The email address input value to validate.
 * @returns {{ ok: boolean, msg: string }} Validation result with success flag and message.
 */
function validateEmailField(value) {
  if (!value || !validateEmail(value)) {
    const msg = value.includes("..") ? ERR.emailDouble : ERR.email;
    return { ok: false, msg };
  }
  if (BLOCKED_EMAILS.includes(value.toLowerCase())) {
    return { ok: false, msg: ERR.emailBlocked };
  }
  return { ok: true, msg: "" };
}


/**
 * Validates a password field for minimum length requirements.
 * Ensures the password contains at least six characters.
 *
 * @param {string} value - The password input value to validate.
 * @returns {{ ok: boolean, msg: string }} Validation result with success flag and message.
 */
function validatePasswordField(value) {
  const ok = value.length >= 6;
  return { ok, msg: ok ? "" : ERR.password };
}


/**
 * Validates that the password confirmation matches the original password.
 * Ensures both values have at least six characters and are identical.
 *
 * @param {string} value - The confirmed password input value.
 * @param {string} password - The original password to compare against.
 * @returns {{ ok: boolean, msg: string }} Validation result with success flag and message.
 */
function validatePasswordConfirm(value, password) {
  const ok = value.length >= 6 && value === password;
  return { ok, msg: ok ? "" : ERR.confirm };
}


/**
 * Returns the appropriate validation function for a given signup field ID.
 * Maps each input field to its specific validator and provides a default fallback.
 *
 * @param {string} id - The ID of the signup input field to validate.
 * @returns {Function} A validator function returning an object with `{ ok: boolean, msg: string }`.
 */
export function getFieldValidator(id) {
  const validators = {
    signupName: () => validateName(val(id)),
    signupEmail: () => validateEmailField(val(id)),
    signupPassword: () => validatePasswordField(val(id)),
    signupPasswordConfirm: () =>
      validatePasswordConfirm(val(id), val("signupPassword")),
  };
  return validators[id] || (() => ({ ok: true, msg: "" }));
}
