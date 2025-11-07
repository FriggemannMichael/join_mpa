/**
 * Subtask management for Add-Task page
 * @module add-task-subtasks
 */

import { icons } from "../common/svg-template.js";


/**
 * Array for storing all subtasks
 */
export let subtasks = [];


/**
 * Initializes the subtask input field with icons and event handlers
 */
export function initSubtaskInput() {
  const elements = getSubtaskElements();
  if (!elements) return;

  insertSubtaskIcons(elements);
  bindSubtaskInputEvents(elements);
  bindSubtaskIconEvents(elements);
}


/**
 * Gets all required DOM elements for subtasks
 * @returns {Object|null} Object with DOM elements or null
 */
function getSubtaskElements() {
  const subtaskInput = document.getElementById("taskSubtasks");
  const subtaskIcons = document.getElementById("subtaskIcons");
  const closeIcon = document.getElementById("subtaskClose");
  const checkIcon = document.getElementById("subtaskCheck");

  if (!subtaskInput || !subtaskIcons || !closeIcon || !checkIcon) {
    return null;
  }

  return { subtaskInput, subtaskIcons, closeIcon, checkIcon };
}


/**
 * Inserts SVG icons into the icon containers
 * @param {Object} elements DOM elements
 */
function insertSubtaskIcons(elements) {
  elements.closeIcon.innerHTML = icons.close;
  elements.checkIcon.innerHTML = icons.check;
}


/**
 * Binds event listeners for the subtask input field
 * @param {Object} elements DOM elements
 */
function bindSubtaskInputEvents(elements) {
  const { subtaskInput, subtaskIcons } = elements;

  subtaskInput.addEventListener("focus", () => {
    subtaskIcons.classList.add("active");
  });

  subtaskInput.addEventListener("input", () => {
    if (subtaskInput.value.trim()) {
      subtaskIcons.classList.add("active");
    } else {
      subtaskIcons.classList.remove("active");
    }
  });

  subtaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask();
    }
  });
}


/**
 * Binds event listeners for the subtask icons
 * @param {Object} elements DOM elements
 */
function bindSubtaskIconEvents(elements) {
  const { closeIcon, checkIcon } = elements;

  closeIcon.addEventListener("click", () => {
    clearSubtaskInput();
  });

  checkIcon.addEventListener("click", () => {
    addSubtask();
  });
}


/**
 * Clears the content of the subtask input field
 */
export function clearSubtaskInput() {
  const subtaskInput = document.getElementById("taskSubtasks");
  const subtaskIcons = document.getElementById("subtaskIcons");

  if (subtaskInput) {
    subtaskInput.value = "";
    subtaskInput.focus();
  }

  if (subtaskIcons) {
    subtaskIcons.classList.remove("active");
  }
}


/**
 * Adds a new subtask
 */
export function addSubtask() {
  const subtaskInput = document.getElementById("taskSubtasks");
  if (!subtaskInput || !subtaskInput.value.trim()) return;

  const newSubtask = createNewSubtask(subtaskInput.value.trim());
  subtasks.push(newSubtask);

  renderSubtasks();
  clearSubtaskInput();
}


/**
 * Creates a new subtask object
 * @param {string} text Subtask text
 * @returns {Object} New subtask object
 */
function createNewSubtask(text) {
  return {
    id: Date.now(),
    text: text,
    completed: false,
  };
}


/**
 * Renders all subtasks in the list
 */
export function renderSubtasks() {
  const subtasksList = document.getElementById("subtasksList");
  if (!subtasksList) return;

  subtasksList.innerHTML = "";
  subtasks.forEach((subtask) => {
    const subtaskElement = createSubtaskElement(subtask);
    subtasksList.appendChild(subtaskElement);
  });
}


/**
 * Creates a DOM element for a subtask
 * @param {Object} subtask Subtask object
 * @returns {HTMLElement} DOM element
 */
function createSubtaskElement(subtask) {
  const subtaskDiv = document.createElement("div");
  subtaskDiv.className = "subtask-list-item";
  subtaskDiv.dataset.id = subtask.id;

  subtaskDiv.innerHTML = buildSubtaskHTML(subtask);
  attachSubtaskEventListeners(subtaskDiv, subtask.id);

  return subtaskDiv;
}


/**
 * Builds the HTML for a subtask
 * @param {Object} subtask Subtask object
 * @returns {string} HTML string
 */
function buildSubtaskHTML(subtask) {
  return `
    <div class="subtask-content">
      <span class="subtask-bullet">•</span>
      <span class="subtask-text">${subtask.text}</span>
    </div>
    <div class="subtask-actions">
      <div class="subtask-action-btn subtask-edit-btn" title="Edit subtask">
        ${icons.edit}
      </div>
      <div class="subtask-divider"></div>
      <div class="subtask-action-btn subtask-delete-btn" title="Delete subtask">
        ${icons.delete}
      </div>
    </div>
  `;
}


