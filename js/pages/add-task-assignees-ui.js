/**
 * Assignee-Dropdown UI-Rendering
 * @module add-task-assignees-ui
 */

import { colorFromString } from "../board/utils.js";
import { getInitials } from "./add-task-assignees.js";


/**
 * Rendert die Assignee-Dropdown-Liste mit Checkboxen
 * @param {HTMLElement} dropdown Dropdown-Element
 * @param {Array} options Assignee-Optionen
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
 * Filtert die Assignee-Liste basierend auf Suchtext
 * @param {string} searchText Suchtext
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
 * Erstellt ein Label-Element für einen Assignee
 * @param {Object} option Assignee-Option
 * @param {number} index Index
 * @returns {HTMLElement} Label-Element
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
 * Baut das HTML für ein Assignee-Label
 * @param {string} displayName Anzeigename
 * @param {string} color Hintergrundfarbe
 * @param {string} initials Initialen
 * @param {string} checkboxId Checkbox-ID
 * @param {Object} option Assignee-Option
 * @returns {string} HTML-String
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
 * Aktualisiert die Anzeige der ausgewählten Assignees
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
 * Aktualisiert die Checkbox-Labels (selected-Klasse)
 * @param {NodeList} checkboxes Checkbox-Elemente
 */
function updateCheckboxLabels(checkboxes) {
  checkboxes.forEach((cb) => {
    const label = cb.closest(".checkbox-label");
    label?.classList.toggle("selected", cb.checked);
  });
}


/**
 * Holt die ausgewählten Kontakte
 * @param {NodeList} checkboxes Checkbox-Elemente
 * @returns {Array} Ausgewählte Kontakte
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
 * Aktualisiert den Placeholder-Text
 * @param {HTMLElement} placeholder Placeholder-Element
 * @param {Array} selected Ausgewählte Kontakte
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
 * Rendert die Avatare der ausgewählten Kontakte
 * @param {HTMLElement} avatarsContainer Container-Element
 * @param {Array} selected Ausgewählte Kontakte
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
 * Rendert die sichtbaren Avatare
 * @param {HTMLElement} container Container-Element
 * @param {Array} selected Ausgewählte Kontakte
 * @param {number} maxVisible Maximale Anzahl
 */
function renderVisibleAvatars(container, selected, maxVisible) {
  selected.slice(0, maxVisible).forEach((contact) => {
    const avatar = createAvatar(contact.name);
    container.appendChild(avatar);
  });
}


/**
 * Rendert den "Mehr"-Avatar wenn nötig
 * @param {HTMLElement} container Container-Element
 * @param {Array} selected Ausgewählte Kontakte
 * @param {number} maxVisible Maximale Anzahl
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
 * Erstellt einen Avatar für einen Kontakt
 * @param {string} name Kontaktname
 * @returns {HTMLElement} Avatar-Element
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
