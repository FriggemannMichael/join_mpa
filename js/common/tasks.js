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
 * Speichert einen neuen Task in der Realtime Database.
 * @param {Object} task Raw Task Daten aus dem Formular
 * @returns {Promise<string>} Generierte Task-ID
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
 * Abonniert alle Tasks und ruft den Callback bei jeder Änderung auf.
 * @param {Function} listener Callback mit Task-Liste (Array)
 * @returns {Function} Cleanup-Funktion zum Entfernen des Abos
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
 * Baut das Task-Objekt mit Metadaten.
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
 * Normalisiert Firebase-Daten zu Array mit IDs.
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
