/**
 * Layout service for common page elements and navigation
 * @module layout
 */

import {
  getActiveUser,
  logout,
  getInitials,
  authReady,
} from "./authService.js";
import { insertTemplates } from "./templateLoader.js";
import { provisionActiveUser } from "./userProvisioning.js";
import { icons } from "./svg-template.js";

/**
 * Loads layout templates and initializes the page structure
 * @returns {Promise<void>}
 */
export async function bootLayout() {
  // Wait for Firebase Auth initialization
  await authReady;

  await insertTemplates([
    ["[data-template=header]", "./templates/header.html"],
    ["[data-template=sidebar]", "./templates/sidebar.html"],
  ]);

  // Wait one tick for the DOM to update
  await new Promise((resolve) => setTimeout(resolve, 0));

  hydrateLayout();
}

/**
 * Activates all layout functionalities after template loading
 */
function hydrateLayout() {
  setProfileInitials();
  bindProfileMenu();
  bindLogout();
  highlightActiveNav();
  provisionActiveUser();
  setupAuthBasedNavigation();
  hideProfileIconOnLegalPagesIfNotLoggedIn();
}

/**
 * Sets the initials in the profile icon based on the current user
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
 * Retrieves key DOM elements related to the profile menu.
 * Returns an object containing references to the icon, menu, and backdrop overlay.
 *
 * @returns {{icon: HTMLElement|null, menu: HTMLElement|null, overlay: HTMLElement|null}}
 * An object with the profile elements, or `null` values if elements are missing.
 */
function getProfileElements() {
  return {
    icon: document.getElementById("profileIcon"),
    menu: document.getElementById("profileMenu"),
    overlay: document.getElementById("profileMenuBackdrop"),
  };
}


/**
 * Validates that all required profile elements exist in the DOM.
 * Logs a warning for each missing element and returns a boolean result.
 *
 * @param {{icon: HTMLElement|null, menu: HTMLElement|null, overlay: HTMLElement|null}} elements
 * An object containing the profile elements to validate.
 * @returns {boolean} `true` if all elements exist, otherwise `false`.
 */
function validateProfileElements({ icon, menu, overlay }) {
  if (!icon) console.warn("Layout: profileIcon not found");
  if (!menu) console.warn("Layout: profileMenu not found");
  if (!overlay) console.warn("Layout: profileMenuBackdrop not found");
  return icon && menu && overlay;
}


/**
 * Attaches event listeners to the profile menu components.
 * Handles click, keyboard, and overlay interactions for opening and closing the menu.
 *
 * @param {HTMLElement} icon - The profile icon that toggles the menu.
 * @param {HTMLElement} menu - The dropdown menu element containing links and buttons.
 * @param {HTMLElement} overlay - The backdrop overlay that closes the menu when clicked.
 * @returns {void} Nothing is returned; event listeners are bound directly to DOM elements.
 */
function attachProfileListeners(icon, menu, overlay) {
  const close = () => closeMenu(menu, overlay, icon);
  icon.addEventListener("click", () => toggleMenu(menu, overlay, icon));
  icon.addEventListener("keydown", (e) => handleProfileKey(e, menu, overlay, icon));
  overlay.addEventListener("click", close);
  menu.querySelectorAll("a, button").forEach((i) => i.addEventListener("click", close));
}


/**
 * Initializes the profile menu by binding all required event listeners.
 * Retrieves and validates DOM elements before attaching listeners.
 *
 * @returns {void} Nothing is returned; sets up the profile menu interactions.
 */
function bindProfileMenu() {
  const els = getProfileElements();
  if (!validateProfileElements(els)) return;
  attachProfileListeners(els.icon, els.menu, els.overlay);
}

/**
 * Toggles the profile menu between open and closed
 * @param {HTMLElement} menu The menu element
 * @param {HTMLElement} overlay The overlay element
 * @param {HTMLElement} icon The icon element
 */
