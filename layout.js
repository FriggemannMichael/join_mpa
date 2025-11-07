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
 * Loads layout templates and initializes page structure
 * @returns {Promise<void>}
 */
export async function bootLayout() {
  // Wait for Firebase Auth initialization
  await authReady;

  await insertTemplates([
    ["[data-template=header]", "./templates/header.html"],
    ["[data-template=sidebar]", "./templates/sidebar.html"],
  ]);

  // Wait one tick for DOM to update
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
 * Binds event listeners for the profile dropdown menu
 */
function bindProfileMenu() {
  const icon = document.getElementById("profileIcon");
  const menu = document.getElementById("profileMenu");
  const overlay = document.getElementById("profileMenuBackdrop");

  // Debug logging for troubleshooting
  if (!icon) console.warn("Layout: profileIcon not found");
  if (!menu) console.warn("Layout: profileMenu not found");
  if (!overlay) console.warn("Layout: profileMenuBackdrop not found");

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
 * Highlights the active navigation link based on the current page
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
 * Sets up navigation based on auth status
 * Shows normal menu links when logged in (including Guest)
 * Shows login link on Legal/Privacy/Help only when not logged in
 */
function setupAuthBasedNavigation() {
  const user = getActiveUser();
  const isLoggedIn = !!user;

  const currentPage = getPageName(window.location.pathname);
  const isLegalPage =
    currentPage === "legal.html" ||
    currentPage === "privacy.html" ||
    currentPage === "help.html";

  const authRequiredLinks = document.querySelectorAll("[data-auth-required]");
  const guestOnlyLinks = document.querySelectorAll("[data-guest-only]");

  console.log("🔍 setupAuthBasedNavigation:", {
    isLoggedIn,
    currentPage,
    isLegalPage,
    user: user ? user.email || "Guest" : "none",
    authRequiredLinksCount: authRequiredLinks.length,
    guestOnlyLinksCount: guestOnlyLinks.length,
  });

  if (isLoggedIn) {
    authRequiredLinks.forEach((link) => {
      link.classList.remove("nav-link-hidden");
    });
    guestOnlyLinks.forEach((link) => {
      link.classList.add("nav-link-hidden");
    });
  } else {
    authRequiredLinks.forEach((link) => {
      link.classList.add("nav-link-hidden");
    });
    if (isLegalPage) {
      guestOnlyLinks.forEach((link) => {
        link.classList.remove("nav-link-hidden");
      });
      renderLoginIcon();
    } else {
      guestOnlyLinks.forEach((link) => {
        link.classList.add("nav-link-hidden");
      });
    }
  }
}

/**
 * Renders the Log In icon with SVG from svg-template.js
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

  console.log("👤 hideProfileIconOnLegalPagesIfNotLoggedIn:", {
    isLoggedIn,
    currentPage,
    isLegalPage,
    profileIconExists: !!profileIcon,
  });

  if (!isLoggedIn && isLegalPage && profileIcon) {
    profileIcon.style.display = "none";
  } else if (profileIcon) {
    profileIcon.style.display = "";
  }
}
