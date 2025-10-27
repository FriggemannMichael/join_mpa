import { buildTaskCard } from "./card.js";
import { buildEmptyState } from "./placeholders.js";


/**
 * Renders all tasks for a single board column.
 * Uses a DocumentFragment to minimize DOM reflows and improve performance.
 *
 * @param {HTMLElement} container - The column element that will contain the tasks.
 * @param {Object[]} entries - The list of tasks to render in this column.
 * @param {{emptyText: string}} config - Column configuration (e.g. empty state message).
 * @returns {void}
 */
export function renderColumn(container, entries, config) {
  container.innerHTML = "";
  const frag = document.createDocumentFragment();

  if (!entries.length) {
    frag.append(buildEmptyState(config.emptyText));
  } else {
    for (const task of entries) frag.append(buildTaskCard(task));
  }

  container.append(frag);
}
