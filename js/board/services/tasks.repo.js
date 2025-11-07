import { db } from "../../common/firebase.js";
import {
  ref,
  get,
  child,
  update,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { closeTaskOverlay, showBoardAlert } from "../utils.js";
import { showAlert } from "../../common/alertService.js";

/**
 * Fetches all contacts from the database and returns them as an object map.
 * @async
 * @returns {Promise<Object>} Contact map if available, otherwise an empty object.
 */
export async function getContactsMap() {
  try {
    const snap = await get(child(ref(db), "contacts"));
    return snap.exists() ? snap.val() : {};
  } catch (error) {
    showAlert("error", 2500, "Failed to load contacts");
    return {};
  }
}

/**
 * Updates the "done" state of a specific subtask in the database.
 * Also updates the parent task's timestamp.
 * @async
 * @param {string} taskId - ID of the task that contains the subtask.
 * @param {number} index - Index of the subtask to update.
 * @param {boolean} done - New completion state.
 * @returns {Promise<void>}
 */
export async function updateSubtaskDone(taskId, index, done) {
  try {
    if (!taskId || typeof index !== "number") {
      showAlert("error", 2500, "Invalid subtask parameters");
      return;
    }

    const path = `tasks/${taskId}/subtasks/${index}/done`;
    await update(ref(db), {
      [path]: !!done,
      [`tasks/${taskId}/updatedAt`]: Date.now(),
    });
  } catch (error) {
    showAlert("error", 2500, "Failed to update subtask");
  }
}

/**
 * Deletes a task from the database and updates the UI.
 * Closes the overlay and shows a delete alert.
 * @async
 * @param {string} taskId - ID of the task to delete.
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
  try {
    if (!taskId) {
      showAlert("error", 2500, "Invalid task ID");
      return;
    }

    const path = `tasks/${taskId}`;
    await update(ref(db), { [path]: null });
    closeTaskOverlay();
    showBoardAlert("deleted");
  } catch (error) {
    showAlert("error", 2500, "Failed to delete task");
  }
}

/**
 * Loads a task by its ID from the database.
 * @async
 * @param {string} id - ID of the task to load.
 * @returns {Promise<Object|null>} Task object if found, otherwise null.
 */
export async function loadTask(id) {
  try {
    if (!id) {
      showAlert("error", 2500, "Task ID is missing");
      return null;
    }

    const root = ref(db);
    const snap = await get(child(root, `tasks/${id}`));
    return snap.exists() ? { id, ...snap.val() } : null;
  } catch (error) {
    showAlert("error", 2500, "Failed to load task");
    return null;
  }
}

/**
 * Updates a task in the database and shows a success alert.
 * @async
 * @param {string} taskId - ID of the task to update.
 * @param {Object} task - Updated task data.
 * @returns {Promise<boolean>} Resolves to true when the update is complete.
 */
export async function updateTask(taskId, task) {
  try {
    if (!taskId) {
      showAlert("error", 2500, "Task ID is missing");
      return false;
    }

    if (!task || typeof task !== "object") {
      showAlert("error", 2500, "Invalid task data");
      return false;
    }

    const taskRef = ref(db, `tasks/${taskId}`);
    await update(taskRef, task);
    showBoardAlert("updated");
    return true;
  } catch (error) {
    showAlert("error", 2500, "Failed to update task");
    return false;
  }
}
