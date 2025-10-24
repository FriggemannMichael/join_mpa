import { db } from "../common/firebase.js";
import {
  ref,
  update,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { icons } from "../common/svg-template.js";
import {
  getInitials,
  getCurrentUser,
  ScrollLock,
  colorFromString,
} from "./utils.js";
import { openEditForm } from "../board/editTask.js";
import { handleOutsideDropdownClick } from "../pages/add-task.js";
import { closeTaskOverlay, showAlert } from "./utils.js";

export async function renderTaskModal(id, task = {}) {
  ScrollLock.set();
  const overlay = document.getElementById("taskOverlay");
  const section = document.getElementById("taskModal");
  section.classList.add("task-overlay");
  section.dataset.taskId = id;
  const h2 = document.createElement("h2");
  h2.textContent = task.title;

  const scrollableSection = document.createElement("div");
  scrollableSection.classList.add("taskModal-main");
  scrollableSection.append(
    h2,
    taskModalDescription(task.description),
    taskModalDueDate(task.dueDate),
    taskModalpriority(task.priority),
    await taskModalAssignees(task, id),
    await taskModalSubtask(task, id)
  );

  section.replaceChildren(
    taskModalHeader(task.categoryLabel, task.category),
    scrollableSection,
    taskModalEditDelete(task, id)
  );

  taskModalEventlistener(overlay, section);
}

// Task Modal Sektionen
function taskModalHeader(categoryLabel, category) {
  const head = document.createElement("div");
  head.className = "header-task-overlay";

  const cat = document.createElement("div");
  cat.className = `task_category ${category}`;
  cat.textContent = categoryLabel;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "close_button_taskModal";
  btn.dataset.overlayClose = "#taskOverlay";
  btn.addEventListener("click", closeTaskOverlay);

  const icon = document.createElement("img");
  icon.src = "../img/icon/close-btn.svg";
  icon.alt = "Close";
  icon.className = "icon-close";

  btn.append(icon);
  head.append(cat, btn);
  return head;
}

function taskModalDescription(description) {
  const descriptionDiv = document.createElement("div");
  descriptionDiv.textContent = description;
  descriptionDiv.classList.add("task_description_overlay");
  return descriptionDiv;
}

function taskModalDueDate(dueDate) {
  const div = document.createElement("div");
  div.className = "due_date_task_overlay";

  const label = document.createElement("p");
  label.className = "taskModal-label";
  label.textContent = "Due date:";

  const value = document.createElement("span");
  value.textContent = new Date(dueDate).toLocaleDateString("en-GB");

  div.append(label, value);
  return div;
}

function taskModalpriority(priority) {
  const priorityDiv = document.createElement("div");
  priorityDiv.classList.add("priority");
  const priorityP = document.createElement("p");
  priorityP.classList.add("taskModal-label");
  priorityP.textContent = "Priority:";
  const prioritySpan = document.createElement("span");
  const formatted = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  prioritySpan.textContent = formatted;
  const icon = document.createElement("img");
  icon.classList.add("priority-icon");
  icon.alt = `${priority}`;
  icon.src = `../img/icon/prio-${priority.toLowerCase()}.svg`;
  prioritySpan.append(icon);
  priorityDiv.append(priorityP, prioritySpan);

  return priorityDiv;
}

async function taskModalAssignees(task) {
  const assigned = document.createElement("div");
  assigned.classList.add("assigned_to_task_overlay");
  const assignedTo = document.createElement("p");
  assignedTo.classList.add("taskModal-label");
  assignedTo.textContent = "Assigned To:";
  const assigneesDiv = document.createElement("div");
  const contacts = await getContactsMap();
  const assigneesArr = normAssignees(task);
  const user = getCurrentUser();
  renderAssignees(assigneesDiv, assigneesArr, contacts, user);
  assigned.append(assignedTo, assigneesDiv);
  return assigned;
}

async function taskModalSubtask(task, taskId) {
  const subtasks = normalizeSubtasks(task);
  if (!subtasks.length) return document.createDocumentFragment();

  const wrap = document.createElement("div");
  wrap.classList.add("subtask_task_overlay");

  const list = document.createElement("ul");
  list.className = "subtask_list";

  const head = document.createElement("div");
  head.className = "subtask_header_task_overlay";
  head.innerHTML = `<span class="taskModal-label">Subtasks</span>`;

  subtasks.forEach((subtask, index) => {
    list.append(createSubtaskItem(subtask, taskId, index));
  });

  wrap.append(head, list);
  return wrap;
}

function createSubtaskItem(subtask, taskId, index) {
  const item = document.createElement("li");
  item.className = "subtask_item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `sub-${taskId}-${index}`;
  checkbox.checked = !!subtask.done;

  const label = document.createElement("label");
  label.textContent = subtask?.text || "";
  label.htmlFor = checkbox.id;

  handleSubtaskToggle(checkbox, item, taskId, index);

  if (checkbox.checked) item.classList.add("done");
  item.append(checkbox, label);

  return item;
}

function handleSubtaskToggle(checkbox, item, taskId, index) {
  checkbox.addEventListener("change", async () => {
    const prev = !checkbox.checked;
    item.classList.toggle("done", checkbox.checked);
    try {
      await updateSubtaskDone(taskId, index, checkbox.checked);
    } catch {
      checkbox.checked = prev;
      item.classList.toggle("done", checkbox.checked);
    }
  });
}

function taskModalEditDelete(task, id) {
  const footer = document.createElement("div");
  footer.classList.add("footer_taskModal");

  const editBtn = document.createElement("button");
  editBtn.classList.add("edit-task-btn");
  editBtn.type = "button";
  editBtn.innerHTML = icons.edit + "<span>Edit</span>";
  editBtn.dataset.action = "edit";
  editBtn.dataset.taskId = id;

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-task-btn");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  deleteBtn.innerHTML = icons.delete + "<span>Delete</span>";
  deleteBtn.dataset.taskId = id;

  const separator = document.createElement("span");
  separator.className = "separator-task-toolbar";
  separator.setAttribute("aria-hidden", "true");
  separator.innerHTML = "|";

  footer.append(deleteBtn, separator, editBtn);
  return footer;
}

// Helper

export function taskModalEventlistener(overlay, section) {
  const backdrop = overlay?.querySelector(".backdrop_overlay");
  if (!overlay) return;
  if (!overlay.dataset.bound) {
    const onBackdropClick = (e) => {
      if (e.target === overlay || e.target === backdrop) closeTaskOverlay();
    };
    const onKeydown = (e) => { if (e.key === "Escape") closeTaskOverlay(); };

    overlay.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeydown);
    overlay.dataset.bound = "1";

    overlay.cleanup = () => {
      overlay.removeEventListener("click", onBackdropClick);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", handleOutsideDropdownClick);
      if (section?._handler) section.removeEventListener("click", section._handler);
      delete overlay.dataset.bound;
      delete section._handler;
      ScrollLock.release();
    };
  }

  if (!section._handler) {
    section._handler = handleSectionClick;
    section.addEventListener("click", section._handler);
  }

  overlay.classList.add("active");
}

