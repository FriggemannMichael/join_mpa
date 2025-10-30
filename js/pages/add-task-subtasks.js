/**
 * Subtask-Verwaltung für Add-Task-Seite
 * @module add-task-subtasks
 */

import { icons } from "../common/svg-template.js";


/**
 * Array zur Speicherung aller Subtasks
 */
export let subtasks = [];


/**
 * Initialisiert das Subtask-Eingabefeld mit Icons und Event-Handlers
 */
export function initSubtaskInput() {
  const elements = getSubtaskElements();
  if (!elements) return;

  insertSubtaskIcons(elements);
  bindSubtaskInputEvents(elements);
  bindSubtaskIconEvents(elements);
}


/**
 * Holt alle benötigten DOM-Elemente für Subtasks
 * @returns {Object|null} Objekt mit DOM-Elementen oder null
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
 * Fügt SVG-Icons in die Icon-Container ein
 * @param {Object} elements DOM-Elemente
 */
function insertSubtaskIcons(elements) {
  elements.closeIcon.innerHTML = icons.close;
  elements.checkIcon.innerHTML = icons.check;
}


/**
 * Bindet Event-Listener für das Subtask-Eingabefeld
 * @param {Object} elements DOM-Elemente
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
 * Bindet Event-Listener für die Subtask-Icons
 * @param {Object} elements DOM-Elemente
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
 * Löscht den Inhalt des Subtask-Eingabefeldes
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
 * Fügt eine neue Subtask hinzu
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
 * Erstellt ein neues Subtask-Objekt
 * @param {string} text Subtask-Text
 * @returns {Object} Neues Subtask-Objekt
 */
function createNewSubtask(text) {
  return {
    id: Date.now(),
    text: text,
    completed: false,
  };
}


/**
 * Rendert alle Subtasks in der Liste
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
 * Erstellt ein DOM-Element für eine Subtask
 * @param {Object} subtask Subtask-Objekt
 * @returns {HTMLElement} DOM-Element
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
 * Baut das HTML für eine Subtask
 * @param {Object} subtask Subtask-Objekt
 * @returns {string} HTML-String
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
 * Fügt Event-Listener zu Subtask-Elementen hinzu
 * @param {HTMLElement} subtaskDiv Subtask-DOM-Element
 * @param {number} id Subtask-ID
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
 * Löscht eine Subtask
 * @param {number} id Subtask-ID
 */
export function deleteSubtask(id) {
  const index = subtasks.findIndex((subtask) => subtask.id === id);
  if (index !== -1) {
    subtasks.splice(index, 1);
  }
  renderSubtasks();
}


/**
 * Bearbeitet eine Subtask
 * @param {number} id Subtask-ID
 */
export function editSubtask(id) {
  const subtask = subtasks.find((s) => s.id === id);
  if (!subtask) return;

  const subtaskElement = document.querySelector(`[data-id="${id}"]`);
  renderEditMode(subtaskElement, subtask, id);
}


/**
 * Rendert den Edit-Modus für eine Subtask
 * @param {HTMLElement} subtaskElement DOM-Element
 * @param {Object} subtask Subtask-Objekt
 * @param {number} id Subtask-ID
 */
function renderEditMode(subtaskElement, subtask, id) {
  subtaskElement.classList.add("editing");
  subtaskElement.innerHTML = buildEditModeHTML(subtask);

  const input = subtaskElement.querySelector(".subtask-edit-input");
  focusAndSelectInput(input);

  bindEditModeEvents(subtaskElement, id);
}


/**
 * Baut das HTML für den Edit-Modus
 * @param {Object} subtask Subtask-Objekt
 * @returns {string} HTML-String
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
 * Fokussiert und selektiert das Input-Feld
 * @param {HTMLInputElement} input Input-Element
 */
function focusAndSelectInput(input) {
  input.focus();
  input.select();
}


/**
 * Bindet Event-Listener für den Edit-Modus
 * @param {HTMLElement} subtaskElement DOM-Element
 * @param {number} id Subtask-ID
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
 * Speichert die bearbeitete Subtask
 * @param {number} id Subtask-ID
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
 * Aktualisiert den Text einer Subtask
 * @param {number} id Subtask-ID
 * @param {string} newText Neuer Text
 */
function updateSubtaskText(id, newText) {
  const subtask = subtasks.find((s) => s.id === id);
  if (subtask) {
    subtask.text = newText;
  }
}


/**
 * Bricht die Bearbeitung ab
 */
function cancelSubtaskEdit() {
  renderSubtasks();
}


/**
 * Setzt die Subtasks aus einer Liste
 * @param {Array} list Array von Subtasks
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
