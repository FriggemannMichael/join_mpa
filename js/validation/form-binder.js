import { releaseSubmit } from "./validation-helpers.js";
import { logWarning } from "../common/logger.js";

/**
 * Encapsulates all field listeners and centrally controls the submit button.
 * @param {Object} cfg
 * @param {Array}  cfg.fields  [{ el, events, validateVisible }]
 * @param {HTMLButtonElement} cfg.submitBtn
 * @param {Function} cfg.validateAllSilent  Checks all fields without UI
 * @param {AbortSignal} cfg.signal  Optional abort signal for event listeners
 */
export function bindForm({ fields, submitBtn, validateAllSilent, signal }) {
  const listeners = [];

  fields.forEach((f) => {
    const { el, events, validateVisible } = f;
    if (!el) {
      logWarning("FormBinder", "Element is null, skip field binding");
      return;
    }
    events.forEach((evt) => {
      const handler = () => {
        validateVisible();
        updateSubmit();
      };
      const options = signal ? { signal } : {};
      el.addEventListener(evt, handler, options);
      if (!signal) {
        listeners.push({ el, evt, handler });
      }
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
      if (signal) return;
      listeners.forEach(({ el, evt, handler }) =>
        el.removeEventListener(evt, handler)
      );
    },
  };
}
