import { renderGroupedContacts, buildContactMarkup } from "./list.js"; // self import hint removed by bundlers
import { showContactDetail } from "./detail.js";


/**
 * Renders the "Add new Contact" button above the contact list.
 * Creates the button dynamically and binds the click event to open the add-contact modal.
 *
 * @returns {void}
 */
export function renderAddButton() {
  const actions = document.getElementById("contact-list-actions");
  if (!actions) return;
  actions.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "contact-btn";
  btn.type = "button";
  btn.id = "addNewContactBtn";
  btn.innerHTML = `Add new Contact<img src="./assets/icons/person_add.png" alt="add Person" />`;
  actions.appendChild(btn);
  // openAddContactModal kommt aus modals.js; Listener wird dort gebunden
}


/**
 * Renders the full contact list grouped by the first letter of each contact's name.
 * Filters invalid entries, updates the cache, and injects the "Add new Contact" button.
 *
 * @param {Array<{ name: string, email: string, phone?: string, key?: string }>} contacts - The list of contacts to render.
 * @returns {void}
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
 * Groups contacts by the first letter of their name.
 * Creates an object where each key is an uppercase letter and the value is an array of contacts.
 *
 * @param {Array<{ name: string, email: string, phone?: string, key?: string }>} contacts - The list of contacts to group.
 * @returns {Record<string, Array<{ name: string, email: string, phone?: string, key?: string }>>} An object with contacts grouped by their initial letter.
 */
export function groupContactsByLetter(contacts) {
  const grouped = {};
  contacts.forEach((c) => {
    const letter = (c.name?.[0] || "?").toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });
  return grouped;
}


/**
 * Renders all contacts grouped by their initial letter into the given list element.
 * Creates letter headers, separators, and clickable contact entries for each contact.
 *
 * @param {HTMLElement} list - The container element where grouped contacts are rendered.
 * @param {Record<string, Array<{ name: string, email: string, phone?: string, key?: string }>>} grouped - Contacts grouped by their initial letter.
 * @returns {void}
 */
export function renderGroupedContacts(list, grouped) {
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


export let contactsCache = [];
export let selectedContactKey = null;


/**
 * Builds the HTML markup for a single contact entry in the list.
 * Generates the contact's initials and color, and returns a formatted HTML string.
 *
 * @param {{ name: string, email: string }} contact - The contact data used to build the markup.
 * @returns {string} The HTML string representing the contact list item.
 */
export async function buildContactMarkup({ name, email }) {
  const { colorFromString, getInitials } = await import("../board/utils.js");
  const initials = getInitials(name);
  const color = colorFromString(name);
  return `<div class="initals" style="background-color: ${color};">${initials}</div>
    <div class="small-info"><h3>${name}</h3><span>${email}</span></div>`;
}
