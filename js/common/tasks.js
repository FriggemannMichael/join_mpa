/**
 * Task-Service für Firebase Realtime Database Operations
 * @module tasks
 */

import { auth } from "./firebase.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  off,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";


const TASKS_PATH = "tasks";


/**
 * Creates and stores a new task entry in the Firebase Realtime Database.
 * Builds the full task payload, pushes it under the tasks path, and returns the generated ID.
 * 
 * @async
 * @param {Object} task - The raw task data to store (title, description, subtasks, etc.).
 * @returns {Promise<string>} The unique key of the newly created task in the database.
 */
export async function createTask(task) {
  const db = getDatabase();
  const tasksRef = ref(db, TASKS_PATH);
  const newTaskRef = push(tasksRef);
  const entry = buildTaskPayload(task);
  await set(newTaskRef, entry);
  return newTaskRef.key;
}


/**
 * Subscribes to all tasks in the Firebase Realtime Database and listens for changes in real time.
 * Whenever the tasks update, the provided listener is called with the normalized task list.
 * Returns a function that can be called to unsubscribe from the listener.
 *
 * @param {(tasks: Array<Object>) => void} listener - Callback function invoked with the updated list of tasks.
 * @returns {() => void} Function to stop listening for changes (unsubscribe).
 */
export function subscribeToTasks(listener) {
  const db = getDatabase();
  const tasksRef = ref(db, TASKS_PATH);

  const handler = (snapshot) => {
    const tasks = snapshot.exists() ? snapshot.val() : null;
    listener(normalizeTasks(tasks));
  };

  onValue(tasksRef, handler, (error) => {
    console.error("Tasks konnten nicht geladen werden", error);
    listener([]);
  });

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
  const currentUser = auth.currentUser;

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
