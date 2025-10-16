import { db, auth } from "../common/firebase.js";
import { ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

export function initialsFrom(str = "") {
  const s = String(str).trim();
  if (!s) return "?";
  const parts = s.split(/\s+/);
  const ini = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (ini || s[0]).toUpperCase();
}

export async function loadTask(id) {
  const root = ref(db);
  const snap = await get(child(root, `tasks/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}

export function getCurrentUser() {
  const user = auth.currentUser;
  return user ? { id: user.uid, name: user.displayName, email: user.email } : null;
}
