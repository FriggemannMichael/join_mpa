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
 * Opens the edit contact modal and populates all contact fields.
 *
 * @param {{ name: string, email: string, phone?: string }} contact - Contact data to display.
 * @returns {void}
 */
export function openEditModal(contact) {
  openEditOverlay();
  fillEditForm(contact);
  updateContactAvatar(contact);
  showEditMenu();
}


/**
 * Fills input fields with contact information.
 * @param {Object} c - Contact object.
 */
function fillEditForm(c) {
  byId("contactName").value = c.name;
  byId("contactEmail").value = c.email;
  byId("contactPhone").value = c.phone || "";
}


/**
 * Updates contact initials and background color in avatar.
 * @param {Object} c - Contact object.
 */
function updateContactAvatar(c) {
  const initialsElem = byId("contactInitials");
  if (!initialsElem) return;
  initialsElem.textContent = getInitials(c.name);
  initialsElem.parentElement.style.backgroundColor = colorFromString(c.name);
}


/**
 * Displays the edit/delete menu if available.
 * @returns {void}
 */
function showEditMenu() {
  try {
    byId("editDeleteModal").classList.remove("menu-hidden");
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