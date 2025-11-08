import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { getActiveUser } from "../common/authService.js";
import { subscribeToTasks } from "../common/tasks.js";
import {calculateTaskMetrics } from "../summary/summary.metrics.js"

let unsubscribeFromTasks = null;


/**
 * Initializes the guest display logic once the DOM is fully loaded.
 * Ensures all elements are available before running {@link handleGuestDisplay}.
 *
 * @listens DOMContentLoaded
 * @returns {void} Nothing is returned; triggers initialization on page load.
 */
document.addEventListener("DOMContentLoaded", () => {
  handleGuestDisplay();
});


initSummaryPage();


/**
 * Handles visibility of the greeting name for guest users.
 * Hides the name field if the active user is identified as a guest.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
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
 * Initializes the summary page after verifying access permissions.
 * Ensures layout, greeting, and summary data are properly loaded and rendered.
 *
 * @async
 * @returns {Promise<void>} Resolves when the summary page has been fully initialized.
 */
async function initSummaryPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  showMobileGreetingIfNeeded();
  renderGreeting();
  await loadSummaryData();
}


/**
 * Loads and subscribes to real-time task data for the summary view.
 * Updates summary metrics automatically or shows fallback data on error.
 *
 * @async
 * @returns {Promise<void>} Resolves when the subscription is successfully initialized or handled with a fallback.
 */
async function loadSummaryData() {
  try {
    unsubscribeFromTasks = await subscribeToTasks(updateSummaryMetrics);
  } catch (error) {
    showFallbackMetrics();
  }
}


/**
 * Renders a personalized greeting message based on the active user.
 * Displays or hides the user's name and adjusts the greeting text for guests.
 *
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
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


/**
 * Determines whether the given user object represents a guest account.
 * Checks common guest identifiers such as UID or display name.
 *
 * @param {?Object} user - The user object to check, or `null` if not logged in.
 * @param {string} [user.uid] - The unique user ID.
 * @param {string} [user.displayName] - The display name of the user.
 * @returns {boolean} `true` if the user is identified as a guest, otherwise `false`.
 */
function isGuestUser(user) {
  if (!user) return true;
  if (user.uid === "guest-user") return true;
  if (user.displayName === "Guest User") return true;
  if (user.displayName === "Guest") return true;
  return false;
}


/**
 * Updates the summary dashboard metrics based on the current task list.
 * Falls back to default metrics if the provided data is invalid.
 *
 * @param {Array<Object>} tasks - The list of task objects to calculate metrics from.
 * @returns {void} Nothing is returned; updates the summary display in the DOM.
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
 * Updates all summary dashboard elements with the latest task metrics.
 * @param {{
 *   todo: number,
 *   done: number,
 *   inProgress: number,
 *   awaitingFeedback: number,
 *   urgent: number,
 *   total: number,
 *   upcomingDeadline: string|null
 * }} metrics - The calculated task metrics.
 * @returns {void}
 */
function updateSummaryDisplay(metrics) {
  updateMetricElements(metrics);
  updateDeadlineElement(metrics.upcomingDeadline);
}


/**
 * Updates all metric display elements with values.
 * @param {Object} metrics - The metrics object.
 * @returns {void}
 */
function updateMetricElements(metrics) {
  updateElementById("amount_toDo", metrics.todo);
  updateElementById("amount_done", metrics.done);
  updateElementById("amount_urgent", metrics.urgent);
  updateElementById("amount_tasks", metrics.total);
  updateElementById("amount_inProgress", metrics.inProgress);
  updateElementById("amount_awaitingFeedback", metrics.awaitingFeedback);
}


/**
 * Updates the deadline display element.
 * @param {string|null} deadline - The upcoming deadline or null.
 * @returns {void}
 */
function updateDeadlineElement(deadline) {
  const deadlineElement = document.getElementById("amount_deadline");
  if (deadlineElement) {
    deadlineElement.textContent = deadline || "No upcoming deadlines";
  }
}


/**
 * Updates the text content of a DOM element by its ID.
 * Converts the provided value to a string before assigning it.
 *
 * @param {string} elementId - The ID of the element to update.
 * @param {string|number} value - The value to display inside the element.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function updateElementById(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value.toString();
  }
}


/**
 * Displays default summary metrics when no task data is available or loading fails.
 * Resets all metric values to zero and shows a fallback deadline message.
 *
 * @returns {void} Nothing is returned; updates the summary dashboard in the DOM.
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
 * Resolves the display name of the currently active user.
 * Falls back to the email prefix or "Guest" if no valid name is found.
 *
 * @returns {string} The resolved user name or "Guest" as a default value.
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
 * Builds a time-based greeting prefix based on the current hour.
 * Returns "Good morning", "Good afternoon", or "Good evening".
 *
 * @returns {string} The greeting text corresponding to the current time of day.
 */
function buildGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}


/**
 * Builds a time-based greeting prefix for guest users.
 * Returns "Good morning", "Good afternoon", or "Good evening" without a comma.
 *
 * @returns {string} The guest greeting text based on the current time of day.
 */
function buildGreetingPrefixForGuest() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}


/**
 * Checks whether the current viewport width corresponds to a mobile device.
 *
 * @returns {boolean} `true` if the viewport width is below 768px, otherwise `false`.
 */
function isMobileDevice() {
  return window.innerWidth < 768;
}


/**
 * Determines whether the mobile greeting should be displayed.
 * Only shows the greeting if the user has just logged in on a mobile device.
 *
 * @returns {boolean} `true` if the mobile greeting should be shown, otherwise `false`.
 */
function shouldShowMobileGreeting() {
  if (!isMobileDevice()) return false;
  const justLoggedIn = sessionStorage.getItem("justLoggedIn");
  if (!justLoggedIn) return false;
  sessionStorage.removeItem("justLoggedIn");
  return true;
}


/**
 * Retrieves key DOM elements used for displaying the mobile greeting.
 *
 * @returns {{
 *   screen: HTMLElement|null,
 *   text: HTMLElement|null,
 *   name: HTMLElement|null
 * }} An object containing references to the mobile greeting elements, or `null` if missing.
 */
function getMobileGreetingElements() {
  return {
    screen: document.getElementById("mobileGreeting"),
    text: document.getElementById("mobileGreetingText"),
    name: document.getElementById("mobileGreetingName"),
  };
}


/**
 * Sets the text content for the mobile greeting screen.
 * Displays a time-based greeting and the user's name unless the user is a guest.
 *
 * @param {{
 *   text: HTMLElement,
 *   name: HTMLElement
 * }} elements - The DOM elements for the greeting text and name.
 * @param {Object} user - The active user object.
 * @param {boolean} isGuest - Whether the current user is identified as a guest.
 * @returns {void} Nothing is returned; updates the DOM directly.
 */
function setMobileGreetingContent(elements, user, isGuest) {
  const timeGreeting = isGuest
    ? buildGreetingPrefixForGuest()
    : buildGreetingPrefix();
  elements.text.textContent = timeGreeting;
  elements.name.textContent = isGuest ? "" : resolveUserName();
}


/**
 * Displays the mobile greeting screen with a timed fade-out animation.
 * Activates the screen, waits briefly, then fades it out and resets classes.
 *
 * @param {HTMLElement} screen - The mobile greeting container element.
 * @returns {void} Nothing is returned; updates the DOM with timed transitions.
 */
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
