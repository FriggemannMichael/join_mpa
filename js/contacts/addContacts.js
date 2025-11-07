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
 * Adds listeners to close a modal overlay when the user clicks the backdrop or presses Escape.
 * Automatically removes the listeners once the modal is closed.
 *
 * @param {HTMLElement} overlayElement - The overlay element that contains the modal content and backdrop.
 * @param {Function} onCloseHandler - The function to call when the modal should be closed.
 * @returns {void} Nothing is returned; attaches and manages modal event listeners.
 */
export function addModalCloseListeners(overlayElement, onCloseHandler) {
    if (!overlayElement || typeof onCloseHandler !== "function") return;

    const contentElement = overlayElement.querySelector(".overlay__content");
    const backdropElement = overlayElement.querySelector(".overlay__backdrop");

    function handleModalEvent(event) {
        const isEscape = event.type === "keydown" && event.key === "Escape";
        const clickedBackdrop =
            event.type === "click" && event.target === backdropElement;
        if (isEscape || clickedBackdrop) {
            onCloseHandler();
            removeListeners();
        }
    }

    document.addEventListener("keydown", handleModalEvent);
    if (backdropElement)
        backdropElement.addEventListener("click", handleModalEvent);

    function removeListeners() {
        document.removeEventListener("keydown", handleModalEvent);
        if (backdropElement)
            backdropElement.removeEventListener("click", handleModalEvent);
    }
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
 * Updates the avatar preview in the add contact modal.
 * Dynamically sets the initials and background color based on the entered name.
 * Displays or hides the placeholder image depending on input state.
 *
 * @returns {void} Nothing is returned; updates the DOM elements for the avatar display.
 */
export function updateAddContactAvatar() {
    const nameInputField = document.getElementById("addContactName");
    const avatarContainer = document.getElementById("addContactAvatar");
    const initialsContainer = document.getElementById("addContactInitials");
    const placeholderImage = document.getElementById(
        "addContactAvatarPlaceholder"
    );

    const nameValue = nameInputField?.value?.trim() || "";
    const initials = getInitials(nameValue) || "?";
    const color = colorFromString(nameValue);

    if (avatarContainer)
        avatarContainer.style.backgroundColor = nameValue ? color : "";
    if (initialsContainer) {
        initialsContainer.textContent = initials;
        initialsContainer.style.display = nameValue ? "block" : "none";
    }
    if (placeholderImage)
        placeholderImage.style.display = nameValue ? "none" : "block";
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