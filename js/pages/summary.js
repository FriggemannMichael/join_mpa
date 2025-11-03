/**
 * Summary-Seite für Dashboard und Task-Übersicht
 * @module summary
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { getActiveUser } from "../common/authService.js";
import { subscribeToTasks } from "../common/tasks.js";

let unsubscribeFromTasks = null;

// DOM ready event listener für sofortige Guest-Behandlung
document.addEventListener("DOMContentLoaded", () => {
  handleGuestDisplay();
});

initSummaryPage();

/**
 * Behandelt die Anzeige für Guest-User sofort beim DOM-Load
 */
function handleGuestDisplay() {
  const user = getActiveUser();
  const nameField = document.getElementById("greeting__name");

  if (
    nameField &&
    user &&
    (user.uid === "guest-user" || user.displayName === "Guest User")
  ) {
    nameField.style.display = "none";
  }
}

/**
 * Initialisiert die Summary-Seite mit Authentication-Check und Layout-Loading
 */
async function initSummaryPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  renderGreeting();
  await loadSummaryData();
}

/**
 * Lädt und abonniert die Task-Daten für Summary-Anzeige
 */
async function loadSummaryData() {
  try {
    unsubscribeFromTasks = await subscribeToTasks(updateSummaryMetrics);
  } catch (error) {
    console.error("Fehler beim Laden der Summary-Daten:", error);
    showFallbackMetrics();
  }
}

/**
 * Rendert die personalisierte Begrüßung basierend auf User und Tageszeit
 */
function renderGreeting() {
  const nameField = document.getElementById("greeting__name");
  const textField = document.getElementById("greeting__text");
  if (!nameField || !textField) return;

  const user = getActiveUser();
  const isGuest = isGuestUser(user);

  if (isGuest) {
    // Bei Guest-User: Name-Element komplett ausblenden
    nameField.style.display = "none";
    textField.textContent = buildGreetingPrefixForGuest();
  } else {
    // Bei echtem User: Name-Element anzeigen
    nameField.style.display = "block";
    nameField.textContent = resolveUserName();
    textField.textContent = buildGreetingPrefix();
  }
}

/**
 * Prüft ob der aktuelle User ein Guest ist
 * @param {Object|null} user User-Objekt
 * @returns {boolean} True wenn Guest-User
 */
function isGuestUser(user) {
  if (!user) return true;
  if (user.uid === "guest-user") return true;
  if (user.displayName === "Guest User") return true;
  if (user.displayName === "Guest") return true;
  return false;
}

/**
 * Aktualisiert alle Summary-Metriken basierend auf Task-Daten
 * @param {Array} tasks Array mit allen Tasks aus der Database
 */
function updateSummaryMetrics(tasks) {
  if (!Array.isArray(tasks)) {
    showFallbackMetrics();
    return;
  }

  const metrics = calculateTaskMetrics(tasks);
  updateSummaryDisplay(metrics);
}

/**
 * Berechnet alle notwendigen Task-Metriken für die Summary-Anzeige
 * @param {Array} tasks Array mit Task-Objekten
 * @returns {Object} Berechnete Metriken
 */
function calculateTaskMetrics(tasks) {
  const todoTasks = tasks.filter((t) => t.status === "toDo");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const inProgressTasks = tasks.filter((t) => t.status === "inProgress");
  const awaitingFeedbackTasks = tasks.filter(
    (t) => t.status === "awaitFeedback"
  );
  const urgentTasks = tasks.filter((t) => t.priority === "urgent");

  return {
    todo: todoTasks.length,
    done: doneTasks.length,
    inProgress: inProgressTasks.length,
    awaitingFeedback: awaitingFeedbackTasks.length,
    urgent: urgentTasks.length,
    total: tasks.length,
    upcomingDeadline: findUpcomingDeadline(tasks),
  };
}

/**
 * Findet die nächstliegende Deadline aus allen Tasks
 * @param {Array} tasks Array mit Task-Objekten
 * @returns {string|null} Formatierte Deadline oder null
 */
function findUpcomingDeadline(tasks) {
  const now = new Date();
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (upcomingTasks.length === 0) return null;
  return formatDeadlineDate(upcomingTasks[0].dueDate);
}

/**
 * Formatiert ein Datum für die Deadline-Anzeige
 * @param {string} dateString ISO-Datumsstring
 * @returns {string} Formatiertes Datum
 */
function formatDeadlineDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Aktualisiert die DOM-Elemente mit den berechneten Metriken
 * @param {Object} metrics Berechnete Task-Metriken
 */
function updateSummaryDisplay(metrics) {
  updateElementById("amount_toDo", metrics.todo);
  updateElementById("amount_done", metrics.done);
  updateElementById("amount_urgent", metrics.urgent);
  updateElementById("amount_tasks", metrics.total);
  updateElementById("amount_inProgress", metrics.inProgress);
  updateElementById("amount_awaitingFeedback", metrics.awaitingFeedback);

  const deadlineElement = document.getElementById("amount_deadline");
  if (deadlineElement) {
    deadlineElement.textContent =
      metrics.upcomingDeadline || "No upcoming deadlines";
  }
}

/**
 * Hilfsfunktion um Element-Inhalt sicher zu aktualisieren
 * @param {string} elementId ID des DOM-Elements
 * @param {number} value Anzuzeigende Zahl
 */
function updateElementById(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value.toString();
  }
}

/**
 * Zeigt Fallback-Werte an wenn keine Daten geladen werden können
 */
function showFallbackMetrics() {
  const fallbackMetrics = {
    todo: 0,
    done: 0,
    urgent: 0,
    total: 0,
    inProgress: 0,
    awaitingFeedback: 0,
    upcomingDeadline: "No data available",
  };
  updateSummaryDisplay(fallbackMetrics);
}

/**
 * Löst den anzuzeigenden Benutzernamen basierend auf Auth-Status auf
 * @returns {string} Anzeigename für den User
 */
function resolveUserName() {
  const user = getActiveUser();
  if (isGuestUser(user)) return "Guest";
  if (user && user.displayName && user.displayName.trim())
    return user.displayName.trim();
  if (user && user.email) return user.email.split("@")[0];
  return "Guest";
}

/**
 * Erstellt das Begrüßungsprefix basierend auf der aktuellen Tageszeit
 * @returns {string} Begrüßungstext je nach Uhrzeit
 */
function buildGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}

/**
 * Erstellt die Begrüßung für Guest-User ohne Komma
 * @returns {string} Begrüßungstext ohne Komma für Guest-User
 */
function buildGreetingPrefixForGuest() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Cleanup-Funktion die beim Verlassen der Seite aufgerufen wird
 */
window.addEventListener("beforeunload", () => {
  if (unsubscribeFromTasks) {
    unsubscribeFromTasks();
  }
});
