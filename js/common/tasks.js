/**
 * Task-Service für Firebase Realtime Database Operations
 * @module tasks
 */

import { auth } from "./firebase.js";
import { loadFirebaseDatabase } from "./database.js";

const TASKS_PATH = "tasks";

/**
 * Speichert einen neuen Task in der Realtime Database.
 * @param {Object} task Raw Task Daten aus dem Formular
 * @returns {Promise<string>} Generierte Task-ID
 */
export async function createTask(task) {
  const db = await loadFirebaseDatabase();
  const database = db.getDatabase();
  const tasksRef = db.ref(database, TASKS_PATH);
  const entry = buildTaskPayload(task);
  const newTaskRef = db.push(tasksRef);
  await db.set(newTaskRef, entry);
  return newTaskRef.key;
}

/**
 * Abonniert alle Tasks und ruft den Callback bei jeder Änderung auf.
 * @param {Function} listener Callback mit Task-Liste (Array)
 * @returns {Promise<Function>} Cleanup-Funktion zum Entfernen des Abos
 */
export async function subscribeToTasks(listener) {
  const db = await loadFirebaseDatabase();
  const database = db.getDatabase();
  const tasksRef = db.ref(database, TASKS_PATH);

  const handler = (snapshot) => {
    const tasks = snapshot.exists() ? snapshot.val() : null;
    listener(normalizeTasks(tasks));
  };

  db.onValue(tasksRef, handler, (error) => {
    console.error("Tasks konnten nicht geladen werden", error);
    listener([]);
  });

  return () => db.off(tasksRef, "value", handler);
}

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
    status: task.status || "todo",
    assignee: {
      id: task.assignee || "",
      email: task.assigneeEmail || "",
      name: task.assigneeName || "",
    },
    subtask: task.subtask || "",
    createdBy: currentUser?.uid || "",
    createdByEmail: currentUser?.email || "",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeTasks(raw) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .map(([id, value]) => ({
      id,
      ...(value && typeof value === "object" ? value : {}),
    }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
