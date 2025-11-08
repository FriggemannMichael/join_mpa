/**
 * Builds and returns a visual progress bar for task subtasks.
 * Displays the completion ratio, progress label, and tooltip with percentage info.
 * @param {Array<Object>} [subtasks=[]] - List of subtask objects with a boolean `done` property.
 * @returns {HTMLDivElement|null} The created progress bar element, or null if no subtasks exist.
 */
export function buildSubtaskProgress(subtasks = []) {
  if (!Array.isArray(subtasks) || !subtasks.length) return null;
  const done = subtasks.filter(st => st.done).length;
  const total = subtasks.length;
  const { box, bar } = buildProgressBar(done, total);
  const label = document.createElement("span");
  label.className = "subtasks_label";
  label.textContent = `${done}/${total} Subtasks`;
  const tooltip = total
    ? `${done} of ${total} subtasks completed (${Math.round((done / total) * 100)}%)`: "No subtasks available";
  box.setAttribute("data-tooltip", tooltip);
  bar.setAttribute("aria-label", tooltip);
  box.append(bar, label);
  return box;
}


/**
 * Builds and returns the base progress bar structure for subtasks.
 * Creates a wrapper and bar element with CSS variables and ARIA attributes.
 * @param {number} done - The number of completed subtasks.
 * @param {number} total - The total number of subtasks.
 * @returns {{box: HTMLDivElement, bar: HTMLDivElement}} An object containing the wrapper and bar elements.
 */
function buildProgressBar(done, total) {
  const box = document.createElement("div");
  box.className = "subtasks has_tooltip";
  box.style.setProperty("--done", done);
  box.style.setProperty("--total", total);

  const bar = document.createElement("div");
  bar.className = "subtasks_bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", String(total));
  bar.setAttribute("aria-valuenow", String(done));

  return { box, bar };
}