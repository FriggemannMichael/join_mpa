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

function loadGuestSession() {
  try {
    const raw = sessionStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveGuestSession(data) {
  guestSession = data;
  if (!data) sessionStorage.removeItem(GUEST_KEY);
  else sessionStorage.setItem(GUEST_KEY, JSON.stringify(data));
}

export function getActiveUser() {
  if (guestSession) return guestSession;
  return auth.currentUser || null;
}

export function startGuestSession() {
  saveGuestSession({
    uid: "guest-user",
    displayName: "Guest User",
    email: "guest@example.com",
    provider: "guest",
  });
  dispatchAuthEvent();
}

export async function endSession() {
  saveGuestSession(null);
  try {
    await signOut(auth);
  } catch {}
  dispatchAuthEvent();
}

export function dispatchAuthEvent() {
  window.dispatchEvent(
    new CustomEvent("auth-changed", { detail: { user: getActiveUser() } })
  );
  finalizeAuthReady();
}

function handleAuthChange(user) {
  if (user && guestSession) saveGuestSession(null);
  dispatchAuthEvent();
}

onAuthStateChanged(auth, handleAuthChange);

function finalizeAuthReady() {
  if (authReadyResolved) return;
  authReadyResolved = true;
  resolveAuthReady();
}
