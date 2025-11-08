/**
 * Signup page for user registration
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";
import { validateEmail } from "../common/emailValidator.js";

initSignupPage();


/**
 * Regular expression for validating proper names.
 * Ensures the name starts with an uppercase letter (including umlauts)
 * and may include additional capitalized parts separated by spaces or hyphens.
 *
 * @constant
 * @type {RegExp}
 */
const RX_NAME = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;


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

const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();


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
const ERR = {
  name: "Please enter a valid name (first letter capitalized).",
  email: "Please enter a valid email address.",
  emailDouble: "Email cannot contain consecutive dots (..).",
  emailBlocked: "This email address cannot be used.",
  password: "Password requires at least 6 characters.",
  confirm: "Passwords do not match.",
};


/**
 * Retrieves the closest input field container element for a given ID.
 * Falls back to the element itself if no container is found.
 *
 * @param {string} id - The ID of the target input element.
 * @returns {HTMLElement|null} The closest `.inputField__container` element, or `null` if not found.
 */
function getContainer(id) {
  const node = el(id);
  return node ? node.closest(".inputField__container") || node : null;
}


/**
 * Updates the visual and accessibility state of a form field based on its validity.
 * Toggles the "input-fault" class and sets the `aria-invalid` attribute accordingly.
 *
 * @param {string} id - The ID of the input field to update.
 * @param {boolean} ok - Whether the field is valid (`true`) or invalid (`false`).
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function setFieldState(id, ok) {
  const node = el(id);
  const container = getContainer(id);
  if (!node || !container) return;
  container.classList.toggle("input-fault", !ok);
  node.setAttribute("aria-invalid", String(!ok));
}


/**
 * Ensures that a fault message element exists within a given input container.
 * Creates and appends an accessible `.field-fault-msg` element if missing.
 *
 * @param {HTMLElement} container - The parent container element for the input field.
 * @returns {HTMLElement} The existing or newly created fault message element.
 */
function ensureFaultMsg(container) {
  let faultMsg = container.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    faultMsg.setAttribute("role", "status");
    faultMsg.setAttribute("aria-live", "polite");
    container.appendChild(faultMsg);
  }
  return faultMsg;
}


/**
 * Sets or clears the validation error message for a specific form field.
 * Ensures the fault message element exists and updates its visibility accordingly.
 *
 * @param {string} id - The ID of the input field associated with the fault message.
 * @param {string} [message=""] - The validation message to display. Clears the message if empty.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function setFieldFaultMsg(id, message = "") {
  const container = getContainer(id);
  if (!container) return;
  const faultMsg = ensureFaultMsg(container);
  if (message) {
    faultMsg.textContent = message;
    faultMsg.classList.add("visible");
  } else {
    faultMsg.textContent = "";
    faultMsg.classList.remove("visible");
  }
}


/**
 * Marks a form field container as "touched" for validation tracking.
 * Used to determine whether live validation should be applied to a field.
 *
 * @param {string} id - The ID of the input field to mark as touched.
 * @returns {void} Nothing is returned; updates the container's dataset.
 */
function markTouched(id) {
  const c = getContainer(id);
  if (c) c.dataset.touched = "true";
}


/**
 * Initializes the signup page and binds all interactive elements.
 * Redirects authenticated users, sets up form validation, 
 * back navigation, and password toggle functionality.
 *
 * @async
 * @returns {Promise<void>} Resolves once all event bindings and checks are complete.
 */
async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
  updateSubmitState();
}


/**
 * Initializes and binds all event listeners for the signup form.
 * Handles live validation, blur-based error feedback, and form submission.
 *
 * @returns {void} Nothing is returned; event listeners are attached to the form elements.
 */
function bindSignupForm() {
  const form = el("signupForm");
  if (!form) return;
  form.addEventListener("input", handleLiveInput);
  form.addEventListener("change", handleLiveInput);
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("blur", () =>
      validateSingleField(input.id, { showErrors: true, markTouch: true })
    );
  });
  form.addEventListener("submit", handleSignupSubmit);
}


/**
 * Handles live input validation for all signup form fields.
 * Revalidates fields that have been interacted with and updates the submit button state.
 *
 * @returns {void} Nothing is returned; updates validation messages and button state in the DOM.
 */
function handleLiveInput() {
  [
    "signupName",
    "signupEmail",
    "signupPassword",
    "signupPasswordConfirm",
  ].forEach((id) => {
    const c = getContainer(id);
    if (c?.dataset.touched === "true") {
      validateSingleField(id, { showErrors: true });
    }
  });
  updateSubmitState();
}


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
function getFieldValidator(id) {
  const validators = {
    signupName: () => validateName(val(id)),
    signupEmail: () => validateEmailField(val(id)),
    signupPassword: () => validatePasswordField(val(id)),
    signupPasswordConfirm: () =>
      validatePasswordConfirm(val(id), val("signupPassword")),
  };
  return validators[id] || (() => ({ ok: true, msg: "" }));
}

/**
 * Validate single field with comprehensive email validation
 * @param {string} id Field ID
 * @param {{showErrors?: boolean, markTouch?: boolean}} opts Validation options
 * @returns {boolean} True if field is valid
 */
function validateSingleField(id, opts = {}) {
  const { showErrors = false, markTouch = false } = opts;
  const validator = getFieldValidator(id);
  const { ok, msg } = validator();
  if (markTouch) markTouched(id);
  const touched = getContainer(id)?.dataset.touched === "true";
  const shouldShow = showErrors || touched;
  if (shouldShow) {
    setFieldState(id, ok);
    setFieldFaultMsg(id, ok ? "" : msg);
  } else {
    setFieldState(id, true);
    setFieldFaultMsg(id, "");
  }
  return ok;
}


