/**
 * Add-Task-Seite für das Erstellen neuer Tasks
 * @module add-task
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { auth } from "../common/firebase.js";
import { loadFirebaseDatabase } from "../common/database.js";
import { createTask } from "../common/tasks.js";

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
}

/**
 * Bindet Event-Listener für Prioritäts-Buttons
 */
function bindPriorityButtons() {
  document.querySelectorAll(".priority-btn").forEach((button) => {
    button.addEventListener("click", () => setActivePriority(button));
  });
}

/**
 * Setzt einen Prioritäts-Button als aktiv und deaktiviert andere
 * @param {HTMLElement} activeButton Der zu aktivierende Button
 */
function setActivePriority(activeButton) {
  document.querySelectorAll(".priority-btn").forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });
}

/**
 * Bindet Event-Listener für Aktions-Buttons (Clear, Create)
 */
function bindActionButtons() {
  const clearBtn = document.getElementById("taskClearBtn");
  const createBtn = document.getElementById("taskCreateBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearTaskForm);
  if (createBtn) createBtn.addEventListener("click", handleTaskCreate);
}

/**
 * Lädt und füllt die Assignee-Auswahlliste mit Kontakten
 */
async function populateAssignees() {
  const select = document.getElementById("taskAssignees");
  if (!select) return;

  setAssigneeOptions(select, [], "Lade Kontakte…", true);

  const currentUser = auth.currentUser;
  if (!currentUser) {
    setAssigneeOptions(select, [], "Keine Kontakte verfügbar", true);
    return;
  }

  try {
    const db = await loadFirebaseDatabase();
    const snapshot = await db.get(db.ref(db.getDatabase(), "contacts"));
    if (!snapshot.exists()) {
      setAssigneeOptions(select, [], "Keine Kontakte verfügbar", true);
      return;
    }

    const options = buildAssigneeOptions(snapshot.val(), currentUser.uid);
    if (!options.length) {
      setAssigneeOptions(select, [], "Keine Kontakte verfügbar", true);
      return;
    }

    setAssigneeOptions(
      select,
      options,
      "Kontakt für Zuweisung auswählen",
      false
    );
  } catch (error) {
    console.error("Assignees konnten nicht geladen werden", error);
    setAssigneeOptions(
      select,
      [],
      "Kontakte konnten nicht geladen werden",
      true
    );
    const isPermissionError =
      typeof error?.code === "string" &&
      error.code.includes("permission_denied");
    const message = isPermissionError
      ? "Zugriff auf Kontakte in der Datenbank verweigert. Bitte Regeln prüfen."
      : "Kontakte konnten nicht geladen werden.";
    setTaskStatus(message, true);
  }
}

function buildAssigneeOptions(rawUsers, currentUid) {
  const users = rawUsers && typeof rawUsers === "object" ? rawUsers : {};
  return Object.values(users)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      value: entry.uid || entry.email || "",
      label:
        entry.name ||
        entry.displayName ||
        entry.email ||
        entry.uid ||
        "Unbekannt",
      email: entry.email || "",
      isCurrentUser: entry.uid === currentUid,
    }))
    .filter((entry) => entry.value)
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
}

function setAssigneeOptions(select, options, placeholder, disabled) {
  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = placeholder;
  select.append(defaultOption);

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    const display = option.isCurrentUser
      ? `${option.label} (Du)`
      : option.label;
    opt.textContent = display;
    if (option.email) opt.dataset.email = option.email;
    select.append(opt);
  });

  select.disabled = disabled;
}

function clearTaskForm() {
  document
    .querySelectorAll(
      "#pageContent input, #pageContent textarea, #pageContent select"
    )
    .forEach((field) => {
      if (field instanceof HTMLSelectElement) field.selectedIndex = 0;
      else field.value = "";
    });
  setTaskStatus("Formular zurückgesetzt", false);
}

async function handleTaskCreate() {
  const data = readTaskData();
  if (!data.title || !data.dueDate || !data.category) {
    setTaskStatus("Bitte alle Pflichtfelder ausfüllen", true);
    return;
  }
  const createBtn = document.getElementById("taskCreateBtn");
  if (createBtn) createBtn.disabled = true;
  try {
    await createTask(data);
    setTaskStatus("Task gespeichert", false);
    clearTaskForm();
  } catch (error) {
    console.error("Task konnte nicht gespeichert werden", error);
    setTaskStatus("Task konnte nicht gespeichert werden", true);
  } finally {
    if (createBtn) createBtn.disabled = false;
  }
}

function readTaskData() {
  const assigneeSelect = document.getElementById("taskAssignees");
  const assigneeEmail =
    assigneeSelect?.selectedOptions?.[0]?.dataset.email || "";
  const assigneeName = assigneeSelect?.selectedOptions?.[0]?.textContent || "";
  const categorySelect = document.getElementById("taskCategory");
  const categoryLabel = categorySelect?.selectedOptions?.[0]?.textContent || "";
  return {
    title: readValue("taskTitle"),
    description: readValue("taskDescription"),
    dueDate: readValue("taskDueDate"),
    category: readValue("taskCategory"),
    categoryLabel,
    priority: readActivePriority(),
    assignee: readValue("taskAssignees"),
    assigneeEmail,
    assigneeName,
    subtask: readValue("taskSubtasks"),
    status: "todo",
  };
}

function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active ? active.dataset.priority || "" : "";
}

function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}
