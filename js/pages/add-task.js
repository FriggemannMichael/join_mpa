/**
 * Add-Task-Seite für das Erstellen neuer Tasks
 * @module add-task
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { populateAssignees } from "./add-task-assignees.js";
import { initSubtaskInput } from "./add-task-subtasks.js";
import {
  bindPriorityButtons,
  bindActionButtons,
  toggleCategoryDropdown,
  selectCategory,
} from "./add-task-form.js";
import { initAddTaskValidation } from "../validation/validation-addTask.js";

initAddTaskPage();

/**
 * Initialisiert die Add-Task-Seite mit Authentication-Check und UI-Setup
 */
async function initAddTaskPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;

  await bootLayout();
  await populateAssignees();
  bindPriorityButtons();
  bindActionButtons();
  initSubtaskInput();
  initAddTaskValidation();
}

window.toggleCategoryDropdown = toggleCategoryDropdown;
window.selectCategory = selectCategory;
