/**
 * Reset utilities for the add-task form.
 * @module addTaskFormReset
 */

import { updateAssigneeSelection } from "./add-task-assignees-ui.js";
import { renderSubtasks, subtasks } from "./add-task-subtasks.js";
import { clearPriorityButtons } from "./add-task-priority.js";
import { validateFormAndUpdateButton } from "./add-task-form-validation.js";
import { showAlert } from "../common/alertService.js";


/**
 * Clears the form, removes validation errors, and notifies the user.
 */
export function clearTaskForm() {
  const container = document.getElementById("pageContent");
  clearAllValidationErrors(container);
  resetFormFields();
  resetCategoryPlaceholder();
  validateFormAndUpdateButton();
  showAlert("clearForm");
}


/**
 * Resets all input fields and selections in the form.
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
 * Restores the default category placeholder label.
 */
function resetCategoryPlaceholder() {
  const placeholder = document.getElementById("selected-category-placeholder");
  if (placeholder) placeholder.textContent = "Select category";
}


/**
 * Removes validation styling and messages from the form.
 * @param {HTMLElement|null} container - Root container of the form.
 */
function clearAllValidationErrors(container) {
  if (!container) return;
  clearInputFaults(container);
  clearFaultMessages(container);
  clearFormGroupFaults(container);
}


/**
 * Clears all input-fault classes from input elements.
 * @param {HTMLElement} container - Root container of the form.
 */
function clearInputFaults(container) {
  container
    .querySelectorAll(".input-fault")
    .forEach((element) => element.classList.remove("input-fault"));
}


/**
 * Removes validation messages from the form.
 * @param {HTMLElement} container - Root container of the form.
 */
function clearFaultMessages(container) {
  container.querySelectorAll(".field-fault-msg").forEach((message) => {
    message.textContent = "";
    message.classList.remove("visible");
  });
}


/**
 * Clears fault classes from form groups.
 * @param {HTMLElement} container - Root container of the form.
 */
function clearFormGroupFaults(container) {
  container
    .querySelectorAll(".form-group")
    .forEach((group) => group.classList.remove("input-fault"));
}


/**
 * Clears all text-like inputs within the form.
 */
function clearTextFields() {
  getFormInputFields().forEach(clearFieldValue);
}


/**
 * Retrieves all text, date, textarea, and select elements in the form.
 * @returns {NodeListOf<Element>} Collection of fields.
 */
function getFormInputFields() {
  return document.querySelectorAll(
    "#pageContent input[type='text'], #pageContent input[type='date'], #pageContent textarea, #pageContent select"
  );
}


/**
 * Clears the value of a single form field.
 * @param {Element} field - Field to reset.
 */
function clearFieldValue(field) {
  if (field instanceof HTMLSelectElement) {
    field.selectedIndex = 0;
  } else {
    field.value = "";
  }
}


/**
 * Unchecks all assignee checkboxes.
 */
function clearCheckboxes() {
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = false;
    });
}
