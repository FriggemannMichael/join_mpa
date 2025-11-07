/**
 * Assignee dropdown management for Add-Task page
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
 * Loads and populates the assignee selection list with contacts
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
 * Loads contacts from the Firebase database
 * @param {HTMLElement} dropdown Dropdown element
 * @param {string} currentUserUid Current user ID
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
 * Fetches contacts from Firebase
 * @returns {Promise<Object|null>} Contacts object or null
 */
async function fetchContactsFromFirebase() {
  const db = await loadFirebaseDatabase();
  const snapshot = await db.get(db.ref(db.getDatabase(), "contacts"));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Handles successfully loaded contacts
 * @param {HTMLElement} dropdown Dropdown element
 * @param {Object|null} contacts Contacts object
 * @param {string} currentUserUid Current user ID
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
 * Handles errors when loading contacts
 * @param {Error} error Error object
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
 * Displays an error message
 * @param {string} message Error message
 */
function showErrorStatus(message) {
  const status = document.getElementById("taskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.add("error");
}

/**
 * Builds assignee options from raw contact data
 * @param {Object} rawUsers Raw user data
 * @param {string} currentUid Current user ID
 * @returns {Array} Array of assignee options
 */
function buildAssigneeOptions(rawUsers, currentUid) {
  const users = rawUsers && typeof rawUsers === "object" ? rawUsers : {};
  const mappedUsers = mapUsersToOptions(users, currentUid);
  return sortUsersByLabel(mappedUsers);
}

/**
 * Maps user objects to assignee options
 * @param {Object} users User object
 * @param {string} currentUid Current user ID
 * @returns {Array} Mapped options
 */
function mapUsersToOptions(users, currentUid) {
  return Object.values(users)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => createAssigneeOption(entry, currentUid))
    .filter((entry) => entry.value);
}

/**
 * Creates an assignee option from a user entry
 * @param {Object} entry User entry
 * @param {string} currentUid Current user ID
 * @returns {Object} Assignee option
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
 * Sorts user options alphabetically by label
 * @param {Array} users User options
 * @returns {Array} Sorted user options
 */
function sortUsersByLabel(users) {
  return users.sort((a, b) => a.label.localeCompare(b.label, "de"));
}

/**
 * Binds event listeners for assignee dropdown
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
 * Binds click event for header
 * @param {HTMLElement} header Header element
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
 * Binds change event for dropdown
 * @param {HTMLElement} dropdown Dropdown element
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
 * Binds outside click event to close the dropdown
 * @param {HTMLElement} dropdown Dropdown element
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
 * Toggles the visibility of the assignee dropdown
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
 * Binds event listener for the search field
 * @param {HTMLElement} searchInput Search field element
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
 * Sets the loading status for assignees
 * @param {boolean} isLoading Loading status
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
 * Extracts initials from a name
 * @param {string} name Name
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name) return "??";
  const cleanName = name.replace(/\s*\(Du\)\s*$/i, "").trim();
  const parts = cleanName.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Handles clicks outside the dropdown
 * @param {Event} e Click event
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
