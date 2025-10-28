/**
 * Add-Task-Seite für das Erstellen neuer Tasks
 * @module add-task
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { auth } from "../common/firebase.js";
import { loadFirebaseDatabase } from "../common/database.js";
import { createTask } from "../common/tasks.js";
import { icons } from "../common/svg-template.js";
import {colorFromString} from "../board/utils.js"
initAddTaskPage();

/**
 * Initialisiert die Add-Task-Seite mit Authentication-Check und UI-Setup
 */
export async function initAddTaskPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  await populateAssignees();
  bindPriorityButtons();
  bindActionButtons();
  initSubtaskInput();
}

/**
 * Bindet Event-Listener für Prioritäts-Buttons
 */
export function bindPriorityButtons() {
  document.querySelectorAll(".priority-btn").forEach((button) => {
    button.addEventListener("click", () => setActivePriority(button));
  });
}

/**
 * Setzt einen Prioritäts-Button als aktiv und deaktiviert andere
 * @param {HTMLElement} activeButton Der zu aktivierende Button
 */
export function setActivePriority(activeButton) {
  document.querySelectorAll(".priority-btn").forEach((button) => {
    if (button === activeButton) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

    // Icon für aktiven Zustand ändern
    const iconContainer = button.querySelector(".prio-icon");
    const priority = button.dataset.priority;

    if (iconContainer && priority) {
      if (button === activeButton) {
        // Aktive Icons verwenden - SVG direkt aus template einsetzen
        switch (priority) {
          case "urgent":
            iconContainer.outerHTML = `<div class="prio-icon">${icons.prioHighwhite}</div>`;
            break;
          case "medium":
            iconContainer.outerHTML = `<div class="prio-icon">${icons.priomediumwhite}</div>`;
            break;
          case "low":
            iconContainer.outerHTML = `<div class="prio-icon">${icons.arrowdownwhite}</div>`;
            break;
        }
      } else {
        // Standard Icons für inaktive Buttons - wieder zu img-Tags zurück
        switch (priority) {
          case "urgent":
            iconContainer.outerHTML = `<img class="prio-icon" src="./img/icon/prio-urgent.svg" alt="Urgent priority" />`;
            break;
          case "medium":
            iconContainer.outerHTML = `<img class="prio-icon" src="./img/icon/prio-medium.svg" alt="Medium priority" />`;
            break;
          case "low":
            iconContainer.outerHTML = `<img class="prio-icon" src="./img/icon/prio-low.svg" alt="Low priority" />`;
            break;
        }
      }
    }
  });
}

/**
 * Bindet Event-Listener für Aktions-Buttons (Clear, Create)
 */
export function bindActionButtons() {
  const clearBtn = document.getElementById("taskClearBtn");
  const createBtn = document.getElementById("taskCreateBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearTaskForm);
  if (createBtn) createBtn.addEventListener("click", handleTaskCreate);
}

/**
 * Lädt und füllt die Assignee-Auswahlliste mit Kontakten
 */
export async function populateAssignees() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");
  if (!header || !dropdown) return;

  setAssigneeLoading(true);

  const currentUser = auth.currentUser;
  if (!currentUser) {
    setAssigneeLoading(false);
    return;
  }

  await loadAssigneesFromDatabase(dropdown, currentUser.uid);
  bindAssigneeEvents();
}

/**
 * Lädt Kontakte aus der Firebase-Datenbank
 */
export async function loadAssigneesFromDatabase(dropdown, currentUserUid) {
  try {
    const contacts = await fetchContactsFromFirebase();
    handleContactsLoaded(dropdown, contacts, currentUserUid);
  } catch (error) {
    handleContactsLoadError(error);
  }
}

/**
 * Holt Kontakte aus Firebase
 */
