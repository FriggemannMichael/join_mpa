/**
 * Firebase Authentication Service for login, registration and user management
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
 * Logs in a user with email and password via Firebase
 * @param {string} email User's email address
 * @param {string} password User's password
 * @returns {Promise<Object>} Firebase user object
 */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  dispatchAuthEvent();
  return cred.user;
}

/**
 * Registers a new user with Firebase Authentication
 * @param {string} name User's display name
 * @param {string} email User's email address
 * @param {string} password User's password
 * @returns {Promise<Object>} Firebase user object
 */
export async function registerUser(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  dispatchAuthEvent();
  return cred.user;
}

/**
 * Logs out the current user and ends the session
 * @returns {Promise<void>}
 */
export async function logout() {
  await endSession();
}

/**
 * Registers a listener for auth status changes
 * @param {Function} listener Callback function for auth changes
 */
export function onAuthChange(listener) {
  window.addEventListener("auth-changed", ({ detail }) => listener(detail));
}

/**
 * Checks authentication and redirects if necessary
 * @param {string} redirectUrl URL to redirect to if authentication is missing
 * @returns {Object|null} User object or null
 */
export function ensureAuthenticated(redirectUrl) {
  const user = getActiveUser();
  if (user) return user;
  if (redirectUrl) window.location.href = redirectUrl;
  return null;
}

/**
 * Converts Firebase errors into readable error messages
 * @param {Error} err Firebase error object
 * @returns {string} User-friendly error message
 */
export function readAuthError(err) {
  return mapFirebaseError(err);
}

/**
 * Creates initials from user data for profile display
 * @param {Object|null} user Firebase user object
 * @returns {string} Initials (e.g. "JD" or "GU" for Guest)
 */
export function getInitials(user) {
  if (!user) return "GU";
  if (user.displayName) return buildInitials(user.displayName);
  if (user.email) return user.email[0].toUpperCase();
  return "US";
}

/**
 * Creates initials from a name (maximum 2 letters)
 * @param {string} name User's full name
 * @returns {string} Initials (e.g. "John Doe" → "JD")
 */
function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}
