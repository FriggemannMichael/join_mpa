import { close } from "../common/svg-template.js";
import { colorFromString, getInitials } from "../board/utils.js";
import { saveContactToFirebase } from "./repo.js";

/**
 * Binds all modal-related controls and initializes modal UI elements.
 * Sets up icons, avatar updates, and form event handlers for both add and edit contact modals.
 *
 * @returns {void}
 */
export function bindModalControls() {
  renderEditContactModalIcons();
  renderAddContactModalIcons();
  bindAddContactAvatarInput();
  bindAddContactControls();
  bindEditContactControls();
  bindAddContactButtonListener();
}

/**
 * Opens the "Add Contact" modal overlay.
 * Makes the modal visible, updates the avatar preview, and binds close listeners.
 *
 * @returns {void}
 */
export function openAddContactModal() {
  const overlayElement = document.getElementById("addContactOverlay");
  if (!overlayElement) return;
  overlayElement.removeAttribute("hidden");
  updateAddContactAvatar();
  addModalCloseListeners(overlayElement, closeAddContactModal);
  document.getElementById("addContactName")?.focus();
}

/**
 * Closes the "Add Contact" modal overlay.
 * Hides the modal, resets the form fields, and updates the avatar display.
 *
 * @returns {void}
 */
export function closeAddContactModal() {
  const overlayElement = document.getElementById("addContactOverlay");
  if (!overlayElement) return;
  overlayElement.setAttribute("hidden", "hidden");
  resetAddContactForm();
  updateAddContactAvatar();
  try {
    document.getElementById("editDeleteModal").classList.add("menu-hidden");
  } catch {}
}

/**
 * Adds listeners to close a modal overlay when clicking the backdrop or pressing Escape.
 * Automatically removes the listeners after the modal is closed.
 *
 * @param {HTMLElement} overlayElement - The overlay element containing the modal content and backdrop.
 * @param {Function} onCloseHandler - The callback function to execute when the modal should close.
 * @returns {void}
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
 * Renders the close icon inside the edit contact modal.
 * Inserts the SVG icon into the designated container element.
 *
 * @returns {void}
 */
export function renderEditContactModalIcons() {
  const closeIconContainer = document.getElementById("contactModalCloseIcon");
  if (closeIconContainer) {
    closeIconContainer.innerHTML = close({
      class: "icon icon--btn",
      width: 24,
      height: 24,
    });
  }
}

/**
 * Renders the close icon inside the "Add Contact" modal.
 * Inserts the SVG icon into the correct close button container.
 *
 * @returns {void}
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

/**
 * Binds the name input field in the "Add Contact" modal to update the avatar preview dynamically.
 * Updates the displayed initials and color as the user types a name.
 *
 * @returns {void}
 */
export function bindAddContactAvatarInput() {
  const nameInputField = document.getElementById("addContactName");
  if (nameInputField)
    nameInputField.addEventListener("input", updateAddContactAvatar);
}

/**
 * Updates the avatar preview in the "Add Contact" modal based on the entered name.
 * Displays initials and assigns a dynamic background color, hiding the placeholder image when active.
 *
 * @returns {void}
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
 * Binds all control elements in the "Add Contact" modal.
 * Handles closing via close and cancel buttons, and submission of the add-contact form.
 *
 * @returns {void}
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
 * Binds a click listener to the dynamically created "Add new Contact" button using event delegation.
 * Opens the add contact modal when the button is clicked.
 *
 * @returns {void}
 */
export function bindAddContactButtonListener() {
  const listActions = document.getElementById("contact-list-actions");
  if (!listActions) return;

  listActions.addEventListener("click", (event) => {
    const target = event.target.closest("#addNewContactBtn");
    if (target) {
      openAddContactModal();
    }
  });
}

/**
 * Handles the submission of the "Add Contact" form.
 * Prevents default behavior, validates input data, saves the new contact to Firebase, and closes the modal.
 *
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} Resolves once the contact has been saved and the modal closed.
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
 * Resets all input fields in the "Add Contact" form to empty values.
 * Clears name, email, and phone inputs to prepare the form for a new entry.
 *
 * @returns {void}
 */
export function resetAddContactForm() {
  ["addContactName", "addContactEmail", "addContactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}

/**
 * Binds control elements for the edit contact modal.
 * Handles closing the modal and resetting the form when the close button is clicked.
 *
 * @returns {void}
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

/**
 * Opens the edit contact overlay and enables modal close listeners.
 * Makes the overlay visible and attaches event handlers for closing actions.
 *
 * @returns {void}
 */
export function openEditOverlay() {
  const overlayElement = document.getElementById("contactOverlay");
  if (!overlayElement) return;
  overlayElement.removeAttribute("hidden");
  addModalCloseListeners(overlayElement, closeEditOverlay);
}

/**
 * Closes the edit contact overlay.
 * Hides the modal and restores normal page interaction.
 *
 * @returns {void}
 */
export function closeEditOverlay() {
  const overlayElement = document.getElementById("contactOverlay");
  if (!overlayElement) return;
  overlayElement.setAttribute("hidden", "hidden");
}

/**
 * Toggles the visibility of the contact overlay.
 * Shows or hides the overlay based on the given boolean flag.
 *
 * @param {boolean} show - Determines whether to show (true) or hide (false) the overlay.
 * @returns {void}
 */
export function toggleOverlay(show) {
  const overlay = document.getElementById("contactOverlay");
  if (!overlay) return;
  if (show) overlay.removeAttribute("hidden");
  else overlay.setAttribute("hidden", "hidden");
}

/**
 * Handles the submission of the edit contact form when creating a new contact.
 * Validates the form data, saves it to Firebase, resets the form, and closes the overlay.
 *
 * @async
 * @param {SubmitEvent} event - The form submission event.
 * @returns {Promise<void>} Resolves once the contact has been saved and the overlay closed.
 */
export async function handleContactCreate(event) {
  event.preventDefault();
  const data = {
    name: readValue("contactName"),
    email: readValue("contactEmail"),
    phone: readValue("contactPhone"),
  };
  if (!data.name || !data.email) return;
  await saveContactToFirebase(data);
  resetContactForm();
  toggleOverlay(false);
}

/**
 * Resets all input fields in the contact form to empty values.
 * Clears name, email, and phone fields after creating or editing a contact.
 *
 * @returns {void}
 */
export function resetContactForm() {
  ["contactName", "contactEmail", "contactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}

/**
 * Reads and returns the trimmed value of an input field by its ID.
 * Returns an empty string if the element does not exist.
 *
 * @param {string} id - The ID of the input element to read.
 * @returns {string} The trimmed input value or an empty string if not found.
 */
export function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}
