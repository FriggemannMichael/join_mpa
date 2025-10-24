import { db } from "../common/firebase.js";
import { ref, get, child, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { closeTaskOverlay, showAlert } from "../board/utils.js";


export async function getContactsMap() {
  const snap = await get(child(ref(db), "contacts"));
  return snap.exists() ? snap.val() : {};
}


export async function updateSubtaskDone(taskId, index, done) {
  const path = `tasks/${taskId}/subtasks/${index}/done`;
  await update(ref(db), {
    [path]: !!done,
    [`tasks/${taskId}/updatedAt`]: Date.now(),
  });
}


export async function deleteTask(taskId) {
  const path = `tasks/${taskId}`;
  await update(ref(db), { [path]: null });
  console.log("🗑️ Task deleted:", taskId);
  closeTaskOverlay();
  showAlert('deleted');
}

export async function loadTask(id) {
  const root = ref(db);
  const snap = await get(child(root, `tasks/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}

export async function updateTask(taskId, task) {
  const taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, task);
  showAlert("updated");
  return true;
}