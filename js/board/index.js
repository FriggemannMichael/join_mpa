import { guardPage } from "../common/pageGuard.js";
import { bootLayout } from "../common/layout.js";
import { initBoardSearch } from "./features/search.js";
import { bindColumnShortcuts } from "./handlers/interactions.js";
import { observeTasks } from "./state/liveTasks.js";
import { buildColumnsConfig, groupTasksByStatus } from "./state/columns.js";
import { renderColumn } from "./components/columns.js";
import { setGlobalButtonsDisabled } from "./utils.js";


initBoardPage();


/**
 * Initializes the main board page and its core features.
 * Handles authentication, layout setup, search, shortcuts, and task observation.
 * @async
 * @returns {Promise<void>}
 */
async function initBoardPage() {
  setGlobalButtonsDisabled(true);
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  initBoardSearch();
  bindColumnShortcuts();
  await observeTasks();
  setGlobalButtonsDisabled(false);
}


/**
 * Renders the entire board with all task columns.
 * Groups tasks by status and updates each column using its configuration.
 * @param {Array<Object>} tasks - List of task objects to render on the board.
 * @returns {void}
 */
export function renderBoard(tasks) {
  const columns = buildColumnsConfig();
  const grouped = groupTasksByStatus(tasks);

  Object.entries(columns).forEach(([status, config]) => {
    const el = document.getElementById(config.id);
    if (!el) return;
    renderColumn(el, grouped[status] || [], config);
  });
}