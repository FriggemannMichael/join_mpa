import { boardTemplates } from "../templates/board-templates.js";
import { populateAssignees } from "../../pages/add-task-assignees.js";
import { updateAssigneeSelection } from "../../pages/add-task-assignees-ui.js";
import { bindPriorityButtons } from "../../pages/add-task-form.js";
import {
  setSubtasksFrom,
  initSubtaskInput,
  renderSubtasks,
  subtasks as subtasksState,
} from "../../pages/add-task-subtasks.js";
import { icons } from "../../common/svg-template.js";
import { closeTaskOverlay } from "../utils.js";
import { updateTask, loadTask } from "../services/tasks.repo.js";
import {
  mountEditTaskValidation,
  unmountAddTaskValidation,
} from "../../validation/validation-addTask.js";
import { showAlert } from "../../common/alertService.js";

/**
 * Opens and renders the edit form inside the task modal.
 * Populates form fields, assignees, and priority buttons for the selected task.
 * @async
 * @param {string} taskId - ID of the task to edit.
 * @returns {Promise<void>}
 */
export async function openEditForm(taskId) {
  try {
    const section = document.getElementById("taskModal");
    if (!section) {
      showAlert("error", 2500, "Edit form could not be opened");
      return;
    }

    section.classList.add("task-overlay");

    section.replaceChildren(
      createHeader(closeTaskOverlay),
      createBody(),
      createFooter(() => handleUpdate(taskId, section))
    );

    await populateAssignees();
    bindPriorityButtons();
    await fillEdit(taskId);
    unmountAddTaskValidation();
    mountEditTaskValidation(section);
  } catch (error) {
    showAlert("error", 2500, "Error loading task for editing");
    closeTaskOverlay();
  }
}

/**
 * Creates the header section for the edit task modal.
 * Includes a close button bound to the provided handler.
 * @param {Function} onClose - Callback function to close the modal.
 * @returns {HTMLDivElement} The created header element.
 */
function createHeader(onClose) {
  const header = document.createElement("div");
  header.classList.add("task-editor_header");

  const btn = document.createElement("button");
  btn.className = "close_button_taskModal";
  btn.type = "button";
  btn.innerHTML = icons.close;
  btn.setAttribute("aria-label", "Close");
  btn.dataset.overlayClose = "#taskOverlay";
  btn.addEventListener("click", onClose);

  header.append(btn);
  return header;
}

/**
 * Creates the body section for the edit task modal.
 * Inserts the edit task template into the modal body.
 * @returns {HTMLDivElement} The created body element.
 */
function createBody() {
  const body = document.createElement("div");
  body.classList.add("task-editor_body");
  body.innerHTML = boardTemplates.editTask;
  return body;
}

/**
 * Creates the footer section for the edit task modal.
 * Includes an update button that triggers the given callback.
 * @param {Function} onUpdate - Callback function to handle task updates.
 * @returns {HTMLDivElement} The created footer element.
 */
function createFooter(onUpdate) {
  const footer = document.createElement("div");
  footer.classList.add("task-editor_footer");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "update-task-btn";
  btn.id = "taskSaveBtn";
  btn.innerHTML = `OK ${icons.checkwhite}`;
  btn.addEventListener("click", onUpdate);

  footer.append(btn);
  return footer;
}

/**
 * Sets the value or text content of a field inside the given scope.
 * Automatically detects whether the element supports a value property.
 * @param {HTMLElement} scope - The parent element to search within.
 * @param {string} selector - The selector used to find the target element.
 * @param {string} [value=""] - The value or text to set.
 * @returns {void}
 */
function setField(scope, selector, value) {
  const el = scope.querySelector(selector);
  if (!el) return;
  el["value" in el ? "value" : "textContent"] = value ?? "";
}

/**
 * Fills the edit task form with existing task data.
 * Loads the task, preselects assignees, and renders subtasks.
 * @async
 * @param {string} taskId - ID of the task to load and edit.
 * @returns {Promise<void>}
 */
