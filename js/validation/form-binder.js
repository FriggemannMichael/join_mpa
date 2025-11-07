import { releaseSubmit } from "./validation-helpers.js";

/**
 * Encapsulates all field listeners and centrally controls the submit button.
 * @param {Object} cfg
 * @param {Array}  cfg.fields  [{ el, events, validateVisible }]
 * @param {HTMLButtonElement} cfg.submitBtn
 * @param {Function} cfg.validateAllSilent  Checks all fields without UI
 */
export function bindForm({ fields, submitBtn, validateAllSilent }) {
  const listeners = [];

  fields.forEach(f => {
    const { el, events, validateVisible } = f;
    if (!el) {
      console.warn("bindForm: Element is null, skip field binding");
      return;
    }
    events.forEach((evt) => {
      const handler = () => {
        validateVisible();  
        updateSubmit();    
      };
      el.addEventListener(evt, handler);
      listeners.push({ el, evt, handler });
    });
  });

  function updateSubmit() {
    const ok = validateAllSilent();
    releaseSubmit(submitBtn, ok);
    return ok;
  }

  updateSubmit();

  return {
    updateSubmit,
    detach() {
      listeners.forEach(({ el, evt, handler }) =>
        el.removeEventListener(evt, handler)
      );
    },
  };
}
