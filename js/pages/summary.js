/**
 * Summary page for dashboard and task overview
 * @module summary
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { getActiveUser } from "../common/authService.js";
import { subscribeToTasks } from "../common/tasks.js";

let unsubscribeFromTasks = null;

document.addEventListener("DOMContentLoaded", () => {
  handleGuestDisplay();
});

initSummaryPage();

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

async function initSummaryPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  showMobileGreetingIfNeeded();
  renderGreeting();
  await loadSummaryData();
}

async function loadSummaryData() {
  try {
    unsubscribeFromTasks = await subscribeToTasks(updateSummaryMetrics);
  } catch (error) {
    showFallbackMetrics();
  }
}

function renderGreeting() {
  const nameField = document.getElementById("greeting__name");
  const textField = document.getElementById("greeting__text");
  if (!nameField || !textField) return;
  const user = getActiveUser();
  const isGuest = isGuestUser(user);
  if (isGuest) {
    nameField.style.display = "none";
    textField.textContent = buildGreetingPrefixForGuest();
  } else {
    nameField.style.display = "block";
    nameField.textContent = resolveUserName();
    textField.textContent = buildGreetingPrefix();
  }
}

function isGuestUser(user) {
  if (!user) return true;
  if (user.uid === "guest-user") return true;
  if (user.displayName === "Guest User") return true;
  if (user.displayName === "Guest") return true;
  return false;
}

function updateSummaryMetrics(tasks) {
  if (!Array.isArray(tasks)) {
    showFallbackMetrics();
    return;
  }
  const metrics = calculateTaskMetrics(tasks);
  updateSummaryDisplay(metrics);
}

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

function findUpcomingDeadline(tasks) {
  const now = new Date();
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  if (upcomingTasks.length === 0) return null;
  return formatDeadlineDate(upcomingTasks[0].dueDate);
}

function formatDeadlineDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

function updateElementById(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value.toString();
  }
}

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

function resolveUserName() {
  const user = getActiveUser();
  if (isGuestUser(user)) return "Guest";
  if (user && user.displayName && user.displayName.trim())
    return user.displayName.trim();
  if (user && user.email) return user.email.split("@")[0];
  return "Guest";
}

function buildGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}

function buildGreetingPrefixForGuest() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isMobileDevice() {
  return window.innerWidth < 768;
}

function shouldShowMobileGreeting() {
  if (!isMobileDevice()) return false;
  const justLoggedIn = sessionStorage.getItem("justLoggedIn");
  if (!justLoggedIn) return false;
  sessionStorage.removeItem("justLoggedIn");
  return true;
}

function getMobileGreetingElements() {
  return {
    screen: document.getElementById("mobileGreeting"),
    text: document.getElementById("mobileGreetingText"),
    name: document.getElementById("mobileGreetingName"),
  };
}

function setMobileGreetingContent(elements, user, isGuest) {
  const timeGreeting = isGuest
    ? buildGreetingPrefixForGuest()
    : buildGreetingPrefix();
  elements.text.textContent = timeGreeting;
  elements.name.textContent = isGuest ? "" : resolveUserName();
}

function displayMobileGreeting(screen) {
  screen.classList.add("active");
  setTimeout(() => {
    screen.classList.add("fade-out");
    setTimeout(() => {
      screen.classList.remove("active", "fade-out");
    }, 500);
  }, 2000);
}

/**
 * Shows the mobile greeting screen after login
 */
function showMobileGreetingIfNeeded() {
  if (!shouldShowMobileGreeting()) return;
  const elements = getMobileGreetingElements();
  if (!elements.screen || !elements.text || !elements.name) return;
  const user = getActiveUser();
  const isGuest = isGuestUser(user);
  setMobileGreetingContent(elements, user, isGuest);
  displayMobileGreeting(elements.screen);
}

window.addEventListener("beforeunload", () => {
  if (unsubscribeFromTasks) {
    unsubscribeFromTasks();
  }
});
