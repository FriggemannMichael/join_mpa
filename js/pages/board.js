import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { subscribeToTasks } from "../common/tasks.js";
import { enableCardInteractions } from "../dragdrop/dragdrop.js";

initBoardPage();

async function initBoardPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  bindSearch();
  bindColumnShortcuts();
  await observeTasks();
}

let unsubscribeTasks = null;

async function observeTasks() {
  unsubscribeTasks = await subscribeToTasks((tasks) => {
    renderBoard(tasks || []);
    toggleSearchMessage(false);
  });
  window.addEventListener("beforeunload", () => {
    if (unsubscribeTasks) unsubscribeTasks();
  });
}

function bindSearch() {
  const button =
    document.getElementById("searchButton") ||
    document.querySelector(".search_button");
  const input = document.getElementById("searchInput");
  if (!button || !input) return;
  button.addEventListener("click", () => runSearch(input.value.trim()));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runSearch(input.value.trim());
  });
  toggleSearchMessage(false);
}

function runSearch(term) {
  if (!term) return toggleSearchMessage(false);
  const cards = Array.from(document.querySelectorAll(".task_card"));
  const found = cards.some((card) => matchTask(card, term));
  toggleSearchMessage(!found);
}

function matchTask(card, term) {
  const title = card.querySelector(".task_header")?.textContent || "";
  const description =
    card.querySelector(".task_description")?.textContent || "";
  const text = `${title} ${description}`.toLowerCase();
  return text.includes(term.toLowerCase());
}

function toggleSearchMessage(show) {
  const message = document.getElementById("search_error");
  if (!message) return;
  message.style.display = show ? "block" : "none";
}

function renderBoard(tasks) {
  const columns = {
    todo: {
      id: "toDo",
      emptyText: "No task To do",
      withPlaceholder: true,
    },
    "in-progress": {
      id: "inProgress",
      emptyText: "No task in progress",
      withPlaceholder: true,
    },
    "await-feedback": {
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

function groupTasksByStatus(tasks) {
  return tasks.reduce((acc, task) => {
    const status = task.status || "todo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});
}

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

function buildTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task_card";
  card.dataset.taskId = task.id;

  const type = document.createElement("div");
  type.id = "taskType";
  type.className = "task_category";
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

  const footer = document.createElement("div");
  footer.className = "footer_task_card";
  footer.append(buildAssigneeGroup(task), buildPriority(task.priority));
  card.append(footer);
  // enableCardInteractions(card)

  return card;
}

function buildAssigneeGroup(task) {
  const assignees = document.createElement("div");
  assignees.className = "assignees";
  assignees.setAttribute("aria-label", "assignees");

  const list = document.createElement("ul");
  list.className = "avatar-group";
  list.setAttribute("role", "list");

  const entry = document.createElement("li");
  entry.className = "avatar";
  entry.textContent = buildInitials(
    task.assignee?.name || task.assignee?.email || "?"
  );
  list.append(entry);
  assignees.append(list);

  return assignees;
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

function bindColumnShortcuts() {
  const triggers = document.querySelectorAll(
    ".add_task_button, .add_task_button_kanban"
  );
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (trigger.tagName !== "A") {
        event.preventDefault();
        window.location.href = "./add-task.html";
      }
    });

    if (trigger.classList.contains("add_task_button_kanban")) {
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.location.href = "./add-task.html";
        }
      });
    }
  });
}
