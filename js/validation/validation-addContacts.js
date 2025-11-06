import { byId } from "./valdiation-ui.js";
import { bindForm } from "./form-binder.js";
import {
  validateRequiredEl,
  validateMinLengthEl,
  validateEmailEl,
  validatePhoneEl,
} from "./validation-fields.js";

/**
 * Initializes validation for the Add Contact form.
 * Validates name (required, min 2 chars), email (required, valid format), and phone (optional, min 3 if filled).
 * @returns {Object|null} Controller with updateSubmit and detach methods, or null if elements not found.
 */
export function initAddContactValidation() {
  const nameEl = byId("addContactName");
  const emailEl = byId("addContactEmail");
  const phoneEl = byId("addContactPhone");
  const submitBtn = byId("addContactSubmit");

  if (!nameEl || !emailEl || !phoneEl || !submitBtn) {
    console.warn("initAddContactValidation: Required elements not found");
    return null;
  }

  const showName = () => {
    const okReq = validateRequiredEl(nameEl, "Name", { show: true });
    const okLen = validateMinLengthEl(nameEl, 2, "Name", { show: true });
    return okReq && okLen;
  };

  const showEmail = () => validateEmailEl(emailEl, "E-Mail", { show: true });
  const showPhone = () => validatePhoneEl(phoneEl, "Telefon", { show: true });

  const validateAllSilent = () => {
    const okNameReq = validateRequiredEl(nameEl, "Name", { show: false });
    const okNameLen = validateMinLengthEl(nameEl, 2, "Name", { show: false });
    const okEmail = validateEmailEl(emailEl, "E-Mail", { show: false });
    const okPhone = validatePhoneEl(phoneEl, "Telefon", { show: false });
    return okNameReq && okNameLen && okEmail && okPhone;
  };

  return bindForm({
    submitBtn,
    validateAllSilent,
    fields: [
      { el: nameEl, events: ["blur", "input"], validateVisible: showName },
      { el: emailEl, events: ["blur"], validateVisible: showEmail },
      { el: phoneEl, events: ["blur"], validateVisible: showPhone },
    ],
  });
}

/**
 * Initializes validation for the Edit Contact form.
 * Same validation rules as Add Contact.
 * @returns {Object|null} Controller with updateSubmit and detach methods, or null if elements not found.
 */
export function initEditContactValidation() {
  const nameEl = byId("contactName");
  const emailEl = byId("contactEmail");
  const phoneEl = byId("contactPhone");
  const submitBtn = byId("contactSaveBtn");

  if (!nameEl || !emailEl || !phoneEl || !submitBtn) {
    console.warn("initEditContactValidation: Required elements not found");
    return null;
  }

  const showName = () => {
    const okReq = validateRequiredEl(nameEl, "Name", { show: true });
    const okLen = validateMinLengthEl(nameEl, 2, "Name", { show: true });
    return okReq && okLen;
  };

  const showEmail = () => validateEmailEl(emailEl, "E-Mail", { show: true });
  const showPhone = () => validatePhoneEl(phoneEl, "Telefon", { show: true });

  const validateAllSilent = () => {
    const okNameReq = validateRequiredEl(nameEl, "Name", { show: false });
    const okNameLen = validateMinLengthEl(nameEl, 2, "Name", { show: false });
    const okEmail = validateEmailEl(emailEl, "E-Mail", { show: false });
    const okPhone = validatePhoneEl(phoneEl, "Telefon", { show: false });
    return okNameReq && okNameLen && okEmail && okPhone;
  };

  return bindForm({
    submitBtn,
    validateAllSilent,
    fields: [
      { el: nameEl, events: ["blur", "input"], validateVisible: showName },
      { el: emailEl, events: ["blur"], validateVisible: showEmail },
      { el: phoneEl, events: ["blur"], validateVisible: showPhone },
    ],
  });
}
