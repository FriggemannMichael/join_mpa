/**
 * Formular-Verwaltung für Add-Task-Seite
 * @module add-task-form
 */

import { createTask } from "../common/tasks.js";
import { icons } from "../common/svg-template.js";
import { subtasks, renderSubtasks } from "./add-task-subtasks.js";
import { updateAssigneeSelection } from "./add-task-assignees-ui.js";
import { validatePriorityGroup } from "../validation/validation-fields.js";
import { controller } from "../validation/validation-addTask.js";

/**
 * Bindet Event-Listener für Prioritäts-Buttons
 */
export function bindPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => setActivePriority(button));
  });

  const mediumButton = document.querySelector(
    '.priority-btn[data-priority="medium"]'
  );
  if (mediumButton) {
    setActivePriority(mediumButton);
  }
}

/**
 * Setzt einen Prioritäts-Button als aktiv und deaktiviert andere
 * @param {HTMLElement} activeButton Der zu aktivierende Button
 */
export function setActivePriority(activeButton) {
  // 1️⃣ UI-State
  document.querySelectorAll(".priority-btn").forEach((button) => {
    updateButtonActiveState(button, button === activeButton);
  });

  // 2️⃣ Priority-Gruppe prüfen (zeigt/entfernt Fehler)
  const group = activeButton.closest(".priority-buttons");
  validatePriorityGroup(group, "Priority", { show: true });

  // 3️⃣ Gesamt-Button-Status aktualisieren (silent)
  if (controller?.updateSubmit) {
    controller.updateSubmit();
  }
}

/**
 * Aktualisiert den aktiven Status eines Buttons
 * @param {HTMLElement} button Button-Element
 * @param {boolean} isActive Aktiv-Status
 */
function updateButtonActiveState(button, isActive) {
  button.classList.toggle("active", isActive);

  const iconContainer = button.querySelector(".prio-icon");
  const priority = button.dataset.priority;

  if (iconContainer && priority) {
    updatePriorityIcon(iconContainer, priority, isActive);
  }
}

/**
 * Aktualisiert das Prioritäts-Icon
 * @param {HTMLElement} iconContainer Icon-Container
 * @param {string} priority Priorität
 * @param {boolean} isActive Aktiv-Status
 */
function updatePriorityIcon(iconContainer, priority, isActive) {
  if (isActive) {
    iconContainer.outerHTML = getActivePriorityIcon(priority);
  } else {
    iconContainer.outerHTML = getInactivePriorityIcon(priority);
  }
}

/**
 * Holt das aktive Icon für eine Priorität
 * @param {string} priority Priorität
 * @returns {string} HTML-String mit Icon
 */
function getActivePriorityIcon(priority) {
  const iconMap = {
    urgent: icons.prioHighwhite,
    medium: icons.priomediumwhite,
    low: icons.arrowdownwhite,
  };

  const icon = iconMap[priority] || "";
  return `<div class="prio-icon">${icon}</div>`;
}

/**
 * Holt das inaktive Icon für eine Priorität
 * @param {string} priority Priorität
 * @returns {string} HTML-String mit Icon
 */
function getInactivePriorityIcon(priority) {
  const iconMap = {
    urgent: "./assets/icons/prio-urgent.svg",
    medium: "./assets/icons/prio-medium.svg",
    low: "./assets/icons/prio-low.svg",
  };

  const src = iconMap[priority] || "";
  const alt = `${
    priority.charAt(0).toUpperCase() + priority.slice(1)
  } priority`;
  return `<img class="prio-icon" src="${src}" alt="${alt}" />`;
}

/**
 * Bindet Event-Listener für Aktions-Buttons (Clear, Create)
 */
export function bindActionButtons() {
  const clearBtn = document.getElementById("taskClearBtn");
  const createBtn = document.getElementById("taskCreateBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearTaskForm);
  if (createBtn) createBtn.addEventListener("click", handleTaskCreate);

  // Initiale Validierung
  validateFormAndUpdateButton();
  // Event-Listener für Formularfelder
  bindFormValidation();
}

/**
 * Liest die Task-Daten aus dem Formular
 * @returns {Object} Task-Daten
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
    assignees: assignees,
    subtasks: subtasks.slice(),
    status: "toDo",
  };
}

/**
 * Liest die ausgewählten Assignees
 * @returns {Array} Array von Assignee-Objekten
 */
function readAssignees() {
  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]:checked'
  );
  return Array.from(checkboxes).map((cb) => ({
    uid: cb.value,
    name: cb.dataset.name?.replace(/\s*\(Du\)$/i, "").trim() || "",
    email: cb.dataset.email,
  }));
}

/**
 * Liest die ausgewählte Kategorie
 * @returns {Object} Kategorie-Objekt mit value und label
 */
function readCategory() {
  const categoryValue = readValue("category");
  const categoryLabel =
    document.getElementById("selected-category-placeholder")?.textContent || "";

  return { value: categoryValue, label: categoryLabel };
}

/**
 * Liest den Wert eines Formularfeldes
 * @param {string} id Element-ID
 * @returns {string} Feldwert
 */