/**
 * Binds a click event listener to the signup back button.
 * Redirects the user to the index page when clicked.
 *
 * @returns {void} Nothing is returned; attaches an event listener to the DOM element.
 */
function bindBackButton() {
  const backBtn = el("signupBackBtn");
  if (backBtn) {
    backBtn.addEventListener(
      "click",
      () => (window.location.href = "./index.html")
    );
  }
}


/**
 * Binds click event listeners to all password visibility toggle buttons.
 * Uses the `data-toggle` attribute to identify the related input field.
 *
 * @returns {void} Nothing is returned; event listeners are attached to the DOM.
 */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePassword(button.dataset.toggle)
    );
  });
}


/**
 * Validates all signup input fields individually with visual feedback.
 * Runs validation for name, email, password, and password confirmation fields.
 *
 * @returns {boolean} `true` if all fields are valid, otherwise `false`.
 */
function validateAllFields() {
  const nameOk = validateSingleField("signupName", {
    showErrors: true,
    markTouch: true,
  });
  const emailOk = validateSingleField("signupEmail", {
    showErrors: true,
    markTouch: true,
  });
  const passwordOk = validateSingleField("signupPassword", {
    showErrors: true,
    markTouch: true,
  });
  const confirmOk = validateSingleField("signupPasswordConfirm", {
    showErrors: true,
    markTouch: true,
  });
  return nameOk && emailOk && passwordOk && confirmOk;
}


/**
 * Checks whether the privacy policy checkbox has been accepted.
 * Displays an error message if the checkbox is not checked.
 *
 * @returns {boolean} `true` if the privacy policy is accepted, otherwise `false`.
 */
function checkPrivacyAccepted() {
  const accepted = el("signupPrivacy")?.checked ?? false;
  if (!accepted) {
    setSignupStatus("Please accept the privacy policy.", true);
  }
  return accepted;
}


/**
 * Handles the full signup registration process.
 * Disables the submit button, registers the user, clears validation messages,
 * and redirects to the summary page upon success.  
 * Displays an error message if registration fails.
 *
 * @async
 * @returns {Promise<void>} Resolves when the registration process is completed.
 */
async function submitRegistration() {
  disableSubmit(true);
  try {
    await registerUser(
      val("signupName"),
      val("signupEmail"),
      val("signupPassword")
    );
    clearFaultMsgs();
    window.location.href = "./summary.html";
  } catch (err) {
    setSignupStatus(readAuthError(err), true);
  } finally {
    disableSubmit(false);
  }
}


/**
 * Handles the signup form submission process.
 * Prevents default submission, validates inputs and privacy consent,
 * and proceeds with registration if all checks pass.
 *
 * @async
 * @param {Event} event - The form submission event.
 * @returns {Promise<void>} Resolves after the registration attempt completes.
 */
async function handleSignupSubmit(event) {
  event.preventDefault();
  if (!validateAllFields()) return;
  if (!checkPrivacyAccepted()) return;
  await submitRegistration();
}


/**
 * Validates all signup form fields for correctness and completeness.
 * Checks name format, email validity, password length, and password confirmation.
 *
 * @returns {boolean} `true` if all form fields are valid, otherwise `false`.
 */
function checkAllFieldsValid() {
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  const okName = !!name && RX_NAME.test(name);
  const okEmail = !!email && validateEmail(email);
  const okPwLen = password.length >= 6;
  const okConfirm = confirm.length >= 6 && password === confirm;
  return okName && okEmail && okPwLen && okConfirm;
}


/**
 * Updates the state of the signup submit button based on form validity.
 * Enables submission only when all fields are valid and privacy is accepted.
 * Also checks and displays password mismatch hints if necessary.
 *
 * @returns {void} Nothing is returned; updates the form UI and validation hints.
 */
function updateSubmitState() {
  const accepted = el("signupPrivacy")?.checked ?? false;
  const allValid = checkAllFieldsValid();
  const enabled = allValid && accepted;
  disableSubmit(!enabled);
  showPasswordMismatch(val("signupPassword"), val("signupPasswordConfirm"));
}


/**
 * Displays a password mismatch hint during signup validation.
 * Shows an error message when the password and confirmation do not match.
 *
 * @param {string} password - The entered password value.
 * @param {string} confirm - The confirmed password value.
 * @returns {void} Nothing is returned; updates the hint element in the DOM.
 */
function showPasswordMismatch(password, confirm) {
  const hint = el("signupPasswordHint");
  if (!hint) return;
  hint.textContent =
    password && confirm && password !== confirm ? ERR.confirm : "";
}


/**
 * Enables or disables the signup submit button.
 * Updates both the `disabled` property and a visual "btn__disabled" class.
 *
 * @param {boolean} disabled - Whether the submit button should be disabled.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function disableSubmit(disabled) {
  const button = el("signupSubmit");
  if (!button) return;
  button.disabled = disabled;
  button.classList.toggle("btn__disabled", disabled);
}


/**
 * Toggles the visibility of a password input field.
 * Switches the field type between "password" and "text".
 *
 * @param {string} id - The ID of the password input element.
 * @returns {void} Nothing is returned; updates the input field directly.
 */
function togglePassword(id) {
  const field = el(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}


/**
 * Displays a signup status message and toggles its error state.
 * Updates the text content and applies an "error" class if needed.
 *
 * @param {string} message - The status message to display.
 * @param {boolean} isError - Whether the message represents an error state.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function setSignupStatus(message, isError) {
  const status = el("signupStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}


/**
 * Clears all visible validation error messages in the document.
 * Empties their text content and removes the "visible" class.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function clearFaultMsgs() {
  document.querySelectorAll(".field-fault-msg.visible").forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}
