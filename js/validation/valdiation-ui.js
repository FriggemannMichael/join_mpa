export const byId = (id) => document.getElementById(id);

export function showError(inputElement, message) {
  if (!inputElement) return;
  const host =
    inputElement.closest?.(".inputField__container, .form-group") ||
    inputElement.parentElement ||
    inputElement;

  let faultMsg = host.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    host.appendChild(faultMsg);
  }
  faultMsg.textContent = message;
  faultMsg.classList.add("visible");

  host.classList.add("input-fault");
  inputElement.classList.add("input-fault");

  // Special handling for category dropdown
  const categoryHeader = host.querySelector(".category-select-header");
  if (categoryHeader) {
    categoryHeader.classList.add("input-fault");
  }
}

export function clearError(inputElement) {
  if (!inputElement) return;
  const host =
    inputElement.closest?.(".inputField__container, .form-group") ||
    inputElement.parentElement ||
    inputElement;

  inputElement.classList.remove("input-fault");
  host.classList.remove("input-fault");

  const faultMsg = host.querySelector(".field-fault-msg");
  if (faultMsg) faultMsg.classList.remove("visible");

  // Special handling for category dropdown
  const categoryHeader = host.querySelector(".category-select-header");
  if (categoryHeader) {
    categoryHeader.classList.remove("input-fault");
  }
}

export function toggleError(inputElement, isValid, message) {
  isValid ? clearError(inputElement) : showError(inputElement, message);
  return isValid;
}
