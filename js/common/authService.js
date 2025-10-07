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

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  dispatchAuthEvent();
  return cred.user;
}

export async function registerUser(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  dispatchAuthEvent();
  return cred.user;
}

export async function logout() {
  await endSession();
}

export function onAuthChange(listener) {
  window.addEventListener("auth-changed", ({ detail }) => listener(detail));
}

export function ensureAuthenticated(redirectUrl) {
  const user = getActiveUser();
  if (user) return user;
  if (redirectUrl) window.location.href = redirectUrl;
  return null;
}

export function readAuthError(err) {
  return mapFirebaseError(err);
}

export function getInitials(user) {
  if (!user) return "GU";
  if (user.displayName) return buildInitials(user.displayName);
  if (user.email) return user.email[0].toUpperCase();
  return "US";
}

function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}
