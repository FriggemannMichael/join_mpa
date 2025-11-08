import { subscribeToTasks } from "../../common/tasks.js";
import { renderBoard } from "../index.js";
import { logError } from "../../common/logger.js";

let unsubscribeTasks = null;

/**
 * Subscribes to live task updates and re-renders the board on changes.
 * Automatically unsubscribes when the window is closed or reloaded.
 * @returns {void}
 */
export function observeTasks() {
  try {
    unsubscribeTasks = subscribeToTasks((tasks) => {
      renderBoard(tasks || []);
      // toggleSearchMessage(false);
    });
    window.addEventListener("beforeunload", () => {
      if (unsubscribeTasks) unsubscribeTasks();
    });
  } catch (error) {
    logError("LiveTasks", "Error subscribing to tasks", error);
    renderBoard([]);
  }
}
