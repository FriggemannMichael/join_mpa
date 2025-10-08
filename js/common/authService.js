/**
 * Firebase Authentication Service für Login, Registrierung und User-Management
 * @module authService
 */

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { mapFirebaseError } from "./errorMap.js";
import {
  getActiveUser,
  startGuestSession,
  endSession,
  dispatchAuthEvent,
  authReady,
} from "./session.js";

export { getActiveUser, startGuestSession as startGuest, authReady };

/**
 * Meldet einen User mit E-Mail und Passwort bei Firebase an
 * @param {string} email E-Mail-Adresse des Users
 * @param {string} password Passwort des Users
 * @returns {Promise<Object>} Firebase User-Objekt
 */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  dispatchAuthEvent();
  return cred.user;
}

/**
 * Registriert einen neuen User bei Firebase Authentication
 * @param {string} name Anzeigename des Users
 * @param {string} email E-Mail-Adresse des Users
 * @param {string} password Passwort des Users
 * @returns {Promise<Object>} Firebase User-Objekt
 */
export async function registerUser(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  dispatchAuthEvent();
  return cred.user;
}

/**
 * Meldet den aktuellen User ab und beendet die Session
 * @returns {Promise<void>}
 */
export async function logout() {
  await endSession();
}

/**
 * Registriert einen Listener für Auth-Status-Änderungen
 * @param {Function} listener Callback-Funktion für Auth-Änderungen
 */
export function onAuthChange(listener) {
  window.addEventListener("auth-changed", ({ detail }) => listener(detail));
}

/**
 * Prüft Authentication und leitet bei Bedarf weiter
 * @param {string} redirectUrl URL für Weiterleitung bei fehlender Auth
 * @returns {Object|null} User-Objekt oder null
 */
export function ensureAuthenticated(redirectUrl) {
  const user = getActiveUser();
  if (user) return user;
  if (redirectUrl) window.location.href = redirectUrl;
  return null;
}

/**
 * Konvertiert Firebase-Fehler in lesbare Fehlermeldungen
 * @param {Error} err Firebase-Fehler-Objekt
 * @returns {string} Benutzerfreundliche Fehlermeldung
 */
export function readAuthError(err) {
  return mapFirebaseError(err);
}

/**
 * Erstellt Initialen aus User-Daten für Profildarstellung
 * @param {Object|null} user Firebase User-Objekt
 * @returns {string} Initialen (z.B. "JD" oder "GU" für Guest)
 */
export function getInitials(user) {
  if (!user) return "GU";
  if (user.displayName) return buildInitials(user.displayName);
  if (user.email) return user.email[0].toUpperCase();
  return "US";
}

/**
 * Erstellt Initialen aus einem Namen (maximal 2 Buchstaben)
 * @param {string} name Vollständiger Name des Users
 * @returns {string} Initialen (z.B. "John Doe" → "JD")
 */
function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}
