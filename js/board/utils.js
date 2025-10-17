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
  const colors = [
    "#FF6B6B",
    "#00B8D4",
    "#1DE9B6",
    "#00CFAE",
    "#00BCD4",
    "#2196F3",
    "#3D5AFE",
    "#7C4DFF",
    "#AB47BC",
    "#E040FB",
  ];
  const charCode = initials.charCodeAt(0);
  return colors[charCode % colors.length];
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