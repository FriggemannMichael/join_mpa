/**
 * Form management for Add-Task page
 * @module add-task-form
 */

import { createTask } from "../common/tasks.js";
import { icons } from "../common/svg-template.js";
import { subtasks, renderSubtasks } from "./add-task-subtasks.js";
import { updateAssigneeSelection } from "./add-task-assignees-ui.js";
import { validatePriorityGroup } from "../validation/validation-fields.js";
import { updateAddTaskValidationButton } from "../validation/validation-addTask.js";

/**
 * Binds event listeners for priority buttons
 */
export function bindPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => setActivePriority(button));
  });

  const mediumButton = document.querySelector(
    '.priority-btn[data-priority="medium"]'
  );
  if (mediumButton) {
    setActivePriority(mediumButton);
  }
}

/**
 * Sets a priority button as active and deactivates others
 * @param {HTMLElement} activeButton The button to activate
 */
export function setActivePriority(activeButton) {
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    updateButtonActiveState(btn, btn === activeButton);
  });

  const group = activeButton.closest(".priority-buttons");
  validatePriorityGroup(group, "Priority", { show: true });

  // Update overall button status
  updateAddTaskValidationButton?.();
}

/**
 * Updates the active state of a button
 * @param {HTMLElement} button Button element
 * @param {boolean} isActive Active status
 */
function updateButtonActiveState(button, isActive) {
  button.classList.toggle("active", isActive);

  const iconContainer = button.querySelector(".prio-icon");
  const priority = button.dataset.priority;

  if (iconContainer && priority) {
    updatePriorityIcon(iconContainer, priority, isActive);
  }
}

/**
 * Updates the priority icon
 * @param {HTMLElement} iconContainer Icon container
 * @param {string} priority Priority
 * @param {boolean} isActive Active status
 */
function updatePriorityIcon(iconContainer, priority, isActive) {
  if (isActive) {
    iconContainer.outerHTML = getActivePriorityIcon(priority);
  } else {
    iconContainer.outerHTML = getInactivePriorityIcon(priority);
  }
}

/**
 * Gets the active icon for a priority
 * @param {string} priority Priority
 * @returns {string} HTML string with icon
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
 * Gets the inactive icon for a priority
 * @param {string} priority Priority
 * @returns {string} HTML string with icon
 */
function getInactivePriorityIcon(priority) {
  const iconMap = {
    urgent: "./assets/icons/prio-urgent.svg",
    medium: "./assets/icons/prio-medium.svg",
    low: "./assets/icons/prio-low.svg",
  };

  const src = iconMap[priority] || "";
  const alt = `${
    priority.charAt(0).toUpperCase() + priority.slice(1)
  } priority`;
  return `<img class="prio-icon" src="${src}" alt="${alt}" />`;
}

/**
 * Binds event listeners for action buttons (Clear, Create)
 */
export function bindActionButtons() {
  const clearBtn = document.getElementById("taskClearBtn");
  const createBtn = document.getElementById("taskCreateBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearTaskForm);
  if (createBtn) createBtn.addEventListener("click", handleTaskCreate);

  // Initial validation
  validateFormAndUpdateButton();
  // Event listeners for form fields
  bindFormValidation();
}

/**
 * Reads the task data from the form
 * @returns {Object} Task data
 */
export function readTaskData() {
  const assignees = readAssignees();
  const category = readCategory();

  return {
    title: readValue("taskTitle"),
    description: readValue("taskDescription"),
    dueDate: readValue("taskDueDate"),
    category: category.value,
    categoryLabel: category.label,
    priority: readActivePriority(),
    assignees: assignees,
    subtasks: subtasks.slice(),
    status: "toDo",
  };
}

/**
 * Reads the selected assignees
 * @returns {Array} Array of assignee objects
 */
function readAssignees() {
  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]:checked'
  );
  return Array.from(checkboxes).map((cb) => ({
    uid: cb.value,
    name: cb.dataset.name?.replace(/\s*\(Du\)$/i, "").trim() || "",
    email: cb.dataset.email,
  }));
}

/**
 * Reads the selected category
 * @returns {Object} Category object with value and label
 */
function readCategory() {
  const categoryValue = readValue("category");
  const categoryLabel =
    document.getElementById("selected-category-placeholder")?.textContent || "";

  return { value: categoryValue, label: categoryLabel };
}

/**
 * Reads the value of a form field
 * @param {string} id Element ID
 * @returns {string} Field value
 */
export function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Reads the active priority
 * @returns {string} Priority
 */
export function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active ? active.dataset.priority || "" : "";
}

/**
 * Clears the form and resets all validation states
 * Removes all error messages, resets field borders, and clears all values
 */
export function clearTaskForm() {
  const form = document.getElementById("taskForm");

  // Use centralized form reset utility to clear validation
  if (form) {
    resetFormCompletely(form);
  }

  // Clear task-specific data
  clearTextFields();
  clearCheckboxes();
  clearPriorityButtons();
  updateAssigneeSelection();
  subtasks.length = 0;
  renderSubtasks();
  setTaskStatus("Form reset", false);

  // Update button status after clear
  validateFormAndUpdateButton();
}

