import {
  person,
  mail,
  call,
  check,
  close,
  icons,
} from "../common/svg-template.js";
import { colorFromString, getInitials } from "../board/utils.js";
import { db, ref, remove } from "./repo.js";
import {
  contactsCache,
  selectedContactKey as selectedKeyFromList,
} from "./list.js";
import { contactDetailTemplate } from "./templates.js";
import {
  openEditOverlay,
  closeEditOverlay,
  resetContactForm,
  readValue,
  handleContactCreate,
} from "./modals.js";

/** Lokaler State (entspricht deinem Original) */
export let selectedContactKey = null;

/**
 * Displays the detail view for a selected contact.
 * Finds the contact by key, renders its details, and handles responsive overlay behavior.
 *
 * @param {HTMLElement} entry - The clicked contact list element.
 * @param {string} key - The unique key of the selected contact in Firebase.
 * @returns {void}
 */
export function showContactDetail(entry, key) {
  selectedContactKey = key;
  const contact = contactsCache.find((c) => c.key === key);
  if (!contact) return;
  
  document.querySelectorAll(".contact-person.active").forEach((el) => {
    el.classList.remove("active");
  });
  
  if (entry) {
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
 * Binds click event listeners for all edit and delete contact buttons.
 * Supports both desktop and responsive (mobile) button variants.
 *
 * @returns {void}
 */
export function bindEditDeleteButtons() {
  ["editContactBtn", "editContactBtnResp"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", handleEditContact);
  });

  ["deleteContactBtn", "deleteContactBtnResp"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", handleDeleteContact);
  });
}

/**
 * Deletes the currently selected contact from Firebase.
 * Prompts for user confirmation, updates the UI, and handles potential errors.
 *
 * @async
 * @returns {Promise<void>} Resolves after the contact has been removed or the action was canceled.
 */
export async function handleDeleteContact() {
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
  } catch (error) {}
}

/**
 * Opens the edit modal for the currently selected contact.
 * Loads the contact data into the form and initializes the edit form handler.
 *
 * @returns {void}
 */
export function handleEditContact() {
  if (!selectedContactKey) return;
  const contact = contactsCache.find((c) => c.key === selectedContactKey);
  if (!contact) return;
  openEditModal(contact);
  setupEditFormHandler();
}

/**
 * Opens the edit modal and fills it with the selected contact's data.
 * Updates input fields, avatar initials, and background color based on the contact name.
 *
 * @param {{ name: string, email: string, phone?: string }} contact - The contact data to prefill the form.
 * @returns {void}
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
 * Sets up the submit handler for the contact edit form.
 * Updates the selected contact in Firebase and refreshes the contact detail view.
 *
 * @returns {void}
 */
export function setupEditFormHandler() {
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
    showContactDetail(
      { dataset: { key: selectedContactKey } },
      selectedContactKey
    );
    form.onsubmit = handleContactCreate;
  };
}

/**
 * Renders the detailed view of a selected contact.
 * Replaces the placeholder with the contact detail template and applies a fade-in animation.
 *
 * @param {{ name: string, email: string, phone?: string, initials: string, color: string }} contactData - The contact data used to populate the detail view.
 * @returns {void}
 */
export function renderContactDetail(contactData) {
  const placeholder = document.querySelector(".contact-detail-placeholder");
  const info = document.querySelector(".contact-info");
  if (!info) return;
  if (placeholder) placeholder.style.display = "none";

  info.innerHTML = contactDetailTemplate(contactData);

  info.classList.remove("fade-in");
  void info.offsetWidth;
  info.classList.add("fade-in");
  info.style.display = "block";
}
