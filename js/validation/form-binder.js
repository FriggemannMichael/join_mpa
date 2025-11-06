import { releaseSubmit } from "./validation-helpers.js";

/**
 * Kapselt alle Feld-Listener und steuert zentral den Submit-Button.
 * @param {Object} cfg
 * @param {Array}  cfg.fields  [{ el, events, validateVisible }]
 * @param {HTMLButtonElement} cfg.submitBtn
 * @param {Function} cfg.validateAllSilent  Prüft alle Felder ohne UI
 */
export function bindForm({ fields, submitBtn, validateAllSilent }) {
  const listeners = [];

  fields.forEach(f => {
    const { el, events, validateVisible } = f;
    events.forEach(evt => {
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
      listeners.forEach(({ el, evt, handler }) => el.removeEventListener(evt, handler));
    },
  };
}
