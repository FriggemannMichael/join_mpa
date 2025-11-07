import { close, icons, } from "../common/svg-template.js";

import { bindEditDeleteButtons } from "../pages/contacts.js";

/**
 * Initializes the responsive edit/delete menu for contacts.
 * Toggles visibility on button click and hides the menu when clicking outside or pressing Escape.
 * Also rebinds edit/delete button listeners after each toggle.
 *
 * @returns {void} Nothing is returned; attaches event listeners and updates menu state.
 */
export function initEditDeleteRespMenu() {
    const btn = document.getElementById("contactsEditDelete");
    const menu = document.getElementById("editDeleteModal");
    if (!btn || !menu) return;

    btn.innerHTML = icons.menuDots;
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("menu-hidden");
        bindEditDeleteButtons();
    });

    document.addEventListener("click", (e) => {
        const isClickInsideMenu = menu.contains(e.target);
        const isButtonClick = e.target === btn;
        const isOverlayClick = e.target.closest("#contactOverlay"); // 🩵 das ist der Trick!

        if (
            !menu.classList.contains("menu-hidden") &&
            !isClickInsideMenu &&
            !isButtonClick &&
            !isOverlayClick
        ) {
            menu.classList.add("menu-hidden");
            bindEditDeleteButtons();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (!menu.classList.contains("menu-hidden") && e.key === "Escape") {
            menu.classList.add("menu-hidden");
            bindEditDeleteButtons();
        }
    });
}