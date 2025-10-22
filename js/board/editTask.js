import { boardTemplates } from "./board-templates.js";
import { loadTask } from "../board/utils.js"
import {
  populateAssignees, updateAssigneeSelection,
  bindPriorityButtons, renderSubtasks, initSubtaskInput, setSubtasksFrom, readTaskData
} from '../pages/add-task.js';

import { icons } from "../common/svg-template.js"
import { closeTaskOverlay } from "../board/utils.js"
import { updateTaskStatus } from "./dragdrop.js";
import { db } from "../common/firebase.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";


export async function openEditForm(taskId) {
  const section = document.getElementById("taskModal");
  section.classList.add("task-overlay")

  const header = document.createElement("div");
  header.className = "task-editor_header";
  const closeBtn = document.createElement("button");
  closeBtn.className = "close_button_taskModal";
  closeBtn.dataset.overlayClose = "#taskOverlay";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = icons.close;
  closeBtn.addEventListener("click", closeTaskOverlay);
  header.append(closeBtn);

  const body = document.createElement("div");
  body.classList.add("task-editor_body");
  body.innerHTML = boardTemplates.editTask;

  const footer = document.createElement("div");
  footer.className = "task-editor_footer";
  const updateBtn = document.createElement("button");
  updateBtn.type = "button";
  updateBtn.className = "update-task-btn";
  updateBtn.textContent = "Update";
  footer.append(updateBtn);
  section.replaceChildren(header, body, footer);

  updateBtn.addEventListener("click", () => handleUpdate(taskId, section));

  await populateAssignees();
  bindPriorityButtons();
  await fillEdit(taskId);

}

function setField(scope, selector, value) {
  const el = scope.querySelector(selector);
  if (!el) return;
  el["value" in el ? "value" : "textContent"] = value ?? "";
}

export async function fillEdit(taskId) {
  const task = await loadTask(taskId);
  const scope = document.getElementById("taskModal");

  setField(scope, "#taskTitle", task.title);
  setField(scope, "#taskDescription", task.description);
  setField(scope, "#taskDueDate", task.dueDate);

  const prio = task.priority.toLowerCase();
  scope.querySelectorAll(".priority-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.priority === prio);
  });

  preselectAssignees(task.assignees || []);
  setSubtasksFrom(task.subtasks || []);
  initSubtaskInput();
  renderSubtasks();
}

function preselectAssignees(selected) {
  const selectedIds = new Set(selected.map(a => a.uid));
  document
    .querySelectorAll('#assignee-dropdown input[type="checkbox"]')
    .forEach(cb => cb.checked = selectedIds.has(cb.value));
  updateAssigneeSelection();
}


export async function handleUpdate(taskId, root = document) {
  const get = sel => root.querySelector(sel);
  const all = sel => [...root.querySelectorAll(sel)];

  const titleEl = get('#taskTitle');
  const title = titleEl.value.trim();
  if (!title) return alert('Please enter a title');

  const task = {
    title,
    description: get('#taskDescription')?.value.trim() || '',
    dueDate: get('#taskDueDate')?.value || null,
    priority: get('.priority-btn.active')?.dataset.priority || null,
    assignee: all('#selected-assignee-avatars [data-id]')
      .map(a => ({ id: a.dataset.id, name: a.dataset.name, email: a.dataset.email })),
    subtasks: all('#subtasksList .subtask-item')
      .map(s => ({ text: s.dataset.text || '', done: s.querySelector('input')?.checked || false })),
    updatedAt: Date.now()
  };

  await updateTask(taskId, task);
}


export async function updateTask(taskId, task) {

  const taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, task);
  console.log(`✅ Task ${taskId} updated`);
  return true;

}