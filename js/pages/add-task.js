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
async function loadAssigneesFromDatabase(dropdown, currentUserUid) {
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
async function fetchContactsFromFirebase() {
  const db = await loadFirebaseDatabase();
  const snapshot = await db.get(db.ref(db.getDatabase(), "contacts"));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Behandelt erfolgreich geladene Kontakte
 */
function handleContactsLoaded(dropdown, contacts, currentUserUid) {
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
function handleContactsLoadError(error) {
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

/**
 * Rendert die Assignee-Dropdown-Liste mit Checkboxen
 */
function renderAssigneeDropdown(dropdown, options) {
  dropdown.innerHTML = "";

  options.forEach((option, index) => {
    const initials = getInitials(option.label);
    const color = getColorForInitials(initials);
    const checkboxId = `assignee_${index}`;
    const displayName = option.isCurrentUser
      ? `${option.label} (Du)`
      : option.label;

    const labelEl = document.createElement("label");
    labelEl.className = "checkbox-label";
    labelEl.htmlFor = checkboxId;

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
function bindAssigneeEvents() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");

  if (header) {
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAssigneeDropdown();
    });
  }

  if (dropdown) {
    dropdown.addEventListener("change", (e) => {
      if (e.target.type === "checkbox") {
        updateAssigneeSelection();
      }
    });
  }

  // Schließen bei Klick außerhalb
  document.addEventListener("click", (e) => {
    if (!header?.contains(e.target) && !dropdown?.contains(e.target)) {
      dropdown?.classList.add("d-none");
      header?.classList.remove("open");
    }
  });
}

/**
 * Togglet die Sichtbarkeit des Assignee-Dropdowns
 */
function toggleAssigneeDropdown() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");

  dropdown?.classList.toggle("d-none");
  header?.classList.toggle("open");
}

/**
 * Aktualisiert die Anzeige der ausgewählten Assignees
 */
function updateAssigneeSelection() {
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
    const color = getColorForInitials(initials);

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
function setAssigneeLoading(isLoading) {
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
function getInitials(name) {
  if (!name) return "??";
  const cleanName = name.replace(/\s*\(Du\)\s*$/i, "").trim();
  const parts = cleanName.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generiert eine Farbe basierend auf Initialen
 */
function getColorForInitials(initials) {
  const colors = [
    "#FF6B6B",
    "#00B8D4",
    "#1DE9B6",
    "#00CFAE",
    "#00BCD4",
    "#2196F3",
    "#3D5AFE",
    "#7C4DFF",
    "#AB47BC",
    "#E040FB",
  ];
  const charCode = initials.charCodeAt(0);
  return colors[charCode % colors.length];
}

/**
 * Liest die Task-Daten aus dem Formular
 */
function readTaskData() {
  const checkboxes = document.querySelectorAll(
    '#assignee-dropdown input[type="checkbox"]:checked'
  );
  const assignees = Array.from(checkboxes).map((cb) => ({
    uid: cb.value,
    name: cb.dataset.name,
    email: cb.dataset.email,
  }));

  const categorySelect = document.getElementById("taskCategory");
  const categoryLabel = categorySelect?.selectedOptions?.[0]?.textContent || "";

  return {
    title: readValue("taskTitle"),
    description: readValue("taskDescription"),
    dueDate: readValue("taskDueDate"),
    category: readValue("taskCategory"),
    categoryLabel,
    priority: readActivePriority(),
    assignees: assignees,
    subtask: readValue("taskSubtasks"),
    status: "todo",
  };
}

/**
 * Liest den Wert eines Formularfeldes
 */
function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Liest die aktive Priorität
 */
function readActivePriority() {
  const active = document.querySelector(".priority-btn.active");
  return active ? active.dataset.priority || "" : "";
}

/**
 * Setzt den Task-Status
 */
function setTaskStatus(message, isError) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Löscht das Formular und setzt es zurück
 */
function clearTaskForm() {
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

  // Reset priority buttons
  document.querySelectorAll(".priority-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector('.priority-btn[data-priority="medium"]')
    ?.classList.add("active");

  // Reset assignee display
  updateAssigneeSelection();

  setTaskStatus("Formular zurückgesetzt", false);
}

/**
 * Behandelt das Erstellen eines Tasks
 */
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
function toggleCategoryDropdown() {
  const header = document.querySelector('.category-select-header');
  const dropdown = document.getElementById('category-dropdown');
  dropdown?.classList.toggle('d-none');
  header?.classList.toggle('open');
}

/**
 * Setzt die Kategorie (wird inline per onclick in HTML aufgerufen)
 * @param {string} value Kategorie-Wert (z.B. 'technical-task')
 */
function selectCategory(value) {
  const input = document.getElementById('category');
  const placeholder = document.getElementById('selected-catrgory-placeholder'); // note: id contains typo in HTML, keep consistent
  const dropdown = document.getElementById('category-dropdown');

  if (input) input.value = value;

  if (placeholder) {
    const text = value === 'technical-task' ? 'Technical Task' : value === 'user-story' ? 'User Story' : value;
    placeholder.textContent = text;
  }

  dropdown?.classList.add('d-none');
  document.querySelector('.category-select-header')?.classList.remove('open');
}

// Expose functions to global scope so inline onclick attributes in add-task.html can call them
window.toggleCategoryDropdown = toggleCategoryDropdown;
window.selectCategory = selectCategory;


export function colorFromString(str) {
  if (!str) return "#999";

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}
