/**
 * Data access helpers for the add-task form.
 * @module addTaskFormData
 */

import { subtasks } from "./add-task-subtasks.js";


/**
 * Collects all task data from the form.
 * @returns {Object} Task payload.
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
    assignees,
    subtasks: subtasks.slice(),
    status: "toDo",
  };
}


/**
 * Reads selected assignees from the dropdown.
 * @returns {Array<Object>} Selected assignees.
 */
export function readAssignees() {
  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]:checked'
  );
  return Array.from(checkboxes).map((checkbox) => ({
    uid: checkbox.value,
    name: sanitizeAssigneeName(checkbox.dataset.name),
    email: checkbox.dataset.email,
  }));
}


/**
 * Sanitizes assignee names by stripping duplicates markers.
 * @param {string} name - Raw name attribute.
 * @returns {string} Cleaned name.
 */
function sanitizeAssigneeName(name = "") {
  return name.replace(/\s*\(Du\)$/i, "").trim();
}


/**
 * Reads the current category selection.
 * @returns {{value: string, label: string}} Category data.
 */
export function readCategory() {
  return {
    value: readValue("category"),
    label:
      document.getElementById("selected-category-placeholder")?.textContent ??
      "",
  };
}


/**
 * Reads the trimmed value from an input field.
 * @param {string} id - Element identifier.
 * @returns {string} Field value.
 */
export function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}


/**
 * Reads the currently active priority selection.
 * @returns {string} Priority identifier.
 */
export function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active?.dataset.priority ?? "";
}
