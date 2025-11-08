/**
 * Category selection utilities for the add-task form.
 * @module addTaskCategory
 */

/**
 * Toggles the visibility of the category dropdown.
 */
export function toggleCategoryDropdown() {
  const header = document.querySelector(".category-select-header");
  const dropdown = document.getElementById("category-dropdown");
  if (!header || !dropdown) return;
  const isOpen = !dropdown.classList.toggle("d-none");
  header.classList.toggle("open", isOpen);
  header.setAttribute("aria-expanded", String(isOpen));
  manageCategoryOutsideClick(isOpen);
}

/**
 * Registers or removes the outside click handler based on dropdown state.
 * @param {boolean} shouldListen - Whether to listen for outside clicks.
 */
function manageCategoryOutsideClick(shouldListen) {
  const handler = handleOutsideCategoryClick;
  if (shouldListen) {
    document.addEventListener("click", handler);
  } else {
    document.removeEventListener("click", handler);
  }
}

/**
 * Hides the dropdown when clicking outside of it.
 * @param {MouseEvent} event - Browser mouse event.
 */
function handleOutsideCategoryClick(event) {
  const dropdown = document.getElementById("category-dropdown");
  const header = document.querySelector(".category-select-header");
  if (!dropdown || !header) return;
  const target = event.target;
  if (dropdown.contains(target) || header.contains(target)) return;
  dropdown.classList.add("d-none");
  header.classList.remove("open");
  header.setAttribute("aria-expanded", "false");
  document.removeEventListener("click", handleOutsideCategoryClick);
}

/**
 * Applies the selected category value and closes the dropdown.
 * @param {string} value - Selected category identifier.
 */
export function selectCategory(value) {
  const input = document.getElementById("category");
  const placeholder = document.getElementById("selected-category-placeholder");
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("change"));
  }
  if (placeholder) placeholder.textContent = getCategoryLabel(value);
  document.getElementById("category-dropdown")?.classList.add("d-none");
  document.querySelector(".category-select-header")?.classList.remove("open");
}

/**
 * Maps category identifiers to human-readable labels.
 * @param {string} value - Category identifier.
 * @returns {string} Readable label.
 */
function getCategoryLabel(value) {
  const labels = {
    "technical-task": "Technical Task",
    "user-story": "User Story",
  };
  return labels[value] || value;
}