export async function fetchContactsFromFirebase() {
  const db = await loadFirebaseDatabase();
  const snapshot = await db.get(db.ref(db.getDatabase(), "contacts"));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Behandelt erfolgreich geladene Kontakte
 */
export function handleContactsLoaded(dropdown, contacts, currentUserUid) {
  if (!contacts) {
    setAssigneeLoading(false);
    return;
  }

  const options = buildAssigneeOptions(contacts, currentUserUid);
  if (!options.length) {
    setAssigneeLoading(false);
    return;
  }

  renderAssigneeDropdown(dropdown, options);
  setAssigneeLoading(false);
}

/**
 * Behandelt Fehler beim Laden der Kontakte
 */
export function handleContactsLoadError(error) {
  console.error("Assignees konnten nicht geladen werden", error);
  setAssigneeLoading(false);

  const isPermissionError =
    typeof error?.code === "string" && error.code.includes("permission_denied");
  const message = isPermissionError
    ? "Zugriff auf Kontakte in der Datenbank verweigert. Bitte Regeln prüfen."
    : "Kontakte konnten nicht geladen werden.";
  setTaskStatus(message, true);
}

/**
 * Baut Assignee-Optionen aus rohen Kontakt-Daten
 */
export function buildAssigneeOptions(rawUsers, currentUid) {
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

/**
 * Rendert die Assignee-Dropdown-Liste mit Checkboxen
 */
export function renderAssigneeDropdown(dropdown, options) {
  dropdown.innerHTML = "";

  options.forEach((option, index) => {
    const initials = getInitials(option.label);
    const color = colorFromString(option.label);
    const checkboxId = `assignee_${index}`;
    const displayName = option.isCurrentUser
      ? `${option.label} (Du)`
      : option.label;

    // Label umschließt das Input, kein for-Attribut nötig
    const labelEl = document.createElement("label");
    labelEl.className = "checkbox-label";
    labelEl.innerHTML = `
      <div class="assignee-info">
        <div class="user-initials" style="background-color: ${color};">${initials}</div>
        <span>${displayName}</span>
      </div>
      <input type="checkbox" id="${checkboxId}" value="${option.value}" data-name="${displayName}" data-email="${option.email}">
    `;

    dropdown.appendChild(labelEl);
  });
}

/**
 * Bindet Event-Listener für Assignee-Dropdown
 */
// export function bindAssigneeEvents() {
//   const header = document.getElementById("assigneeHeader");
//   const dropdown = document.getElementById("assignee-dropdown");

//   if (header) {
//     header.addEventListener("click", (e) => {
//       e.stopPropagation();
//       toggleAssigneeDropdown();
//     });
//   }

//   if (dropdown) {
//     dropdown.addEventListener("change", (e) => {
//       if (e.target.type === "checkbox") {
//         updateAssigneeSelection();
//       }
//     });
//   }

//   // Schließen bei Klick außerhalb
// document.addEventListener("click", handleOutsideDropdownClick);
// }
//
// Funktionaler für andere seiten ->

export function bindAssigneeEvents() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");
  if (!header.dataset.bound) {
    header.dataset.bound = "1";
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAssigneeDropdown();
    });
  }
  if (!dropdown.dataset.bound) {
    dropdown.dataset.bound = "1";
    dropdown.addEventListener("change", (e) => {
      if (e.target.type === "checkbox") updateAssigneeSelection();
    });
  }
  dropdown.closeCtrl?.abort();
  const ctrl = new AbortController();
  dropdown.closeCtrl = ctrl;
  document.addEventListener("click", handleOutsideDropdownClick, {
    capture: true,
    signal: ctrl.signal,
  });
}

/**
 * Togglet die Sichtbarkeit des Assignee-Dropdowns
 */
export function toggleAssigneeDropdown() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");

  dropdown?.classList.toggle("d-none");
  header?.classList.toggle("open");
}

/**
 * Aktualisiert die Anzeige der ausgewählten Assignees
 */
export function updateAssigneeSelection() {
  const avatarsContainer = document.getElementById("selected-assignee-avatars");
  const placeholder = document.getElementById("selected-assignees-placeholder");
  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]'
  );

  if (!avatarsContainer || !placeholder) return;

  // Update checkbox labels
  checkboxes.forEach((cb) => {
    const label = cb.closest(".checkbox-label");
    label?.classList.toggle("selected", cb.checked);
  });

  // Get selected contacts
  const selected = Array.from(checkboxes)
    .filter((cb) => cb.checked)
    .map((cb) => ({
      name: cb.dataset.name,
      value: cb.value,
    }));

  // Update placeholder text
  if (selected.length === 0) {
    placeholder.textContent = "Select contacts to assign";
  } else if (selected.length === 1) {
    placeholder.textContent = selected[0].name;
  } else {
    placeholder.textContent = `${selected.length} contacts selected`;
  }

  // Update avatars
  avatarsContainer.innerHTML = "";
  const maxVisible = 5;

  selected.slice(0, maxVisible).forEach((contact) => {
    const initials = getInitials(contact.name);
    const color = colorFromString(contact.name);

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.backgroundColor = color;
    avatar.textContent = initials;

    avatarsContainer.appendChild(avatar);
  });

  if (selected.length > maxVisible) {
    const moreAvatar = document.createElement("div");
    moreAvatar.className = "avatar";
    moreAvatar.style.backgroundColor = "#2a3647";
    moreAvatar.textContent = `+${selected.length - maxVisible}`;
    avatarsContainer.appendChild(moreAvatar);
  }
}

/**
 * Setzt den Loading-Status für Assignees
 */
export function setAssigneeLoading(isLoading) {
  const placeholder = document.getElementById("selected-assignees-placeholder");
  if (placeholder) {
    placeholder.textContent = isLoading
      ? "Loading contacts..."
      : "Select contacts to assign";
  }
}

/**
 * Extrahiert Initialen aus einem Namen
 */
