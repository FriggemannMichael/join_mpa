import { colorFromString, getInitials } from "../board/utils.js";
import { contactDetailTemplate } from "../contacts/templates.js";
import { db } from "../common/firebase.js";
import { ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { guardPage } from "../common/pageGuard.js"
import { bootLayout } from "../common/layout.js";
import { close, icons, } from "../common/svg-template.js";

import { openAddContactModal, bindAddContactControls, renderAddContactModalIcons, updateAddContactAvatar } from "../contacts/addContacts.js";
import { handleEditContact, handleDeleteContact, showContactDetail, renderContactList } from "../contacts/contactCache.js";
import { bindEditContactControls } from "../contacts/editContacts.js"
import { initEditDeleteRespMenu } from "../contacts/responsiveHandler.js"
import { readValue } from "../contacts/helper.js"
import { closeContactDetailOverlay } from "../contacts/detailOverlay.js"
import { showAlert } from "../common/alertService.js";


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
    document
        .querySelector(".contact-detail-section .close-detail")
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

/**
 * Renders the "Add new Contact" button in the contact list actions area.
 * Clears any existing buttons, creates a new one, and binds the modal opening event.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
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
    btn.addEventListener("click", openAddContactModal);
}


/**
 * Groups contacts alphabetically by the first letter of their name.
 * Unknown or missing names are grouped under "?".
 *
 * @param {Array<Object>} contacts - The list of contacts to group.
 * @returns {Object<string, Array<Object>>} An object with letters as keys and contact arrays as values.
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
 * Binds an input listener to the name field in the add contact form.
 * Updates the avatar initials and color dynamically as the user types.
 *
 * @returns {void} Nothing is returned; attaches an input listener to the DOM element.
 */
function bindAddContactAvatarInput() {
    const nameInputField = document.getElementById("addContactName");
    if (nameInputField)
        nameInputField.addEventListener("input", updateAddContactAvatar);
}

/**
 * Binds click events for all edit and delete contact buttons.
 * Supports both desktop and responsive button variants.
 *
 * @returns {void} Nothing is returned; attaches event listeners to the DOM.
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
 * Renders all grouped contacts into the contact list element.
 * @param {HTMLElement} list - The DOM element where the contacts will be rendered.
 * @param {Object<string, Array<Object>>} grouped - Contacts grouped by their starting letter.
 * @returns {void}
 */
export function renderGroupedContacts(list, grouped) {
    Object.keys(grouped)
        .sort()
        .forEach((letter) => {
            renderContactGroup(list, letter, grouped[letter]);
        });
}

/**
 * Renders a single contact group with header and contacts.
 * @param {HTMLElement} list - The list container.
 * @param {string} letter - The starting letter.
 * @param {Array<Object>} contacts - Contacts in this group.
 * @returns {void}
 */
function renderContactGroup(list, letter, contacts) {
    appendGroupHeader(list, letter);
    appendGroupSeparator(list);
    contacts.forEach((c) => appendContactItem(list, c));
}

/**
 * Appends a group header for a letter.
 * @param {HTMLElement} list - The list container.
 * @param {string} letter - The starting letter.
 * @returns {void}
 */
function appendGroupHeader(list, letter) {
    const p = document.createElement("p");
    p.className = "beginning-letter";
    p.textContent = letter;
    list.appendChild(p);
}

/**
 * Appends a separator between header and contacts.
 * @param {HTMLElement} list - The list container.
 * @returns {void}
 */
function appendGroupSeparator(list) {
    const sep = document.createElement("div");
    sep.className = "contact-seperator";
    list.appendChild(sep);
}

/**
 * Appends a single contact item to the list.
 * @param {HTMLElement} list - The list container.
 * @param {Object} c - The contact object.
 * @returns {void}
 */
function appendContactItem(list, c) {
    const item = document.createElement("article");
    item.className = "contact-person";
    item.dataset.phone = `tel:${c.phone || ""}`;
    item.dataset.key = c.key;
    item.dataset.contactId = c.key;
    item.tabIndex = 0;
    item.innerHTML = buildContactMarkup(c);
    item.addEventListener("click", () => showContactDetail(item, c.key));
    list.appendChild(item);
}


/**
 * Renders the detailed contact view with full contact information.
 * @param {Object} data - The contact data.
 * @returns {void}
 */
export function renderContactDetail({ name, email, phone, initials, color }) {
    const info = document.querySelector(".contact-info");
    if (!info) return;

    hidePlaceholder();
    injectContactTemplate(info, { name, email, phone, initials, color });
    triggerFadeInAnimation(info);
}


/**
 * Hides the contact detail placeholder.
 * @returns {void}
 */
function hidePlaceholder() {
    const placeholder = document.querySelector(".contact-detail-placeholder");
    if (placeholder) placeholder.style.display = "none";
}


/**
 * Injects the contact detail template into the info container.
 * @param {HTMLElement} info - The contact info container.
 * @param {Object} data - The contact data.
 * @returns {void}
 */
function injectContactTemplate(info, data) {
    info.innerHTML = contactDetailTemplate(data);
}


/**
 * Triggers a fade-in animation for the contact info.
 * @param {HTMLElement} info - The contact info element.
 * @returns {void}
 */
function triggerFadeInAnimation(info) {
    info.classList.remove("fade-in");
    void info.offsetWidth;
    info.classList.add("fade-in");
    info.style.display = "block";
}


/**
 * Renders the close icon inside the edit contact modal.
 * Inserts the SVG icon markup into the close button container.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
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
 * Resets all input fields in the add contact form.
 * Clears name, email, and phone values.
 *
 * @returns {void} Nothing is returned; resets the form fields directly.
 */
export function resetAddContactForm() {
    ["addContactName", "addContactEmail", "addContactPhone"].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });
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
export async function saveContactToFirebase(data) {
    const contactsRef = ref(db, "/contacts");
    await set(push(contactsRef), data);
    showAlert("createContact")
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
 * Resets all input fields in the edit contact form
 * Clears the values for name, email, and phone and removes all validation states
 *
 * @returns {void} Nothing is returned; resets the form fields directly.
 */
export function resetContactForm() {
    ["contactName", "contactEmail", "contactPhone"].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });
}


/**
 * Inserts the close icons into both contact modals.
 * Updates the inner HTML of the close buttons with the close SVG icon.
 *
 * @returns {void} Nothing is returned; updates the DOM elements directly.
 */
export function insertCloseBtn() {
    document.getElementById("contactModalClose").innerHTML = icons.close;
    document.getElementById("addContactModalClose").innerHTML = icons.close;
}


