/**
 * Add-Task page for creating new tasks
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
import { mountAddTaskValidation } from "../validation/validation-addTask.js";


initAddTaskPage();


/**
 * Initializes the Add-Task page with authentication check and UI setup
 */
async function initAddTaskPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;

  await bootLayout();
  await populateAssignees();
  bindPriorityButtons();
  bindActionButtons();
  initSubtaskInput();
  mountAddTaskValidation();
}

window.toggleCategoryDropdown = toggleCategoryDropdown;
window.selectCategory = selectCategory;
