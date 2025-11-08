import { releaseSubmit } from "./validation-helpers.js";
import { logWarning } from "../common/logger.js";


/**
 * Creates an event handler that validates the field and updates the submit button.
 * @param {() => void} validateVisible - Field-specific validation function.
 * @param {() => boolean} updateSubmit - Updates overall form validity state.
 * @returns {() => void} Bound handler to attach to event listeners.
 */
function makeFieldHandler(validateVisible, updateSubmit) {
  return () => {
    validateVisible();
    updateSubmit();
  };
}


/**
 * Adds an event listener and stores it if no AbortSignal is used.
 * @param {HTMLElement} el - Element to attach the listener to.
 * @param {string} evt - Event name.
 * @param {EventListener} handler - Callback function.
 * @param {AbortSignal|undefined} signal - Optional signal for automatic cleanup.
 * @param {{el:HTMLElement,evt:string,handler:EventListener}[]} listeners - Local listener cache.
 * @returns {void}
 */
function addEvent(el, evt, handler, signal, listeners) {
  const options = signal ? { signal } : {};
  el.addEventListener(evt, handler, options);
  if (!signal) listeners.push({ el, evt, handler });
}


/**
 * Binds validation and update handlers for one field.
 * @param {FieldConfig} field - Field configuration object.
 * @param {() => boolean} updateSubmit - Function to refresh form state.
 * @param {AbortSignal|undefined} signal - Optional cleanup signal.
 * @param {{el:HTMLElement,evt:string,handler:EventListener}[]} listeners - Listener collection.
 * @returns {void}
 */
function bindField(field, updateSubmit, signal, listeners) {
  const { el, events, validateVisible } = field;
  if (!el) return logWarning("FormBinder", "Element is null, skip field binding");
  const handler = makeFieldHandler(validateVisible, updateSubmit);
  events.forEach((evt) => addEvent(el, evt, handler, signal, listeners));
}


/**
 * Runs silent validation and updates the submit button state.
 * @param {() => boolean} validateAllSilent - Validates all fields without showing errors.
 * @param {HTMLElement} submitBtn - Submit button element.
 * @returns {boolean} Returns true if all fields are valid.
 */
function updateSubmitState(validateAllSilent, submitBtn) {
  const ok = validateAllSilent();
  releaseSubmit(submitBtn, ok);
  return ok;
}


/**
 * Main form binder. Attaches field listeners, manages validation, and controls submit state.
 * @param {{fields:FieldConfig[], submitBtn:HTMLElement, validateAllSilent:() => boolean, signal?:AbortSignal}} cfg - Binding configuration.
 * @returns {{updateSubmit:() => boolean, detach:() => void}} Returns control methods for the form.
 */
export function bindForm({ fields, submitBtn, validateAllSilent, signal }) {
  const listeners = [];
  const updateSubmit = () => updateSubmitState(validateAllSilent, submitBtn);

  fields.forEach((f) => bindField(f, updateSubmit, signal, listeners));
  updateSubmit();

  return {
    updateSubmit,
    detach() {
      if (signal) return;
      listeners.forEach(({ el, evt, handler }) => el.removeEventListener(evt, handler));
    },
  };
}