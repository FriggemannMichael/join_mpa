import { byId } from "./valdiation-ui.js";
import { attachValidationByIds } from "./validation.helpers.js";
import { validateRequiredEl, validateMinLengthEl, validateEmailEl, validatePhoneEl } from "./validation-fields.js";

export function validateAddContact() {
  const nameEl  = byId("addContactName");
  const emailEl = byId("addContactEmail");
  const phoneEl = byId("addContactPhone");

  const okNameReq = validateRequiredEl(nameEl, "Name");
  const okNameLen = validateMinLengthEl(nameEl, 2, "Name");

  const okEmail = validateEmailEl(emailEl, "E-Mail");
  const okPhone = validatePhoneEl(phoneEl, "Telefon");

  return okNameReq && okNameLen && okEmail && okPhone;
}

export function bindAddContactValidation(containerEl = document, submitButtonId = "addContactSubmit") {
  const submitBtn = document.getElementById(submitButtonId);
  const idsToWatch = ["addContactName", "addContactEmail", "addContactPhone"];
  attachValidationByIds(containerEl, submitBtn, validateAddContact, idsToWatch);
}
