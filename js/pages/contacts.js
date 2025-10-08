/**
 * Contacts-Seite für Kontaktverwaltung
 * @module contacts
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initContactsPage();

/**
 * Initialisiert die Contacts-Seite mit Authentication-Check und UI-Setup
 */
async function initContactsPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  bindContactList();
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

/**
 * Zeigt die Details eines ausgewählten Kontakts an
 * @param {HTMLElement} entry Das Kontakt-Element
 */
function showContactDetail(entry) {
  const name = entry.querySelector("h3")?.textContent || "";
  const mail = entry.querySelector("a")?.getAttribute("href") || "mailto:";
  const phone = entry.dataset.phone || "tel:+491111111111";
  updateDetailView(
    name,
    mail.replace("mailto:", ""),
    phone.replace("tel:", "")
  );
}

/**
 * Aktualisiert die Detailansicht mit Kontaktinformationen
 * @param {string} name Name des Kontakts
 * @param {string} mail E-Mail-Adresse
 * @param {string} phone Telefonnummer
 */
function updateDetailView(name, mail, phone) {
  setText("contactDetailName", name);
  setLink("contactDetailMail", `mailto:${mail}`, mail);
  setLink("contactDetailPhone", `tel:${phone}`, phone);
}

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

function handleContactCreate(event) {
  event.preventDefault();
  const data = {
    name: readValue("contactName"),
    email: readValue("contactEmail"),
    phone: readValue("contactPhone"),
  };
  if (!data.name || !data.email) return;
  appendContact(data);
  resetContactForm();
  toggleOverlay(false);
}

function appendContact(data) {
  const list = document.getElementById("contact-list");
  if (!list) return;
  const item = document.createElement("article");
  item.className = "contact-person";
  item.dataset.phone = `tel:${data.phone || "+49"}`;
  item.innerHTML = buildContactMarkup(data);
  item.addEventListener("click", () => showContactDetail(item));
  list.append(item);
}

function buildContactMarkup({ name, email }) {
  const initials = buildInitials(name);
  return `
    <div class="initals">${initials}</div>
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
