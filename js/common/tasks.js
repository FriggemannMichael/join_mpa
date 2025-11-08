/**
 * Task-Service für Firebase Realtime Database Operations
 * @module tasks
 */

import { auth } from "./firebase.js";
import { getActiveUser } from "./session.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  off,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { showAlert } from "./alertService.js";

const TASKS_PATH = "tasks";

/**
 * Validates the provided task data.
 * @param {object} task - Task data to validate.
 * @throws {Error} If task data or title is invalid.
 */
function validateTask(task) {
  if (!task || typeof task !== "object") {
    showAlert("error", 2500, "Invalid task data");
    throw new Error("Invalid task data");
  }
  if (!task.title?.trim()) {
    showAlert("error", 2500, "Task title is required");
    throw new Error("Task title is required");
  }
}

/**
 * Creates a new task entry in Firebase.
 * @async
 * @param {object} task - Task object containing all required fields.
 * @returns {Promise<string>} Resolves with the new task key.
 * @throws {Error} When Firebase or validation fails.
 */
export async function createTask(task) {
  try {
    validateTask(task);
    const db = getDatabase();
    const newRef = push(ref(db, TASKS_PATH));
    await set(newRef, buildTaskPayload(task));
    return newRef.key;
  } catch (error) {
    showAlert("error", 2500, "Failed to create task");
    throw error;
  }
}

/**
 * Subscribes to tasks in Firebase and updates the listener on changes.
 * @param {(tasks:any[])=>void} listener - Callback for normalized tasks.
 * @returns {() => void} Unsubscribe function.
 */
export function subscribeToTasks(listener) {
  if (typeof listener !== "function") {
    showAlert("error", 2500, "Invalid listener function");
    return () => {};
  }

  const tasksRef = ref(getDatabase(), TASKS_PATH);
  const handler = (s) => {
    try { listener(normalizeTasks(s.exists() ? s.val() : null)); }
    catch { showAlert("error", 2500, "Error processing tasks"); listener([]); }
  };

  onValue(tasksRef, handler, () => { showAlert("error", 2500, "Failed to load tasks"); listener([]); });
  return () => off(tasksRef, "value", handler);
}

/**
 * Builds a normalized and complete task payload ready to be stored in Firebase.
 * Fills in default values for missing fields and adds metadata like timestamps and user info.
 *
 * @param {Partial<Task>} task - The raw task input (can contain only a subset of fields).
 * @returns {Task} The fully normalized task object ready for database storage.
 */
function buildTaskPayload(task) {
  const now = Date.now();
  const currentUser = getActiveUser();

  return {
    title: task.title || "",
    description: task.description || "",
    dueDate: task.dueDate || "",
    category: task.category || "",
    categoryLabel: task.categoryLabel || task.category || "",
    priority: task.priority || "medium",
    status:
      !task.status || typeof task.status !== "string" || !task.status.trim()
        ? "toDo"
        : task.status,
    assignees: Array.isArray(task.assignees) ? task.assignees : [],
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    createdBy: currentUser?.uid || "",
    createdByEmail: currentUser?.email || "",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Converts a raw Firebase task object into a normalized and sorted task array.
 * Each task receives its unique Firebase ID (`id`) and is guaranteed to be an object.
 * Tasks are sorted by creation date in ascending order.
 *
 * @param {Record<string, Partial<Task>> | null} raw - The raw task object returned from Firebase (`snapshot.val()`).
 * @returns {Task[]} An array of normalized task objects with attached IDs.
 */
function normalizeTasks(raw) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .map(([id, value]) => ({
      id,
      ...(value && typeof value === "object" ? value : {}),
    }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
