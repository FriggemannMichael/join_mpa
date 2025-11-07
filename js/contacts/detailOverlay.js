import{clearActiveContacts} from "../contacts/helper.js"
import { close, icons, } from "../common/svg-template.js";

/**
 * Opens the contact detail overlay in mobile view.
 * Sets accessibility attributes, updates the back icon,
 * focuses the first interactive element, and shows the edit/delete menu.
 *
 * @returns {void} Nothing is returned; updates the DOM and accessibility state.
 */
export function openContactDetailOverlay() {
    const listSection = document.querySelector(".contacts-list-section");
    const detail = document.querySelector(".contact-detail-section");
    const menuBtn = document.getElementById("contactsEditDelete");
    detail.classList.add("is-open");
    detail.setAttribute("aria-hidden", "false");
    const modal = document.getElementById("closeDetails");
    modal.innerHTML = `${icons.arrowback}`;
    if ("inert" in HTMLElement.prototype && listSection) listSection.inert = true;
    detail.querySelector('h1, h2, button, a, [tabindex="0"]')?.focus();
    menuBtn.classList.remove("menu-hidden");
}


/**
 * Closes the contact detail overlay in mobile view.
 * Restores accessibility state, hides the edit/delete menu,
 * and returns focus to the contact list.
 *
 * @returns {void} Nothing is returned; updates the DOM and accessibility attributes.
 */
export function closeContactDetailOverlay() {
    const menuBtn = document.getElementById("contactsEditDelete");
    const listSection = document.querySelector(".contacts-list-section");
    const detail = document.querySelector(".contact-detail-section");
    detail.classList.remove("is-open");
    detail.setAttribute("aria-hidden", "true");
    if ("inert" in HTMLElement.prototype && listSection)
        listSection.inert = false;
    document.getElementById("contact-list")?.focus();
    menuBtn.classList.add("menu-hidden");
    clearActiveContacts()
}