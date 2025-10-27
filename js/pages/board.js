/**
 * Board-Seite für Task-Management und Kanban-View
 * @module board
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { subscribeToTasks } from "../common/tasks.js";
import { enableCardInteractions } from "../board/dragdrop.js";
import { colorFromString, clearModal, ScrollLock } from "../board/utils.js"
import { initBoardSearch } from "../board/search.js";
import { initAddTask } from "../board/addTaskModal.js"
import { buildInitials} from "../board/utils.js"








/**
 * Toggles visibility of the search error message on the board.
 * @param {boolean} show - Whether to show or hide the message element.
 * @returns {void}
 */
function toggleSearchMessage(show) {
  const message = document.getElementById("search_error");
  if (!message) return;
  message.style.display = show ? "block" : "none";
}







































