/**
 * Signup page for user registration
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";
import { validateEmail } from "../common/emailValidator.js";

initSignupPage();

/**
 * Regex for name validation
 * Requires first letter capitalized, allows German characters (äöüÄÖÜß)
 * Supports compound names with spaces or hyphens
 */
const RX_NAME = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;

/** ===== Small DOM helpers ===== */
const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();

/** Toggle red border + aria-invalid */
function setFieldState(id, ok) {
  const node = el(id);
  if (!node) return;
  node.classList.toggle("input-fault", !ok);
  node.setAttribute("aria-invalid", String(!ok));
}

/**
 * Initializes the signup page with redirect check and UI setup
 */
async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
  // Initial state on load
  updateSubmitState();
}

/**
 * Binds event listeners for the signup form
 */
function bindSignupForm() {
  const form = el("signupForm");
  if (!form) return;
  form.addEventListener("submit", handleSignupSubmit);
  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
}

/**
 * Binds event listeners for the back button
 */
function bindBackButton() {
  const backBtn = el("signupBackBtn");
  if (!backBtn) return;
  backBtn.addEventListener(
    "click",
    () => (window.location.href = "./index.html")
  );
}

/**
 * Binds event listeners for password visibility toggles
 */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePassword(button.dataset.toggle)
    );
  });
}

/**
 * Handles the signup form submit
 * @param {Event} event The submit event
 */
async function handleSignupSubmit(event) {
  event.preventDefault();
  if (!validateSignup()) return;
  disableSubmit(true);
  try {
    await registerUser(
      val("signupName"),
      val("signupEmail"),
      val("signupPassword")
    );
    window.location.href = "./summary.html";
  } catch (err) {
    setSignupStatus(readAuthError(err), true);
  }
  disableSubmit(false);
}

/**
 * Validates all signup form inputs with comprehensive email validation
 * Uses centralized email validator to catch consecutive dots and malformed patterns
 * Marks invalid fields with a red border
 * 
 * @returns {boolean} True if all validations pass, otherwise false
 */
function validateSignup() {
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  const accepted = el("signupPrivacy")?.checked ?? false;

  const okName = !!name && RX_NAME.test(name);
  // Use robust email validator instead of simple regex
  const okEmail = !!email && validateEmail(email);
  const okPwLen = password.length >= 6;
  const okConfirm = confirm.length >= 6 && password === confirm;
  const okPrivacy = accepted === true;

  setFieldState("signupName", okName);
  setFieldState("signupEmail", okEmail);
  setFieldState("signupPassword", okPwLen);
  setFieldState("signupPasswordConfirm", okConfirm);

  if (!okName)
    return reportError('Please enter a valid name (e.g. "Max Mustermann").');
  if (!okEmail) {
    // Provide specific error for consecutive dots
    const msg = email.includes('..') 
      ? "Email cannot contain consecutive dots (..)" 
      : "Please enter a valid email address.";
    return reportError(msg);
  }
  if (!okPwLen) return reportError("Password requires at least 6 characters.");
  if (!okConfirm) return reportError("Passwords do not match.");
  if (!okPrivacy) return reportError("Please accept the privacy policy.");

  setSignupStatus("", false);
  return true;
}

/**
 * Updates the submit button status and live field validation borders
 * Uses robust email validation to prevent malformed email addresses
 */
function updateSubmitState() {
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  const accepted = el("signupPrivacy")?.checked ?? false;

  const okName = !!name && RX_NAME.test(name);
  // Use robust email validator for comprehensive validation
  const okEmail = !!email && validateEmail(email);
  const okPwLen = password.length >= 6;
  const okConfirm = confirm.length >= 6 && password === confirm;

  // Live field states (red border on/off)
  setFieldState("signupName", name ? okName : true);
  setFieldState("signupEmail", email ? okEmail : true);
  setFieldState("signupPassword", password ? okPwLen : true);
  setFieldState("signupPasswordConfirm", confirm ? okConfirm : true);

  // Enable button when everything is valid
  const enabled = okName && okEmail && okPwLen && okConfirm && accepted;
  disableSubmit(!enabled);

  // Show hint text on password mismatch
  showPasswordMismatch(password, confirm);
}

/**
 * Shows a hint when passwords do not match
 * @param {string} password The password
 * @param {string} confirm The confirmation password
 */
function showPasswordMismatch(password, confirm) {
  const hint = el("signupPasswordHint");
  if (!hint) return;
  const mismatch = password && confirm && password !== confirm;
  hint.textContent = mismatch ? "Passwords do not match" : "";
}

/**
 * Enables or disables the submit button
 * @param {boolean} disabled True to disable, false to enable
 */
function disableSubmit(disabled) {
  const button = el("signupSubmit");
  if (!button) return;
  button.disabled = disabled;
  button.classList.toggle("btn__disabled", disabled);
}

/**
 * Toggles the visibility of a password field
 * @param {string} id The ID of the password input field
 */
function togglePassword(id) {
  const field = el(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

/**
 * Displays a status message on the signup page
 * @param {string} message The message to display
 * @param {boolean} isError True for error message, false for normal message
 */
function setSignupStatus(message, isError) {
  const status = el("signupStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Displays an error message and returns false
 * @param {string} message The error message
 * @returns {boolean} Always false
 */
function reportError(message) {
  setSignupStatus(message, true);
  return false;
}
