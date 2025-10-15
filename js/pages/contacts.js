// Farb-Logik aus add-task.js übernommen
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
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
 * Bindet Event-Listener für die Kontaktliste
 */

function bindContactList() {
  document.querySelectorAll(".contact-person").forEach((entry) => {
    entry.addEventListener("click", () => showContactDetail(entry));
  });
}

async function loadAndRenderContacts() {
  const list = document.getElementById("contact-list");
  if (!list) return;
  list.innerHTML = `
    <button class="contact-btn" type="button" id="addNewContactBtn">
      Add new Contact
      <img src="./img/icon/person_add.png" alt="add Person" />
    </button>
  `;
  const contactsRef = ref(db, "/contacts");
  onValue(contactsRef, (snapshot) => {
    // Nach Anfangsbuchstaben gruppieren
    const contacts = [];
    snapshot.forEach((child) => {
      const val = child.val();
      contacts.push({ key: child.key, ...val });
    });
    renderContactList(contacts);
  });
}

let contactsCache = [];
let selectedContactKey = null;

function renderContactList(contacts) {
  // Kontakte ohne Name oder E-Mail herausfiltern
  contacts = contacts.filter((c) => c.name && c.email);
  contactsCache = contacts;
  const list = document.getElementById("contact-list");
  if (!list) return;
  // Button bleibt oben
  const addBtn = list.querySelector(".contact-btn");
  list.innerHTML = "";
  if (addBtn) list.appendChild(addBtn);
  if (!contacts.length) return;
  // Nach Anfangsbuchstaben gruppieren
  const grouped = {};
  contacts.forEach((c) => {
    const letter = (c.name?.[0] || "?").toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });
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
 * @param {HTMLElement} entry Das Kontakt-Element
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
}

function bindEditDeleteButtons() {
  const editBtn = document.getElementById("editContactBtn");
  const deleteBtn = document.getElementById("deleteContactBtn");
  if (editBtn) editBtn.addEventListener("click", handleEditContact);
  if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteContact);
}

async function handleDeleteContact() {
  if (!selectedContactKey) return;
  if (!confirm("Kontakt wirklich löschen?")) return;
  try {
    const { ref: dbRef, remove } = await import(
      "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"
    );
    const contactRef = dbRef(db, `/contacts/${selectedContactKey}`);
    await remove(contactRef);
    selectedContactKey = null;
    // Nach dem Löschen: Detailansicht leeren
    const info = document.querySelector(".contact-info");
    if (info) info.innerHTML = "";
  } catch (e) {
    alert("Fehler beim Löschen des Kontakts.");
    console.error(e);
  }
}

function handleEditContact() {
  if (!selectedContactKey) return;
  const contact = contactsCache.find((c) => c.key === selectedContactKey);
  if (!contact) return;
  // Modal öffnen und Felder füllen
  toggleOverlay(true);
  document.getElementById("contactName").value = contact.name;
  document.getElementById("contactEmail").value = contact.email;
  document.getElementById("contactPhone").value = contact.phone || "";
  // Submit-Handler anpassen
  const form = document.getElementById("contactForm");
  if (form) {
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = {
        name: readValue("contactName"),
        email: readValue("contactEmail"),
        phone: readValue("contactPhone"),
      };
      if (!data.name || !data.email) return;
      await updateContactInFirebase(selectedContactKey, data);
      resetContactForm();
      toggleOverlay(false);
      // Nach dem Editieren: Detailansicht aktualisieren
      showContactDetail(
        { dataset: { key: selectedContactKey } },
        selectedContactKey
      );
      // Submit-Handler zurücksetzen
      form.onsubmit = handleContactCreate;
    };
  }
}

async function updateContactInFirebase(key, data) {
  const { ref: dbRef, update } = await import(
    "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"
  );
  const contactRef = dbRef(db, `/contacts/${key}`);
  await update(contactRef, data);
}

function renderContactDetail({ name, email, phone, initials, color }) {
  const info = document.querySelector(".contact-info");
  if (!info) return;
  info.innerHTML = `
    <div class="contact-headline">
      <h3>Contacts</h3>
      <div class="headline-seperator"></div>
      <span>Better with a team</span>
    </div>
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
}

/**
 * Aktualisiert die Detailansicht mit Kontaktinformationen
 * @param {string} name Name des Kontakts
 * @param {string} mail E-Mail-Adresse
 * @param {string} phone Telefonnummer
 */

// updateDetailView entfällt, da die Detailansicht komplett gerendert wird

/**
 * Bindet Event-Listener für Modal-Steuerung
 */
function bindModalControls() {
  const openBtn = document.getElementById("addNewContactBtn");
  const closeBtn = document.getElementById("contactModalClose");
  const cancelBtn = document.getElementById("contactCancelBtn");
  const form = document.getElementById("contactForm");
  if (openBtn) openBtn.addEventListener("click", () => toggleOverlay(true));
  if (closeBtn) closeBtn.addEventListener("click", () => toggleOverlay(false));
  if (cancelBtn)
    cancelBtn.addEventListener("click", () => toggleOverlay(false));
  if (form) form.addEventListener("submit", handleContactCreate);
}

function toggleOverlay(show) {
  const overlay = document.getElementById("contactOverlay");
  if (!overlay) return;
  if (show) overlay.removeAttribute("hidden");
  else overlay.setAttribute("hidden", "hidden");
}

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

async function saveContactToFirebase(data) {
  const contactsRef = ref(db, "/contacts");
  const newRef = push(contactsRef);
  await set(newRef, data);
}

// appendContact entfällt, da alles über Firebase läuft

function buildContactMarkup({ name, email }) {
  const initials = buildInitials(name);
  const color = getColorForInitials(initials);
  return `
    <div class="initals" style="background-color: ${color};">${initials}</div>
    <div class="small-info">
      <h3>${name}</h3>
      <a href="mailto:${email}">${email}</a>
    </div>`;
}

function resetContactForm() {
  ["contactName", "contactEmail", "contactPhone"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
}

function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setLink(id, href, text) {
  const node = document.getElementById(id);
  if (!node) return;
  node.href = href;
  node.textContent = text;
}
