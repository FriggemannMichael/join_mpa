import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { db } from "../common/firebase.js";
import {
  ref,
  onValue,
  push,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { person, mail, call, check, close, icons } from "../common/svg-template.js";
import { colorFromString, getInitials } from "../board/utils.js"
import { contactDetailTemplate } from "../contacts/templates.js"
import { confirmModal } from "../board/modals/confirmModal.js"


initContactsPage();


/**
 * Initializes the Contacts page and ensures the user has access.
 * Sets up layout, loads contacts, binds modal events, 
 * and attaches responsive menu and close button handlers.
 * 
 * @async
 * @returns {Promise<void>} Resolves when the contacts page is fully initialized.
 */
async function initContactsPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  await loadAndRenderContacts();
  bindModalControls();
  document.querySelector(".contact-detail-section .close-detail")
    ?.addEventListener("click", closeContactDetailOverlay);
  initEditDeleteRespMenu();
  insertCloseBtn();
}


/**
 * Loads all contacts from Firebase and renders them into the contact list.
 * Listens for real-time updates and re-renders automatically when data changes.
 * 
 * @async
 * @returns {Promise<void>} Resolves when contacts are loaded and rendered.
 */
async function loadAndRenderContacts() {
  const list = document.getElementById("contact-list");
  if (!list) return;
  const contactsRef = ref(db, "/contacts");
  onValue(contactsRef, (snapshot) => {
    const contacts = extractContactsFromSnapshot(snapshot);
    renderContactList(contacts);
  });
}


/**
 * Renders the "Add new Contact" button in the contact list actions area.
 * Clears any existing buttons, creates a new one, and binds the modal opening event.
 * 
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function renderAddButton() {
  const actions = document.getElementById("contact-list-actions");
  if (!actions) return;
  actions.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "contact-btn";
  btn.type = "button";
  btn.id = "addNewContactBtn";
  btn.innerHTML = `Add new Contact<img src="./assets/icons/person_add.png" alt="add Person" />`;
  actions.appendChild(btn);
  btn.addEventListener("click", openAddContactModal);
}


/**
 * Extracts all contact entries from a Firebase snapshot into a plain array.
 * Each contact includes its unique database key and corresponding data.
 * 
 * @param {import("firebase/database").DataSnapshot} snapshot - The Firebase snapshot containing contact data.
 * @returns {Array<Object>} A list of contacts with their keys and values.
 */
function extractContactsFromSnapshot(snapshot) {
  const contacts = [];
  snapshot.forEach((child) => {
    contacts.push({ key: child.key, ...child.val() });
  });
  return contacts;
}


let contactsCache = [];
let selectedContactKey = null;


/**
 * Renders the full contact list into the DOM.
 * Filters out invalid contacts, caches them, groups them alphabetically,
 * and renders each group with its contacts.
 * 
 * @param {Array<Object>} contacts - The list of contacts to render.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function renderContactList(contacts) {
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
 * Groups contacts alphabetically by the first letter of their name.
 * Unknown or missing names are grouped under "?".
 * 
 * @param {Array<Object>} contacts - The list of contacts to group.
 * @returns {Object<string, Array<Object>>} An object with letters as keys and contact arrays as values.
 */
function groupContactsByLetter(contacts) {
  const grouped = {};
  contacts.forEach((c) => {
    const letter = (c.name?.[0] || "?").toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });
  return grouped;
}


/**
 * Renders all grouped contacts into the contact list element.
 * Creates section headers for each starting letter and adds all related contacts below.
 * 
 * @param {HTMLElement} list - The DOM element where the contacts will be rendered.
 * @param {Object<string, Array<Object>>} grouped - Contacts grouped by their starting letter.
 * @returns {void} Nothing is returned; modifies the DOM directly.
 */
function renderGroupedContacts(list, grouped) {
  Object.keys(grouped)
    .sort()
    .forEach((letter) => {
      const p = document.createElement("p");
      p.className = "beginning-letter";
      p.textContent = letter;
      list.appendChild(p);
      const sep = document.createElement("div");
      sep.className = "contact-seperator";
      list.appendChild(sep);
      grouped[letter].forEach((c) => {
        const item = document.createElement("article");
        item.className = "contact-person";
        item.dataset.phone = `tel:${c.phone || ""}`;
        item.dataset.key = c.key;
        item.dataset.contactId = c.key;
        item.tabIndex = 0;
        item.innerHTML = buildContactMarkup(c);
        item.addEventListener("click", () => showContactDetail(item, c.key));
        list.appendChild(item);
      });
    });
}


