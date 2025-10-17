import { db, auth } from "../common/firebase.js";
import { ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { icons } from "../common/svg-template.js";
import { initialsFrom, getCurrentUser, ScrollLock, loadTask } from "./utils.js"
import {openEditForm} from "../board/editTask.js"



export async function renderTaskModal(id, task = {}) {
  ScrollLock.set()
  const overlay = document.getElementById("taskOverlay");
  const section = document.getElementById("taskModal");
  section.dataset.taskId = id;
  const h2 = document.createElement("h2");
  h2.textContent = task.title;

  const scrollableSection = document.createElement("div")
  scrollableSection.classList.add("taskModal-main");
  scrollableSection.append(h2,
    taskModalDescription(task.description),
    taskModalDueDate(task.dueDate),
    taskModalpriority(task.priority),
    await taskModalAssignees(task, id),
    await taskModalSubtask(task, id))

  section.replaceChildren(
    taskModalHeader(task.categoryLabel, task.category),
    scrollableSection,
    taskModalEditDelete(task, id)
  );

  taskModalEventlistener(overlay, section)
}


// Task Modal Sektionen
function taskModalHeader(categoryLabel, category) {
  const head = document.createElement("div");
  head.classList.add("header-task-overlay");

  const taskCategory = document.createElement("div");
  taskCategory.classList.add("task_category", category);
  taskCategory.textContent = categoryLabel;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.classList.add("close_button_taskModal");
  closeBtn.dataset.overlayClose = "#taskOverlay";
  closeBtn.addEventListener("click", closeTaskOverlay);
  const icon = document.createElement("img");
  icon.src = "../img/icon/close-btn.svg";
  icon.alt = "Close";
  icon.classList.add("icon-close");
  closeBtn.append(icon);
  head.append(taskCategory, closeBtn);
  return head;
}

function taskModalDescription(description) {
  const descriptionDiv = document.createElement("div");
  descriptionDiv.textContent = description;
  descriptionDiv.classList.add("task_description_overlay");
  return descriptionDiv;
}

function taskModalDueDate(dueDate) {
  const dueDateDiv = document.createElement("div");
  dueDateDiv.classList.add("due_date_task_overlay");
  const dueLabel = document.createElement("p");
  dueLabel.classList.add("taskModal-label")
  dueLabel.textContent = "Due date:";
  const dueVal = document.createElement("span");
  if (dueDate) {
    const d = new Date(dueDate);
    dueVal.textContent = isNaN(d) ? dueDate : d.toLocaleDateString("en-GB");
  }
  dueDateDiv.append(dueLabel, dueVal);
  return dueDateDiv;
}

function taskModalpriority(priority) {
  const priorityDiv = document.createElement("div");
  priorityDiv.classList.add("priority");
  const priorityP = document.createElement("p");
  priorityP.classList.add("taskModal-label")
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
  assignedTo.classList.add("taskModal-label")
  assignedTo.textContent = "Assigned To:";
  const assigneesDiv = document.createElement("div");
  const contacts = await getContactsMap();
  const assigneesArr = normAssignees(task);
  const user = getCurrentUser();
  renderAssignees(assigneesDiv, assigneesArr, contacts, user);
  assigned.append(assignedTo, assigneesDiv);
  return assigned;
}

async function taskModalSubtask(task, id) {
  const normalized = normalizeSubtasks(task);

  if (normalized.length > 0) {

    const subtaskWrap = document.createElement("div");
    subtaskWrap.classList.add("subtask_task_overlay");

    const subtaskList = document.createElement("ul");
    subtaskList.className = "subtask_list";

    const normalized = normalizeSubtasks(task);

    const headRow = document.createElement("div");
    headRow.className = "subtask_header_task_overlay";
    headRow.innerHTML = `
        <span class="taskModal-label">Subtasks</span>
    `;

    // Items
    normalized.forEach((s, idx) => {
      const li = document.createElement("li");
      li.className = "subtask_item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `sub-${id}-${idx}`;
      cb.checked = !!s.done;

      const label = document.createElement("label");
      label.textContent = s?.text || String(s);
      label.setAttribute("for", cb.id);

      li.append(cb, label);
      if (cb.checked) li.classList.add("done");

      if (!s._readonly) {
        cb.addEventListener("change", async () => {
          await updateSubtaskDone(id, idx, cb.checked);
          li.classList.toggle("done", cb.checked);
        });
      }

      subtaskList.appendChild(li);
    });
    subtaskWrap.append(headRow, subtaskList);
    return subtaskWrap;
  }

  return document.createDocumentFragment()
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
  separator.innerHTML = "|"

  footer.append(deleteBtn, separator, editBtn);
  return footer;
}


// Helper

export function closeTaskOverlay() {
  const overlay = document.getElementById("taskOverlay");
  if (!overlay) return;

  overlay.classList.remove("active");
  overlay._cleanup?.();
}

function taskModalEventlistener(overlay, section) {
  const backdrop = overlay?.querySelector(".backdrop_overlay");

  // --- Close handling (Backdrop + ESC) ---
  if (overlay && !overlay.dataset.bound) {
    const onBackdropClick = (e) => {
      if (e.target === overlay || e.target === backdrop) closeTaskOverlay();
    };

    const onKeydown = (e) => {
      if (e.key === "Escape") closeTaskOverlay();
    };

    overlay.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeydown);
    overlay.dataset.bound = "1";

    overlay._cleanup = () => {
      overlay.removeEventListener("click", onBackdropClick);
      document.removeEventListener("keydown", onKeydown);
      ScrollLock.release()
      delete overlay.dataset.bound;
    };
  }

  // --- Klicks im Modal selbst ---
  section.addEventListener("click", async (e) => {
    e.stopPropagation(); // verhindert Overlay-Schließen

    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const { action, taskId } = btn.dataset;

    if (action === "edit") {
      openEditForm(taskId);
    }

    if (action === "delete") {
      const confirmed = confirm("Are you sure you want to delete this task?");
      if (confirmed) await deleteTask(taskId);
    }
  });

  // --- Overlay aktivieren ---
  overlay?.classList.add("active");
}


