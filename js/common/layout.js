/**
 * Layout-Service für gemeinsame Seitenelemente und Navigation
 * @module layout
 */

import { getActiveUser, logout, getInitials } from "./authService.js";
import { insertTemplates } from "./templateLoader.js";
import { provisionActiveUser } from "./userProvisioning.js";

/**
 * Lädt Layout-Templates und initialisiert die Seitenstruktur
 * @returns {Promise<void>}
 */
export async function bootLayout() {
  await insertTemplates([
    ["[data-template=header]", "./templates/header.html"],
    ["[data-template=sidebar]", "./templates/sidebar.html"],
  ]);
  hydrateLayout();
}

/**
 * Aktiviert alle Layout-Funktionalitäten nach dem Template-Loading
 */
function hydrateLayout() {
  setProfileInitials();
  bindProfileMenu();
  bindLogout();
  highlightActiveNav();
  provisionActiveUser();
}

/**
 * Setzt die Initialen im Profil-Icon basierend auf dem aktuellen User
 */
function setProfileInitials() {
  const user = getActiveUser();
  const initials = getInitials(user);
  const target = document.getElementById("profileInitials");
  if (!target) return;
  target.textContent = initials;
  target.classList.toggle("guest-font-size", initials === "GU");
}

/**
 * Bindet Event-Listener für das Profil-Dropdown-Menü
 */
function bindProfileMenu() {
  const icon = document.getElementById("profileIcon");
  const menu = document.getElementById("profileMenu");
  const overlay = document.getElementById("profileMenuBackdrop");
  if (!icon || !menu || !overlay) return;
  icon.addEventListener("click", () => toggleMenu(menu, overlay, icon));
  icon.addEventListener("keydown", (event) =>
    handleProfileKey(event, menu, overlay, icon)
  );
  overlay.addEventListener("click", () => closeMenu(menu, overlay, icon));
  menu
    .querySelectorAll("a, button")
    .forEach((item) =>
      item.addEventListener("click", () => closeMenu(menu, overlay, icon))
    );
}

/**
 * Schaltet das Profil-Menü zwischen offen und geschlossen um
 * @param {HTMLElement} menu Das Menü-Element
 * @param {HTMLElement} overlay Das Overlay-Element
 * @param {HTMLElement} icon Das Icon-Element
 */
function toggleMenu(menu, overlay, icon) {
  if (menu.classList.contains("sub-menu-open")) closeMenu(menu, overlay, icon);
  else openMenu(menu, overlay, icon);
}

/**
 * Öffnet das Profil-Menü und setzt Accessibility-Attribute
 * @param {HTMLElement} menu Das Menü-Element
 * @param {HTMLElement} overlay Das Overlay-Element
 * @param {HTMLElement} icon Das Icon-Element
 */
function openMenu(menu, overlay, icon) {
  menu.classList.add("sub-menu-open");
  menu.classList.remove("sub-menu-close");
  overlay.classList.remove("d-none");
  icon.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
  document.body.classList.add("sub-menu-bg-open");
}

/**
 * Schließt das Profil-Menü und setzt Accessibility-Attribute
 * @param {HTMLElement} menu Das Menü-Element
 * @param {HTMLElement} overlay Das Overlay-Element
 * @param {HTMLElement} icon Das Icon-Element
 */
function closeMenu(menu, overlay, icon) {
  menu.classList.add("sub-menu-close");
  menu.classList.remove("sub-menu-open");
  overlay.classList.add("d-none");
  icon.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sub-menu-bg-open");
}

/**
 * Behandelt Tastatur-Events für das Profil-Menü
 * @param {KeyboardEvent} event Das Keyboard-Event
 * @param {HTMLElement} menu Das Menü-Element
 * @param {HTMLElement} overlay Das Overlay-Element
 * @param {HTMLElement} icon Das Icon-Element
 */
function handleProfileKey(event, menu, overlay, icon) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMenu(menu, overlay, icon);
  }
  if (event.key === "Escape") closeMenu(menu, overlay, icon);
}

/**
 * Bindet den Logout-Button und behandelt Logout-Events
 */
function bindLogout() {
  const trigger = document.getElementById("logoutLink");
  if (!trigger) return;
  trigger.addEventListener("click", async () => {
    await logout();
    window.location.href = "./index.html";
  });
}

/**
 * Markiert den aktiven Navigationslink basierend auf der aktuellen Seite
 */
function highlightActiveNav() {
  const current = getPageName(window.location.pathname);
  document.querySelectorAll("a.nav-link").forEach((link) => {
    const match = getPageName(link.getAttribute("href"));
    link.classList.toggle("link-active", match === current);
  });
}

/**
 * Extrahiert den Dateinamen aus einem Pfad
 * @param {string} path Vollständiger oder relativer Pfad
 * @returns {string} Dateiname (z.B. "summary.html")
 */
function getPageName(path) {
  return path.split("/").pop();
}
