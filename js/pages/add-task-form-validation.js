/**
 * Validation helpers for the add-task form.
 * @module addTaskFormValidation
 */

import {
  validatePriorityGroup,
  validateMinLengthEl,
  validateDateNotPastEl,
  validateRequiredEl,
} from "../validation/validation-fields.js";
import { readTaskData } from "./add-task-form-data.js";


/**
 * Validates the add-task form data object.
 * @param {Object} data - Task payload.
 * @returns {boolean} Whether all required fields are present.
 */
export function validateTaskData(data) {
  return Boolean(data.title && data.dueDate && data.category && data.priority);
}


/**
 * Validates the form silently and updates the submit button state.
 */
export function validateFormAndUpdateButton() {
  const data = readTaskData();
  const button = document.getElementById("taskCreateBtn");
  if (!button) return;
  const isValid = validateTaskData(data);
  button.disabled = !isValid;
  button.classList.toggle("disabled", !isValid);
}


/**
 * Displays validation errors for all required fields.
 * @param {Object} data - Task payload.
 */
export function showAllValidationErrors(data) {
  validateTitleField(data);
  validateDueDateField(data);
  validateCategoryField(data);
  validatePriorityField(data);
}


/**
 * Validates the title field and shows feedback when missing.
 * @param {Object} data - Task payload.
 */
export function validateTitleField(data) {
  const title = document.getElementById("taskTitle");
  if (title && !data.title)
    validateMinLengthEl(title, 3, "Title", { show: true });
}


/**
 * Validates the due-date field and shows feedback when missing.
 * @param {Object} data - Task payload.
 */
export function validateDueDateField(data) {
  const dueDate = document.getElementById("taskDueDate");
  if (dueDate && !data.dueDate)
    validateDateNotPastEl(dueDate, "Due date", { show: true });
}


/**
 * Validates the category field and shows feedback when missing.
 * @param {Object} data - Task payload.
 */
export function validateCategoryField(data) {
  const category = document.getElementById("category");
  if (category && !data.category)
    validateRequiredEl(category, "Category", { show: true });
}


/**
 * Validates the priority group and shows feedback when missing.
 * @param {Object} data - Task payload.
 */
export function validatePriorityField(data) {
  const group = document.querySelector(".priority-buttons");
  if (group && !data.priority)
    validatePriorityGroup(group, "Priority", { show: true });
}
