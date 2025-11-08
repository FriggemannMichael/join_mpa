/**
 * Priority button interactions for the add-task form.
 * @module addTaskPriority
 */

import { icons } from "../common/svg-template.js";
import { validatePriorityGroup } from "../validation/validation-fields.js";
import { updateAddTaskValidationButton } from "../validation/validation-addTask.js";

/**
 * Binds event listeners for all priority buttons.
 */
export function bindPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-btn");
  buttons.forEach((button) =>
    button.addEventListener("click", () => setActivePriority(button))
  );
  activateMediumPriority();
}

/**
 * Activates the medium priority button if available.
 */
function activateMediumPriority() {
  const medium = document.querySelector(
    '.priority-btn[data-priority="medium"]'
  );
  if (medium) setActivePriority(medium);
}

/**
 * Sets a priority button as active and updates validation.
 * @param {HTMLElement} activeButton - Button to activate.
 */
function setActivePriority(activeButton) {
  document
    .querySelectorAll(".priority-btn")
    .forEach((button) =>
      updateButtonActiveState(button, button === activeButton)
    );
  const group = activeButton.closest(".priority-buttons");
  validatePriorityGroup(group, "Priority", { show: true });
  updateAddTaskValidationButton?.();
}

/**
 * Updates the visual state of a priority button.
 * @param {HTMLElement} button - Button element to update.
 * @param {boolean} isActive - Whether the button is active.
 */
function updateButtonActiveState(button, isActive) {
  button.classList.toggle("active", isActive);
  const icon = button.querySelector(".prio-icon");
  const priority = button.dataset.priority;
  if (icon && priority) updatePriorityIcon(icon, priority, isActive);
}

/**
 * Replaces the icon based on priority state.
 * @param {Element} iconContainer - Current icon container.
 * @param {string} priority - Priority identifier.
 * @param {boolean} isActive - Whether the button is active.
 */
function updatePriorityIcon(iconContainer, priority, isActive) {
  iconContainer.outerHTML = isActive
    ? getActivePriorityIcon(priority)
    : getInactivePriorityIcon(priority);
}

/**
 * Returns markup for the active priority icon.
 * @param {string} priority - Priority identifier.
 * @returns {string} HTML markup for active icon.
 */
function getActivePriorityIcon(priority) {
  const iconMap = {
    urgent: icons.prioHighwhite,
    medium: icons.priomediumwhite,
    low: icons.arrowdownwhite,
  };
  const icon = iconMap[priority] || "";
  return `<div class="prio-icon">${icon}</div>`;
}

/**
 * Returns markup for the inactive priority icon.
 * @param {string} priority - Priority identifier.
 * @returns {string} HTML markup for inactive icon.
 */
function getInactivePriorityIcon(priority) {
  const iconMap = {
    urgent: "./assets/icons/prio-urgent.svg",
    medium: "./assets/icons/prio-medium.svg",
    low: "./assets/icons/prio-low.svg",
  };
  const src = iconMap[priority] || "";
  const label = priority
    ? `${priority[0].toUpperCase()}${priority.slice(1)}`
    : "";
  return `<img class="prio-icon" src="${src}" alt="${label} priority" />`;
}

/**
 * Clears all active priority buttons and restores the default selection.
 */
export function clearPriorityButtons() {
  document
    .querySelectorAll(".priority-btn")
    .forEach((button) => button.classList.remove("active"));
  activateMediumPriority();
}
