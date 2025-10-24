export function confirmModal(message = "Are you sure?", onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "modal_overlay";

  const modal = document.createElement("div");
  modal.className = "modal_box";

  modal.innerHTML = `
    <p class="modal_message">${message}</p>
    <div class="modal_actions">
      <button class="btn_cancel">Cancel</button>
      <button class="btn_confirm">Delete</button>
    </div>
  `;

  overlay.append(modal);
  document.body.append(overlay);
  modal.querySelector(".btn_cancel").addEventListener("click", () => overlay.remove());
  modal.querySelector(".btn_confirm").addEventListener("click", () => {
    overlay.remove();
    onConfirm?.();
  });
}