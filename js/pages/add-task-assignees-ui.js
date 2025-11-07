/**
 * Assignee-Dropdown UI-Rendering
 * @module add-task-assignees-ui
 */

import { colorFromString } from "../board/utils.js";
import { getInitials } from "./add-task-assignees.js";


/**
 * Renders the assignee dropdown list with checkboxes
 * @param {HTMLElement} dropdown Dropdown element
 * @param {Array} options Assignee options
 */
export function renderAssigneeDropdown(dropdown, options) {
  const listContainer = dropdown.querySelector('#assignee-list') || dropdown;
  listContainer.innerHTML = "";

  options.forEach((option, index) => {
    const labelEl = createAssigneeLabel(option, index);
    listContainer.appendChild(labelEl);
  });
}


/**
 * Filters the assignee list based on search text
 * @param {string} searchText Search text
 */
export function filterAssignees(searchText) {
  const listContainer = document.getElementById('assignee-list');
  if (!listContainer) return;

  const labels = listContainer.querySelectorAll('.checkbox-label');
  const searchLower = searchText.toLowerCase().trim();

  labels.forEach((label) => {
    const nameSpan = label.querySelector('.assignee-info span');
    if (!nameSpan) return;

    const name = nameSpan.textContent.toLowerCase();
    const matches = name.includes(searchLower);
    label.style.display = matches ? '' : 'none';
  });
}


/**
 * Creates a label element for an assignee
 * @param {Object} option Assignee option
 * @param {number} index Index
 * @returns {HTMLElement} Label element
 */
function createAssigneeLabel(option, index) {
  const initials = getInitials(option.label);
  const color = colorFromString(option.label);
  const checkboxId = `assignee_${index}`;
  const displayName = option.isCurrentUser ? `${option.label} (Du)` : option.label;

  const labelEl = document.createElement("label");
  labelEl.className = "checkbox-label";
  labelEl.innerHTML = buildAssigneeLabelHTML(displayName, color, initials, checkboxId, option);

  return labelEl;
}


/**
 * Builds the HTML for an assignee label
 * @param {string} displayName Display name
 * @param {string} color Background color
 * @param {string} initials Initials
 * @param {string} checkboxId Checkbox ID
 * @param {Object} option Assignee option
 * @returns {string} HTML string
 */
function buildAssigneeLabelHTML(displayName, color, initials, checkboxId, option) {
  return `
    <div class="assignee-info">
      <div class="user-initials" style="background-color: ${color};">${initials}</div>
      <span>${displayName}</span>
    </div>
    <input type="checkbox" id="${checkboxId}" value="${option.value}" data-name="${displayName}" data-email="${option.email}">
  `;
}


/**
 * Updates the display of selected assignees
 */
export function updateAssigneeSelection() {
  const avatarsContainer = document.getElementById("selected-assignee-avatars");
  const placeholder = document.getElementById("selected-assignees-placeholder");
  const checkboxes = document.querySelectorAll('#assignee-dropdown input[type="checkbox"]');

  if (!avatarsContainer || !placeholder) return;

  updateCheckboxLabels(checkboxes);
  const selected = getSelectedContacts(checkboxes);
  updatePlaceholderText(placeholder, selected);
  renderAvatars(avatarsContainer, selected);
}


/**
 * Updates the checkbox labels (selected class)
 * @param {NodeList} checkboxes Checkbox elements
 */
function updateCheckboxLabels(checkboxes) {
  checkboxes.forEach((cb) => {
    const label = cb.closest(".checkbox-label");
    label?.classList.toggle("selected", cb.checked);
  });
}


/**
 * Gets the selected contacts
 * @param {NodeList} checkboxes Checkbox elements
 * @returns {Array} Selected contacts
 */
function getSelectedContacts(checkboxes) {
  return Array.from(checkboxes)
    .filter((cb) => cb.checked)
    .map((cb) => ({
      name: cb.dataset.name,
      value: cb.value,
    }));
}


/**
 * Updates the placeholder text
 * @param {HTMLElement} placeholder Placeholder element
 * @param {Array} selected Selected contacts
 */
function updatePlaceholderText(placeholder, selected) {
  if (selected.length === 0) {
    placeholder.textContent = "Select contacts to assign";
  } else if (selected.length === 1) {
    placeholder.textContent = selected[0].name;
  } else {
    placeholder.textContent = `${selected.length} contacts selected`;
  }
}


/**
 * Renders the avatars of selected contacts
 * @param {HTMLElement} avatarsContainer Container element
 * @param {Array} selected Selected contacts
 */
function renderAvatars(avatarsContainer, selected) {
  avatarsContainer.innerHTML = "";
  const maxVisible = 5;

  // Leeren Container rendern (CSS :not(:empty) versteckt ihn automatisch)
  if (selected.length === 0) {
    return;
  }

  renderVisibleAvatars(avatarsContainer, selected, maxVisible);
  renderMoreAvatar(avatarsContainer, selected, maxVisible);
}


/**
 * Renders the visible avatars
 * @param {HTMLElement} container Container element
 * @param {Array} selected Selected contacts
 * @param {number} maxVisible Maximum number
 */
function renderVisibleAvatars(container, selected, maxVisible) {
  selected.slice(0, maxVisible).forEach((contact) => {
    const avatar = createAvatar(contact.name);
    container.appendChild(avatar);
  });
}


/**
 * Renders the "more" avatar if needed
 * @param {HTMLElement} container Container element
 * @param {Array} selected Selected contacts
 * @param {number} maxVisible Maximum number
 */
function renderMoreAvatar(container, selected, maxVisible) {
  if (selected.length > maxVisible) {
    const moreAvatar = document.createElement("div");
    moreAvatar.className = "avatar";
    moreAvatar.style.backgroundColor = "#2a3647";
    moreAvatar.textContent = `+${selected.length - maxVisible}`;
    container.appendChild(moreAvatar);
  }
}


/**
 * Creates an avatar for a contact
 * @param {string} name Contact name
 * @returns {HTMLElement} Avatar element
 */
function createAvatar(name) {
  const initials = getInitials(name);
  const color = colorFromString(name);

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.style.backgroundColor = color;
  avatar.textContent = initials;

  return avatar;
}