export function getInitials(name) {
  if (!name) return "??";
  const cleanName = name.replace(/\s*\(Du\)\s*$/i, "").trim();
  const parts = cleanName.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


/**
 * Liest die Task-Daten aus dem Formular
 */
export function readTaskData() {
  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]:checked'
  );
  const assignees = Array.from(checkboxes).map((cb) => ({
    uid: cb.value,
    name: cb.dataset.name?.replace(/\s*\(Du\)$/i, "").trim() || "",
    email: cb.dataset.email,
  }));

  // Category aus hidden input auslesen
  const categoryValue = readValue("category");
  const categoryLabel =
    document.getElementById("selected-category-placeholder")?.textContent || "";

  // Subtasks-Array übernehmen
  return {
    title: readValue("taskTitle"),
    description: readValue("taskDescription"),
    dueDate: readValue("taskDueDate"),
    category: categoryValue,
    categoryLabel,
    priority: readActivePriority(),
    assignees: assignees,
    subtasks: subtasks.slice(), // Array kopieren
    status: "toDo",
  };
}

/**
 * Liest den Wert eines Formularfeldes
 */
export function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Liest die aktive Priorität
 */
export function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active ? active.dataset.priority || "" : "";
}

/**
 * Setzt den Task-Status
 */
export function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Löscht das Formular und setzt es zurück
 */
export function clearTaskForm() {
  // Reset text inputs, textareas, and selects
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

  // Reset checkboxes
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = false;
    });

  // Reset priority buttons - alle bleiben inaktiv
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Reset assignee display
  updateAssigneeSelection();

  // Subtasks-Array leeren und Liste neu rendern
  subtasks = [];
  renderSubtasks();

  setTaskStatus("Formular zurückgesetzt", false);
}

/**
 * Behandelt das Erstellen eines Tasks
 */
export async function handleTaskCreate() {
  const data = readTaskData();
  if (!data.title || !data.dueDate || !data.category || !data.priority) {
    setTaskStatus("Bitte alle Pflichtfelder ausfüllen (inkl. Priorität)", true);
    return;
  }
  const createBtn = document.getElementById("taskCreateBtn");
  if (createBtn) createBtn.disabled = true;
  try {
    await createTask(data);
    setTaskStatus("Task erfolgreich erstellt!", false);
    clearTaskForm();
  } catch (error) {
    console.error("Task konnte nicht gespeichert werden", error);
    setTaskStatus("Task konnte nicht gespeichert werden", true);
  } finally {
    if (createBtn) createBtn.disabled = false;
  }
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
  const placeholder = document.getElementById("selected-catrgory-placeholder"); // note: id contains typo in HTML, keep consistent
  const dropdown = document.getElementById("category-dropdown");

  if (input) input.value = value;

  if (placeholder) {
    const text =
      value === "technical-task"
        ? "Technical Task"
        : value === "user-story"
        ? "User Story"
        : value;
    placeholder.textContent = text;
  }

  dropdown?.classList.add("d-none");
  document.querySelector(".category-select-header")?.classList.remove("open");
}

// Expose functions to global scope so inline onclick attributes in add-task.html can call them
window.toggleCategoryDropdown = toggleCategoryDropdown;
window.selectCategory = selectCategory;


/**
 * Initialisiert das Subtask-Eingabefeld mit Icons und Event-Handlers
 */
export function initSubtaskInput(list = subtasks) {
  const subtaskInput = document.getElementById("taskSubtasks");
  const subtaskIcons = document.getElementById("subtaskIcons");
  const closeIcon = document.getElementById("subtaskClose");
  const checkIcon = document.getElementById("subtaskCheck");

  if (!subtaskInput || !subtaskIcons || !closeIcon || !checkIcon) {
    return;
  }

  // Icons in die Container einfügen
  closeIcon.innerHTML = icons.close;
  checkIcon.innerHTML = icons.check;

  // Event-Listener für das Eingabefeld
  subtaskInput.addEventListener("focus", () => {
    subtaskIcons.classList.add("active");
  });

  // subtaskInput.addEventListener("blur", (e) => {
  // Verzögerung hinzufügen, damit Icon-Klicks funktionieren
  setTimeout(() => {
    if (!subtaskInput.value.trim()) {
      subtaskIcons.classList.remove("active");
    }
  }, 150);
  // });

  subtaskInput.addEventListener("input", () => {
    if (subtaskInput.value.trim()) {
      subtaskIcons.classList.add("active");
    } else {
      subtaskIcons.classList.remove("active");
    }
  });

  // Event-Listener für die Icons
  closeIcon.addEventListener("click", () => {
    clearSubtaskInput();
  });

  checkIcon.addEventListener("click", () => {
    addSubtask(list);
  });

  // Enter-Taste für das Hinzufügen von Subtasks
  subtaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask(list);
    }
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
 * Array zur Speicherung aller Subtasks
 */
