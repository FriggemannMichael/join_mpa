import { resetAddContactForm } from "../pages/contacts.js";
import { initAddContactValidation } from "../validation/validation-addContacts.js";
import {getInitials,colorFromString } from "../board/utils.js"
import {readValue } from "./helper.js"
import {saveContactToFirebase} from "../pages/contacts.js"


let addContactValidator = null;

/**
 * Opens the "Add Contact" modal overlay.
 * Initializes the avatar preview, binds close listeners,
 * and sets focus to the name input field.
 *
 * @returns {void} Nothing is returned; updates the DOM and UI state.
 */
export function openAddContactModal() {
    const overlayElement = document.getElementById("addContactOverlay");
    if (!overlayElement) return;
    overlayElement.removeAttribute("hidden");
    updateAddContactAvatar();
    addModalCloseListeners(overlayElement, closeAddContactModal);

    if (addContactValidator) {
        addContactValidator.detach();
    }
    addContactValidator = initAddContactValidation();

    document.getElementById("addContactName")?.focus();
}


/**
 * Closes the "Add Contact" modal overlay.
 * Resets the form and avatar preview, and hides related edit/delete menus if open.
 *
 * @returns {void} Nothing is returned; updates the DOM and modal state.
 */
function closeAddContactModal() {
    const overlayElement = document.getElementById("addContactOverlay");
    if (!overlayElement) return;
    overlayElement.setAttribute("hidden", "hidden");
    resetAddContactForm();
    updateAddContactAvatar();

    if (addContactValidator) {
        addContactValidator.detach();
        addContactValidator = null;
    }

    try {
        document.getElementById("editDeleteModal").classList.add("menu-hidden");
    } catch { }
}


/**
 * Attaches event listeners to handle modal close interactions.
 * Listens for the Escape key and backdrop clicks, removing listeners automatically after closing.
 *
 * @param {HTMLElement} overlayElement - The modal overlay element containing the backdrop.
 * @param {Function} onCloseHandler - The callback function to execute when the modal should close.
 * @returns {void} Nothing is returned; manages event listeners dynamically.
 */
export function addModalCloseListeners(overlayElement, onCloseHandler) {
  if (!overlayElement || typeof onCloseHandler !== "function") return;
  const { backdrop } = getModalNodes(overlayElement);
  const handler = makeModalHandler(backdrop, onCloseHandler, detach);

  attach();
  function attach() {
    document.addEventListener("keydown", handler);
    if (backdrop) backdrop.addEventListener("click", handler);
  }
  function detach() {
    document.removeEventListener("keydown", handler);
    if (backdrop) backdrop.removeEventListener("click", handler);
  }
}


/**
 * Retrieves key DOM nodes from a modal overlay element.
 * Returns references to the modal content and backdrop elements.
 *
 * @param {HTMLElement} overlay - The modal overlay element containing content and backdrop.
 * @returns {{content: HTMLElement | null, backdrop: HTMLElement | null}} 
 * An object with references to the content and backdrop nodes.
 */
function getModalNodes(overlay) {
  return {
    content: overlay.querySelector(".overlay__content"),
    backdrop: overlay.querySelector(".overlay__backdrop"),
  };
}


/**
 * Creates a unified event handler for closing a modal.
 * Triggers the provided callbacks when Escape is pressed or the backdrop is clicked.
 *
 * @param {HTMLElement} backdrop - The backdrop element of the modal overlay.
 * @param {Function} onClose - Function to call when the modal should close.
 * @param {Function} afterClose - Function to execute after closing (e.g., remove listeners).
 * @returns {(e: Event) => void} The event handler function for modal close events.
 */
function makeModalHandler(backdrop, onClose, afterClose) {
  return (e) => {
    const esc = e.type === "keydown" && e.key === "Escape";
    const back = e.type === "click" && e.target === backdrop;
    if (esc || back) {
      onClose();
      afterClose();
    }
  };
}


/**
 * Binds all control elements inside the add contact modal.
 * Handles close, cancel, and form submit actions.
 *
 * @returns {void} Nothing is returned; attaches event listeners to modal elements.
 */
