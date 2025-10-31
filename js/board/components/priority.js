/**
 * Builds and returns a visual priority indicator element.
 * Displays a corresponding icon for the given priority level.
 * @param {string} [priority="medium"] - The task priority ("urgent", "medium", or "low").
 * @returns {HTMLDivElement} The created priority indicator element.
 */
export function buildPriority(priority) {
  const wrapper = document.createElement("div");
  wrapper.className = "prio";

  const icon = document.createElement("img");
  const map = {
    urgent: "./assets/icons/prio-urgent.svg",
    medium: "./assets/icons/prio-medium.svg",
    low: "./assets/icons/prio-low.svg",
  };
  const source = map[priority] || map.medium;
  icon.src = source;
  icon.alt = `Prio ${priority || "medium"}`;
  wrapper.append(icon);
  return wrapper;
}