
/**
 * Displays a simple confirmation modal with Cancel and Confirm buttons.
 *
 * @param {string} [message="Are you sure?"] - Confirmation message.
 * @param {() => void} [onConfirm] - Callback executed when confirmed.
 * @returns {void}
 */
export function confirmModal(message = "Are you sure?", onConfirm) {
  const overlay = createModalOverlay();
  const modal = buildModalBox(message);
  overlay.append(modal);
  document.body.append(overlay);
  bindConfirmModalEvents(modal, overlay, onConfirm);
}

/**
 * Creates the modal overlay container.
 * @returns {HTMLDivElement}
 */
function createModalOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "modal_overlay";
  return overlay;
}

/**
 * Builds the modal content box with message and buttons.
 * @param {string} message - Message to display.
 * @returns {HTMLDivElement}
 */
function buildModalBox(message) {
  const modal = document.createElement("div");
  modal.className = "modal_box";
  modal.innerHTML = `
    <p class="modal_message">${message}</p>
    <div class="modal_actions">
      <button class="btn_cancel">Cancel</button>
      <button class="btn_confirm">Delete</button>
    </div>`;
  return modal;
}

/**
 * Binds event handlers for cancel and confirm buttons.
 * @param {HTMLElement} modal
 * @param {HTMLElement} overlay
 * @param {() => void} [onConfirm]
 */
function bindConfirmModalEvents(modal, overlay, onConfirm) {
  modal.querySelector(".btn_cancel")?.addEventListener("click", () => overlay.remove());
  modal.querySelector(".btn_confirm")?.addEventListener("click", () => {
    overlay.remove();
    onConfirm?.();
  });
}