function toggleMenu(menu, overlay, icon) {
  if (menu.classList.contains("sub-menu-open")) closeMenu(menu, overlay, icon);
  else openMenu(menu, overlay, icon);
}

/**
 * Opens the profile menu and sets accessibility attributes
 * @param {HTMLElement} menu The menu element
 * @param {HTMLElement} overlay The overlay element
 * @param {HTMLElement} icon The icon element
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
 * Closes the profile menu and sets accessibility attributes
 * @param {HTMLElement} menu The menu element
 * @param {HTMLElement} overlay The overlay element
 * @param {HTMLElement} icon The icon element
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
 * Handles keyboard events for the profile menu
 * @param {KeyboardEvent} event The keyboard event
 * @param {HTMLElement} menu The menu element
 * @param {HTMLElement} overlay The overlay element
 * @param {HTMLElement} icon The icon element
 */
function handleProfileKey(event, menu, overlay, icon) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMenu(menu, overlay, icon);
  }
  if (event.key === "Escape") closeMenu(menu, overlay, icon);
}

/**
 * Binds the logout button and handles logout events
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
 * Marks the active navigation link based on the current page
 */
function highlightActiveNav() {
  const current = getPageName(window.location.pathname);
  document.querySelectorAll("a.nav-link").forEach((link) => {
    const match = getPageName(link.getAttribute("href"));
    link.classList.toggle("link-active", match === current);
  });
}

/**
 * Extracts the filename from a path
 * @param {string} path Full or relative path
 * @returns {string} Filename (e.g. "summary.html")
 */
function getPageName(path) {
  return path.split("/").pop();
}


/**
 * Returns the current authentication state.
 * @returns {{ isLoggedIn: boolean, user: unknown }} Object containing login status and user data.
 */
function getAuthState() {
  const user = getActiveUser();
  return { isLoggedIn: !!user, user };
}

/**
 * Checks whether the current path is a legal/info page.
 * @param {string} path - Current window pathname.
 * @returns {boolean} True if the path is a legal page.
 */
function isLegalPath(path) {
  const page = getPageName(path);
  return page === "legal.html" || page === "privacy.html" || page === "help.html";
}

/**
 * Toggles visibility for navigation links.
 * @param {NodeListOf<Element>} links - Elements to show or hide.
 * @param {boolean} show - If true, links are visible; otherwise hidden.
 * @returns {void}
 */
function toggleNavLinks(links, show) {
  links.forEach(el => el.classList.toggle("nav-link-hidden", !show));
}

/**
 * Sets up navigation visibility based on authentication and current page.
 * @returns {void}
 */
function setupAuthBasedNavigation() {
  const { isLoggedIn } = getAuthState();
  const legal = isLegalPath(window.location.pathname);
  const authRequired = document.querySelectorAll("[data-auth-required]");
  const guestOnly = document.querySelectorAll("[data-guest-only]");
  if (isLoggedIn) {
    toggleNavLinks(authRequired, true);
    toggleNavLinks(guestOnly, false);
    return;
  }
  toggleNavLinks(authRequired, false);
  toggleNavLinks(guestOnly, legal);
  if (legal) renderLoginIcon();
}

/**
 * Renders the log in icon with SVG from svg-template.js
 */
function renderLoginIcon() {
  const iconContainer = document.getElementById("loginIcon");
  if (!iconContainer) return;
  iconContainer.innerHTML = icons.log;
}

/**
 * Hides the profile icon on Legal/Privacy/Help pages when no user is logged in
 */
function hideProfileIconOnLegalPagesIfNotLoggedIn() {
  const user = getActiveUser();
  const isLoggedIn = !!user;

  const currentPage = getPageName(window.location.pathname);
  const isLegalPage =
    currentPage === "legal.html" ||
    currentPage === "privacy.html" ||
    currentPage === "help.html";

  const profileIcon = document.getElementById("profileIcon");

  if (!isLoggedIn && isLegalPage && profileIcon) {
    profileIcon.style.display = "none";
  } else if (profileIcon) {
    profileIcon.style.display = "";
  }
}
