// common/form-binder.js
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

  // pro Feld: Sichtbare Validierung + Button-State
  fields.forEach((f) => {
    const { el, events, validateVisible } = f;
    if (!el) {
      console.warn("bindForm: Element ist null, überspringe Feld-Binding");
      return;
    }
    events.forEach((evt) => {
      const handler = () => {
        validateVisible(); // zeigt Fehler für dieses Feld
        updateSubmit(); // prüft alles silent
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

  // initial (silent)
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
