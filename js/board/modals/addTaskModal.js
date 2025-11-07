import { populateAssignees } from "../../pages/add-task-assignees.js";
import {
  bindPriorityButtons,
  bindActionButtons,
} from "../../pages/add-task-form.js";
import { initSubtaskInput } from "../../pages/add-task-subtasks.js";
import { mountAddTaskValidation } from "../../validation/validation-addTask.js";
import { boardTemplates } from "../templates/board-templates.js";
import { closeTaskOverlay, ScrollLock } from "../utils.js";

/**
 * Renders the "Add Task" modal using the predefined board template.
 * Injects the modal into the DOM and binds the close button event.
 * @returns {void}
 */
function renderAddTaskModal() {
  const section = document.getElementById("taskModal");
  section.classList.add("add_task_overlay");

  section.innerHTML = boardTemplates.addTask;
  section.addEventListener("click", (e) => {
    if (e.target.closest("#closeAddTask")) {
      closeTaskOverlay();
    }
  });
}

/**
 * Initializes the "Add Task" modal and its interactive components.
 * Locks scrolling, renders the modal, and binds all related handlers.
 * @async
 * @returns {Promise<void>}
 */
export async function initAddTask() {
  ScrollLock.set();
  await renderAddTaskModal();
  await populateAssignees();
  bindPriorityButtons();
  bindActionButtons();
  initSubtaskInput();

  // Initialize validation after rendering the template
  mountAddTaskValidation();
}
