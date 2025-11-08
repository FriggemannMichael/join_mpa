import { byId } from "./valdiation-ui.js";
import { bindForm } from "./form-binder.js";
import {
  validateRequiredEl,
  validateMinLengthEl,
  validateEmailEl,
  validatePhoneEl,
} from "./validation-fields.js";
import { logWarning } from "../common/logger.js";


/**
 * Initializes validation for the Add Contact form.
 * Validates name (required, min 2 chars), email (required, valid format), and phone (optional, min 3 if filled).
 * @returns {Object|null} Controller with updateSubmit and detach methods, or null if elements not found.
 */
export function initAddContactValidation() {
  return initContactValidation({
    nameId: "addContactName",
    emailId: "addContactEmail",
    phoneId: "addContactPhone",
    submitId: "addContactSubmit",
    logKey: "AddContactValidation",
  });
}


/**
 * Initializes validation for the Edit Contact form.
 * Same validation rules as Add Contact.
 * @returns {Object|null} Controller with updateSubmit and detach methods, or null if elements not found.
 */
export function initEditContactValidation() {
  return initContactValidation({
    nameId: "contactName",
    emailId: "contactEmail",
    phoneId: "contactPhone",
    submitId: "contactSaveBtn",
    logKey: "EditContactValidation",
  });
}


/**
 * Initializes and binds form validation logic for the contact form.
 * Collects DOM nodes, builds visible field validators, and attaches event bindings.
 *
 * @param {Object} ids - Collection of element IDs or config keys required for contact validation.
 * @param {string} ids.logKey - Log identifier for debugging or warning output.
 * @returns {{ updateSubmit: () => boolean, detach: () => void } | null}
 * Returns the bound form controller, or null if required elements are missing.
 */
function initContactValidation(ids) {
  const nodes = getContactNodes(ids);
  if (!nodes) {
    logWarning(ids.logKey, "Required elements not found");
    return null;
  }
  const visible = createVisibleHandlers(nodes);
  return bindForm(buildContactConfig(nodes, visible));
}


/**
 * Retrieves required DOM nodes for the contact form by their element IDs.
 * Returns null if any of the required elements are missing.
 *
 * @param {{ nameId: string, emailId: string, phoneId: string, submitId: string }} ids
 * Object containing the element IDs for each contact form field.
 * @returns {{ name: HTMLElement, email: HTMLElement, phone: HTMLElement, submit: HTMLElement } | null}
 * Returns a map of DOM nodes if all are found, otherwise null.
 */
function getContactNodes({ nameId, emailId, phoneId, submitId }) {
  const nodes = {
    name: byId(nameId),
    email: byId(emailId),
    phone: byId(phoneId),
    submit: byId(submitId),
  };
  return Object.values(nodes).every(Boolean) ? nodes : null;
}


/**
 * Creates field-specific validation handlers that trigger visible feedback.
 * Each handler calls its corresponding validator with visibility enabled.
 *
 * @param {{ name: HTMLElement, email: HTMLElement, phone: HTMLElement }} fields
 * Object containing the contact form elements.
 * @returns {{ name: () => boolean, email: () => boolean, phone: () => boolean }}
 * Returns a set of functions that perform visible validation for each field.
 */
function createVisibleHandlers({ name, email, phone }) {
  return {
    name: () => validateNameField(name, true),
    email: () => validateEmailEl(email, "E-Mail", { show: true }),
    phone: () => validatePhoneEl(phone, "Telefon", { show: true }),
  };
}


/**
 * Builds the configuration object used by form binding for the contact form.
 * Defines which elements to validate, their triggering events, and the silent validator.
 *
 * @param {{ name: HTMLElement, email: HTMLElement, phone: HTMLElement, submit: HTMLElement }} nodes
 * Map of DOM nodes representing the contact form fields.
 * @param {{ name: () => boolean, email: () => boolean, phone: () => boolean }} visible
 * Visible validation handler functions for each field.
 * @returns {{
 *   submitBtn: HTMLElement,
 *   validateAllSilent: () => boolean,
 *   fields: { el: HTMLElement, events: string[], validateVisible: () => boolean }[]
 * }}
 * Returns a config object compatible with `bindForm`.
 */
function buildContactConfig(nodes, visible) {
  return {
    submitBtn: nodes.submit,
    validateAllSilent: createSilentValidator(nodes),
    fields: [
      { el: nodes.name, events: ["blur", "input"], validateVisible: visible.name },
      { el: nodes.email, events: ["blur"], validateVisible: visible.email },
      { el: nodes.phone, events: ["blur"], validateVisible: visible.phone },
    ],
  };
}


/**
 * Creates a silent validator that checks all contact form fields
 * without displaying visible error messages.
 *
 * @param {{ name: HTMLElement, email: HTMLElement, phone: HTMLElement }} nodes
 * Map of contact form elements to validate.
 * @returns {() => boolean}
 * Returns a function that performs silent validation and
 * returns true only if all fields are valid.
 */
function createSilentValidator(nodes) {
  return () =>
    validateNameField(nodes.name, false) &&
    validateEmailEl(nodes.email, "E-Mail", { show: false }) &&
    validatePhoneEl(nodes.phone, "Telefon", { show: false });
}


/**
 * Validates a name input field for presence and minimum length.
 * Can run in visible or silent mode depending on the `show` flag.
 *
 * @param {HTMLElement} el - Input element representing the name field.
 * @param {boolean} show - If true, shows visible validation feedback.
 * @returns {boolean} Returns true if the field passes all validation checks.
 */
function validateNameField(el, show) {
  const requiredOk = validateRequiredEl(el, "Name", { show });
  const lengthOk = validateMinLengthEl(el, 2, "Name", { show });
  return requiredOk && lengthOk;
}
