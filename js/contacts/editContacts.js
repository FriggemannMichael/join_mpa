import { getInitials, colorFromString } from "../board/utils.js"; 
import { addModalCloseListeners } from "./addContacts.js";
import { initEditContactValidation } from "../validation/validation-addContacts.js";
import { handleDeleteContact } from "./contactCache.js";
import {resetContactForm, } from "../pages/contacts.js"


let editContactValidator = null;


/**
 * Opens the edit contact overlay.
 * Retrieves the overlay element, activates it, initializes validation,
 * and ensures the delete event delegation is properly bound.
 *
 * @returns {void} Nothing is returned; updates DOM state and event bindings.
 */
function openEditOverlay() {
  const overlay = getEditOverlay();
  if (!overlay) return;
  activateOverlay(overlay);
  setupEditValidation();
  ensureDeleteDelegation(overlay);
}


/**
 * Retrieves the edit contact overlay element from the DOM.
 *
 * @returns {HTMLElement | null} The overlay element if found, otherwise null.
 */
function getEditOverlay() {
  return document.getElementById("contactOverlay");
}


/**
 * Activates and displays the edit contact overlay.
 * Removes the hidden attribute, enables interactivity, and binds modal close listeners.
 *
 * @param {HTMLElement} overlay - The edit contact overlay element to activate.
 * @returns {void} Nothing is returned; directly updates DOM visibility and event bindings.
 */
function activateOverlay(overlay) {
  overlay.removeAttribute("hidden");
  overlay.inert = false; // sicherheitshalber interaktiv
  addModalCloseListeners(overlay, closeEditOverlay);
}


/**
 * Initializes the edit contact form validation.
 * Detaches any existing validator before creating a new one to avoid duplicates.
 *
 * @returns {void} Nothing is returned; updates the global editContactValidator reference.
 */
function setupEditValidation() {
  if (editContactValidator) editContactValidator.detach();
  editContactValidator = initEditContactValidation();
}


/**
 * Ensures that the delete button event delegation is attached to the edit overlay.
 * Prevents duplicate listeners and handles delete contact actions via event delegation.
 *
 * @param {HTMLElement} overlay - The edit contact overlay element.
 * @returns {void} Nothing is returned; attaches the delegated click listener if not already active.
 */
function ensureDeleteDelegation(overlay) {
  if (overlay._hasDeleteDelegation) return;
  overlay.addEventListener("click", (e) => {
    const delBtn = e.target.closest("#deleteContactBtn");
    if (delBtn) handleDeleteContact(e);
  });
  overlay._hasDeleteDelegation = true;
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