/**
 * Displays the detailed view for a selected contact.
 * Finds the contact from cache, builds its detail data, 
 * and opens the detail overlay depending on screen size.
 * 
 * @param {HTMLElement} entry - The clicked contact list element.
 * @param {string} key - The unique Firebase key of the selected contact.
 * @returns {void} Nothing is returned; updates the DOM and opens the detail view.
 */
function showContactDetail(entry, key) {
  selectedContactKey = key;
  const contact = contactsCache.find((c) => c.key === key);
  if (!contact) return;
  
  document.querySelectorAll(".contact-person.active").forEach((el) => {
    el.classList.remove("active");
  });
  
  if (entry && entry.classList) {
    entry.classList.add("active");
  }
  
  const initials = getInitials(contact.name);
  const color = colorFromString(contact.name);
  renderContactDetail({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    initials,
    color,
  });
  setTimeout(bindEditDeleteButtons, 0);

  if (window.matchMedia("(max-width: 928px)").matches) {
    openContactDetailOverlay();
  } else {
    const detail = document.querySelector(".contact-detail-section");
    detail.setAttribute("aria-hidden", "false");
  }
}


/**
 * Binds click events for all edit and delete contact buttons.
 * Supports both desktop and responsive button variants.
 * 
 * @returns {void} Nothing is returned; attaches event listeners to the DOM.
 */
function bindEditDeleteButtons() {
  ["editContactBtn", "editContactBtnResp"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", handleEditContact);
  });

  ["deleteContactBtn", "deleteContactBtnResp"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", handleDeleteContact);
  });
}

/**
 * Deletes the currently selected contact from Firebase.
 * Confirms the action with the user, removes the contact, 
 * and resets the contact detail view on success.
 * 
 * @async
 * @returns {Promise<void>} Resolves when the contact has been deleted and the UI is updated.
 */
async function handleDeleteContact() {
  if (!selectedContactKey) return;
  if (!confirm("Kontakt wirklich löschen?")) return;
  try {
    const contactRef = ref(db, `/contacts/${selectedContactKey}`);
    await remove(contactRef);
    selectedContactKey = null;
    const info = document.querySelector(".contact-info");
    const placeholder = document.querySelector(".contact-detail-placeholder");
    if (info) {
      info.innerHTML = "";
      info.style.display = "none";
    }
    if (placeholder) placeholder.style.display = "flex";

    const overlay = document.getElementById("contactOverlay");
    if (overlay && !overlay.hasAttribute("hidden")) {
      overlay.setAttribute("hidden", "hidden");
    }
  } catch (error) {
    alert("Fehler beim Löschen: " + error.message);
  }
}


/**
 * Opens the edit modal for the currently selected contact.
 * Finds the contact from cache and initializes the edit form handler.
 * 
 * @returns {void} Nothing is returned; triggers the edit modal setup.
 */
function handleEditContact() {
  if (!selectedContactKey) return;
  const contact = contactsCache.find((c) => c.key === selectedContactKey);
  if (!contact) return;
  openEditModal(contact);
  setupEditFormHandler();
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
function openEditModal(contact) {
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

  try { document.getElementById("editDeleteModal").classList.remove("menu-hidden") } catch { };
}


/**
 * Sets up the submit handler for the contact edit form.
 * Updates the selected contact in Firebase and refreshes the detail view after saving.
 * 
 * @returns {void} Nothing is returned; assigns a new async submit handler to the form.
 */
function setupEditFormHandler() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = {
      name: readValue("contactName"),
      email: readValue("contactEmail"),
      phone: readValue("contactPhone"),
    };
    if (!data.name || !data.email) return;
    const { ref: dbRef, update } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"
    );
    await update(dbRef(db, `/contacts/${selectedContactKey}`), data);
    resetContactForm();
    closeEditOverlay();
    showContactDetail({ dataset: { key: selectedContactKey } }, selectedContactKey);
    form.onsubmit = handleContactCreate;
  };
}


