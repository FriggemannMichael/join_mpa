import { ERR } from "./signUp.validation.js"

const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();


/**
 * Retrieves the closest input field container element for a given ID.
 * Falls back to the element itself if no container is found.
 *
 * @param {string} id - The ID of the target input element.
 * @returns {HTMLElement|null} The closest `.inputField__container` element, or `null` if not found.
 */
export function getContainer(id) {
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
export function setFieldState(id, ok) {
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
export function setFieldFaultMsg(id, message = "") {
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
export function markTouched(id) {
  const c = getContainer(id);
  if (c) c.dataset.touched = "true";
}




/**
 * Displays a signup status message and toggles its error state.
 * Updates the text content and applies an "error" class if needed.
 *
 * @param {string} message - The status message to display.
 * @param {boolean} isError - Whether the message represents an error state.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function setSignupStatus(message, isError) {
  const status = el("signupStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}




/**
 * Enables or disables the signup submit button.
 * Updates both the `disabled` property and a visual "btn__disabled" class.
 *
 * @param {boolean} disabled - Whether the submit button should be disabled.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function disableSubmit(disabled) {
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
export function togglePassword(id) {
  const field = el(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}


/**
 * Displays a password mismatch hint during signup validation.
 * Shows an error message when the password and confirmation do not match.
 *
 * @param {string} password - The entered password value.
 * @param {string} confirm - The confirmed password value.
 * @returns {void} Nothing is returned; updates the hint element in the DOM.
 */
export function showPasswordMismatch(password, confirm) {
  const hint = el("signupPasswordHint");
  if (!hint) return;
  hint.textContent =
    password && confirm && password !== confirm ? ERR.confirm : "";
}


/**
 * Clears all visible validation error messages in the document.
 * Empties their text content and removes the "visible" class.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function clearFaultMsgs() {
  document.querySelectorAll(".field-fault-msg.visible").forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}