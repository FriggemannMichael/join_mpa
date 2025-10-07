/**
 * Page Guard Service für Authentication-basierte Zugriffskontrolle
 * @module pageGuard
 */

import { authReady, getActiveUser } from "./authService.js";

/**
 * Schützt eine Seite vor unauthentifizierten Zugriffen
 * @param {string} redirect URL für Weiterleitung bei fehlender Auth
 * @returns {Promise<boolean>} True wenn User authentifiziert ist
 */
export async function guardPage(redirect) {
  await authReady;
  const user = getActiveUser();
  if (user) return true;
  if (redirect) window.location.href = redirect;
  return false;
}

/**
 * Leitet authentifizierte User zu einer Zielseite weiter
 * @param {string} target Ziel-URL für Weiterleitung
 */
export async function redirectIfAuthenticated(target) {
  await authReady;
  if (getActiveUser()) window.location.href = target;
}