/**
 * Renders the detailed contact view with full contact information.
 * Replaces the placeholder, injects the contact detail template, 
 * and triggers a fade-in animation for smooth display.
 * 
 * @param {Object} data - The contact data used to render the detail view.
 * @param {string} data.name - The contact's full name.
 * @param {string} data.email - The contact's email address.
 * @param {string} [data.phone] - The contact's phone number (optional).
 * @param {string} data.initials - The generated initials for the avatar.
 * @param {string} data.color - The avatar background color (HSL or HEX).
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function renderContactDetail({ name, email, phone, initials, color }) {
  const placeholder = document.querySelector(".contact-detail-placeholder");
  const info = document.querySelector(".contact-info");
  if (!info) return;
  if (placeholder) placeholder.style.display = "none";

  info.innerHTML = contactDetailTemplate({ name, email, phone, initials, color });

  info.classList.remove("fade-in"); // reset falls schon aktiv
  void info.offsetWidth; // force reflow für wiederholtes Abspielen
  info.classList.add("fade-in");
  info.style.display = "block";
}


/**
 * Binds all modal-related controls and initializes modal icons.
 * Sets up listeners and inputs for both add and edit contact modals.
 * 
 * @returns {void} Nothing is returned; initializes modal UI and event bindings.
 */
function bindModalControls() {
  renderEditContactModalIcons();
  renderAddContactModalIcons();
  bindAddContactAvatarInput();
  bindAddContactControls();
  bindEditContactControls();
}


/**
 * Opens the "Add Contact" modal overlay.
 * Initializes the avatar preview, binds close listeners,
 * and sets focus to the name input field.
 * 
 * @returns {void} Nothing is returned; updates the DOM and UI state.
 */
function openAddContactModal() {
  const overlayElement = document.getElementById("addContactOverlay");
  if (!overlayElement) return;
  overlayElement.removeAttribute("hidden");
  updateAddContactAvatar();
  addModalCloseListeners(overlayElement, closeAddContactModal);
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
  try { document.getElementById("editDeleteModal").classList.add("menu-hidden") } catch { };
}


/**
 * Adds listeners to close a modal overlay when the user clicks the backdrop or presses Escape.
 * Automatically removes the listeners once the modal is closed.
 * 
 * @param {HTMLElement} overlayElement - The overlay element that contains the modal content and backdrop.
 * @param {Function} onCloseHandler - The function to call when the modal should be closed.
 * @returns {void} Nothing is returned; attaches and manages modal event listeners.
 */
function addModalCloseListeners(overlayElement, onCloseHandler) {
  if (!overlayElement || typeof onCloseHandler !== "function") return;

  const contentElement = overlayElement.querySelector(".overlay__content");
  const backdropElement = overlayElement.querySelector(".overlay__backdrop");

  function handleModalEvent(event) {
    const isEscape = event.type === "keydown" && event.key === "Escape";
    const clickedBackdrop = event.type === "click" && event.target === backdropElement;
    if (isEscape || clickedBackdrop) {
      onCloseHandler();
      removeListeners();
    }
  }

  document.addEventListener("keydown", handleModalEvent);
  if (backdropElement) backdropElement.addEventListener("click", handleModalEvent);

  function removeListeners() {
    document.removeEventListener("keydown", handleModalEvent);
    if (backdropElement) backdropElement.removeEventListener("click", handleModalEvent);
  }
}


/**
 * Renders the close icon inside the edit contact modal.
 * Inserts the SVG icon markup into the close button container.
 * 
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function renderEditContactModalIcons() {
  const closeIconContainer = document.getElementById("contactModalCloseIcon");
  if (closeIconContainer) {
    closeIconContainer.innerHTML = close({ class: "icon icon--btn", width: 24, height: 24 });
  }
}


/**
 * Renders the close icon inside the add contact modal.
 * Inserts the SVG icon markup into the close button container.
 * 
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function renderAddContactModalIcons() {
  const closeIconContainer = document.getElementById("addContactModalCloseIcon");
  if (closeIconContainer) {
    closeIconContainer.innerHTML = close({ class: "icon icon--btn", width: 24, height: 24 });
  }
}


/**
 * Binds an input listener to the name field in the add contact form.
 * Updates the avatar initials and color dynamically as the user types.
 * 
 * @returns {void} Nothing is returned; attaches an input listener to the DOM element.
 */
function bindAddContactAvatarInput() {
  const nameInputField = document.getElementById("addContactName");
  if (nameInputField) nameInputField.addEventListener("input", updateAddContactAvatar);
}


/**
 * Updates the avatar preview in the add contact modal.
 * Dynamically sets the initials and background color based on the entered name.
 * Displays or hides the placeholder image depending on input state.
 * 
 * @returns {void} Nothing is returned; updates the DOM elements for the avatar display.
 */
