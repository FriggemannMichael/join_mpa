/**
 * Finds a form field by its `name` attribute within the given form element.
 *
 * @param {HTMLFormElement} form - The form element to search inside.
 * @param {string} name - The name attribute of the target input or field.
 * @returns {HTMLElement|null} The matching element, or `null` if not found.
 */
export const byName = (form, name) => form.querySelector(`[name="${name}"]`);


/**
 * Displays a validation error message below an input field.
 * Creates the message element if it doesn't exist and highlights the input.
 *
 * @param {HTMLElement} el - The input element to attach the error message to.
 * @param {string} msg - The validation message to display.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function showFaultMsg(el, msg) {
  if (!el) return;
  let faultMsg = el.parentElement.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    el.parentElement.appendChild(faultMsg);
  }
  faultMsg.textContent = msg;
  faultMsg.classList.add("visible");
  el.classList.add("input-fault");
}


/**
 * Hides the validation error message for a given input field.
 * Removes visual error highlighting and hides the message element if present.
 *
 * @param {HTMLElement} el - The input element whose error message should be cleared.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function clearFaultMsg(el) {
  if (!el) return;
  el.classList.remove("input-fault");
  const faultMsg = el.parentElement.querySelector(".field-fault-msg");
  if (faultMsg) faultMsg.classList.remove("visible");
}


/**
 * Toggles a validation message based on the given condition.
 * Clears the message if the field is valid, or displays it if invalid.
 *
 * @param {HTMLElement} el - The input element to validate.
 * @param {boolean} ok - Whether the field passes validation.
 * @param {string} msg - The message to display when validation fails.
 * @returns {boolean} Returns the validation result (`true` if valid).
 */
export function toggleFaultMsg(el, ok, msg) {
  ok ? clearFaultMsg(el) : showFaultMsg(el, msg);
  return ok;
}
