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
import { person, mail, call, check, close } from "../common/svg-template.js";
import {colorFromString} from "../board/utils.js"


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
  btn.addEventListener("click", () => toggleAddContactOverlay(true));
}

/**
 * Zeigt oder verbirgt das Add-Contact-Modal
 * @param {boolean} show - true zum Anzeigen, false zum Verbergen
 */
function toggleAddContactOverlay(show) {
  const overlay = document.getElementById("addContactOverlay");
  if (!overlay) return;
  if (show) overlay.removeAttribute("hidden");
  else overlay.setAttribute("hidden", "hidden");
}

/**
 * Extrahiert Kontakte aus Firebase Snapshot
 * @param {Object} snapshot - Firebase Snapshot
 * @returns {Array} Array von Kontakten
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
 * @param {Array} contacts - Array von Kontakten
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
 * @param {Array} contacts - Array von Kontakten
 * @returns {Object} Gruppierte Kontakte
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
 * Rendert gruppierte Kontakte in die Liste
 * @param {HTMLElement} list - Das Listen-Element
 * @param {Object} grouped - Gruppierte Kontakte
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
        item.innerHTML = buildContactMarkup(c);
        item.addEventListener("click", () => showContactDetail(item, c.key));
        list.appendChild(item);
      });
    });
}

/**
 * Zeigt die Details eines ausgewählten Kontakts an
 * @param {HTMLElement} entry - Das Kontakt-Element
 * @param {string} key - Der Firebase-Key des Kontakts
 */
function showContactDetail(entry, key) {
  selectedContactKey = key;
  const contact = contactsCache.find((c) => c.key === key);
  if (!contact) return;
  const initials = buildInitials(contact.name);
  const color = colorFromString(contact.name);
  renderContactDetail({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    initials,
    color,
  });
  setTimeout(bindEditDeleteButtons, 0);
}

/**
 * Bindet Event-Listener für Edit und Delete Buttons
 */
function bindEditDeleteButtons() {
  const editBtn = document.getElementById("editContactBtn");
  const deleteBtn = document.getElementById("deleteContactBtn");
  if (editBtn) editBtn.addEventListener("click", handleEditContact);
  if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteContact);
}

/**
 * Behandelt das Löschen eines Kontakts
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
 * Behandelt das Bearbeiten eines Kontakts
 */
function handleEditContact() {
  if (!selectedContactKey) return;
  const contact = contactsCache.find((c) => c.key === selectedContactKey);
  if (!contact) return;
  openEditModal(contact);
  setupEditFormHandler();
}

/**
 * Öffnet das Modal mit Kontaktdaten
 * @param {Object} contact - Das Kontakt-Objekt
 */
function openEditModal(contact) {
  toggleOverlay(true);
  document.getElementById("contactName").value = contact.name;
  document.getElementById("contactEmail").value = contact.email;
  document.getElementById("contactPhone").value = contact.phone || "";

  // Avatar im Edit-Modal aktualisieren
  const initials = buildInitials(contact.name);
  const color = colorFromString(contact.name);
  const initialsElem = document.getElementById("contactInitials");
  if (initialsElem) {
    initialsElem.textContent = initials;
    initialsElem.parentElement.style.backgroundColor = color;
  }
}

/**
 * Richtet den Submit-Handler für Bearbeitung ein
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
    toggleOverlay(false);
    showContactDetail(
      { dataset: { key: selectedContactKey } },
      selectedContactKey
    );
    form.onsubmit = handleContactCreate;
  };
}

/**
 * Rendert die Detailansicht eines Kontakts
 * @param {Object} contact - Kontakt-Objekt mit name, email, phone, initials, color
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
 * Bindet Event-Listener für Modal-Steuerung
 */
