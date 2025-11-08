import { initAddTask } from "../modals/addTaskModal.js";
import { ScrollLock, clearModal } from "../utils.js";

/**
 * Binds keyboard shortcuts for board columns.
 */
export function bindColumnShortcuts() {
  document.addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handleShortcutKeydown);
}

/**
 * Handles overlay clicks for open and close triggers.
 * @param {MouseEvent} event
 */
async function handleOverlayClick(event) {
  if (await processOverlayOpen(event)) return;
  await processOverlayClose(event);
}

/**
 * Processes open triggers on overlay clicks.
 * @param {MouseEvent} event
 * @returns {Promise<boolean>}
 */
async function processOverlayOpen(event) {
  const trigger = event.target.closest("[data-overlay-open]");
  if (!trigger) return false;
  if (trigger.dataset.overlayOpen === "#addTaskOverlay") await initAddTask();
  const targets = getOverlayTargets();
  if (!targets) return false;
  targets.overlay.classList.add("active");
  return true;
}

/**
 * Resolves overlay and modal elements.
 * @returns {{overlay:HTMLElement, modal:HTMLElement}|null}
 */
function getOverlayTargets() {
  const overlay = document.querySelector("#taskOverlay");
  const modal = document.querySelector("#taskModal");
  if (!overlay || !modal) return null;
  return { overlay, modal };
}

/**
 * Processes overlay close interactions.
 * @param {MouseEvent} event
 */
async function processOverlayClose(event) {
  if (!event.target.classList.contains("backdrop_overlay")) return;
  const overlay = document.querySelector("#taskOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  ScrollLock.release();
  await clearModal();
}

/**
 * Handles keyboard shortcuts for overlays.
 * @param {KeyboardEvent} event
 */
function handleShortcutKeydown(event) {
  if (event.key === "Escape") {
    closeActiveOverlay();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    handleKeyboardActivation(event);
  }
}

/**
 * Closes active overlay on Escape.
 */
function closeActiveOverlay() {
  const overlay = document.querySelector("#taskOverlay");
  if (!overlay?.classList.contains("active")) return;
  overlay.classList.remove("active");
  clearModal();
}

/**
 * Executes keyboard-triggered actions.
 * @param {KeyboardEvent} event
 */
function handleKeyboardActivation(event) {
  const trigger = event.target.closest("[data-overlay-open],[data-overlay-close]");
  if (!trigger) return;
  event.preventDefault();
  trigger.click();
}
