import { closeTaskOverlay, ScrollLock } from "./utils.js";
import { handleOutsideDropdownClick } from "../pages/add-task.js";
import { openEditForm } from "./editTask.js";           
import { deleteTask } from "./tasks.repo.js";           
import { confirmModal } from "./confirmModal.js";


/**
 * Initializes event listeners for the task modal overlay.
 * Handles backdrop clicks, Escape key presses, and section interactions.
 * @param {HTMLElement} overlay - The overlay element containing the modal.
 * @param {HTMLElement} section - The modal content section.
 * @returns {void}
 */
export function taskModalEventlistener(overlay, section) {
  if (!overlay) return;
  const backdrop = overlay.querySelector(".backdrop_overlay");

  if (!overlay.dataset.bound) {
    const onBackdropClick = (e) => {
      if (e.target === overlay || e.target === backdrop) closeTaskOverlay();
    };
    const onKeydown = (e) => { if (e.key === "Escape") closeTaskOverlay(); };
    bindOverlayEvents(overlay, section, onBackdropClick, onKeydown);
  }

  if (!section._handler) {
    section._handler = handleSectionClick;
    section.addEventListener("click", section._handler);
  }

  overlay.classList.add("active");
}


/**
 * Binds click and keydown events for the task modal overlay.
 * Also defines a cleanup method to remove listeners and restore scroll.
 * @param {HTMLElement} overlay - The overlay element containing the modal.
 * @param {HTMLElement} section - The modal content section element.
 * @param {Function} onBackdropClick - Handler for backdrop click events.
 * @param {Function} onKeydown - Handler for Escape key events.
 * @returns {void}
 */
function bindOverlayEvents(overlay, section, onBackdropClick, onKeydown) {
  overlay.addEventListener("click", onBackdropClick);
  document.addEventListener("keydown", onKeydown);
  overlay.dataset.bound = "1";

  overlay.cleanup = () => {
    overlay.removeEventListener("click", onBackdropClick);
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", handleOutsideDropdownClick);
    if (section?._handler) section.removeEventListener("click", section._handler);
    delete overlay.dataset.bound;
    delete section._handler;
    ScrollLock.release();
  };
}


/**
 * Handles click events inside the task modal section.
 * Triggers edit or delete actions based on the clicked button.
 * @param {MouseEvent} e - The click event object.
 * @returns {void}
 */
function handleSectionClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { action, taskId } = btn.dataset;
  if (action === "edit") return openEditForm(taskId);
  if (action === "delete") {
    confirmModal("Are you sure you want to delete this task?", () => {
      deleteTask(taskId);
    });
  }
}