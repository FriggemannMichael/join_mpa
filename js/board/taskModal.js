import { db, auth } from "../common/firebase.js";
import { ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { icons } from "../common/svg-template.js";
import { initialsFrom, getCurrentUser, ScrollLock, colorFromString, loadTask } from "./utils.js"
import { openEditForm } from "../board/editTask.js"
import { handleOutsideDropdownClick } from '../pages/add-task.js';


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

      // --- Eventlistener für Statusänderung ---
      cb.addEventListener("change", async () => {
        const prev = !cb.checked; // für Rollback bei Fehler
        li.classList.toggle("done", cb.checked); // sofortiges UI-Feedback

        try {
          await updateSubtaskDone(id, idx, cb.checked);
        } catch (err) {
          console.error("updateSubtaskDone failed:", err);
          cb.checked = prev; // Zustand zurücksetzen
          li.classList.toggle("done", cb.checked);
        }
      });

      li.append(cb, label);
      if (cb.checked) li.classList.add("done");
      subtaskList.appendChild(li);
    });

    subtaskWrap.append(headRow, subtaskList);
    return subtaskWrap;
  }

  return document.createDocumentFragment();
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
  overlay.cleanup?.();
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

    overlay.cleanup = () => {
      overlay.removeEventListener("click", onBackdropClick);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", handleOutsideDropdownClick)
      ScrollLock.release()
      delete overlay.dataset.bound;
    };
  }

  section.addEventListener("click", async (e) => {
    e.stopPropagation(); 

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

  overlay?.classList.add("active");
}


export async function getContactsMap() {
  const snap = await get(child(ref(db), "contacts"));
  return snap.exists() ? snap.val() : {};
}

function normAssignees(task) {
  return Array.isArray(task?.assignees) ? task.assignees : [];
}


export function renderAssignees(container, assigneesArr = [], contactsMap = {}, currentUser) {
  container.classList.add("assignees");
  container.innerHTML = "";

  if (!assigneesArr.length) {
    container.textContent = "—";
    return;
  }

  assigneesArr.forEach(a => {
    const uid = a?.uid;
    const contact = contactsMap[uid];
    const name = contact?.name || a?.name || "Unbekannt";
    const isYou = currentUser && (uid === currentUser.uid);
    const color = colorFromString(name);
    const initials = initialsFrom(name);

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
  await update(ref(db), { [path]: !!done, [`tasks/${taskId}/updatedAt`]: Date.now() });
}

async function deleteTask(taskId) {
  const path = `tasks/${taskId}`;
  await update(ref(db), { [path]: null });
  console.log("🗑️ Task deleted:", taskId);
  closeTaskOverlay();
}
