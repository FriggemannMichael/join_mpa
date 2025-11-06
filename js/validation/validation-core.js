import { toggleError } from "./valdiation-ui.js";

/**
 * Zeigt Fehler nur, wenn show === true
 * Sonst prüft nur still und gibt boolean zurück.
 */
export function report(el, ok, msg, { show = false } = {}) {
  if (show) return toggleError(el, ok, ok ? "" : msg);
  return ok;
}

export const rules = {
  required: (value) => value.trim().length > 0,
  minLen: (value, min) => value.trim().length >= min,
  dateNotPast: (value) => {
    if (!value) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(value); d.setHours(0,0,0,0);
    return d >= today;
  },
};
