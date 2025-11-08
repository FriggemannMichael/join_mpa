/**
 * Enables or disables the submit button based on form validity
 * @param {HTMLButtonElement} btn - The submit button element
 * @param {boolean} isValid - Whether the form is valid
 * @returns {void}
 */
export function releaseSubmit(btn, isValid) {
  if (!btn) return;
  btn.disabled = !isValid;
  btn.ariaDisabled = String(!isValid);
}
