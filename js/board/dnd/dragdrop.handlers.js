import { renderTaskModal } from "../modals/taskModal.view.js";
import { db } from "../../common/firebase.js";
import {
  ref,
  update,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { loadTask } from "../services/tasks.repo.js";


/**
 * Opens the task modal for the given card.
 * Loads the task data and renders the modal view.
 * @async
 * @param {HTMLElement} card - The task card element that was tapped or clicked.
 * @returns {Promise<void>}
 */
export async function openModal(card) {
  const id = card.dataset.taskId;
  const task = await loadTask(id);
  await renderTaskModal(id, task);
}


/**
 * Updates the status of a task in the database.
 * Sets the new status and updates the timestamp.
 * @async
 * @param {string} taskId - The ID of the task to update.
 * @param {string} newStatus - The new status value for the task.
 * @returns {Promise<void>}
 */
async function updateTaskStatus(taskId, newStatus) {
  const taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, { status: newStatus, updatedAt: Date.now() });
}


/**
 * Updates the task status if it was moved to a different column.
 * @param {HTMLElement} card - The task card.
 * @param {HTMLElement|null} targetCol - The target column.
 * @param {HTMLElement} originColumn - The origin column.
 * @returns {void}
 */
export function updateTaskIfMoved(card, targetCol, originColumn) {
  if (targetCol && targetCol !== originColumn) {
    const space = targetCol.querySelector(".task_space");
    updateTaskStatus(card.dataset.taskId, space.id);
  }
}