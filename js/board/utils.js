import { auth, db } from "../common/firebase.js";
import { getActiveUser } from "../common/session.js";
import { icons } from "../common/svg-template.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import {unmountAddTaskValidation} from "../validation/validation-addTask.js"


/**
 * Returns the currently authenticated user.
 * @returns {{id: string, name: string, email: string} | null} User object if logged in, otherwise null.
 */
export function getCurrentUser() {
  const user = getActiveUser();
  return user
    ? { id: user.uid, name: user.displayName, email: user.email }
    : null;
}

/**
 * Generates a visually distinct and stable HSL color from a given string.
 * Useful for assigning consistent avatar or label colors based on names.
 * The algorithm multiplies character codes by small primes to spread hues evenly.
 * @param {string} str - The input string used to derive the color (e.g. a name).
 * @returns {string} An HSL color string (e.g. "hsl(210, 68%, 50%)").
 */
export function colorFromString(str) {
  if (!str) return "#999";
  const clean = str.trim().toLowerCase();
  const primes = [2, 3, 5, 7, 11, 13, 17];

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash += clean.charCodeAt(i) * primes[i % primes.length];
  }

  const hue = Math.abs(hash) % 360;

  const sat = 60 + (hash % 20);

  let light = 35 + ((hash >> 3) % 25);

  light = Math.max(35, Math.min(60, light));

  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/**
 * Utility for locking and restoring page scroll.
 * Used to prevent background scrolling when modals are open.
 * @namespace ScrollLock
 * @property {Function} set - Locks the current scroll position.
 * @property {Function} release - Restores the previous scroll position.
 */
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
 * Returns uppercase initials from a given name string.
 * Falls back to "??" if the name is missing.
 * @param {string} name - The full name to extract initials from.
 * @returns {string} Two-letter initials, or "??" if invalid.
 */
export function getInitials(name) {
  if (!name) return "??";
  const cleanName = name.replace(/\s*\(Du\)\s*$/i, "").trim();
  const parts = cleanName.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Updates the task status message in the UI.
 * @param {string} message - Text to display in the status element.
 * @param {boolean} [isError=false] - If true, applies error styling.
 * @returns {void}
 */
export function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Closes the task overlay and resets the UI.
 * Runs cleanup if defined and unlocks page scroll.
 * @returns {void}
 */
export function closeTaskOverlay() {
  const overlay = document.getElementById("taskOverlay");
  if (!overlay) return;

  overlay.classList.remove("active");
  overlay.cleanup?.();
  delete overlay.cleanup;
  clearModal();
  ScrollLock.release?.();
  unmountAddTaskValidation()
}

/**
 * Clears the task modal after a short delay.
 * Removes all content and attributes except the ID.
 * @param {number} [delay=300] - Delay before clearing in milliseconds.
 * @returns {void}
 */
export function clearModal(delay = 300) {
  const section = document.getElementById("taskModal");
  if (!section) return;

  ScrollLock.release();

  setTimeout(() => {
    section.innerHTML = "";
    [...section.attributes].forEach((attr) => {
      if (attr.name !== "id") section.removeAttribute(attr.name);
    });
  }, delay);
}

/**
 * Shows board-specific alert and optionally closes task overlay.
 * Wraps the global showAlert with board-specific behavior.
 *
 * @param {string} type - Alert type.
 * @param {number} [ms=1800] - Duration in milliseconds.
 * @returns {void}
 */
export function showBoardAlert(type, ms = 1800) {
  if (type === "created") {
    showAlert(type, ms, null, () => closeTaskOverlay?.());
  } else {
    showAlert(type, ms);
  }
}

/**
 * Formats a given date string into DD/MM/YYYY (en-GB) format.
 * Returns "—" if the date is missing or invalid.
 * @param {string|Date} dueDate - The date to format.
 * @returns {string} Formatted date or "—" if invalid.
 */
export function formatDate(dueDate) {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Enables or disables all buttons inside the given root element.
 * Also toggles a "loading" class on the body to indicate a busy state.
 * @param {boolean} state - Whether buttons should be disabled (true) or enabled (false).
 * @param {HTMLElement} [root=document.body] - The root element containing the buttons.
 * @returns {void}
 */
export function setGlobalButtonsDisabled(state, root = document.body) {
  root.querySelectorAll("button").forEach((btn) => {
    btn.disabled = state;
  });

  document.body.classList.toggle("loading", state);
}

/**
 * Updates the status of a task in the database.
 * Sets the new status and updates the timestamp.
 * @async
 * @param {string} taskId - The ID of the task to update.
 * @param {string} newStatus - The new status value for the task.
 * @returns {Promise<void>}
 */
export async function updateTaskStatus(taskId, newStatus) {
  const taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, { status: newStatus, updatedAt: Date.now() });
}
