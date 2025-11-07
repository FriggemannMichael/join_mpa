/**
 * Assignee-Dropdown-Verwaltung für Add-Task-Seite
 * @module add-task-assignees
 */

import { auth } from "../common/firebase.js";
import { getActiveUser } from "../common/session.js";
import { loadFirebaseDatabase } from "../common/database.js";
import {
  renderAssigneeDropdown,
  updateAssigneeSelection,
  filterAssignees,
} from "./add-task-assignees-ui.js";

/**
 * Lädt und füllt die Assignee-Auswahlliste mit Kontakten
 */
export async function populateAssignees() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");
  if (!header || !dropdown) return;

  setAssigneeLoading(true);

  const currentUser = getActiveUser();
  if (!currentUser) {
    setAssigneeLoading(false);
    return;
  }

  await loadAssigneesFromDatabase(dropdown, currentUser.uid);
  bindAssigneeEvents();
}

/**
 * Lädt Kontakte aus der Firebase-Datenbank
 * @param {HTMLElement} dropdown Dropdown-Element
 * @param {string} currentUserUid ID des aktuellen Users
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
 * @returns {Promise<Object|null>} Kontakte-Objekt oder null
 */
async function fetchContactsFromFirebase() {
  const db = await loadFirebaseDatabase();
  const snapshot = await db.get(db.ref(db.getDatabase(), "contacts"));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Behandelt erfolgreich geladene Kontakte
 * @param {HTMLElement} dropdown Dropdown-Element
 * @param {Object|null} contacts Kontakte-Objekt
 * @param {string} currentUserUid ID des aktuellen Users
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
 * @param {Error} error Fehler-Objekt
 */
function handleContactsLoadError(error) {
  setAssigneeLoading(false);

  const isPermissionError =
    typeof error?.code === "string" && error.code.includes("permission_denied");
  const message = isPermissionError
    ? "Access to contacts in database denied. Please check rules."
    : "Contacts could not be loaded.";

  showErrorStatus(message);
}

/**
 * Zeigt eine Fehlermeldung an
 * @param {string} message Fehlermeldung
 */
function showErrorStatus(message) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.add("error");
}

/**
 * Baut Assignee-Optionen aus rohen Kontakt-Daten
 * @param {Object} rawUsers Rohe User-Daten
 * @param {string} currentUid ID des aktuellen Users
 * @returns {Array} Array von Assignee-Optionen
 */
function buildAssigneeOptions(rawUsers, currentUid) {
  const users = rawUsers && typeof rawUsers === "object" ? rawUsers : {};
  const mappedUsers = mapUsersToOptions(users, currentUid);
  return sortUsersByLabel(mappedUsers);
}

/**
 * Mappt User-Objekte zu Assignee-Optionen
 * @param {Object} users User-Objekt
 * @param {string} currentUid ID des aktuellen Users
 * @returns {Array} Gemappte Optionen
 */
function mapUsersToOptions(users, currentUid) {
  return Object.values(users)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => createAssigneeOption(entry, currentUid))
    .filter((entry) => entry.value);
}

/**
 * Erstellt eine Assignee-Option aus einem User-Entry
 * @param {Object} entry User-Entry
 * @param {string} currentUid ID des aktuellen Users
 * @returns {Object} Assignee-Option
 */
function createAssigneeOption(entry, currentUid) {
  return {
    value: entry.uid || entry.email || "",
    label:
      entry.name ||
      entry.displayName ||
      entry.email ||
      entry.uid ||
      "Unbekannt",
    email: entry.email || "",
    isCurrentUser: entry.uid === currentUid,
  };
}

/**
 * Sortiert User-Optionen alphabetisch nach Label
 * @param {Array} users User-Optionen
 * @returns {Array} Sortierte User-Optionen
 */
function sortUsersByLabel(users) {
  return users.sort((a, b) => a.label.localeCompare(b.label, "de"));
}

/**
 * Bindet Event-Listener für Assignee-Dropdown
 */
function bindAssigneeEvents() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");
  const searchInput = document.getElementById("assignee-search");

  bindHeaderClickEvent(header);
  bindDropdownChangeEvent(dropdown);
  bindOutsideClickEvent(dropdown);
  bindSearchInputEvent(searchInput);
}

/**
 * Bindet Click-Event für Header
 * @param {HTMLElement} header Header-Element
 */
function bindHeaderClickEvent(header) {
  if (!header || header.dataset.bound) return;

  header.dataset.bound = "1";
  header.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAssigneeDropdown();
  });
}

/**
 * Bindet Change-Event für Dropdown
 * @param {HTMLElement} dropdown Dropdown-Element
 */
function bindDropdownChangeEvent(dropdown) {
  if (!dropdown || dropdown.dataset.bound) return;

  dropdown.dataset.bound = "1";

  // Event delegation for checkboxes (works even after filtering)
  dropdown.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      updateAssigneeSelection();
    }
  });
}

/**
 * Bindet Outside-Click-Event zum Schließen des Dropdowns
 * @param {HTMLElement} dropdown Dropdown-Element
 */
function bindOutsideClickEvent(dropdown) {
  if (!dropdown) return;

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
function toggleAssigneeDropdown() {
  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");
  const searchInput = document.getElementById("assignee-search");

  const isOpening = dropdown?.classList.contains("d-none");

  dropdown?.classList.toggle("d-none");
  header?.classList.toggle("open");

  // Focus on search field when opening
  if (isOpening && searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }

  // Clear search field when closing
  if (!isOpening && searchInput) {
    searchInput.value = "";
    filterAssignees("");
  }
}

/**
 * Bindet Event-Listener für das Suchfeld
 * @param {HTMLElement} searchInput Suchfeld-Element
 */
function bindSearchInputEvent(searchInput) {
  if (!searchInput || searchInput.dataset.bound) return;

  searchInput.dataset.bound = "1";

  // Input event for live search
  searchInput.addEventListener("input", (e) => {
    filterAssignees(e.target.value);
  });

  // Prevent click on search field from closing the dropdown
  searchInput.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

/**
 * Setzt den Loading-Status für Assignees
 * @param {boolean} isLoading Loading-Status
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
 * @param {string} name Name
 * @returns {string} Initialen
 */
export function getInitials(name) {
  if (!name) return "??";
  const cleanName = name.replace(/\s*\(Du\)\s*$/i, "").trim();
  const parts = cleanName.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Behandelt Klicks außerhalb des Dropdowns
 * @param {Event} e Click-Event
 */
export function handleOutsideDropdownClick(e) {
  if (e.cancelBubble) return;

  const header = document.getElementById("assigneeHeader");
  const dropdown = document.getElementById("assignee-dropdown");
  if (!header || !dropdown) return;

  if (!header.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("d-none");
    header.classList.remove("open");
  }
}
