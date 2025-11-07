import { close, icons, } from "../common/svg-template.js";
import {bindEditDeleteButtons} from "../pages/contacts.js" 

/**
 * Initializes the responsive edit/delete menu for contact details.
 * Sets up all necessary event listeners for button clicks, outside clicks, and Escape key handling.
 *
 * @returns {void} Nothing is returned; initializes menu interactions and event bindings.
 */
export function initEditDeleteRespMenu() {
    const btn = document.getElementById("contactsEditDelete");
    const menu = document.getElementById("editDeleteModal");
    if (!btn || !menu) return;

    setupEditDeleteButton(btn, menu);
    setupOutsideClickHandler(btn, menu);
    setupEscapeKeyHandler(menu);
}


/**
 * Initializes the edit/delete menu button behavior.
 * Renders the menu icon and toggles the menu visibility when clicked.
 *
 * @param {HTMLElement} btn - The button element that opens or closes the menu.
 * @param {HTMLElement} menu - The menu element to show or hide.
 * @returns {void} Nothing is returned; attaches the click event handler.
 */
function setupEditDeleteButton(btn, menu) {
    btn.innerHTML = icons.menuDots;
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu(menu);
    });
}


/**
 * Sets up a global click listener to close the edit/delete menu when clicking outside of it.
 * Keeps the menu open when clicking on the button, inside the menu, or within the contact overlay.
 *
 * @param {HTMLElement} btn - The button that toggles the menu.
 * @param {HTMLElement} menu - The menu element to control.
 * @returns {void} Nothing is returned; attaches a click event listener to the document.
 */
function setupOutsideClickHandler(btn, menu) {
    document.addEventListener("click", (e) => {
        const clickedInsideMenu = menu.contains(e.target);
        const clickedButton = e.target === btn;
        const clickedOverlay = e.target.closest("#contactOverlay");
        if (!menu.classList.contains("menu-hidden") && !clickedInsideMenu && !clickedButton && !clickedOverlay) {
            closeMenu(menu);
        }
    });
}


/**
 * Sets up a global keydown listener to close the edit/delete menu on Escape key press.
 * Ensures the menu is only closed if it is currently visible.
 *
 * @param {HTMLElement} menu - The menu element to control.
 * @returns {void} Nothing is returned; attaches a keyboard event listener to the document.
 */
function setupEscapeKeyHandler(menu) {
    document.addEventListener("keydown", (e) => {
        if (!menu.classList.contains("menu-hidden") && e.key === "Escape") {
            closeMenu(menu);
        }
    });
}


/**
 * Toggles the visibility of the edit/delete menu in the contact detail view.
 * Switches between hidden and visible states, then rebinds button listeners.
 *
 * @param {HTMLElement} menu - The menu element to toggle.
 * @returns {void} Nothing is returned; directly modifies the DOM state.
 */
function toggleMenu(menu) {
    menu.classList.toggle("menu-hidden");
    bindEditDeleteButtons();
}


/**
 * Closes the edit/delete menu in the contact detail view.
 * Hides the menu and rebinds the edit and delete button listeners.
 *
 * @param {HTMLElement} menu - The menu element to close.
 * @returns {void} Nothing is returned; directly updates the DOM state.
 */
function closeMenu(menu) {
    menu.classList.add("menu-hidden");
    bindEditDeleteButtons();
}