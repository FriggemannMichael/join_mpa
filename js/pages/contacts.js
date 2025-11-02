/**
 * Contacts-Seite für Kontaktverwaltung
 * @module contacts
 */

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

/**
 * Generiert eine Farbe basierend auf den Initialen
 * @param {string} initials - Die Initialen des Kontakts
 * @returns {string} Hex-Farbcode
 */
function getColorForInitials(initials) {
  const colors = [
    "#FF6B6B",
    "#00B8D4",
    "#1DE9B6",
    "#00CFAE",
    "#00BCD4",
    "#2196F3",
    "#3D5AFE",
    "#7C4DFF",
    "#AB47BC",
    "#E040FB",
  ];
  const charCode = initials.charCodeAt(0);
  return colors[charCode % colors.length];
}

initContactsPage();

/**
 * Initialisiert die Contacts-Seite mit Authentication-Check und UI-Setup
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
 * Lädt Kontakte aus Firebase und rendert die Liste
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
 * Rendert den "Add new Contact"-Button oberhalb der Kontaktliste
 */
function renderAddButton() {
  const actions = document.getElementById("contact-list-actions");
  if (!actions) return;
  actions.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "contact-btn";
  btn.type = "button";
  btn.id = "addNewContactBtn";
  btn.innerHTML = `Add new Contact<img src="./img/icon/person_add.png" alt="add Person" />`;
  actions.appendChild(btn);
  btn.addEventListener("click", openAddContactModal);
}

/**
 * Extrahiert Kontakte aus Firebase Snapshot
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
 * Rendert die Kontaktliste gruppiert nach Anfangsbuchstaben
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
 * Gruppiert Kontakte nach Anfangsbuchstaben
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
 * Rendert gruppierte Kontakte
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
 * Zeigt Details eines Kontakts
 */
function showContactDetail(entry, key) {
  selectedContactKey = key;
  const contact = contactsCache.find((c) => c.key === key);
  if (!contact) return;
  const initials = buildInitials(contact.name);
  const color = getColorForInitials(initials);
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
 * Bindet Buttons für Edit & Delete
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
  if (editBtn) editBtn.addEventListener("click", handleEditContact);
  if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteContact);
}

/**
 * Kontakt löschen
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
  } catch (error) {
    alert("Fehler beim Löschen: " + error.message);
  }
}

/**
 * Kontakt bearbeiten
 */
function handleEditContact() {
  if (!selectedContactKey) return;
  const contact = contactsCache.find((c) => c.key === selectedContactKey);
  if (!contact) return;
  openEditModal(contact);
  setupEditFormHandler();
}

/**
 * Edit-Modal öffnen
 */
function openEditModal(contact) {
  openEditOverlay();

  document.getElementById("contactName").value = contact.name;
  document.getElementById("contactEmail").value = contact.email;
  document.getElementById("contactPhone").value = contact.phone || "";

  const initials = buildInitials(contact.name);
  const color = getColorForInitials(initials);
  const initialsElem = document.getElementById("contactInitials");
  if (initialsElem) {
    initialsElem.textContent = initials;
    initialsElem.parentElement.style.backgroundColor = color;
  }

  document.getElementById("editDeleteModal").classList.remove("menu-hidden")
}

/**
 * Submit für Edit-Form
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
 * Detailbereich eines Kontakts rendern
 */
function renderContactDetail({ name, email, phone, initials, color }) {
  const placeholder = document.querySelector(".contact-detail-placeholder");
  const info = document.querySelector(".contact-info");
  if (!info) return;
  if (placeholder) placeholder.style.display = "none";
  info.innerHTML = `
    <div class="contact-big">
      <div class="initals-big" style="background-color: ${color};">${initials}</div>
      <div class="name-big">
        <span id="contactDetailName">${name}</span>
        <div class="changebtns">
          <button type="button" id="editContactBtn">
            <img src="./img/icon/edit.svg" alt="Edit">Edit
          </button>
          <button type="button" id="deleteContactBtn">
            <img src="./img/icon/delete.svg" alt="Delete">Delete
          </button>
        </div>
      </div>
    </div>
    <div class="contact-big-information">
      <span>Contact Information</span>
      <div class="contact-deep-info">
        <div class="contact-mail">
          <span>E-Mail</span>
          <a id="contactDetailMail" href="mailto:${email}">${email}</a>
        </div>
        <div class="contact-phone">
          <span>Phone</span>
          <a id="contactDetailPhone" href="tel:${phone}">${phone}</a>
        </div>
      </div>
    </div>
  `;
  info.style.display = "block";
}

/**
 * MODAL-STEUERUNG
 */
function bindModalControls() {
  renderEditContactModalIcons();
  renderAddContactModalIcons();
  bindAddContactAvatarInput();
  bindAddContactControls();
  bindEditContactControls();
}

// ==========================================
// ADD CONTACT – MODAL OPEN/CLOSE + LISTENERS
// ==========================================
function openAddContactModal() {
  const overlayElement = document.getElementById("addContactOverlay");
  if (!overlayElement) return;
  overlayElement.removeAttribute("hidden");
  updateAddContactAvatar();
  addModalCloseListeners(overlayElement, closeAddContactModal);
  document.getElementById("addContactName")?.focus();
}

function closeAddContactModal() {
  const overlayElement = document.getElementById("addContactOverlay");
  if (!overlayElement) return;
  overlayElement.setAttribute("hidden", "hidden");
  resetAddContactForm();
  updateAddContactAvatar();
  document.getElementById("editDeleteModal").classList.add("menu-hidden")
}

