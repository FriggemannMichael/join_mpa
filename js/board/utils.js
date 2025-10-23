import { db, auth } from "../common/firebase.js";
import { ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

export async function loadTask(id) {
  const root = ref(db);
  const snap = await get(child(root, `tasks/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}

export function getCurrentUser() {
  const user = auth.currentUser;
  return user ? { id: user.uid, name: user.displayName, email: user.email } : null;
}

export function colorFromString(str) {
  if (!str) return "#999";

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}


export const ScrollLock = (() => {
  let y = 0;

  function lock() {
    y = window.scrollY || 0;
    const b = document.body;

    b.style.position = "fixed";
    b.style.top = `-${y}px`;
    b.style.left = "0";
    b.style.right = "0";
    b.style.overflow = "hidden";

  }

  function unlock() {
    const b = document.body;
    b.style.overflow = "";
    b.style.position = "";
    b.style.top = "";
    b.style.left = "";
    b.style.right = "";


    window.scrollTo(0, y);
  }

  return { set: lock, release: unlock };
})();


// später ersetzen 


/**
 * Generiert eine Farbe basierend auf Initialen
 */

export function getColorForInitials(initials) {
  return colorFromString(initials);
}

/**
 * Extrahiert Initialen aus einem Namen
 */
export function getInitials(name) {
  if (!name) return "??";
  const cleanName = name.replace(/\s*\(Du\)\s*$/i, "").trim();
  const parts = cleanName.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Setzt den Task-Status
 */
export function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

export function closeTaskOverlay() {
  const overlay = document.getElementById("taskOverlay");
  if (!overlay) return;

  overlay.classList.remove("active");
  overlay.cleanup?.();
  delete overlay.cleanup; 
  clearModal();
  ScrollLock.release?.(); 
}

export function clearModal(delay = 300) {
  const section = document.getElementById("taskModal");
  if (!section) return;

  ScrollLock.release()

  setTimeout(() => {
    section.innerHTML = "";
    [...section.attributes].forEach(attr => {
      if (attr.name !== "id") section.removeAttribute(attr.name);
    });
  }, delay);
}