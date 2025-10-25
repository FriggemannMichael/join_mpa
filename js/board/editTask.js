import { boardTemplates } from "./board-templates.js";
import {
  populateAssignees, updateAssigneeSelection,
  bindPriorityButtons, renderSubtasks, initSubtaskInput, setSubtasksFrom,
} from "../pages/add-task.js";
import { icons } from "../common/svg-template.js";
import { closeTaskOverlay } from "../board/utils.js";
import { updateTask, loadTask } from "./tasks.repo.js"


/**
 * Opens and renders the edit form inside the task modal.
 * Populates form fields, assignees, and priority buttons for the selected task.
 * @async
 * @param {string} taskId - ID of the task to edit.
 * @returns {Promise<void>}
 */
export async function openEditForm(taskId) {
  const section = document.getElementById("taskModal");
  section.classList.add("task-overlay");

  section.replaceChildren(
    createHeader(closeTaskOverlay),
    createBody(),
    createFooter(() => handleUpdate(taskId, section))
  );

  await populateAssignees();
  bindPriorityButtons();
  await fillEdit(taskId);
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
  const task = await loadTask(taskId);
  const scope = document.getElementById("taskModal");

  setField(scope, "#taskTitle", task.title);
  setField(scope, "#taskDescription", task.description);
  setField(scope, "#taskDueDate", task.dueDate);

  const prio = (task.priority || "").toLowerCase();
  scope.querySelectorAll(".priority-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.priority === prio);
  });

  preselectAssignees(task.assignees || []);
  setSubtasksFrom(task.subtasks || []);
  initSubtaskInput();
  renderSubtasks();
}


/**
 * Preselects assignee checkboxes based on the given list of users.
 * Updates the visual selection state in the dropdown.
 * @param {Array<Object>} selected - Array of selected assignee objects.
 * @returns {void}
 */
function preselectAssignees(selected) {
  const selectedIds = new Set(selected.map(a => a.uid));
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach(cb => cb.checked = selectedIds.has(cb.value));
  updateAssigneeSelection();
}


/**
 * Handles task updates from the edit modal and saves changes to the database.
 * Collects all form data, assignees, and subtasks before updating.
 * @async
 * @param {string} taskId - ID of the task being updated.
 * @param {Document|HTMLElement} [root=document] - The root element to query form fields from.
 * @returns {Promise<void>}
 */
export async function handleUpdate(taskId, root = document) {
  const get = sel => root.querySelector(sel);
  const all = sel => [...root.querySelectorAll(sel)];

  const titleEl = get('#taskTitle');
  const title = titleEl.value.trim();

  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]:checked'
  );

  const assignees = Array.from(checkboxes).map(cb => ({
    uid: cb.value,
    name: cb.dataset.name?.replace(/\s*\(Du\)$/i, '').trim() || '',
    email: cb.dataset.email,
  }));

  const task = {
    title,
    description: get('#taskDescription')?.value.trim() || '',
    dueDate: get('#taskDueDate')?.value || null,
    priority: get('.priority-btn.active')?.dataset.priority || null,
    assignees, // hier direkt einsetzen
    subtasks: all('#subtasksList .subtask-item').map(s => ({
      text: s.dataset.text || '',
      done: s.querySelector('input')?.checked || false,
    })),
    updatedAt: Date.now(),
  };

  console.log(task);
  await updateTask(taskId, task);
  closeTaskOverlay()
}

