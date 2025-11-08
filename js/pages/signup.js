/**
 * Signup page for user registration
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";
import { validateEmail } from "../common/emailValidator.js";

import {
  getContainer,
  setFieldState, setFieldFaultMsg, markTouched,
  disableSubmit, togglePassword, setSignupStatus,
  clearFaultMsgs, showPasswordMismatch,
} from "../signUp/signUp.ui.js";

import {
  ERR, RX_NAME,
  getFieldValidator,
} from "../signUp/signUp.validation.js";

// const fieldValidator = getFieldValidator(val);

initSignupPage();

const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();

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
 * Validates a single signup field with comprehensive validation logic.
 * @param {string} id - Field ID to validate.
 * @param {{showErrors?: boolean, markTouch?: boolean}} opts - Validation options.
 * @returns {boolean} True if field is valid.
 */
function validateSingleField(id, opts = {}) {
  const { showErrors = false, markTouch = false } = opts;
  const validator = getFieldValidator(id);
  const { ok, msg } = validator();

  if (markTouch) markTouched(id);

  const shouldShow = shouldShowValidationError(id, showErrors);
  applyValidationFeedback(id, ok, msg, shouldShow);

  return ok;
}

/**
 * Determines if validation errors should be displayed for a field.
 * @param {string} id - The field ID.
 * @param {boolean} showErrors - Force display of errors.
 * @returns {boolean} True if errors should be shown.
 */
function shouldShowValidationError(id, showErrors) {
  const touched = getContainer(id)?.dataset.touched === "true";
  return showErrors || touched;
}

/**
 * Applies validation feedback to a field (state and message).
 * @param {string} id - Field ID.
 * @param {boolean} ok - Validation result.
 * @param {string} msg - Error message.
 * @param {boolean} shouldShow - Whether to show errors.
 * @returns {void}
 */
function applyValidationFeedback(id, ok, msg, shouldShow) {
  if (shouldShow) {
    setFieldState(id, ok);
    setFieldFaultMsg(id, ok ? "" : msg);
  } else {
    setFieldState(id, true);
    setFieldFaultMsg(id, "");
  }
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
 * @returns {boolean} `true` if all fields are valid, otherwise `false`.
 */
function validateAllFields() {
  const nameOk = validateNameField();
  const emailOk = validateEmailFieldWithFeedback();
  const passwordOk = validatePasswordFieldWithFeedback();
  const confirmOk = validatePasswordConfirmFieldWithFeedback();
  return nameOk && emailOk && passwordOk && confirmOk;
}

/**
 * Validates the name field with visual feedback.
 * @returns {boolean} True if name is valid.
 */
function validateNameField() {
  return validateSingleField("signupName", {
    showErrors: true,
    markTouch: true,
  });
}

/**
 * Validates the email field with visual feedback.
 * @returns {boolean} True if email is valid.
 */
function validateEmailFieldWithFeedback() {
  return validateSingleField("signupEmail", {
    showErrors: true,
    markTouch: true,
  });
}

/**
 * Validates the password field with visual feedback.
 * @returns {boolean} True if password is valid.
 */
function validatePasswordFieldWithFeedback() {
  return validateSingleField("signupPassword", {
    showErrors: true,
    markTouch: true,
  });
}

/**
 * Validates the password confirmation field with visual feedback.
 * @returns {boolean} True if password confirmation matches.
 */
function validatePasswordConfirmFieldWithFeedback() {
  return validateSingleField("signupPasswordConfirm", {
    showErrors: true,
    markTouch: true,
  });
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
 * @async
 * @returns {Promise<void>} Resolves when the registration process is completed.
 */
async function submitRegistration() {
  disableSubmit(true);
  try {
    await performUserRegistration();
    handleRegistrationSuccess();
  } catch (err) {
    handleRegistrationError(err);
  } finally {
    disableSubmit(false);
  }
}

/**
 * Performs the actual user registration with Firebase.
 * @async
 * @returns {Promise<void>}
 */
async function performUserRegistration() {
  await registerUser(
    val("signupName"),
    val("signupEmail"),
    val("signupPassword")
  );
}

/**
 * Handles successful user registration.
 * @returns {void}
 */
function handleRegistrationSuccess() {
  clearFaultMsgs();
  window.location.href = "./summary.html";
}

/**
 * Handles registration errors by displaying appropriate messages.
 * @param {Error} err - The error object.
 * @returns {void}
 */
function handleRegistrationError(err) {
  setSignupStatus(readAuthError(err), true);
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
 * @returns {boolean} `true` if all form fields are valid, otherwise `false`.
 */
function checkAllFieldsValid() {
  const okName = isNameValid();
  const okEmail = isEmailValid();
  const okPwLen = isPasswordLengthValid();
  const okConfirm = isPasswordConfirmValid();
  return okName && okEmail && okPwLen && okConfirm;
}

/**
 * Checks if the name field is valid.
 * @returns {boolean} True if name matches the pattern.
 */
function isNameValid() {
  const name = val("signupName");
  return !!name && RX_NAME.test(name);
}

/**
 * Checks if the email field is valid.
 * @returns {boolean} True if email is valid.
 */
function isEmailValid() {
  const email = val("signupEmail");
  return !!email && validateEmail(email);
}

/**
 * Checks if the password meets minimum length.
 * @returns {boolean} True if password is at least 6 characters.
 */
function isPasswordLengthValid() {
  const password = val("signupPassword");
  return password.length >= 6;
}

/**
 * Checks if the password confirmation matches and is valid.
 * @returns {boolean} True if passwords match and are valid.
 */
function isPasswordConfirmValid() {
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  return confirm.length >= 6 && password === confirm;
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

