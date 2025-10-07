import { getActiveUser, logout, getInitials } from "./authService.js";
import { insertTemplates } from "./templateLoader.js";
import { provisionActiveUser } from "./userProvisioning.js";

export async function bootLayout() {
  await insertTemplates([
    ["[data-template=header]", "./templates/header.html"],
    ["[data-template=sidebar]", "./templates/sidebar.html"],
  ]);
  hydrateLayout();
}

function hydrateLayout() {
  setProfileInitials();
  bindProfileMenu();
  bindLogout();
  highlightActiveNav();
  provisionActiveUser();
}

function setProfileInitials() {
  const user = getActiveUser();
  const initials = getInitials(user);
  const target = document.getElementById("profileInitials");
  if (!target) return;
  target.textContent = initials;
  target.classList.toggle("guest-font-size", initials === "GU");
}

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

function toggleMenu(menu, overlay, icon) {
  if (menu.classList.contains("sub-menu-open")) closeMenu(menu, overlay, icon);
  else openMenu(menu, overlay, icon);
}

function openMenu(menu, overlay, icon) {
  menu.classList.add("sub-menu-open");
  menu.classList.remove("sub-menu-close");
  overlay.classList.remove("d-none");
  icon.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
  document.body.classList.add("sub-menu-bg-open");
}

function closeMenu(menu, overlay, icon) {
  menu.classList.add("sub-menu-close");
  menu.classList.remove("sub-menu-open");
  overlay.classList.add("d-none");
  icon.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("sub-menu-bg-open");
}

function handleProfileKey(event, menu, overlay, icon) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMenu(menu, overlay, icon);
  }
  if (event.key === "Escape") closeMenu(menu, overlay, icon);
}

function bindLogout() {
  const trigger = document.getElementById("logoutLink");
  if (!trigger) return;
  trigger.addEventListener("click", async () => {
    await logout();
    window.location.href = "./index.html";
  });
}

function highlightActiveNav() {
  const current = getPageName(window.location.pathname);
  document.querySelectorAll("a.nav-link").forEach((link) => {
    const match = getPageName(link.getAttribute("href"));
    link.classList.toggle("link-active", match === current);
  });
}

function getPageName(path) {
  return path.split("/").pop();
}
