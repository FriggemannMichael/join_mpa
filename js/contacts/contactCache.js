
import { db } from "../common/firebase.js";
import { ref, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getInitials, colorFromString } from "../board/utils.js";
import { openEditModal, closeEditOverlay } from "./editContacts.js";
import { resetContactForm, renderContactDetail, renderGroupedContacts, groupContactsByLetter, renderAddButton, handleContactCreate, bindEditDeleteButtons } from "../pages/contacts.js";
import { confirmModal } from "../board/modals/confirmModal.js";
import { closeContactDetailOverlay, openContactDetailOverlay } from "./detailOverlay.js"
import { readValue } from "./helper.js"

let contactsCache = [];
let selectedContactKey = null;

/**
 * Displays the detailed view for a selected contact.
 * Finds the contact from cache, builds its detail data,
 * and opens the detail overlay depending on screen size.
 *
 * @param {HTMLElement} entry - The clicked contact list element.
 * @param {string} key - The unique Firebase key of the selected contact.
 * @returns {void} Nothing is returned; updates the DOM and opens the detail view.
 */
export function showContactDetail(entry, key) {
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
 * Global keyboard listener for closing the contact detail overlay.
 * Listens for the Escape key and closes the overlay on smaller screens (≤ 58 rem).
 *
 * @returns {void} Nothing is returned; registers a global event listener.
 */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && window.matchMedia("(max-width: 58rem)").matches) {
        closeContactDetailOverlay();
    }
});

/**
 * Opens the edit modal for the currently selected contact.
 * Finds the contact from cache and initializes the edit form handler.
 *
 * @returns {void} Nothing is returned; triggers the edit modal setup.
 */
export function handleEditContact() {
    if (!selectedContactKey) return;
    const contact = contactsCache.find((c) => c.key === selectedContactKey);
    if (!contact) return;
    openEditModal(contact);
    setupEditFormHandler();
}


/**
 * Renders the full contact list into the DOM.
 * Filters out invalid contacts, caches them, groups them alphabetically,
 * and renders each group with its contacts.
 *
 * @param {Array<Object>} contacts - The list of contacts to render.
 * @returns {void} Nothing is returned; updates the DOM directly.
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
 * Deletes the currently selected contact from Firebase.
 * Confirms the action with the user, removes the contact,
 * and resets the contact detail view on success.
 *
 * @async
 * @returns {Promise<void>} Resolves when the contact has been deleted and the UI is updated.
 */
export async function handleDeleteContact() {
    if (!selectedContactKey) return;
    confirmModal("Confirm Delete Contact?", async () => {
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
        }
    });
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
        showContactDetail(
            { dataset: { key: selectedContactKey } },
            selectedContactKey
        );
        form.onsubmit = handleContactCreate;
    };
}