function bindModalControls() {
  // Avatar live aktualisieren beim Tippen
  const nameInput = document.getElementById("addContactName");
  if (nameInput) {
    nameInput.addEventListener("input", () => updateAddContactAvatar());
  }

  // --- ICONS RENDERN: Edit Contact Modal ---
  const contactModalCloseIcon = document.getElementById(
    "contactModalCloseIcon"
  );
  if (contactModalCloseIcon) {
    contactModalCloseIcon.innerHTML = close({
      class: "icon icon--btn",
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const contactNameIcon = document.getElementById("contactNameIcon");
  if (contactNameIcon) {
    contactNameIcon.innerHTML = person({
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const contactEmailIcon = document.getElementById("contactEmailIcon");
  if (contactEmailIcon) {
    contactEmailIcon.innerHTML = mail({
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const contactPhoneIcon = document.getElementById("contactPhoneIcon");
  if (contactPhoneIcon) {
    contactPhoneIcon.innerHTML = call({
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const contactSaveIcon = document.getElementById("contactSaveIcon");
  if (contactSaveIcon) {
    contactSaveIcon.innerHTML = check({
      class: "icon icon--btn btn__icon--right",
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  // --- ICONS RENDERN: Add Contact Modal ---
  const addContactModalCloseIcon = document.getElementById(
    "addContactModalCloseIcon"
  );
  if (addContactModalCloseIcon) {
    addContactModalCloseIcon.innerHTML = close({
      class: "icon icon--btn",
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const addContactNameIcon = document.getElementById("addContactNameIcon");
  if (addContactNameIcon) {
    addContactNameIcon.innerHTML = person({
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const addContactEmailIcon = document.getElementById("addContactEmailIcon");
  if (addContactEmailIcon) {
    addContactEmailIcon.innerHTML = mail({
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const addContactPhoneIcon = document.getElementById("addContactPhoneIcon");
  if (addContactPhoneIcon) {
    addContactPhoneIcon.innerHTML = call({
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const addContactCancelIcon = document.getElementById("addContactCancelIcon");
  if (addContactCancelIcon) {
    addContactCancelIcon.innerHTML = close({
      class: "icon icon--btn btn__icon--right",
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  const addContactCreateIcon = document.getElementById("addContactCreateIcon");
  if (addContactCreateIcon) {
    addContactCreateIcon.innerHTML = check({
      class: "icon icon--btn btn__icon--right",
      width: 24,
      height: 24,
      "aria-hidden": "true",
    });
  }

  /**
   * Aktualisiert den Avatar im Add-Contact-Modal live
   */
  function updateAddContactAvatar() {
    const name = document.getElementById("addContactName")?.value || "";
    const initials = buildInitials(name);
    const color = colorFromString(name || "?");
    const avatar = document.getElementById("addContactAvatar");
    const initialsElem = document.getElementById("addContactInitials");
    const placeholderImg = document.getElementById(
      "addContactAvatarPlaceholder"
    );

    if (avatar) avatar.style.backgroundColor = initials ? color : "";
    if (initialsElem) {
      initialsElem.textContent = initials || "?";
      initialsElem.style.display = initials ? "block" : "none";
    }
    if (placeholderImg) {
      placeholderImg.style.display = initials ? "none" : "block";
    }
  }

  // Add-Contact-Modal Controls
  const addCloseBtn = document.getElementById("addContactModalClose");
  const addCancelBtn = document.getElementById("addContactCancelBtn");
  const addForm = document.getElementById("addContactForm");

  if (addCloseBtn) {
    addCloseBtn.addEventListener("click", () => {
      resetAddContactForm();
      updateAddContactAvatar();
      toggleAddContactOverlay(false);
    });
  }

  if (addCancelBtn) {
    addCancelBtn.addEventListener("click", () => {
      resetAddContactForm();
      updateAddContactAvatar();
      toggleAddContactOverlay(false);
    });
  }

  if (addForm) {
    addForm.addEventListener("submit", handleAddContactCreate);
  }

  /**
   * Behandelt das Erstellen eines neuen Kontakts aus dem Add-Contact-Modal
   * @param {Event} event - Das Submit-Event
   */
  async function handleAddContactCreate(event) {
    event.preventDefault();
    const data = {
      name: readValue("addContactName"),
      email: readValue("addContactEmail"),
      phone: readValue("addContactPhone"),
    };
    if (!data.name || !data.email) return;
    await saveContactToFirebase(data);
    resetAddContactForm();
    updateAddContactAvatar();
    toggleAddContactOverlay(false);
  }

  /**
   * Setzt das Add-Contact-Formular zurück
   */
  function resetAddContactForm() {
    ["addContactName", "addContactEmail", "addContactPhone"].forEach((id) => {
      const field = document.getElementById(id);
      if (field) field.value = "";
    });
  }

  // Edit-Contact-Modal Controls
  const closeBtn = document.getElementById("contactModalClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      resetContactForm();
      toggleOverlay(false);
    });
  }
}

/**
 * Zeigt oder verbirgt das Modal-Overlay
 * @param {boolean} show - true zum Anzeigen, false zum Verbergen
 */
function toggleOverlay(show) {
  const overlay = document.getElementById("contactOverlay");
  if (!overlay) return;
  if (show) overlay.removeAttribute("hidden");
  else overlay.setAttribute("hidden", "hidden");
}

/**
 * Behandelt das Erstellen eines neuen Kontakts
 * @param {Event} event - Das Submit-Event
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
 * Speichert einen neuen Kontakt in Firebase
 * @param {Object} data - Die Kontaktdaten
 */
async function saveContactToFirebase(data) {
  const contactsRef = ref(db, "/contacts");
  await set(push(contactsRef), data);
}

/**
 * Erstellt das HTML-Markup für einen Kontakt
 * @param {Object} contact - Das Kontakt-Objekt
 * @returns {string} HTML-String
 */
function buildContactMarkup({ name, email }) {
  const initials = buildInitials(name);
  const color = colorFromString(name);
  return `<div class="initals" style="background-color: ${color};">${initials}</div>
    <div class="small-info"><h3>${name}</h3><span>${email}</span></div>`;
}

/**
 * Setzt das Kontaktformular zurück
 */
function resetContactForm() {
  ["contactName", "contactEmail", "contactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}

/**
 * Liest den Wert aus einem Input-Feld
 * @param {string} id - Die ID des Input-Feldes
 * @returns {string} Der getrimmte Wert
 */
function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Erstellt Initialen aus einem Namen
 * @param {string} name - Der vollständige Name
 * @returns {string} Die Initialen (max. 2 Buchstaben)
 */
function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
}
