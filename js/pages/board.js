/**
 * Board-Seite für Task-Management und Kanban-View
 * @module board
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { subscribeToTasks } from "../common/tasks.js";
import { enableCardInteractions } from "../board/dragdrop.js";
import { colorFromString, clearModal, ScrollLock } from "../board/utils.js"
import { initBoardSearch } from "../board/search.js";
import { initAddTask } from "../board/addTaskModal.js"


initBoardPage();

/**
 * Initializes the main board page and its core features.
 * Handles authentication, layout setup, search, shortcuts, and task observation.
 * @async
 * @returns {Promise<void>}
 */
async function initBoardPage() {
  setGlobalButtonsDisabled(true);
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  initBoardSearch();
  bindColumnShortcuts();
  await observeTasks();
  setGlobalButtonsDisabled(false);
}


let unsubscribeTasks = null;


/**
 * Subscribes to live task updates and re-renders the board on changes.
 * Automatically unsubscribes when the window is closed or reloaded.
 * @async
 * @returns {Promise<void>}
 */
async function observeTasks() {
  unsubscribeTasks = await subscribeToTasks((tasks) => {
    renderBoard(tasks || []);
    toggleSearchMessage(false);
  });
  window.addEventListener("beforeunload", () => {
    if (unsubscribeTasks) unsubscribeTasks();
  });
}


/**
 * Toggles visibility of the search error message on the board.
 * @param {boolean} show - Whether to show or hide the message element.
 * @returns {void}
 */
function toggleSearchMessage(show) {
  const message = document.getElementById("search_error");
  if (!message) return;
  message.style.display = show ? "block" : "none";
}


/**
 * Renders all tasks onto the board in their respective columns.
 * Groups tasks by status and populates each column with task cards or placeholders.
 * @param {Array<Object>} tasks - Array of task objects to render on the board.
 * @returns {void}
 */
function renderBoard(tasks) {
  const columns = {
    toDo: {
      id: "toDo",
      emptyText: "No task To do",
      withPlaceholder: false,
    },
    inProgress: {
      id: "inProgress",
      emptyText: "No task in progress",
      withPlaceholder: false,
    },
    awaitFeedback: {
      id: "awaitFeedback",
      emptyText: "No task await Feetback",
      withPlaceholder: false,
    },
    done: {
      id: "done",
      emptyText: "No task Done",
      withPlaceholder: false,
    },
  };

  const grouped = groupTasksByStatus(tasks);

  Object.entries(columns).forEach(([status, config]) => {
    const container = document.getElementById(config.id);
    if (!container) return;
    container.innerHTML = "";

    const entries = grouped[status] || [];
    if (!entries.length) {
      container.append(buildEmptyState(config.emptyText));
    } else {
      entries.forEach((task) => container.append(buildTaskCard(task)));
    }

    if (config.withPlaceholder) {
      container.append(buildDropPlaceholder());
    }
  });
}


/**
 * Groups all tasks by their status property.
 * Returns an object where each key is a status and its value is an array of tasks.
 * @param {Array<Object>} tasks - Array of task objects to group.
 * @returns {Object<string, Array<Object>>} An object mapping each status to its task list.
 */
