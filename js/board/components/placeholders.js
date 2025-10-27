/**
 * Creates and returns an element representing an empty board state.
 * Displays a placeholder message when no tasks are available.
 * @param {string} text - The message text to display inside the element.
 * @returns {HTMLDivElement} The created empty state element.
 */
export function buildEmptyState(text) {
  const node = document.createElement("div");
  node.className = "no_task_to_do";
  node.textContent = text;
  return node;
}