/**
 * Outside-Click + ESC für Modals
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

// ==========================================
// ADD CONTACT – ICONS, AVATAR & FORM
// ==========================================
function renderEditContactModalIcons() {
  const closeIconContainer = document.getElementById("contactModalCloseIcon");
  if (closeIconContainer) {
    closeIconContainer.innerHTML = close({ class: "icon icon--btn", width: 24, height: 24 });
  }
}

function renderAddContactModalIcons() {
  const closeIconContainer = document.getElementById("addContactModalCloseIcon");
  if (closeIconContainer) {
    closeIconContainer.innerHTML = close({ class: "icon icon--btn", width: 24, height: 24 });
  }
}

function bindAddContactAvatarInput() {
  const nameInputField = document.getElementById("addContactName");
  if (nameInputField) nameInputField.addEventListener("input", updateAddContactAvatar);
}

function updateAddContactAvatar() {
  const nameInputField = document.getElementById("addContactName");
  const avatarContainer = document.getElementById("addContactAvatar");
  const initialsContainer = document.getElementById("addContactInitials");
  const placeholderImage = document.getElementById("addContactAvatarPlaceholder");

  const nameValue = nameInputField?.value?.trim() || "";
  const initials = buildInitials(nameValue) || "?";
  const color = getColorForInitials(initials);

  if (avatarContainer) avatarContainer.style.backgroundColor = nameValue ? color : "";
  if (initialsContainer) {
    initialsContainer.textContent = initials;
    initialsContainer.style.display = nameValue ? "block" : "none";
  }
  if (placeholderImage) placeholderImage.style.display = nameValue ? "none" : "block";
}

function bindAddContactControls() {
  const closeButton = document.getElementById("addContactModalClose");
  const cancelButton = document.getElementById("addContactCancelBtn");
  const formElement = document.getElementById("addContactForm");

  if (closeButton) closeButton.addEventListener("click", closeAddContactModal);
  if (cancelButton) cancelButton.addEventListener("click", closeAddContactModal);
  if (formElement) formElement.addEventListener("submit", handleAddContactSubmit);
}

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

function resetAddContactForm() {
  ["addContactName", "addContactEmail", "addContactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}

// ==========================================
// EDIT CONTACT – FORM
// ==========================================
function bindEditContactControls() {
  const closeButton = document.getElementById("contactModalClose");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      resetContactForm();
      closeEditOverlay();
    });
  }
}



function openEditOverlay() {
  const overlayElement = document.getElementById("contactOverlay");
  if (!overlayElement) return;
  overlayElement.removeAttribute("hidden");
  addModalCloseListeners(overlayElement, closeEditOverlay);
}

function closeEditOverlay() {
  const overlayElement = document.getElementById("contactOverlay");
  if (!overlayElement) return;
  overlayElement.setAttribute("hidden", "hidden");
}
/**
 * Zeigt oder verbirgt das Modal-Overlay
 */
function toggleOverlay(show) {
  const overlay = document.getElementById("contactOverlay");
  if (!overlay) return;
  if (show) overlay.removeAttribute("hidden");
  else overlay.setAttribute("hidden", "hidden");
}

/**
 * Behandelt das Erstellen eines neuen Kontakts
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
 * Speichert neuen Kontakt in Firebase
 */
async function saveContactToFirebase(data) {
  const contactsRef = ref(db, "/contacts");
  await set(push(contactsRef), data);
}

/**
 * Erstellt HTML für Kontaktkarte
 */
function buildContactMarkup({ name, email }) {
  const initials = buildInitials(name);
  const color = getColorForInitials(initials);
  return `<div class="initals" style="background-color: ${color};">${initials}</div>
    <div class="small-info"><h3>${name}</h3><span>${email}</span></div>`;
}

/**
 * Reset Formulare
 */
function resetContactForm() {
  ["contactName", "contactEmail", "contactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}

/**
 * Liest Wert aus Input
 */
function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Erstellt Initialen aus Name
 */
function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

// Marc Responsiv 

function openContactDetailOverlay() {
  const listSection = document.querySelector('.contacts-list-section');
  const detail = document.querySelector('.contact-detail-section');
  const menuBtn = document.getElementById("contactsEditDelete")
  detail.classList.add('is-open');
  detail.setAttribute('aria-hidden', 'false');
  const modal = document.getElementById("closeDetails")
  modal.innerHTML = `${icons.arowback}`
  if ('inert' in HTMLElement.prototype && listSection) listSection.inert = true;
  detail.querySelector('h1, h2, button, a, [tabindex="0"]')?.focus();
  menuBtn.classList.remove("menu-hidden")
}

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


document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.matchMedia('(max-width: 58rem)').matches) {
    closeContactDetailOverlay();
  }
});

// Breakpoint-Wechsel: Desktop => Overlay-Zustand zurücksetzen
window.addEventListener('resize', () => {
  const listSection = document.querySelector('.contacts-list-section');
  const detail = document.querySelector('.contact-detail-section');
  if (!window.matchMedia('(max-width: 58rem)').matches) {
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'false');
    if ('inert' in HTMLElement.prototype && listSection) listSection.inert = false;
  }
});

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

  document.addEventListener("click", e => {
    if (!menu.classList.contains("menu-hidden") && !menu.contains(e.target) && e.target !== btn) {
      menu.classList.add("menu-hidden")
      bindEditDeleteButtons()
    }
  })

  document.addEventListener("keydown", e => {
    if (!menu.classList.contains("menu-hidden") && e.key === "Escape") {
      menu.classList.add("menu-hidden")
      bindEditDeleteButtons()
    }
  })
}

function insertCloseBtn() {
  document.getElementById("contactModalClose").innerHTML = icons.close;
  document.getElementById("addContactModalClose").innerHTML = icons.close;
}


window.addEventListener('resize', () => {
  const btn = document.getElementById('contactsEditDelete');
  if (!btn) return;
  if (window.innerWidth > 768) {
    btn.classList.add('menu-hidden');
  }
});