function groupTasksByStatus(tasks) {
  return tasks.reduce((acc, task) => {
    const status = task.status || "todo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});
}


/**
 * Creates and returns an element representing an empty board state.
 * Displays a placeholder message when no tasks are available.
 * @param {string} text - The message text to display inside the element.
 * @returns {HTMLDivElement} The created empty state element.
 */
function buildEmptyState(text) {
  const node = document.createElement("div");
  node.className = "no_task_to_do";
  node.textContent = text;
  return node;
}


/**
 * Creates and returns a drop placeholder element for drag-and-drop areas.
 * Used to visually indicate valid drop zones on the board.
 * @returns {HTMLDivElement} The created placeholder element.
 */
function buildDropPlaceholder() {
  const node = document.createElement("div");
  node.className = "drop_placeholder";
  return node;
}


/**
 * Builds and returns a task card element for the board.
 * Includes category, description, and footer sections.
 * @param {Object} task - The task object containing task details.
 * @param {string} task.id - Unique task ID.
 * @param {string} [task.category] - Task category key or class.
 * @param {string} [task.categoryLabel] - Human-readable category label.
 * @returns {HTMLElement} The fully constructed task card element.
 */
function buildTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task_card";
  card.dataset.taskId = task.id;

  const type = document.createElement("div");
  type.id = "taskType";
  type.classList.add("task_category", task.category);
  type.textContent = task.categoryLabel || task.category || "Task";
  card.append(type);

  buildTaskCardDescription(card, task)

  buildTaskCardFooter(card, task)

  return card;
}


/**
 * Builds and appends the description section of a task card.
 * Includes the title, description text, and optional subtask progress.
 * @param {HTMLElement} card - The parent task card element to append to.
 * @param {Object} task - The task object containing description data.
 * @param {string} task.title - Task title displayed in the header.
 * @param {string} [task.description] - Optional task description text.
 * @param {Array<Object>} [task.subtasks] - Optional list of subtasks for progress display.
 * @returns {void}
 */
function buildTaskCardDescription(card, task) {
  const descriptionSection = document.createElement("section");
  descriptionSection.className = "task_card_description";
  const title = document.createElement("h5");
  title.className = "task_header";
  title.textContent = task.title;
  const description = document.createElement("span");
  description.className = "task_description";
  description.textContent = task.description || "";
  descriptionSection.append(title, description);
  card.append(descriptionSection);

  const progress = buildSubtaskProgress(task.subtasks);
  if (progress) card.append(progress);
}


/**
 * Builds and appends the footer section of a task card.
 * Displays assignees, priority, and enables card interactions.
 * @param {HTMLElement} card - The parent task card element to append the footer to.
 * @param {Object} task - The task object containing footer details.
 * @param {Array<Object>} [task.assignees] - Optional list of assigned users.
 * @param {string} [task.priority] - Priority level of the task (e.g., "urgent", "medium", "low").
 * @returns {void}
 */
function buildTaskCardFooter (card, task) {
   const footer = document.createElement("div");
  footer.className = "footer_task_card";
  footer.append(buildAssigneeGroup(task), buildPriority(task.priority));
  card.append(footer);
  enableCardInteractions(card);
}


/**
 * Builds and returns an assignee group element for a task card.
 * Displays up to three avatars and a "+N" indicator for remaining assignees.
 * @param {Object} [task={}] - The task object containing assignee data.
 * @param {Array<Object>} [task.assignees] - List of assigned users for the task.
 * @returns {HTMLDivElement} The created assignee group container element.
 */
export function buildAssigneeGroup(task = {}) {
  const wrap = document.createElement("div"); wrap.className = "assignees";
  wrap.setAttribute("aria-label", "assignees");
  const ul = document.createElement("ul"); ul.className = "avatar-group";
  ul.setAttribute("role", "list");
  const list = getAssignees(task), shown = list.slice(0, 3), rest = Math.max(0, list.length - 3);
  shown.forEach(a => {
    const name = a?.name;
    const li = document.createElement("li"); li.className = "task-card-avatar"; li.title = name;
    li.textContent = buildInitials(name || "");
    li.style.background = colorFromString(name || "");
    ul.append(li);
  });
  if (rest) { const more = document.createElement("li"); more.className = "task-card-avatar more"; more.textContent = `+${rest}`; ul.append(more); }
  wrap.append(ul); return wrap;
}


/**
 * Normalizes and returns the assignee list from a task object.
 * Supports multiple data formats for backward compatibility.
 * @param {Object} [task={}] - The task object that may contain assignee data.
 * @param {Array<Object>|Object} [task.assignees|task.assignee] - Possible assignee fields in the task.
 * @returns {Array<Object>} A normalized array of assignee objects.
 */

function getAssignees(task = {}) {
  if (Array.isArray(task.assignees)) return task.assignees;
  if (Array.isArray(task.assignee)) return task.assignee;
  if (task.assignee && typeof task.assignee === "object") return [task.assignee];
  return [];
}


/**
 * Builds and returns a visual priority indicator element.
 * Displays a corresponding icon for the given priority level.
 * @param {string} [priority="medium"] - The task priority ("urgent", "medium", or "low").
 * @returns {HTMLDivElement} The created priority indicator element.
 */
function buildPriority(priority) {
  const wrapper = document.createElement("div");
  wrapper.className = "prio";

  const icon = document.createElement("img");
  const map = {
    urgent: "./img/icon/prio-urgent.svg",
    medium: "./img/icon/prio-medium.svg",
    low: "./img/icon/prio-low.svg",
  };
  const source = map[priority] || map.medium;
  icon.src = source;
  icon.alt = `Prio ${priority || "medium"}`;
  wrapper.append(icon);
  return wrapper;
}


/**
 * Generates a two-letter uppercase initials string from a given name.
 * Pads with an asterisk if the name is too short.
 * @param {string} name - The full name to generate initials from.
 * @returns {string} The generated two-character initials string.
 */
function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
    .padEnd(2, "*")
    .slice(0, 2);
}


