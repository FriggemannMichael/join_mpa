/**
 * Summary page for dashboard and task overview
 * @module summary
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { getActiveUser } from "../common/authService.js";
import { subscribeToTasks } from "../common/tasks.js";

let unsubscribeFromTasks = null;

// DOM ready event listener for immediate guest handling
document.addEventListener("DOMContentLoaded", () => {
  handleGuestDisplay();
});

initSummaryPage();

/**
 * Handles display for guest users immediately on DOM load
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
 * Initializes the summary page with authentication check and layout loading
 */
async function initSummaryPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();

  // Show mobile greeting AFTER auth initialization
  showMobileGreetingIfNeeded();

  renderGreeting();
  await loadSummaryData();
}

/**
 * Loads and subscribes to task data for summary display
 */
async function loadSummaryData() {
  try {
    unsubscribeFromTasks = await subscribeToTasks(updateSummaryMetrics);
  } catch (error) {
    console.error("Error loading summary data:", error);
    showFallbackMetrics();
  }
}

/**
 * Renders personalized greeting based on user and time of day
 */
function renderGreeting() {
  const nameField = document.getElementById("greeting__name");
  const textField = document.getElementById("greeting__text");
  if (!nameField || !textField) return;

  const user = getActiveUser();
  const isGuest = isGuestUser(user);

  if (isGuest) {
    // For guest user: hide name element completely
    nameField.style.display = "none";
    textField.textContent = buildGreetingPrefixForGuest();
  } else {
    // For real user: show name element
    nameField.style.display = "block";
    nameField.textContent = resolveUserName();
    textField.textContent = buildGreetingPrefix();
  }
}

/**
 * Checks if the current user is a guest
 * @param {Object|null} user User object
 * @returns {boolean} True if guest user
 */
function isGuestUser(user) {
  if (!user) return true;
  if (user.uid === "guest-user") return true;
  if (user.displayName === "Guest User") return true;
  if (user.displayName === "Guest") return true;
  return false;
}

/**
 * Updates all summary metrics based on task data
 * @param {Array} tasks Array with all tasks from the database
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
 * Calculates all necessary task metrics for summary display
 * @param {Array} tasks Array with task objects
 * @returns {Object} Calculated metrics
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
 * Finds the nearest deadline from all tasks
 * @param {Array} tasks Array with task objects
 * @returns {string|null} Formatted deadline or null
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
 * Formats a date for deadline display
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date
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
 * Updates DOM elements with calculated metrics
 * @param {Object} metrics Calculated task metrics
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
 * Helper function to safely update element content
 * @param {string} elementId ID of the DOM element
 * @param {number} value Number to display
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
 * Zeigt den mobilen Begrüßungs-Screen nach dem Login (nur mobil)
 * Prüft ob User gerade von Login kommt (sessionStorage Flag)
 * Desktop: Kein Greeting-Screen
 * Mobile + Registered User: Begrüßung mit Namen
 * Mobile + Guest User: Nur zeitabhängige Begrüßung ohne Namen
 */
function showMobileGreetingIfNeeded() {
  // Mobile only (max 767px)
  if (window.innerWidth >= 768) return;

  // Check if user just logged in
  const justLoggedIn = sessionStorage.getItem("justLoggedIn");
  if (!justLoggedIn) return;

  // Remove flag (only once per login)
  sessionStorage.removeItem("justLoggedIn");

  const greetingScreen = document.getElementById("mobileGreeting");
  const greetingText = document.getElementById("mobileGreetingText");
  const greetingName = document.getElementById("mobileGreetingName");

  if (!greetingScreen || !greetingText || !greetingName) return;

  const user = getActiveUser();
  const isGuest = isGuestUser(user);

  // Time-based greeting (with or without comma)
  const timeGreeting = isGuest
    ? buildGreetingPrefixForGuest()
    : buildGreetingPrefix();
  greetingText.textContent = timeGreeting;

  // Name only for registered users
  if (!isGuest) {
    greetingName.textContent = resolveUserName();
  } else {
    greetingName.textContent = ""; // Guest: No name
  }

  // Show greeting screen
  greetingScreen.classList.add("active");

  // Fade out after 2 seconds
  setTimeout(() => {
    greetingScreen.classList.add("fade-out");

    // Nach Fade-Out komplett verstecken
    setTimeout(() => {
      greetingScreen.classList.remove("active", "fade-out");
    }, 500); // Dauer der CSS-Transition
  }, 2000);
}

/**
 * Cleanup-Funktion die beim Verlassen der Seite aufgerufen wird
 */
window.addEventListener("beforeunload", () => {
  if (unsubscribeFromTasks) {
    unsubscribeFromTasks();
  }
});