function updateAddContactAvatar() {
  const nameInputField = document.getElementById("addContactName");
  const avatarContainer = document.getElementById("addContactAvatar");
  const initialsContainer = document.getElementById("addContactInitials");
  const placeholderImage = document.getElementById("addContactAvatarPlaceholder");

  const nameValue = nameInputField?.value?.trim() || "";
  const initials = getInitials(nameValue) || "?";
  const color = colorFromString(nameValue);

  if (avatarContainer) avatarContainer.style.backgroundColor = nameValue ? color : "";
  if (initialsContainer) {
    initialsContainer.textContent = initials;
    initialsContainer.style.display = nameValue ? "block" : "none";
  }
  if (placeholderImage) placeholderImage.style.display = nameValue ? "none" : "block";
}


/**
 * Binds all control elements inside the add contact modal.
 * Handles close, cancel, and form submit actions.
 * 
 * @returns {void} Nothing is returned; attaches event listeners to modal elements.
 */
function bindAddContactControls() {
  const closeButton = document.getElementById("addContactModalClose");
  const cancelButton = document.getElementById("addContactCancelBtn");
  const formElement = document.getElementById("addContactForm");

  if (closeButton) closeButton.addEventListener("click", closeAddContactModal);
  if (cancelButton) cancelButton.addEventListener("click", closeAddContactModal);
  if (formElement) formElement.addEventListener("submit", handleAddContactSubmit);
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
async function handleAddContactSubmit(event) {
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
 * Resets all input fields in the add contact form.
 * Clears name, email, and phone values.
 * 
 * @returns {void} Nothing is returned; resets the form fields directly.
 */
function resetAddContactForm() {
  ["addContactName", "addContactEmail", "addContactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}


/**
 * Binds the close button inside the edit contact modal.
 * Resets the form and closes the edit overlay when clicked.
 * 
 * @returns {void} Nothing is returned; attaches the close event listener.
 */
function bindEditContactControls() {
  const closeButton = document.getElementById("contactModalClose");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      resetContactForm();
      closeEditOverlay();
    });
  }
}


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
function closeEditOverlay() {
  const overlayElement = document.getElementById("contactOverlay");
  if (!overlayElement) return;
  overlayElement.setAttribute("hidden", "hidden");
}


/**
 * Toggles the visibility of the contact overlay.
 * Shows or hides the overlay based on the provided flag.
 * 
 * @param {boolean} show - Whether to show (`true`) or hide (`false`) the overlay.
 * @returns {void} Nothing is returned; updates the overlay visibility in the DOM.
 */
function toggleOverlay(show) {
  const overlay = document.getElementById("contactOverlay");
  if (!overlay) return;
  if (show) overlay.removeAttribute("hidden");
  else overlay.setAttribute("hidden", "hidden");
}


/**
 * Handles the form submission for creating a new contact.
 * Reads input values, validates them, saves the contact to Firebase,
 * resets the form, and closes the overlay after saving.
 * 
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} Resolves when the contact is saved and the overlay is closed.
 */
async function handleContactCreate(event) {
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
 * Saves a new contact entry to Firebase.
 * Pushes the provided contact data into the `/contacts` reference.
 * 
 * @async
 * @param {Object} data - The contact data to be saved.
 * @param {string} data.name - The contact's full name.
 * @param {string} data.email - The contact's email address.
 * @param {string} [data.phone] - The contact's phone number (optional).
 * @returns {Promise<void>} Resolves when the contact is successfully stored in Firebase.
 */
async function saveContactToFirebase(data) {
  const contactsRef = ref(db, "/contacts");
  await set(push(contactsRef), data);
}


/**
 * Builds the HTML markup for a single contact entry.
 * Generates initials and background color based on the contact name.
 * 
 * @param {Object} contact - The contact data to render.
 * @param {string} contact.name - The contact's full name.
 * @param {string} contact.email - The contact's email address.
 * @returns {string} The generated HTML string for the contact element.
 */
function buildContactMarkup({ name, email }) {
  const initials = getInitials(name);
  const color = colorFromString(name);
  return `<div class="initals" style="background-color: ${color};">${initials}</div>
    <div class="small-info"><h3>${name}</h3><span>${email}</span></div>`;
}


/**
 * Resets all input fields in the edit contact form.
 * Clears the values for name, email, and phone.
 * 
 * @returns {void} Nothing is returned; resets the form fields directly.
 */
function resetContactForm() {
  ["contactName", "contactEmail", "contactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}


/**
 * Reads and trims the value of an input field by its ID.
 * Returns an empty string if the field does not exist.
 * 
 * @param {string} id - The ID of the input element to read.
 * @returns {string} The trimmed input value or an empty string if not found.
 */
function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}


/**
 * Opens the contact detail overlay in mobile view.
 * Sets accessibility attributes, updates the back icon,
 * focuses the first interactive element, and shows the edit/delete menu.
 * 
 * @returns {void} Nothing is returned; updates the DOM and accessibility state.
 */
function openContactDetailOverlay() {
  const listSection = document.querySelector('.contacts-list-section');
  const detail = document.querySelector('.contact-detail-section');
  const menuBtn = document.getElementById("contactsEditDelete")
  detail.classList.add('is-open');
  detail.setAttribute('aria-hidden', 'false');
  const modal = document.getElementById("closeDetails")
  modal.innerHTML = `${icons.arrowback}`
  if ('inert' in HTMLElement.prototype && listSection) listSection.inert = true;
  detail.querySelector('h1, h2, button, a, [tabindex="0"]')?.focus();
  menuBtn.classList.remove("menu-hidden")
}


/**
 * Closes the contact detail overlay in mobile view.
 * Restores accessibility state, hides the edit/delete menu,
 * and returns focus to the contact list.
 * 
 * @returns {void} Nothing is returned; updates the DOM and accessibility attributes.
 */
function closeContactDetailOverlay() {
  const menuBtn = document.getElementById("contactsEditDelete")
  const listSection = document.querySelector('.contacts-list-section');
  const detail = document.querySelector('.contact-detail-section');
  detail.classList.remove('is-open');
  detail.setAttribute('aria-hidden', 'true');
  if ('inert' in HTMLElement.prototype && listSection) listSection.inert = false;
  document.getElementById('contact-list')?.focus();
  menuBtn.classList.add("menu-hidden")
}


/**
 * Global keyboard listener for closing the contact detail overlay.
 * Listens for the Escape key and closes the overlay on smaller screens (≤ 58 rem).
 * 
 * @returns {void} Nothing is returned; registers a global event listener.
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.matchMedia('(max-width: 58rem)').matches) {
    closeContactDetailOverlay();
  }
});


/**
 * Initializes the responsive edit/delete menu for contacts.
 * Toggles visibility on button click and hides the menu when clicking outside or pressing Escape.
 * Also rebinds edit/delete button listeners after each toggle.
 * 
 * @returns {void} Nothing is returned; attaches event listeners and updates menu state.
 */
function initEditDeleteRespMenu() {
  const btn = document.getElementById("contactsEditDelete")
  const menu = document.getElementById("editDeleteModal")
  if (!btn || !menu) return

  btn.innerHTML = icons.menuDots
  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    menu.classList.toggle("menu-hidden")
    bindEditDeleteButtons()
  })

  document.addEventListener("click", (e) => {
    const isClickInsideMenu = menu.contains(e.target);
    const isButtonClick = e.target === btn;
    const isOverlayClick = e.target.closest("#contactOverlay"); // 🩵 das ist der Trick!

    if (
      !menu.classList.contains("menu-hidden") &&
      !isClickInsideMenu &&
      !isButtonClick &&
      !isOverlayClick
    ) {
      menu.classList.add("menu-hidden");
      bindEditDeleteButtons();
    }
  });

  document.addEventListener("keydown", e => {
    if (!menu.classList.contains("menu-hidden") && e.key === "Escape") {
      menu.classList.add("menu-hidden")
      bindEditDeleteButtons()
    }
  })
}


/**
 * Inserts the close icons into both contact modals.
 * Updates the inner HTML of the close buttons with the close SVG icon.
 * 
 * @returns {void} Nothing is returned; updates the DOM elements directly.
 */
function insertCloseBtn() {
  document.getElementById("contactModalClose").innerHTML = icons.close;
  document.getElementById("addContactModalClose").innerHTML = icons.close;
}


/**
 * Global resize listener for responsive contact layout behavior.
 * Ensures proper overlay visibility and accessibility state when resizing between breakpoints.
 * Hides the edit/delete menu on wider screens.
 * 
 * @returns {void} Nothing is returned; manages responsive DOM updates on resize.
 */
window.addEventListener('resize', () => {
  const btn = document.getElementById('contactsEditDelete');
  const listSection = document.querySelector('.contacts-list-section');
  const detail = document.querySelector('.contact-detail-section');
  if (!window.matchMedia('(max-width: 58rem)').matches) {
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'false');
    if ('inert' in HTMLElement.prototype && listSection) listSection.inert = false;
  }
  if (!btn) return;
  if (window.innerWidth > 768) {
    btn.classList.add('menu-hidden');
  }
});