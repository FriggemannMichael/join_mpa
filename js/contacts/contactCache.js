
import { db } from "../common/firebase.js";
import { ref, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getInitials, colorFromString } from "../board/utils.js";
import { openEditModal, closeEditOverlay } from "./editContacts.js";
import { resetContactForm, renderContactDetail, renderGroupedContacts, groupContactsByLetter, renderAddButton, handleContactCreate, bindEditDeleteButtons } from "../pages/contacts.js";
import { confirmModal } from "../board/modals/confirmModal.js";
import { closeContactDetailOverlay, openContactDetailOverlay } from "./detailOverlay.js"
import { readValue } from "./helper.js"
import { showAlert } from "../common/alertService.js";
import { logError } from "../common/logger.js";

let contactsCache = [];
let selectedContactKey = null;


/**
 * Displays the detailed view for the selected contact.
 * Finds the contact by key, highlights the entry, renders its details,
 * binds edit/delete buttons, and opens the appropriate detail section.
 *
 * @param {HTMLElement} entry - The clicked contact list element.
 * @param {string} key - The unique Firebase key identifying the contact.
 * @returns {void} Nothing is returned; updates the DOM and opens the contact detail view.
 */
export function showContactDetail(entry, key) {
  selectedContactKey = key;
  const contact = contactsCache.find((c) => c.key === key);
  if (!contact) return;

  highlightSelectedEntry(entry);
  renderSelectedContact(contact);
  setTimeout(bindEditDeleteButtons, 0);
  openDetailSection();
}


/**
 * Highlights the selected contact entry in the contact list.
 * Removes the active state from all other entries before applying it to the selected one.
 *
 * @param {HTMLElement} entry - The contact list element that was selected.
 * @returns {void} Nothing is returned; updates the active state in the DOM.
 */
function highlightSelectedEntry(entry) {
  document.querySelectorAll(".contact-person.active").forEach((el) => el.classList.remove("active"));
  if (entry?.classList) entry.classList.add("active");
}


/**
 * Renders the selected contact's details in the detail view.
 * Generates initials and color based on the contact's name before rendering.
 *
 * @param {{name: string, email: string, phone?: string}} contact - The contact data to display.
 * @returns {void} Nothing is returned; updates the contact detail section in the DOM.
 */
function renderSelectedContact(contact) {
  const initials = getInitials(contact.name);
  const color = colorFromString(contact.name);
  renderContactDetail({ ...contact, initials, color });
}


/**
 * Opens the contact detail section based on the current viewport size.
 * On smaller screens, opens the responsive contact detail overlay;
 * on larger screens, makes the detail section visible.
 *
 * @returns {void} Nothing is returned; directly updates the DOM visibility state.
 */
function openDetailSection() {
  if (window.matchMedia("(max-width: 928px)").matches) openContactDetailOverlay();
  else document.querySelector(".contact-detail-section")?.setAttribute("aria-hidden", "false");
}


/**
 * Global keyboard listener for closing the contact detail overlay.
 * Listens for the Escape key and closes the overlay on smaller screens (≤ 58 rem).
 *
 * @returns {void} Nothing is returned; registers a global event listener.
 */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && window.matchMedia("(max-width: 58rem)").matches) {
        closeContactDetailOverlay();
    }
});

/**
 * Opens the edit modal for the currently selected contact.
 * Finds the contact from cache and initializes the edit form handler.
 *
 * @returns {void} Nothing is returned; triggers the edit modal setup.
 */
export function handleEditContact() {
    if (!selectedContactKey) return;
    const contact = contactsCache.find((c) => c.key === selectedContactKey);
    if (!contact) return;
    openEditModal(contact);
    setupEditFormHandler();
}


/**
 * Renders the full contact list into the DOM.
 * Filters out invalid contacts, caches them, groups them alphabetically,
 * and renders each group with its contacts.
 *
 * @param {Array<Object>} contacts - The list of contacts to render.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function renderContactList(contacts) {
    contacts = contacts.filter((c) => c.name && c.email);
    contactsCache = contacts;
    const list = document.getElementById("contact-list");
    if (!list) return;
    list.innerHTML = "";
    renderAddButton();
    if (!contacts.length) return;
    const grouped = groupContactsByLetter(contacts);
    renderGroupedContacts(list, grouped);
}


/**
 * Handles the deletion process for the currently selected contact.
 * Opens a confirmation modal and, if confirmed, triggers the contact deletion workflow.
 *
 * @async
 * @returns {Promise<void>} Resolves when the user confirms and the contact deletion is executed.
 */
