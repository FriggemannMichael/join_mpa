import { closeTaskOverlay, ScrollLock } from "../utils.js";
import { handleOutsideDropdownClick } from "../../pages/add-task-assignees.js";
import { openEditForm } from "./editTask.js";
import { deleteTask } from "../services/tasks.repo.js";
import { confirmModal } from "../modals/confirmModal.js"


/**
 * Attaches event listeners for the task modal overlay and content section.
 * Handles backdrop clicks, Escape key, and section clicks.
 *
 * @param {HTMLElement} overlay - The modal overlay element.
 * @param {HTMLElement} section - The modal content section.
 * @returns {void}
 */
export function taskModalEventlistener(overlay, section) {
  if (!overlay) return;
  setupOverlayEvents(overlay, section);
  setupSectionClick(section);
  overlay.classList.add("active");
}


/**
 * Binds backdrop and keyboard events if not already bound.
 * @param {HTMLElement} overlay
 * @param {HTMLElement} section
 */
function setupOverlayEvents(overlay, section) {
  if (overlay.dataset.bound) return;
  const backdrop = overlay.querySelector(".backdrop_overlay");
  const onBackdropClick = (e) =>
    (e.target === overlay || e.target === backdrop) && closeTaskOverlay();
  const onKeydown = (e) => e.key === "Escape" && closeTaskOverlay();
  bindOverlayEvents(overlay, section, onBackdropClick, onKeydown);
}


/**
 * Ensures the section has its click handler attached once.
 * @param {HTMLElement} section
 */
function setupSectionClick(section) {
  if (section._handler) return;
  section._handler = handleSectionClick;
  section.addEventListener("click", section._handler);
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