export function bindAddContactControls() {
  const closeButton = document.getElementById("addContactModalClose");
  const cancelButton = document.getElementById("addContactCancelBtn");
  const formElement = document.getElementById("addContactForm");

  if (closeButton) closeButton.addEventListener("click", closeAddContactModal);
  if (cancelButton)
    cancelButton.addEventListener("click", closeAddContactModal);
  if (formElement)
    formElement.addEventListener("submit", handleAddContactSubmit);
}


/**
 * Handles the form submission for adding a new contact.
 * Reads input values, validates required fields, saves the contact to Firebase,
 * and closes the modal after successful submission.
 *
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} Resolves when the contact is saved and the modal is closed.
 */
export async function handleAddContactSubmit(event) {
  event.preventDefault();
  const data = {
    name: readValue("addContactName"),
    email: readValue("addContactEmail"),
    phone: readValue("addContactPhone"),
  };
  if (!data.name || !data.email) return;
  await saveContactToFirebase(data);
  closeAddContactModal();
}


/**
 * Updates the Add Contact avatar preview in real time.
 * Reads the input value, computes avatar data, and applies initials and color.
 *
 * @returns {void} Nothing is returned; directly updates avatar-related DOM elements.
 */
export function updateAddContactAvatar() {
  const { nameInput, avatar, initialsEl, placeholder } = getAvatarNodes();
  const data = computeAvatarData(readInput(nameInput));
  applyAvatar(avatar, initialsEl, placeholder, data);
}


/**
 * Retrieves all DOM elements related to the Add Contact avatar section.
 * Returns references to input, avatar, initials, and placeholder nodes.
 *
 * @returns {{nameInput: HTMLInputElement, avatar: HTMLElement, initialsEl: HTMLElement, placeholder: HTMLElement}} 
 * An object containing the key DOM nodes for the avatar display.
 */
function getAvatarNodes() {
  return {
    nameInput: document.getElementById("addContactName"),
    avatar: document.getElementById("addContactAvatar"),
    initialsEl: document.getElementById("addContactInitials"),
    placeholder: document.getElementById("addContactAvatarPlaceholder"),
  };
}


/**
 * Reads and trims the value from a given input element.
 * Returns an empty string if the input is missing or empty.
 *
 * @param {HTMLInputElement} [input] - The input element to read from.
 * @returns {string} The trimmed input value or an empty string.
 */
function readInput(input) {
  return input?.value?.trim() || "";
}


/**
 * Generates avatar data (name, initials, and color) based on a given contact name.
 * Falls back to "?" if no valid initials can be derived.
 *
 * @param {string} name - The contact's full name.
 * @returns {{name: string, initials: string, color: string}} An object containing the name, generated initials, and background color.
 */
function computeAvatarData(name) {
  return {
    name,
    initials: getInitials(name) || "?",
    color: colorFromString(name),
  };
}


/**
 * Applies the avatar appearance inside the Add Contact modal.
 * Sets background color, initials visibility, and toggles the placeholder image.
 *
 * @param {HTMLElement} avatar - The avatar container element.
 * @param {HTMLElement} initialsEl - The element displaying the initials.
 * @param {HTMLElement} placeholder - The placeholder image element.
 * @param {{name: string, initials: string, color: string}} data - Avatar data containing name, initials, and color.
 * @returns {void} Nothing is returned; directly updates DOM elements.
 */
function applyAvatar(avatar, initialsEl, placeholder, { name, initials, color }) {
  if (avatar) avatar.style.backgroundColor = name ? color : "";
  if (initialsEl) {
    initialsEl.textContent = initials;
    initialsEl.style.display = name ? "block" : "none";
  }
  if (placeholder) placeholder.style.display = name ? "none" : "block";
}


/**
 * Renders the close icon inside the add contact modal.
 * Inserts the SVG icon markup into the close button container.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
export function renderAddContactModalIcons() {
    const closeIconContainer = document.getElementById(
        "addContactModalCloseIcon"
    );
    if (closeIconContainer) {
        closeIconContainer.innerHTML = close({
            class: "icon icon--btn",
            width: 24,
            height: 24,
        });
    }
}