export async function fillEdit(taskId) {
  try {
    const task = await loadTask(taskId);
    if (!task) {
      showAlert("error", 2500, "Task not found");
      closeTaskOverlay();
      return;
    }

    const scope = document.getElementById("taskModal");
    if (!scope) return;

    setField(scope, "#taskTitle", task.title);
    setField(scope, "#taskDescription", task.description);
    setField(scope, "#taskDueDate", task.dueDate);

    const prio = (task.priority || "").toLowerCase();
    scope.querySelectorAll(".priority-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.priority === prio);
    });

    preselectAssignees(task.assignees || []);
    setSubtasksFrom(task.subtasks || []);
    initSubtaskInput();
    renderSubtasks();
  } catch (error) {
    showAlert("error", 2500, "Error loading task data");
    closeTaskOverlay();
  }
}

/**
 * Preselects assignee checkboxes based on the given list of users.
 * Updates the visual selection state in the dropdown.
 * @param {Array<Object>} selected - Array of selected assignee objects.
 * @returns {void}
 */
function preselectAssignees(selected) {
  const selectedIds = new Set(selected.map((a) => a.uid));
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach((cb) => (cb.checked = selectedIds.has(cb.value)));
  updateAssigneeSelection();
}

/**
 * Handles updating an existing task with new form data.
 * Collects updated task fields, assignees, and subtasks, then saves changes to the database.
 * @async
 * @param {string} taskId - The unique ID of the task to update.
 * @param {Document|HTMLElement} [root=document] - The root element containing the task form.
 * @returns {Promise<void>}
 */
export async function handleUpdate(taskId, root = document) {
  try {
    if (!taskId) {
      showAlert("error", 2500, "Invalid task ID");
      return;
    }

    const base = collectTaskData(root);

    if (!base.title?.trim()) {
      showAlert("error", 2500, "Task title is required");
      return;
    }

    const assignees = readAssignees(root);
    const subtasks = normalizeSubtasks();

    const task = {
      ...base,
      assignees,
      subtasks,
      updatedAt: Date.now(),
    };

    await updateTask(taskId, task);
    closeTaskOverlay();
  } catch (error) {
    showAlert("error", 2500, "Failed to update task");
  }
}

/**
 * Collects and returns task data from the given root element.
 * Extracts title, description, due date, and priority from form fields.
 * @param {Document|HTMLElement} [root=document] - The root element containing the task form inputs.
 * @returns {{title: string, description: string, dueDate: string|null, priority: string|null}} The collected task data.
 */
function collectTaskData(root = document) {
  const get = (sel) => root.querySelector(sel);

  const title = get("#taskTitle")?.value.trim() || "";
  const description = get("#taskDescription")?.value.trim() || "";
  const dueDate = get("#taskDueDate")?.value || null;
  const priority = get(".priority-btn.active")?.dataset.priority || null;

  return { title, description, dueDate, priority };
}

/**
 * Reads and returns the list of selected assignees from the assignee dropdown.
 * Extracts UID, cleaned name, and email from checked checkbox elements.
 * @param {Document|HTMLElement} [root=document] - The root element containing the assignee dropdown.
 * @returns {Array<{uid: string, name: string, email: string}>} A list of selected assignee objects.
 */
function readAssignees(root = document) {
  return [
    ...root.querySelectorAll(
      '#assignee-dropdown input[type="checkbox"]:checked'
    ),
  ].map((cb) => ({
    uid: cb.value,
    name: cb.dataset.name?.replace(/\s*\(Du\)$/i, "").trim() || "",
    email: cb.dataset.email || "",
  }));
}

/**
 * Normalizes the current subtask state into a consistent array format.
 * Trims text values and ensures a boolean `done` property for each subtask.
 * @returns {Array<{text: string, done: boolean}>} The normalized list of subtasks.
 */
function normalizeSubtasks() {
  return (subtasksState || []).map((s) => ({
    text: (s?.text || "").trim(),
    done: !!s?.completed,
  }));
}
