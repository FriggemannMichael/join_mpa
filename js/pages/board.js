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
 * Initialisiert die Board-Seite mit Authentication-Check und Layout-Loading
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
 * Abonniert Task-Änderungen und rendert das Board bei Updates
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
 * Zeigt oder versteckt die "Keine Ergebnisse"-Nachricht
 * @param {boolean} show True um die Nachricht anzuzeigen
 */
function toggleSearchMessage(show) {
  const message = document.getElementById("search_error");
  if (!message) return;
  message.style.display = show ? "block" : "none";
}

/**
 * Rendert alle Tasks auf dem Board in die entsprechenden Spalten
 * @param {Array<Object>} tasks Array von Task-Objekten
 */
function renderBoard(tasks) {
  const columns = {
    toDo : {
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
 * Gruppiert Tasks nach ihrem Status
 * @param {Array<Object>} tasks Array von Task-Objekten
 * @returns {Object} Gruppierte Tasks nach Status
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
 * Erstellt ein Element für leere Board-Spalten
 * @param {string} text Der anzuzeigende Text
 * @returns {HTMLElement} Das Empty-State-Element
 */
function buildEmptyState(text) {
  const node = document.createElement("div");
  node.className = "no_task_to_do";
  node.textContent = text;
  return node;
}

function buildDropPlaceholder() {
  const node = document.createElement("div");
  node.className = "drop_placeholder";
  return node;
}

/**
 * Erstellt eine HTML-Karte für einen Task
 * @param {Object} task Das Task-Objekt
 * @returns {HTMLElement} Das Task-Karten-Element
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

  const descriptionSection = document.createElement("section");
  descriptionSection.className = "task_card_description";
  const title = document.createElement("h5");
  title.id = "taskHeader";
  title.className = "task_header";
  title.textContent = task.title || "Ohne Titel";
  const description = document.createElement("span");
  description.id = "taskDescription";
  description.className = "task_description";
  description.textContent = task.description || "";
  descriptionSection.append(title, description);
  card.append(descriptionSection);

  const progress = buildSubtaskProgress(task.subtasks);
  if (progress) card.append(progress);

  const footer = document.createElement("div");
  footer.className = "footer_task_card";
  footer.append(buildAssigneeGroup(task), buildPriority(task.priority));
  card.append(footer);
  enableCardInteractions(card);

  return card;
}

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

function getAssignees(task = {}) {
  if (Array.isArray(task.assignees)) return task.assignees;
  if (Array.isArray(task.assignee)) return task.assignee;
  if (task.assignee && typeof task.assignee === "object") return [task.assignee];
  return [];
}

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

// zu testzwecken

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

function setGlobalButtonsDisabled(state, root = document.body) {
  root.querySelectorAll("button").forEach((btn) => {
    btn.disabled = state;
  });

  document.body.classList.toggle("loading", state);
}



