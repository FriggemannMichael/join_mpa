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

function initContactValidation(ids) {
  const nodes = getContactNodes(ids);
  if (!nodes) {
    logWarning(ids.logKey, "Required elements not found");
    return null;
  }
  const visible = createVisibleHandlers(nodes);
  return bindForm(buildContactConfig(nodes, visible));
}

function getContactNodes({ nameId, emailId, phoneId, submitId }) {
  const nodes = {
    name: byId(nameId),
    email: byId(emailId),
    phone: byId(phoneId),
    submit: byId(submitId),
  };
  return Object.values(nodes).every(Boolean) ? nodes : null;
}

function createVisibleHandlers({ name, email, phone }) {
  return {
    name: () => validateNameField(name, true),
    email: () => validateEmailEl(email, "E-Mail", { show: true }),
    phone: () => validatePhoneEl(phone, "Telefon", { show: true }),
  };
}

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

function createSilentValidator(nodes) {
  return () =>
    validateNameField(nodes.name, false) &&
    validateEmailEl(nodes.email, "E-Mail", { show: false }) &&
    validatePhoneEl(nodes.phone, "Telefon", { show: false });
}

function validateNameField(el, show) {
  const requiredOk = validateRequiredEl(el, "Name", { show });
  const lengthOk = validateMinLengthEl(el, 2, "Name", { show });
  return requiredOk && lengthOk;
}
