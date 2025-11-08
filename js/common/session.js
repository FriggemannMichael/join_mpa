import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const GUEST_KEY = "join_guest_session";
let guestSession = loadGuestSession();
let authReadyResolved = false;
let resolveAuthReady;
export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});


/**
 * Loads the guest session data from session storage.
 * Safely parses the stored JSON and returns `null` if no valid data is found.
 *
 * @returns {?Object} The parsed guest session object, or `null` if unavailable or invalid.
 */
function loadGuestSession() {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


/**
 * Saves or clears the guest session data in session storage.
 * Updates the in-memory reference and synchronizes it with storage.
 *
 * @param {?Object} data - The guest session data to save, or `null` to clear the session.
 * @returns {void} Nothing is returned; updates session state and storage.
 */
function saveGuestSession(data) {
  guestSession = data;
  if (!data) sessionStorage.removeItem(GUEST_KEY);
  else sessionStorage.setItem(GUEST_KEY, JSON.stringify(data));
}


/**
 * Retrieves the currently active user.
 * Returns the guest session if active, otherwise the authenticated Firebase user.
 *
 * @returns {?Object} The active user object, or `null` if no user is logged in.
 */
export function getActiveUser() {
  if (guestSession) return guestSession;
  return auth.currentUser || null;
}


/**
 * Starts a new guest user session.
 * Saves a temporary guest profile to session storage and triggers an auth change event.
 *
 * @returns {void} Nothing is returned; initializes a guest session and updates the auth state.
 */
export function startGuestSession() {
  saveGuestSession({
    uid: "guest-user",
    displayName: "Guest User",
    email: "guest@example.com",
    provider: "guest",
  });
  dispatchAuthEvent();
}


/**
 * Ends the current user session and signs out from authentication.
 * Clears any active guest session, attempts to sign out, and dispatches an auth change event.
 *
 * @async
 * @returns {Promise<void>} Resolves when the session is fully terminated.
 */
export async function endSession() {
  saveGuestSession(null);
  try {
    await signOut(auth);
  } catch {}
  dispatchAuthEvent();
}


/**
 * Dispatches a global authentication change event.
 * Emits a custom "auth-changed" event with the current user and finalizes the auth ready state.
 *
 * @fires window#auth-changed
 * @returns {void} Nothing is returned; notifies listeners of authentication changes.
 */
export function dispatchAuthEvent() {
  window.dispatchEvent(
    new CustomEvent("auth-changed", { detail: { user: getActiveUser() } })
  );
  finalizeAuthReady();
}


/**
 * Handles changes in authentication state.
 * Clears any active guest session when a real user logs in and dispatches an auth update event.
 *
 * @param {?Object} user - The current authenticated user object, or `null` if logged out.
 * @returns {void} Nothing is returned; triggers side effects based on auth state.
 */
function handleAuthChange(user) {
  if (user && guestSession) saveGuestSession(null);
  dispatchAuthEvent();
}

onAuthStateChanged(auth, handleAuthChange);


/**
 * Marks the authentication system as ready and resolves pending initialization.
 * Ensures the ready state is only resolved once.
 *
 * @returns {void} Nothing is returned; updates internal state and triggers resolution.
 */
function finalizeAuthReady() {
  if (authReadyResolved) return;
  authReadyResolved = true;
  resolveAuthReady();
}
