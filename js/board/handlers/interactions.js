import { initAddTask } from "../modals/addTaskModal.js"; 
import { ScrollLock, clearModal } from "../utils.js";

/**
 * Binds global click and keyboard shortcuts for board overlays.
 * Handles opening of modals (e.g., Add Task), closing via backdrop or Escape key,
 * and keyboard accessibility for interactive overlay elements.
 * @async
 * @returns {Promise<void>}
 */
export function bindColumnShortcuts() {
  const onClick = async (e) => {
    const openBtn = e.target.closest("[data-overlay-open]");
    if (openBtn) {
      const selector = openBtn.dataset.overlayOpen;
      const overlay = document.querySelector("#taskOverlay");
      const modal = document.querySelector("#taskModal");

      if (selector === "#addTaskOverlay") {
        await initAddTask();
      }

      if (!overlay || !modal) return;
      overlay.classList.add("active");
      return;
    }

    // === Schließen-Handling ===

    const isBackdrop = e.target.classList.contains("backdrop_overlay");

    if (isBackdrop) {
      const overlay = document.querySelector("#taskOverlay");
      if (overlay) {
        overlay.classList.remove("active");
        ScrollLock.release()

        await clearModal()
      }
      return;
    }
  };

  const onKeydown = (e) => {
    if (e.key === "Escape") {
      const overlay = document.querySelector("#taskOverlay");
      if (overlay?.classList.contains("active")) {
        overlay.classList.remove("active");
        clearModal();
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      const kb = e.target.closest("[data-overlay-open],[data-overlay-close]");
      if (kb) {
        e.preventDefault();
        kb.click();
      }
    }
  };

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
}


