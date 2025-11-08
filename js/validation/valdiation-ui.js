/**
 * Returns element by id (shorthand).
 * @param {string} id - Element id.
 * @returns {HTMLElement|null}
 */
export const byId = (id) => document.getElementById(id);

/**
 * Ensures a fault message element exists in the host container.
 * @param {HTMLElement} host - The container holding the input.
 * @returns {HTMLElement} The created or existing fault message element.
 */
function ensureFaultMsg(host) {
  let faultMsg = host.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    // Optional a11y:
    faultMsg.setAttribute("role", "status");
    faultMsg.setAttribute("aria-live", "polite");
    host.appendChild(faultMsg);
  }
  return faultMsg;
}

/**
 * Finds the best container element for visual feedback.
 * @param {HTMLElement} input - The input element to start from.
 * @returns {HTMLElement} Container element for error state.
 */
function findHostContainer(input) {
  return (
    input.closest?.(".inputField__container, .form-group") ||
    input.parentElement ||
    input
  );
}

/**
 * Updates the visual state for an error message.
 * @param {HTMLElement} host - Container of the input.
 * @param {HTMLElement} input - The affected input element.
 * @param {string} message - The message to display.
 * @returns {void}
 */
function applyErrorState(host, input, message) {
  const faultMsg = ensureFaultMsg(host);
  faultMsg.textContent = message;
  faultMsg.classList.add("visible");

  host.classList.add("input-fault");
  input.classList.add("input-fault");

  const header = host.querySelector(".category-select-header");
  if (header) header.classList.add("input-fault");
}

/**
 * Displays a validation error message for an input field.
 * @param {HTMLElement|null} inputElement - Target input element.
 * @param {string} message - Error message text.
 * @returns {void}
 */
export function showError(inputElement, message) {
  if (!inputElement) return;
  const host = findHostContainer(inputElement);
  applyErrorState(host, inputElement, message);
}

/**
 * Removes visible error indicators from the container.
 * @param {HTMLElement} host - The container holding the input.
 * @returns {void}
 */
function clearFaultMessage(host) {
  const msg = host.querySelector(".field-fault-msg");
  if (msg) msg.classList.remove("visible");
}

/**
 * Clears all visual "input-fault" states.
 * @param {HTMLElement} host - Container of the input.
 * @param {HTMLElement} input - The affected input element.
 * @returns {void}
 */
function clearFaultClasses(host, input) {
  host.classList.remove("input-fault");
  input.classList.remove("input-fault");

  const header = host.querySelector(".category-select-header");
  if (header) header.classList.remove("input-fault");
}

/**
 * Clears validation error state for a given input field.
 * @param {HTMLElement|null} inputElement - Input element to clear.
 * @returns {void}
 */
export function clearError(inputElement) {
  if (!inputElement) return;
  const host = findHostContainer(inputElement);
  clearFaultMessage(host);
  clearFaultClasses(host, inputElement);
}

/**
 * Toggles error state based on validity.
 * @param {HTMLElement|null} inputElement - Input element to update.
 * @param {boolean} isValid - Current validity state.
 * @param {string} message - Error message when invalid.
 * @returns {boolean} Returns the provided validity flag.
 */
export function toggleError(inputElement, isValid, message) {
  isValid ? clearError(inputElement) : showError(inputElement, message);
  return isValid;
}