async function getContactsMap() {
  let contactsCache = null;
  if (contactsCache) return contactsCache;
  const snap = await get(child(ref(db), "contacts"));
  contactsCache = snap.exists() ? snap.val() : {};
  return contactsCache;
}

function normAssignees(task) {
  // akzeptiert: task.assignees = [ {id,name,email}, ... ] ODER task.assignee = {id,name,email}
  if (Array.isArray(task.assignees) && task.assignees.length) return task.assignees;
  if (task.assignee && (task.assignee.id || task.assignee.name || task.assignee.email)) return [task.assignee];
  return [];
}

export function renderAssignees(container, assigneesArr, contactsMap, currentUser) {
  container.classList.add("assignees");
  container.innerHTML = "";
  if (!assigneesArr.length) return container.textContent = "—";

  assigneesArr.forEach(a => {
    const uid = a?.id || a?.uid || "";
    const c = uid ? contactsMap[uid] : null;
    const name = c?.name || a?.name || a?.displayName || a?.email || "Unbekannt";
    const isYou = currentUser && (uid === currentUser.id || name === currentUser.name);
    const color = c?.color || "#6c7ae0";
    const ini = c?.initials || initialsFrom(name);
    const badge = Object.assign(document.createElement("span"), {
      className: "assignee_badge", textContent: ini, title: name,
      style: `background-color:${color}`
    });
    const label = Object.assign(document.createElement("span"), {
      className: "assignee_label", textContent: isYou ? `${name} (You)` : name
    });
    const row = document.createElement("div");
    row.className = "assignee_row";
    row.append(badge, label);
    container.append(row);
  });
}

function normalizeSubtasks(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.subtasks)) return input.subtasks;
  if (typeof input?.subtask === "string" && input.subtask.trim())
    return input.subtask.split(",").map(s => ({ text: s.trim(), done: false, _readonly: true }));
  return [];
}

async function updateSubtaskDone(taskId, index, done) {
  const path = `tasks/${taskId}/subtasks/${index}/done`;
  await update(ref(db), { [path]: !!done, [`tasks/${taskId}/updatedAt`]: Date.now() });
}

// async function openEditForm(taskId)  jetzt in editTask.js

async function deleteTask(taskId) {
  const path = `tasks/${taskId}`;
  await update(ref(db), { [path]: null });
  console.log("🗑️ Task deleted:", taskId);
  closeTaskOverlay();
}
