
import { icons } from "./svg-template.js";


/**
 * Predefined alert messages mapped by alert type.
 * Used by {@link createAlert} and {@link showAlert} to display consistent user feedback.
 *
 * @constant
 * @type {Object<string, string>}
 * @property {string} created - Message shown when a task is added.
 * @property {string} updated - Message shown when a task is updated.
 * @property {string} deleted - Message shown when a task is deleted.
 * @property {string} signUp - Message shown after successful signup.
 * @property {string} clearForm - Message shown when a form is cleared.
 * @property {string} createContact - Message shown when a contact is created.
 * @property {string} deleteContact - Message shown when a contact is deleted.
 * @property {string} editContact - Message shown when a contact is edited.
 * @property {string} error - Default message shown for unknown errors.
 */
const ALERT_TEXTS = {
  created: `Task added to board ${icons.board}`,
  updated: "Task updated successfully",
  deleted: "Task deleted from board",
  signUp: "You Signed Up successfully",
  clearForm: "Form cleared",
  createContact: "Contact successfully created",
  deleteContact: "Contact successfully deleted",
  editContact: "Contact updated",
  error: "An error occurred",
};


/**
 * Creates an alert element based on the given type and message.
 * Adds styling classes and default text if no custom message is provided.
 *
 * @param {string} type - The alert type (e.g., "created", "updated", "error").
 * @param {?string} msg - Optional custom message to display instead of the default text.
 * @returns {HTMLDivElement} The generated alert element ready to be appended to the DOM.
 */
function createAlert(type, msg) {
  const el = document.createElement("div");
  el.className = "alert task-added";
  if (type === "created") el.classList.add("center");
  if (type === "error") el.classList.add("error");
  el.innerHTML = msg || ALERT_TEXTS[type] || ALERT_TEXTS.error;
  return el;
}

/**
 * Displays a temporary alert message on the screen.
 * The alert fades in, stays visible for a short time, and then disappears automatically.
 *
 * @param {string} type - Type of alert (e.g., "created", "updated", "error").
 * @param {number} [ms=1800] - Duration in milliseconds before the alert disappears.
 * @param {?string} [msg=null] - Optional custom message to override the default alert text.
 * @param {?Function} [done=null] - Optional callback executed after the alert is removed.
 * @returns {void} Nothing is returned; updates the DOM.
 */
export function showAlert(type, ms = 1800, msg = null, done = null) {
  const alert = createAlert(type, msg);
  document.body.append(alert);
  requestAnimationFrame(() => alert.classList.add("visible"));
  clearTimeout(alert.t);
  alert.t = setTimeout(() => (alert.remove(), done?.()), ms);
}