export async function handleDeleteContact() {
  if (!selectedContactKey) return;
  confirmModal("Confirm Delete Contact?", async () => await deleteSelectedContact());
}


/**
 * Deletes the currently selected contact and updates the UI accordingly.
 * Removes the contact from Firebase, clears the detail view, and hides the overlay.
 * Logs an error message if the deletion fails.
 *
 * @async
 * @returns {Promise<void>} Resolves when the contact is deleted and the UI has been updated.
 */
async function deleteSelectedContact() {
  try {
    await removeContactFromFirebase();
    clearContactDetail();
    hideContactOverlay();
    showAlert("deleteContact")
    closeContactDetailOverlay()
  } catch (error) {
    logError("ContactCache", "Error deleting contact", error);
  }
}


/**
 * Removes the currently selected contact from Firebase.
 * Deletes the contact entry and resets the selected contact key.
 *
 * @async
 * @returns {Promise<void>} Resolves when the contact is successfully removed from Firebase.
 */
async function removeContactFromFirebase() {
  const contactRef = ref(db, `/contacts/${selectedContactKey}`);
  await remove(contactRef);
  selectedContactKey = null;
}


/**
 * Clears the currently displayed contact details from the view.
 * Empties the contact info container and restores the placeholder display.
 *
 * @returns {void} Nothing is returned; directly modifies DOM elements.
 */
function clearContactDetail() {
  const info = document.querySelector(".contact-info");
  const placeholder = document.querySelector(".contact-detail-placeholder");
  if (info) Object.assign(info, { innerHTML: "", style: { display: "none" } });
  if (placeholder) placeholder.style.display = "flex";
}


/**
 * Hides the contact overlay if it is currently visible.
 * Checks the overlay's visibility state before applying the hidden attribute.
 *
 * @returns {void} Nothing is returned; directly updates the DOM element's visibility.
 */
function hideContactOverlay() {
  const overlay = document.getElementById("contactOverlay");
  if (overlay && !overlay.hasAttribute("hidden")) overlay.setAttribute("hidden", "hidden");
}


/**
 * Sets up the submit handler for the contact edit form.
 * Assigns the edit submission logic to handle form updates in Firebase.
 *
 * @returns {void} Nothing is returned; binds the edit form submit event handler.
 */
function setupEditFormHandler() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.onsubmit = handleEditSubmit;
}


/**
 * Handles the form submission when editing a contact.
 * Validates the input, updates the contact in Firebase, and finalizes the edit process.
 *
 * @async
 * @param {SubmitEvent} event - The form submission event.
 * @returns {Promise<void>} Resolves when the contact has been updated and the UI is refreshed.
 */
async function handleEditSubmit(event) {
  event.preventDefault();
  const data = collectEditFormData();
  if (!data.name || !data.email) return;
  await updateContactInFirebase(data);
  finalizeEditProcess();
  showAlert("editContact")
}


/**
 * Collects and returns the current values from the contact edit form fields.
 *
 * @returns {{name: string, email: string, phone: string}} 
 * An object containing the name, email, and phone values from the form.
 */
function collectEditFormData() {
  return {
    name: readValue("contactName"),
    email: readValue("contactEmail"),
    phone: readValue("contactPhone"),
  };
}


/**
 * Updates an existing contact entry in Firebase with new data.
 * Dynamically imports the Firebase update function and applies the changes.
 *
 * @async
 * @param {{name: string, email: string, phone?: string}} data - The updated contact information.
 * @returns {Promise<void>} Resolves when the contact data is successfully updated in Firebase.
 */
async function updateContactInFirebase(data) {
  const { ref: dbRef, update } = await import(
    "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"
  );
  await update(dbRef(db, `/contacts/${selectedContactKey}`), data);
}


/**
 * Finalizes the contact editing process.
 * Resets the form, closes the edit overlay, refreshes the contact detail view,
 * and restores the default form submission handler for creating new contacts.
 *
 * @returns {void} Nothing is returned; directly updates UI and form behavior.
 */
function finalizeEditProcess() {
  resetContactForm();
  closeEditOverlay();
  showContactDetail({ dataset: { key: selectedContactKey } }, selectedContactKey);
  document.getElementById("contactForm").onsubmit = handleContactCreate;
}
