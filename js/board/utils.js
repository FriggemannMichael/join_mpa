import { auth } from "../common/firebase.js";
import { icons } from "../common/svg-template.js";



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


export function showAlert(type, ms = 1800) {
  const alert = document.createElement('div');
  alert.className = 'alert task-added';
  document.body.append(alert);

  const texts = {
    created: `Task added to board ${icons.board} `,
    updated: 'Task updated successfully',
    deleted: 'Task deleted from board',
    signUp: 'You Signed Up successfully',
    createContact: 'Contact successfully created'
  };

  alert.innerHTML = texts[type];
  if (type === 'created') alert.classList.add('center');

  requestAnimationFrame(() => alert.classList.add('visible'));

  clearTimeout(alert.t);
  alert.t = setTimeout(() => {
    alert.classList.remove('visible', 'center');
    alert.remove();
    if (type === 'created') closeTaskOverlay?.();
  }, ms);
}


export function formatDate(dueDate) {
  if (!dueDate) return "—";                      
  const d = new Date(dueDate);
  if (isNaN(d)) return "—";                      
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}