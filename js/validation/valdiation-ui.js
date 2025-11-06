// common/validation-ui.js
export const byId = (id) => document.getElementById(id);

export function showError(inputElement, message) {
  if (!inputElement) return;
  const host = inputElement.parentElement || inputElement;
  let faultMsg = host.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    host.appendChild(faultMsg);
  }
  faultMsg.textContent = message;
  faultMsg.classList.add("visible");
  inputElement.classList.add("input-fault");
}

export function clearError(inputElement) {
  if (!inputElement) return;
  inputElement.classList.remove("input-fault");
  const host = inputElement.parentElement || inputElement;
  const faultMsg = host.querySelector(".field-fault-msg");
  if (faultMsg) faultMsg.classList.remove("visible");
}

export function toggleError(inputElement, isValid, message) {
  isValid ? clearError(inputElement) : showError(inputElement, message);
  return isValid;
}
