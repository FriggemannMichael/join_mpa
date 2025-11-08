import { createTask } from "../common/tasks.js";
import { icons } from "../common/svg-template.js";
import { subtasks, renderSubtasks } from "./add-task-subtasks.js";
import { updateAssigneeSelection } from "./add-task-assignees-ui.js";
import {
  validatePriorityGroup,
  validateMinLengthEl,
  validateDateNotPastEl,
  validateRequiredEl,
} from "../validation/validation-fields.js";
import { updateAddTaskValidationButton } from "../validation/validation-addTask.js";
import { showAlert } from "../common/alertService.js";

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
function setActivePriority(activeButton) {
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    updateButtonActiveState(btn, btn === activeButton);
  });

  const group = activeButton.closest(".priority-buttons");
  validatePriorityGroup(group, "Priority", { show: true });

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

  validateFormAndUpdateButton();
}

/**
 * Reads the task data from the form
 * @returns {Object} Task data
 */
function readTaskData() {
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
function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active ? active.dataset.priority || "" : "";
}

/**
 * Clears the form and resets all validation states.
 * @returns {void}
 */
function clearTaskForm() {
  const pageContent = document.getElementById("pageContent");
  clearAllValidationErrors(pageContent);
  resetFormFields();
  resetCategoryPlaceholder();
  validateFormAndUpdateButton();
  showAlert("clearForm");
}

/**
 * Resets all form fields and selections.
 * @returns {void}
 */
function resetFormFields() {
  clearTextFields();
  clearCheckboxes();
  clearPriorityButtons();
  updateAssigneeSelection();
  subtasks.length = 0;
  renderSubtasks();
}

/**
 * Resets the category placeholder to default text.
 * @returns {void}
 */
function resetCategoryPlaceholder() {
  const categoryPlaceholder = document.getElementById(
    "selected-category-placeholder"
  );
  if (categoryPlaceholder) {
    categoryPlaceholder.textContent = "Select category";
  }
}

/**
 * Clears all validation error states from the form.
 * @param {HTMLElement} container - Container element.
 * @returns {void}
 */
function clearAllValidationErrors(container) {
  if (!container) return;
  clearInputFaults(container);
  clearFaultMessages(container);
  clearFormGroupFaults(container);
}

/**
 * Removes the input-fault class from all elements.
 * @param {HTMLElement} container - Container element.
 * @returns {void}
 */
function clearInputFaults(container) {
  container.querySelectorAll(".input-fault").forEach((el) => {
    el.classList.remove("input-fault");
  });
}

/**
 * Clears all fault messages and their visibility.
 * @param {HTMLElement} container - Container element.
 * @returns {void}
 */
function clearFaultMessages(container) {
  container.querySelectorAll(".field-fault-msg").forEach((msg) => {
    msg.textContent = "";
    msg.classList.remove("visible");
  });
}

/**
 * Removes the input-fault class from all form groups.
 * @param {HTMLElement} container - Container element.
 * @returns {void}
 */
function clearFormGroupFaults(container) {
  container.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("input-fault");
  });
}

/**
 * Clears all text fields in the form.
 * @returns {void}
 */
function clearTextFields() {
  const fields = getFormInputFields();
  fields.forEach(clearFieldValue);
}

/**
 * Gets all form input fields (text, date, textarea, select).
 * @returns {NodeListOf<Element>} List of form fields.
 */
function getFormInputFields() {
  return document.querySelectorAll(
    "#pageContent input[type='text'], #pageContent input[type='date'], #pageContent textarea, #pageContent select"
  );
}

/**
 * Clears the value of a single field.
 * @param {HTMLElement} field - The field to clear.
 * @returns {void}
 */
function clearFieldValue(field) {
  if (field instanceof HTMLSelectElement) {
    field.selectedIndex = 0;
  } else {
    field.value = "";
  }
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
 * Handles the creation of a task.
 * @async
 * @returns {Promise<void>}
 */
async function handleTaskCreate() {
  try {
    const data = readTaskData();

    if (!validateTaskData(data)) {
      handleValidationFailure(data);
      return;
    }

    disableCreateButton();
    await saveTaskAndRedirect(data);
  } catch (error) {}
}

/**
 * Handles validation failure by showing errors.
 * @param {Object} data - Task data.
 * @returns {void}
 */
function handleValidationFailure(data) {
  showAllValidationErrors(data);
  setTaskStatus("Please fill all required fields (incl. Priority)", true);
}

/**
 * Disables the create button to prevent double submission.
 * @returns {void}
 */
function disableCreateButton() {
  const createBtn = document.getElementById("taskCreateBtn");
  if (createBtn) createBtn.disabled = true;
}

/**
 * Saves the task and redirects to the board page.
 * @async
 * @param {Object} data - Task data to save.
 * @returns {Promise<void>}
 */
async function saveTaskAndRedirect(data) {
  await createTask(data);
  setTaskStatus("Task successfully created!", false);
  clearTaskForm();
  setTimeout(() => {
    window.location.href = "board.html";
  }, 1800);
}

/**
 * Shows visual validation errors for all required fields.
 * @param {Object} data - Task data to validate.
 * @returns {void}
 */
function showAllValidationErrors(data) {
  validateTitleField(data);
  validateDueDateField(data);
  validateCategoryField(data);
  validatePriorityField(data);
}

/**
 * Validates and shows error for the title field.
 * @param {Object} data - Task data.
 * @returns {void}
 */
function validateTitleField(data) {
  const titleEl = document.getElementById("taskTitle");
  if (titleEl && !data.title) {
    validateMinLengthEl(titleEl, 3, "Title", { show: true });
  }
}

/**
 * Validates and shows error for the due date field.
 * @param {Object} data - Task data.
 * @returns {void}
 */
function validateDueDateField(data) {
  const dateEl = document.getElementById("taskDueDate");
  if (dateEl && !data.dueDate) {
    validateDateNotPastEl(dateEl, "Due date", { show: true });
  }
}

/**
 * Validates and shows error for the category field.
 * @param {Object} data - Task data.
 * @returns {void}
 */
function validateCategoryField(data) {
  const catEl = document.getElementById("category");
  if (catEl && !data.category) {
    validateRequiredEl(catEl, "Category", { show: true });
  }
}

/**
 * Validates and shows error for the priority field.
 * @param {Object} data - Task data.
 * @returns {void}
 */
function validatePriorityField(data) {
  const prioGrp = document.querySelector(".priority-buttons");
  if (prioGrp && !data.priority) {
    validatePriorityGroup(prioGrp, "Priority", { show: true });
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
 * Validates the form and enables/disables the Create button
 */
function validateFormAndUpdateButton() {
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
function setTaskStatus(message, isError) {
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
  header.setAttribute("aria-expanded", isOpen.toString());

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

  if (!dropdown.contains(e.target) && !header.contains(e.target)) {
    dropdown.classList.add("d-none");
    header.classList.remove("open");
    header.setAttribute("aria-expanded", "false");
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