/**
 * Binds global click and keyboard shortcuts for board overlays.
 * Handles opening of modals (e.g., Add Task), closing via backdrop or Escape key,
 * and keyboard accessibility for interactive overlay elements.
 * @async
 * @returns {Promise<void>}
 */
export function bindColumnShortcuts() {
  const onClick = async (e) => {
    const openBtn = e.target.closest("[data-overlay-open]");
    if (openBtn) {
      const selector = openBtn.dataset.overlayOpen;
      const overlay = document.querySelector("#taskOverlay");
      const modal = document.querySelector("#taskModal");

      if (selector === "#addTaskOverlay") {
        await initAddTask();
      }

      if (!overlay || !modal) return;
      overlay.classList.add("active");
      return;
    }

    // === Schließen-Handling ===

    const isBackdrop = e.target.classList.contains("backdrop_overlay");

    if (isBackdrop) {
      const overlay = document.querySelector("#taskOverlay");
      if (overlay) {
        overlay.classList.remove("active");
        ScrollLock.release()

        await clearModal()
      }
      return;
    }
  };

  const onKeydown = (e) => {
    if (e.key === "Escape") {
      const overlay = document.querySelector("#taskOverlay");
      if (overlay?.classList.contains("active")) {
        overlay.classList.remove("active");
        clearModal();
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      const kb = e.target.closest("[data-overlay-open],[data-overlay-close]");
      if (kb) {
        e.preventDefault();
        kb.click();
      }
    }
  };

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
}


/**
 * Builds and returns a visual progress bar for task subtasks.
 * Displays the ratio of completed subtasks and sets ARIA progress attributes.
 * @param {Array<Object>} [subtasks=[]] - List of subtask objects with a `done` property.
 * @returns {HTMLDivElement|null} The created progress bar element, or null if no subtasks exist.
 */
export function buildSubtaskProgress(subtasks = []) {
  if (!Array.isArray(subtasks) || !subtasks.length) return null;
  const done = subtasks.filter((st) => st.done).length;
  const total = subtasks.length;

  const box = document.createElement("div");
  box.className = "subtasks";
  box.style.setProperty("--done", done);
  box.style.setProperty("--total", total);

  const bar = document.createElement("div");
  bar.className = "subtasks_bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", total);
  bar.setAttribute("aria-valuenow", done);

  const label = document.createElement("span");
  label.className = "subtasks_label";
  label.textContent = `${done}/${total} Subtasks`;

  box.append(bar, label);
  return box;
}


/**
 * Enables or disables all buttons inside the given root element.
 * Also toggles a "loading" class on the body to indicate a busy state.
 * @param {boolean} state - Whether buttons should be disabled (true) or enabled (false).
 * @param {HTMLElement} [root=document.body] - The root element containing the buttons.
 * @returns {void}
 */
function setGlobalButtonsDisabled(state, root = document.body) {
  root.querySelectorAll("button").forEach((btn) => {
    btn.disabled = state;
  });

  document.body.classList.toggle("loading", state);
}



