import { closeTaskOverlay, ScrollLock } from "./utils.js";
import { handleOutsideDropdownClick } from "../pages/add-task.js";
import { openEditForm } from "./editTask.js";           
import { deleteTask } from "./tasks.repo.js";           
import { confirmModal } from "./confirmModal.js";


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