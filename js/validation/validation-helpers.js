// common/validation-helpers.js
const activeListeners = [];

export function releaseSubmit(btn, isValid) {
  if (!btn) return;
  btn.disabled = !isValid;
  btn.ariaDisabled = String(!isValid);
}

export function detachValidation() {
  activeListeners.forEach(({ el, evt, handler }) => {
    if (el) el.removeEventListener(evt, handler);
  });
  activeListeners.length = 0;
}
