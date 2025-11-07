import { getInitials, colorFromString } from "../board/utils.js"; 
import { addModalCloseListeners } from "./addContacts.js";
import { initEditContactValidation } from "../validation/validation-addContacts.js";
import { handleDeleteContact } from "./contactCache.js";
import {resetContactForm, } from "../pages/contacts.js"


let editContactValidator = null;


/**
 * Opens the edit contact overlay.
 * Makes the overlay visible and attaches close listeners for ESC and backdrop click.
 *
 * @returns {void} Nothing is returned; updates the DOM and event bindings.
 */
function openEditOverlay() {
  const overlay = document.getElementById("contactOverlay");
  if (!overlay) return;
  overlay.removeAttribute("hidden");
  overlay.inert = false; // sicherheitshalber interaktiv
  addModalCloseListeners(overlay, closeEditOverlay);

  if (editContactValidator) {
    editContactValidator.detach();
  }
  editContactValidator = initEditContactValidation();

  // Delegation – Listener bleibt auch nach innerHTML-Änderungen erhalten
  if (!overlay._hasDeleteDelegation) {
    overlay.addEventListener("click", (e) => {
      const delBtn = e.target.closest("#deleteContactBtn");
      if (delBtn) handleDeleteContact(e);
    });
    overlay._hasDeleteDelegation = true;
  }
}


/**
 * Closes the edit contact overlay.
 * Hides the overlay by setting the `hidden` attribute.
 *
 * @returns {void} Nothing is returned; updates the DOM visibility state.
 */
export function closeEditOverlay() {
    const overlayElement = document.getElementById("contactOverlay");
    if (!overlayElement) return;
    overlayElement.setAttribute("hidden", "hidden");

    if (editContactValidator) {
        editContactValidator.detach();
        editContactValidator = null;
    }
}


/**
 * Opens the edit overlay and fills the form with the selected contact's data.
 * Updates initials and avatar color dynamically based on the contact name.
 *
 * @param {Object} contact - The contact object to edit.
 * @param {string} contact.name - The contact's full name.
 * @param {string} contact.email - The contact's email address.
 * @param {string} [contact.phone] - The contact's phone number (optional).
 * @returns {void} Nothing is returned; updates the UI and form fields.
 */
export function openEditModal(contact) {
  openEditOverlay();

  document.getElementById("contactName").value = contact.name;
  document.getElementById("contactEmail").value = contact.email;
  document.getElementById("contactPhone").value = contact.phone || "";

  const initials = getInitials(contact.name);
  const color = colorFromString(contact.name);
  const initialsElem = document.getElementById("contactInitials");
  if (initialsElem) {
    initialsElem.textContent = initials;
    initialsElem.parentElement.style.backgroundColor = color;
  }

  try {
    document.getElementById("editDeleteModal").classList.remove("menu-hidden");
  } catch {}
}


/**
 * Binds the close button inside the edit contact modal.
 * Resets the form and closes the edit overlay when clicked.
 *
 * @returns {void} Nothing is returned; attaches the close event listener.
 */
export function bindEditContactControls() {
  const closeButton = document.getElementById("contactModalClose");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      resetContactForm();
      closeEditOverlay();
    });
  }
}