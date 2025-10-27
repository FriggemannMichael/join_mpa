import { subscribeToTasks } from "../../common/tasks.js";
import {renderBoard } from "../index.js"


let unsubscribeTasks = null;


/**
 * Subscribes to live task updates and re-renders the board on changes.
 * Automatically unsubscribes when the window is closed or reloaded.
 * @async
 * @returns {Promise<void>}
 */
export async function observeTasks() {
  unsubscribeTasks = await subscribeToTasks((tasks) => {
    renderBoard(tasks || []);
    // toggleSearchMessage(false);
  });
  window.addEventListener("beforeunload", () => {
    if (unsubscribeTasks) unsubscribeTasks();
  });
}