export let subtasks = [];

/**
 * Fügt eine neue Subtask hinzu
 */
export function addSubtask() {
  const subtaskInput = document.getElementById("taskSubtasks");

  if (!subtaskInput || !subtaskInput.value.trim()) return;

  const subtaskText = subtaskInput.value.trim();

  // Neue Subtask zum Array hinzufügen
  const newSubtask = {
    id: Date.now(), // Einfache ID-Generierung
    text: subtaskText,
    completed: false,
  };

  subtasks.push(newSubtask);

  // Subtask-Liste aktualisieren
  renderSubtasks();

  // Eingabefeld zurücksetzen
  clearSubtaskInput();

  // Erfolgs-Feedback (optional)
  setTaskStatus("Subtask hinzugefügt", false);
}

/**
 * Rendert alle Subtasks in der Liste
 */
export function renderSubtasks(list = subtasks) {
  const subtasksList = document.getElementById("subtasksList");
  if (!subtasksList) return;

  subtasksList.innerHTML = "";

  list.forEach((subtask) => {
    const subtaskElement = createSubtaskElement(subtask);
    subtasksList.appendChild(subtaskElement);
  });
}

/**
 * Erstellt ein DOM-Element für eine Subtask
 */
export function createSubtaskElement(subtask) {
  const subtaskDiv = document.createElement("div");
  subtaskDiv.className = "subtask-list-item";
  subtaskDiv.dataset.id = subtask.id;

  subtaskDiv.innerHTML = `
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

  // Event-Listener direkt hinzufügen
  const editBtn = subtaskDiv.querySelector(".subtask-edit-btn");
  const deleteBtn = subtaskDiv.querySelector(".subtask-delete-btn");
  const subtaskText = subtaskDiv.querySelector(".subtask-text");

  editBtn.addEventListener("click", () => editSubtask(subtask.id));
  deleteBtn.addEventListener("click", () => deleteSubtask(subtask.id));

  // Klick auf den Text startet auch die Bearbeitung
  subtaskText.addEventListener("click", () => editSubtask(subtask.id));

  // Cursor-Stil für bessere UX
  subtaskText.style.cursor = "pointer";

  return subtaskDiv;
}

/**
 * Löscht eine Subtask
 */
export function deleteSubtask(id) {
  subtasks = subtasks.filter((subtask) => subtask.id !== id);
  renderSubtasks();
  setTaskStatus("Subtask entfernt", false);
}

/**
 * Bearbeitet eine Subtask
 */
export function editSubtask(id) {
  const subtask = subtasks.find((s) => s.id === id);
  if (!subtask) return;

  const subtaskElement = document.querySelector(`[data-id="${id}"]`);

  // Edit-Modus aktivieren - komplette Zeile wird zu einem Input-Container wie beim Hinzufügen
  subtaskElement.classList.add("editing");

  // Erstelle Container ähnlich wie beim Hinzufügen
  subtaskElement.innerHTML = `
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

  // Input fokussieren und Text selektieren
  const input = subtaskElement.querySelector(".subtask-edit-input");
  input.focus();
  input.select();

  // Event-Listener für die neuen Buttons
  const saveBtn = subtaskElement.querySelector(".subtask-save-btn");
  const cancelBtn = subtaskElement.querySelector(".subtask-cancel-btn");

  saveBtn.addEventListener("click", () => saveSubtaskEdit(id));
  cancelBtn.addEventListener("click", () => cancelSubtaskEdit(id));

  // Enter und Escape Handler
  // input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    saveSubtaskEdit(id);
  } else if (e.key === "Escape") {
    cancelSubtaskEdit(id);
  }
  // });
  // }

  /**
   * Speichert die bearbeitete Subtask
   */
  export function saveSubtaskEdit(id) {
    const subtaskElement = document.querySelector(`[data-id="${id}"]`);
    const input = subtaskElement.querySelector(".subtask-edit-input");
    const newText = input.value.trim();

    if (!newText) {
      deleteSubtask(id);
      return;
    }

    // Subtask aktualisieren
    const subtask = subtasks.find((s) => s.id === id);
    if (subtask) {
      subtask.text = newText;
      renderSubtasks();
      setTaskStatus("Subtask aktualisiert", false);
    }
  }

  /**
   * Bricht die Bearbeitung ab
   */
  // export function cancelSubtaskEdit(id) {
  //   renderSubtasks();
  // }

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

  export function handleOutsideDropdownClick(e) {
    if (e.cancelBubble) return;

    const header = document.getElementById("assigneeHeader");
    const dropdown = document.getElementById("assignee-dropdown");
    if (!header || !dropdown) return;

    if (!header.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("d-none");
      header.classList.remove("open");
      // Der AbortController entfernt den Listener automatisch
    }
  }
}