/**
 * Clears all text fields in the form
 */
function clearTextFields() {
  document
    .querySelectorAll(
      "#pageContent input[type='text'], #pageContent input[type='date'], #pageContent textarea, #pageContent select"
    )
    .forEach((field) => {
      if (field instanceof HTMLSelectElement) {
        field.selectedIndex = 0;
      } else {
        field.value = "";
      }
    });
}

/**
 * Deactivates all checkboxes
 */
function clearCheckboxes() {
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
    });
}

/**
 * Deactivates all priority buttons and sets Medium as default
 */
function clearPriorityButtons() {
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const mediumButton = document.querySelector(
    '.priority-btn[data-priority="medium"]'
  );
  if (mediumButton) {
    setActivePriority(mediumButton);
  }
}

/**
 * Handles the creation of a task
 */
export async function handleTaskCreate() {
  const data = readTaskData();

  if (!validateTaskData(data)) {
    setTaskStatus("Please fill all required fields (incl. Priority)", true);
    return;
  }

  const createBtn = document.getElementById("taskCreateBtn");
  if (createBtn) createBtn.disabled = true;

  try {
    await createTask(data);
    setTaskStatus("Task successfully created!", false);
    clearTaskForm();
    setTimeout(() => {
      window.location.href = "board.html";
    }, 100);
  } catch (error) {
    setTaskStatus("Task could not be saved", true);
  } finally {
    if (createBtn) createBtn.disabled = false;
  }
}

/**
 * Validates the task data
 * @param {Object} data Task data
 * @returns {boolean} True if valid
 */
function validateTaskData(data) {
  return !!(data.title && data.dueDate && data.category && data.priority);
}

/**
 * Binds event listeners for form field changes for validation
 */
function bindFormValidation() {
  const titleField = document.getElementById("taskTitle");
  const dueDateField = document.getElementById("taskDueDate");
  const categoryField = document.getElementById("category");
  const priorityButtons = document.querySelectorAll(".priority-btn");

  // Validate title and due date on input
  if (titleField)
    titleField.addEventListener("input", validateFormAndUpdateButton);
  if (dueDateField)
    dueDateField.addEventListener("change", validateFormAndUpdateButton);
  if (categoryField)
    categoryField.addEventListener("change", validateFormAndUpdateButton);

  // Validate priority on click
  priorityButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(validateFormAndUpdateButton, 0);
    });
  });
}

/**
 * Validates the form and enables/disables the Create button
 */
export function validateFormAndUpdateButton() {
  const data = readTaskData();
  const createBtn = document.getElementById("taskCreateBtn");

  if (!createBtn) return;

  const isValid = validateTaskData(data);
  createBtn.disabled = !isValid;
  createBtn.classList.toggle("disabled", !isValid);
}

/**
 * Sets the task status
 * @param {string} message Status message
 * @param {boolean} isError Error flag
 */
export function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Toggle for the category dropdown (called inline via onclick in HTML)
 */
export function toggleCategoryDropdown() {
  const header = document.querySelector(".category-select-header");
  const dropdown = document.getElementById("category-dropdown");
  if (!dropdown || !header) return;

  const isOpen = !dropdown.classList.toggle("d-none");
  header.classList.toggle("open", isOpen);

  // Listener only active when open
  if (isOpen) {
    document.addEventListener("click", handleOutsideCategoryClick);
  } else {
    document.removeEventListener("click", handleOutsideCategoryClick);
  }
}

function handleOutsideCategoryClick(e) {
  const dropdown = document.getElementById("category-dropdown");
  const header = document.querySelector(".category-select-header");
  if (!dropdown || !header) return;

  // Click outside -> close
  if (!dropdown.contains(e.target) && !header.contains(e.target)) {
    dropdown.classList.add("d-none");
    header.classList.remove("open");
    document.removeEventListener("click", handleOutsideCategoryClick);
  }
}

/**
 * Sets the category (called inline via onclick in HTML)
 * @param {string} value Category value (e.g. 'technical-task')
 */
export function selectCategory(value) {
  const input = document.getElementById("category");
  const placeholder = document.getElementById("selected-category-placeholder");
  const dropdown = document.getElementById("category-dropdown");

  if (input) {
    input.value = value;
    // Trigger change event for validation
    input.dispatchEvent(new Event("change"));
  }
  if (placeholder) placeholder.textContent = getCategoryLabel(value);

  dropdown?.classList.add("d-none");
  document.querySelector(".category-select-header")?.classList.remove("open");
}

/**
 * Gets the label for a category
 * @param {string} value Category value
 * @returns {string} Category label
 */
function getCategoryLabel(value) {
  const labelMap = {
    "technical-task": "Technical Task",
    "user-story": "User Story",
  };
  return labelMap[value] || value;
}