export async function getContactsMap() {
  const snap = await get(child(ref(db), "contacts"));
  return snap.exists() ? snap.val() : {};
}

function normAssignees(task) {
  return Array.isArray(task?.assignees) ? task.assignees : [];
}

export function renderAssignees(
  container,
  assigneesArr = [],
  contactsMap = {},
  currentUser
) {
  container.classList.add("assignees");
  container.innerHTML = "";

  if (!assigneesArr.length) {
    container.textContent = "—";
    return;
  }

  assigneesArr.forEach((a) => {
    const uid = a?.uid;
    const contact = contactsMap[uid];
    const name = contact?.name || a?.name;

    const isYou = (currentUser && uid == currentUser.uid) || (a?.email && a.email === currentUser.email);;
    const color = colorFromString(name);
    const initials = getInitials(name);

    const badge = document.createElement("span");
    badge.className = "assignee_badge";
    badge.textContent = initials;
    badge.title = name;
    badge.style.backgroundColor = color;

    const label = document.createElement("span");
    label.className = "assignee_label";
    label.textContent = isYou ? `${name} (You)` : name;

    const row = document.createElement("div");
    row.className = "assignee_row";
    row.append(badge, label);

    container.append(row);
  });
}

function normalizeSubtasks(task) {
  return Array.isArray(task?.subtasks) ? task.subtasks : [];
}

async function updateSubtaskDone(taskId, index, done) {
  const path = `tasks/${taskId}/subtasks/${index}/done`;
  await update(ref(db), {
    [path]: !!done,
    [`tasks/${taskId}/updatedAt`]: Date.now(),
  });
}

async function deleteTask(taskId) {
  const path = `tasks/${taskId}`;
  await update(ref(db), { [path]: null });
  console.log("🗑️ Task deleted:", taskId);
  closeTaskOverlay();
  showAlert('deleted');
}

function handleSectionClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { action, taskId } = btn.dataset;
  if (action === "edit") return openEditForm(taskId);
  if (action === "delete") {
    confirmModal("Are you sure you want to delete this task?", () => {
      deleteTask(taskId);
    });
  }
}

export function confirmModal(message = "Are you sure?", onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "modal_overlay";

  const modal = document.createElement("div");
  modal.className = "modal_box";

  modal.innerHTML = `
    <p class="modal_message">${message}</p>
    <div class="modal_actions">
      <button class="btn_cancel">Cancel</button>
      <button class="btn_confirm">Delete</button>
    </div>
  `;

  overlay.append(modal);
  document.body.append(overlay);
  modal.querySelector(".btn_cancel").addEventListener("click", () => overlay.remove());
  modal.querySelector(".btn_confirm").addEventListener("click", () => {
    overlay.remove();
    onConfirm?.();
  });
}