export function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Liest die aktive Priorität
 * @returns {string} Priorität
 */
export function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active ? active.dataset.priority || "" : "";
}

/**
 * Löscht das Formular und setzt es zurück
 */
export function clearTaskForm() {
  clearTextFields();
  clearCheckboxes();
  clearPriorityButtons();
  updateAssigneeSelection();
  subtasks.length = 0;
  renderSubtasks();
  setTaskStatus("Formular zurückgesetzt", false);
  // Button-Status nach Clear aktualisieren
  validateFormAndUpdateButton();
}

/**
 * Löscht alle Textfelder im Formular
 */
function clearTextFields() {
  document
    .querySelectorAll(
      "#pageContent input[type='text'], #pageContent input[type='date'], #pageContent textarea, #pageContent select"
    )
    .forEach((field) => {
      if (field instanceof HTMLSelectElement) {
        field.selectedIndex = 0;
      } else {
        field.value = "";
      }
    });
}

/**
 * Deaktiviert alle Checkboxen
 */
function clearCheckboxes() {
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
    });
}

/**
 * Deaktiviert alle Prioritäts-Buttons und setzt Medium als Default
 */
function clearPriorityButtons() {
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const mediumButton = document.querySelector(
    '.priority-btn[data-priority="medium"]'
  );
  if (mediumButton) {
    setActivePriority(mediumButton);
  }
}

/**
 * Behandelt das Erstellen eines Tasks
 */
export async function handleTaskCreate() {
  const data = readTaskData();

  if (!validateTaskData(data)) {
    setTaskStatus("Bitte alle Pflichtfelder ausfüllen (inkl. Priorität)", true);
    return;
  }

  const createBtn = document.getElementById("taskCreateBtn");
  if (createBtn) createBtn.disabled = true;

  try {
    await createTask(data);
    setTaskStatus("Task erfolgreich erstellt!", false);
    clearTaskForm();
    setTimeout(() => {
      window.location.href = "board.html";
    }, 100);
  } catch (error) {
    setTaskStatus("Task konnte nicht gespeichert werden", true);
  } finally {
    if (createBtn) createBtn.disabled = false;
  }
}

/**
 * Validiert die Task-Daten
 * @param {Object} data Task-Daten
 * @returns {boolean} True wenn valide
 */
function validateTaskData(data) {
  return !!(data.title && data.dueDate && data.category && data.priority);
}

/**
 * Bindet Event-Listener für Formularfeld-Änderungen zur Validierung
 */
function bindFormValidation() {
  const titleField = document.getElementById("taskTitle");
  const dueDateField = document.getElementById("taskDueDate");
  const categoryField = document.getElementById("category");
  const priorityButtons = document.querySelectorAll(".priority-btn");

  // Title und Due Date bei Eingabe validieren
  if (titleField)
    titleField.addEventListener("input", validateFormAndUpdateButton);
  if (dueDateField)
    dueDateField.addEventListener("change", validateFormAndUpdateButton);
  if (categoryField)
    categoryField.addEventListener("change", validateFormAndUpdateButton);

  // Priorität bei Klick validieren
  priorityButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(validateFormAndUpdateButton, 0);
    });
  });
}

/**
 * Validiert das Formular und aktiviert/deaktiviert den Create-Button
 */
export function validateFormAndUpdateButton() {
  const data = readTaskData();
  const createBtn = document.getElementById("taskCreateBtn");

  if (!createBtn) return;

  const isValid = validateTaskData(data);
  createBtn.disabled = !isValid;
  createBtn.classList.toggle("disabled", !isValid);
}

/**
 * Setzt den Task-Status
 * @param {string} message Status-Nachricht
 * @param {boolean} isError Fehler-Flag
 */
export function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Toggle für das Category-Dropdown (wird inline per onclick in HTML aufgerufen)
 */
export function toggleCategoryDropdown() {
  const header = document.querySelector(".category-select-header");
  const dropdown = document.getElementById("category-dropdown");
  dropdown?.classList.toggle("d-none");
  header?.classList.toggle("open");
}

/**
 * Setzt die Kategorie (wird inline per onclick in HTML aufgerufen)
 * @param {string} value Kategorie-Wert (z.B. 'technical-task')
 */
export function selectCategory(value) {
  const input = document.getElementById("category");
  const placeholder = document.getElementById("selected-category-placeholder");
  const dropdown = document.getElementById("category-dropdown");

  if (input) {
    input.value = value;
    // Trigger change event für Validierung
    input.dispatchEvent(new Event("change"));
  }
  if (placeholder) placeholder.textContent = getCategoryLabel(value);

  dropdown?.classList.add("d-none");
  document.querySelector(".category-select-header")?.classList.remove("open");
}

/**
 * Holt das Label für eine Kategorie
 * @param {string} value Kategorie-Wert
 * @returns {string} Kategorie-Label
 */
function getCategoryLabel(value) {
  const labelMap = {
    "technical-task": "Technical Task",
    "user-story": "User Story",
  };
  return labelMap[value] || value;
}
