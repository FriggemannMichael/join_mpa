/**
 * Form Reset Utilities
 * Provides functions to properly reset forms and clear all validation states
 * @module formReset
 */

/**
 * Completely resets a form and clears all validation states
 * Removes error messages, resets field states, and clears all input values
 * 
 * @param {HTMLFormElement} form - The form element to reset
 * @returns {void}
 * 
 * @example
 * const form = document.getElementById('myForm');
 * resetFormCompletely(form);
 */
export function resetFormCompletely(form) {
  if (!form || !(form instanceof HTMLFormElement)) {
    console.warn('resetFormCompletely: Invalid form element provided');
    return;
  }

  // Reset all form values using native reset()
  form.reset();

  // Clear all validation error states
  clearAllValidationStates(form);

  // Reset ARIA attributes
  resetAriaAttributes(form);

  // Clear custom error messages
  clearCustomErrorMessages(form);
}

/**
 * Clears all validation states (error borders, invalid classes) from form fields
 * 
 * @param {HTMLFormElement} form - The form containing fields to clear
 * @returns {void}
 */
export function clearAllValidationStates(form) {
  if (!form) return;

  // Clear input-fault classes
  form.querySelectorAll('.input-fault, .field-fault').forEach(el => {
    el.classList.remove('input-fault', 'field-fault');
  });

  // Clear container-level fault classes
  form.querySelectorAll('.inputField__container').forEach(container => {
    container.classList.remove('input-fault');
    // Remove touched state
    delete container.dataset.touched;
  });

  // Clear error field classes
  form.querySelectorAll('input.error, textarea.error, select.error').forEach(el => {
    el.classList.remove('error');
  });
}

/**
 * Resets ARIA attributes to their default valid state
 * 
 * @param {HTMLFormElement} form - The form containing fields to reset
 * @returns {void}
 */
export function resetAriaAttributes(form) {
  if (!form) return;

  // Reset aria-invalid to false on all form controls
  form.querySelectorAll('[aria-invalid]').forEach(el => {
    el.setAttribute('aria-invalid', 'false');
  });

  // Clear aria-describedby if it points to error messages
  form.querySelectorAll('[aria-describedby]').forEach(el => {
    const describedBy = el.getAttribute('aria-describedby');
    if (describedBy && describedBy.includes('error')) {
      el.removeAttribute('aria-describedby');
    }
  });
}

/**
 * Clears all custom error messages from the form
 * Removes visible error text elements and status messages
 * 
 * @param {HTMLFormElement} form - The form containing error messages to clear
 * @returns {void}
 */
export function clearCustomErrorMessages(form) {
  if (!form) return;

  // Clear field-fault-msg elements
  form.querySelectorAll('.field-fault-msg').forEach(msg => {
    msg.textContent = '';
    msg.classList.remove('visible');
  });

  // Clear generic error divs
  form.querySelectorAll('.error-message, .field-error, .validation-error').forEach(msg => {
    msg.textContent = '';
    msg.classList.remove('visible', 'show');
  });

  // Clear status messages inside the form
  form.querySelectorAll('[id*="Status"], [id*="Error"]').forEach(status => {
    status.textContent = '';
    status.classList.remove('error', 'visible');
  });
}

/**
 * Clears a single field's validation state
 * Useful for clearing errors as user starts typing
 * 
 * @param {HTMLElement} field - The input/textarea/select element to clear
 * @returns {void}
 * 
 * @example
 * const emailInput = document.getElementById('email');
 * clearFieldValidation(emailInput);
 */
export function clearFieldValidation(field) {
  if (!field) return;

  // Remove error classes from field
  field.classList.remove('input-fault', 'field-fault', 'error');

  // Reset aria-invalid
  field.setAttribute('aria-invalid', 'false');

  // Clear parent container's fault state
  const container = field.closest('.inputField__container');
  if (container) {
    container.classList.remove('input-fault');
  }

  // Clear associated error message
  const parent = field.parentElement;
  if (parent) {
    const errorMsg = parent.querySelector('.field-fault-msg');
    if (errorMsg) {
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
    }
  }
}

/**
 * Resets form and re-enables submit button
 * Common pattern: clear form and ensure button is in correct state
 * 
 * @param {HTMLFormElement} form - The form to reset
 * @param {HTMLButtonElement} submitButton - The submit button to enable/disable
 * @param {boolean} enableButton - Whether to enable the button after reset (default: false)
 * @returns {void}
 * 
 * @example
 * resetFormAndButton(form, submitBtn, false); // Reset and disable button
 */
export function resetFormAndButton(form, submitButton, enableButton = false) {
  resetFormCompletely(form);

  if (submitButton) {
    submitButton.disabled = !enableButton;
    submitButton.classList.toggle('btn__disabled', !enableButton);
  }
}
