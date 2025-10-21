import { boardTemplates } from "./board-templates.js";
// import { setActivePriority } from "../board/addTask-Board.js"
import { getInitials, getColorForInitials, colorFromString, setTaskStatus, loadTask } from "../board/utils.js"
import {
  // --- Assignees ---
  populateAssignees,
  buildAssigneeOptions,
  renderAssigneeDropdown,
  bindAssigneeEvents,
  updateAssigneeSelection,
  setAssigneeLoading,

  // --- Priorität ---
  bindPriorityButtons,
  setActivePriority,

  // --- Subtasks ---
  addSubtask,
  renderSubtasks,
  createSubtaskElement,
  deleteSubtask,
  editSubtask,
  saveSubtaskEdit,
  cancelSubtaskEdit,
  clearSubtaskInput,
  initSubtaskInput,

  // --- Form ---
  readValue,
  readActivePriority,

  // subtasks,
  setSubtasksFrom
} from '../pages/add-task.js';

import { icons } from "../common/svg-template.js"
import { closeTaskOverlay } from "../board/taskModal.js"


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
  updateBtn.addEventListener("click", () => handleUpdateClick(taskId));
  footer.append(updateBtn);

  section.replaceChildren(header, body, footer);


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
