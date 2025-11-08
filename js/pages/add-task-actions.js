/**
 * Action bindings for the add-task form.
 * @module addTaskActions
 */

import { createTask } from "../common/tasks.js";
import { clearTaskForm } from "./add-task-form-reset.js";
import { readTaskData } from "./add-task-form-data.js";
import {
  validateTaskData,
  showAllValidationErrors,
  validateFormAndUpdateButton,
} from "./add-task-form-validation.js";


/**
 * Wires up clear and create actions for the form buttons.
 */
export function bindActionButtons() {
  const clearBtn = document.getElementById("taskClearBtn");
  const createBtn = document.getElementById("taskCreateBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearTaskForm);
  if (createBtn) createBtn.addEventListener("click", handleTaskCreate);
  validateFormAndUpdateButton();
}


/**
 * Handles task creation click with guarded error handling.
 */
async function handleTaskCreate() {
  try {
    await attemptTaskCreation();
  } catch (_) {
    // Intentionally swallow errors to preserve prior behavior.
  }
}


/**
 * Attempts to create a task and navigates on success.
 */
async function attemptTaskCreation() {
  const data = readTaskData();
  if (!validateTaskData(data)) {
    handleValidationFailure(data);
    return;
  }
  disableCreateButton();
  await saveTaskAndRedirect(data);
}


/**
 * Handles validation errors when task creation fails.
 * @param {Object} data - Task payload.
 */
function handleValidationFailure(data) {
  showAllValidationErrors(data);
  setTaskStatus("Please fill all required fields (incl. Priority)", true);
}


/**
 * Disables the create button to prevent duplicates.
 */
function disableCreateButton() {
  const button = document.getElementById("taskCreateBtn");
  if (button) button.disabled = true;
}


/**
 * Persists the task and redirects to the board view.
 * @param {Object} data - Task payload.
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
 * Updates the task status message element.
 * @param {string} message - Status text to display.
 * @param {boolean} isError - Whether to mark as error.
 */
function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", Boolean(isError));
}
