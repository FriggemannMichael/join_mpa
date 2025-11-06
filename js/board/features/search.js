import { buildEmptyState } from "../components/placeholders.js"

/**
 * Initializes the board search input and button.
 * Attaches event listeners and prepares the search UI.
 * @returns {void}
 */
export function initBoardSearch() {
  const button = document.getElementById("searchButton");
  const input = document.getElementById("searchInput");

  const run = () => runSearch(input.value.trim());
  button.addEventListener("click", run);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  input.addEventListener("keydown", run);

  toggleSearchMessage(false);
}


/**
 * Runs the board search and filters visible task cards.
 * Shows or hides cards based on whether they match the search term.
 * @param {string} term - The search term to filter task cards by.
 * @returns {void}
 */
function runSearch(term) {
  const cards = Array.from(document.querySelectorAll(".task_card"));
  const hasTerm = !!term;
  let foundAny = false;

  cards.forEach((card) => {
    const isMatch = hasTerm && matchTask(card, term);
    card.style.display = (!hasTerm || isMatch) ? "" : "none";
    if (isMatch) foundAny = true;
  });

  ensureColumnEmptyStates(hasTerm)

  toggleSearchMessage(hasTerm && !foundAny);
}


/**
 * Checks if a task card matches the given search term.
 * Compares the title, description, and category text.
 * @param {HTMLElement} card - The task card element to check.
 * @param {string} term - The search term to match against.
 * @returns {boolean} True if the card text includes the term, otherwise false.
 */
function matchTask(card, term) {
  const title = card.querySelector(".task_header")?.textContent || "";
  const description = card.querySelector(".task_description")?.textContent || "";
  const category = card.querySelector(".task_category")?.textContent || "";
  const text = `${title} ${description} ${category}`.toLowerCase();
  return text.includes(term.toLowerCase());
}


/**
 * Toggles the visibility of the search message element.
 * @param {boolean} show - Whether to show or hide the message.
 * @returns {void}
 */
function toggleSearchMessage(show) {
  const msg = document.getElementById("search_error");
  if (!msg) return;
  msg.style.display = show ? "block" : "none";
}


/**
 * Ensures each board column shows a temporary empty state when no visible tasks remain.
 * Removes the placeholder once tasks are visible again or search is cleared.
 * @param {boolean} searchActive - Whether the search filter is currently active.
 * @returns {void}
 */
function ensureColumnEmptyStates(searchActive) {
  getBoardColumns().forEach((col) => {
    const visible = [...col.querySelectorAll(".task_card")]
      .filter(c => c.style.display !== "none");
    const temp = col.querySelector(".search-temp-empty");

    if (searchActive && visible.length === 0) {
      if (!temp) {
        const el = buildEmptyState("No search results");
        col.append(el);
      }
    } else if (temp) {
      temp.remove();
    }
  });
}


/**
 * Returns all column elements on the board.
 * Used to iterate over each Kanban column when updating task visibility.
 * @returns {HTMLElement[]} An array of all board column elements.
 */
function getBoardColumns() {
  return Array.from(document.querySelectorAll(".task_space"));
}