/**
 * Attaches event listeners to subtask elements
 * @param {HTMLElement} subtaskDiv Subtask DOM element
 * @param {number} id Subtask ID
 */
function attachSubtaskEventListeners(subtaskDiv, id) {
  const editBtn = subtaskDiv.querySelector(".subtask-edit-btn");
  const deleteBtn = subtaskDiv.querySelector(".subtask-delete-btn");
  const subtaskText = subtaskDiv.querySelector(".subtask-text");

  editBtn.addEventListener("click", () => editSubtask(id));
  deleteBtn.addEventListener("click", () => deleteSubtask(id));
  subtaskText.addEventListener("click", () => editSubtask(id));

  subtaskText.style.cursor = "pointer";
}


/**
 * Deletes a subtask
 * @param {number} id Subtask ID
 */
export function deleteSubtask(id) {
  const index = subtasks.findIndex((subtask) => subtask.id === id);
  if (index !== -1) {
    subtasks.splice(index, 1);
  }
  renderSubtasks();
}


/**
 * Edits a subtask
 * @param {number} id Subtask ID
 */
export function editSubtask(id) {
  const subtask = subtasks.find((s) => s.id === id);
  if (!subtask) return;

  const subtaskElement = document.querySelector(`[data-id="${id}"]`);
  renderEditMode(subtaskElement, subtask, id);
}


/**
 * Renders edit mode for a subtask
 * @param {HTMLElement} subtaskElement DOM element
 * @param {Object} subtask Subtask object
 * @param {number} id Subtask ID
 */
function renderEditMode(subtaskElement, subtask, id) {
  subtaskElement.classList.add("editing");
  subtaskElement.innerHTML = buildEditModeHTML(subtask);

  const input = subtaskElement.querySelector(".subtask-edit-input");
  focusAndSelectInput(input);

  bindEditModeEvents(subtaskElement, id);
}


/**
 * Builds the HTML for edit mode
 * @param {Object} subtask Subtask object
 * @returns {string} HTML string
 */
function buildEditModeHTML(subtask) {
  return `
    <div class="subtask-edit-container">
      <input type="text" class="subtask-edit-input" value="${subtask.text}" placeholder="Subtasks">
      <div class="subtask-edit-actions">
        <div class="subtask-action-btn subtask-cancel-btn" title="Cancel">
          ${icons.close}
        </div>
        <div class="subtask-divider"></div>
        <div class="subtask-action-btn subtask-save-btn" title="Save">
          ${icons.check}
        </div>
      </div>
    </div>
  `;
}


/**
 * Focuses and selects the input field
 * @param {HTMLInputElement} input Input element
 */
function focusAndSelectInput(input) {
  input.focus();
  input.select();
}


/**
 * Binds event listeners for edit mode
 * @param {HTMLElement} subtaskElement DOM element
 * @param {number} id Subtask ID
 */
function bindEditModeEvents(subtaskElement, id) {
  const saveBtn = subtaskElement.querySelector(".subtask-save-btn");
  const cancelBtn = subtaskElement.querySelector(".subtask-cancel-btn");
  const input = subtaskElement.querySelector(".subtask-edit-input");

  saveBtn.addEventListener("click", () => saveSubtaskEdit(id));
  cancelBtn.addEventListener("click", () => cancelSubtaskEdit());

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveSubtaskEdit(id);
    } else if (e.key === "Escape") {
      cancelSubtaskEdit();
    }
  });
}


/**
 * Saves the edited subtask
 * @param {number} id Subtask ID
 */
function saveSubtaskEdit(id) {
  const subtaskElement = document.querySelector(`[data-id="${id}"]`);
  const input = subtaskElement.querySelector(".subtask-edit-input");
  const newText = input.value.trim();

  if (!newText) {
    deleteSubtask(id);
    return;
  }

  updateSubtaskText(id, newText);
  renderSubtasks();
}


/**
 * Updates the text of a subtask
 * @param {number} id Subtask ID
 * @param {string} newText New text
 */
function updateSubtaskText(id, newText) {
  const subtask = subtasks.find((s) => s.id === id);
  if (subtask) {
    subtask.text = newText;
  }
}


/**
 * Cancels the edit operation
 */
function cancelSubtaskEdit() {
  renderSubtasks();
}


/**
 * Sets the subtasks from a list
 * @param {Array} list Array of subtasks
 */
export function setSubtasksFrom(list) {
  const arr = Array.isArray(list) ? list : [];
  subtasks.length = 0;
  arr.forEach((s, i) => {
    subtasks.push({
      id: s?.id ?? Date.now() + i,
      text: (s?.text ?? "").trim(),
      completed: !!(s?.completed ?? s?.done),
    });
  });
}
