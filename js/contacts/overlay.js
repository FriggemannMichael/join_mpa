import { icons } from "../common/svg-template.js";
import { bindEditDeleteButtons } from "./detail.js";


/**
 * Opens the contact detail overlay in responsive (mobile) view.
 * Activates the detail section, hides the list section for accessibility, 
 * sets the back icon, and focuses the first interactive element.
 *
 * @returns {void}
 */
export function openContactDetailOverlay() {
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


/**
 * Closes the contact detail overlay in responsive (mobile) view.
 * Restores visibility to the contact list, updates accessibility attributes,
 * and hides the edit/delete menu button.
 *
 * @returns {void}
 */
export function closeContactDetailOverlay() {
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
 * Initializes the responsive edit/delete menu for the contact detail view.
 * Handles opening and closing of the menu via click or Escape key,
 * and rebinds the edit/delete button listeners when the menu state changes.
 *
 * @returns {void}
 */
export function initEditDeleteRespMenu() {
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


/**
 * Inserts the close icons into both the edit and add contact modals.
 * Replaces the modal close button content with the SVG close icon.
 *
 * @returns {void}
 */
export function insertCloseBtn() {
  document.getElementById("contactModalClose").innerHTML = icons.close;
  document.getElementById("addContactModalClose").innerHTML = icons.close;
}


/**
 * Closes the contact detail overlay when pressing Escape on mobile view.
 * Listens globally for the Escape key and triggers the close handler 
 * if the screen width matches the mobile breakpoint.
 *
 * @listens document:keydown
 * @param {KeyboardEvent} e - The keydown event object.
 * @returns {void}
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.matchMedia('(max-width: 58rem)').matches) {
    closeContactDetailOverlay();
  }
});


/**
 * Handles responsive layout adjustments on window resize.
 * Ensures the contact detail overlay and edit/delete menu adapt to screen width changes.
 * Closes the overlay on desktop view and hides the responsive menu button when necessary.
 *
 * @listens window:resize
 * @returns {void}
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
