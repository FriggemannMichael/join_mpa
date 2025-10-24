import { boardTemplates } from "./board-templates.js";
import {
  populateAssignees, updateAssigneeSelection,
  bindPriorityButtons, renderSubtasks, initSubtaskInput, setSubtasksFrom,
} from "../pages/add-task.js";
import { icons } from "../common/svg-template.js";
import { closeTaskOverlay } from "../board/utils.js";
import { updateTask, loadTask } from "./tasks.repo.js"

export async function openEditForm(taskId) {
  const section = document.getElementById("taskModal");
  section.classList.add("task-overlay");

  section.replaceChildren(
    createHeader(closeTaskOverlay),
    createBody(),
    createFooter(() => handleUpdate(taskId, section))
  );

  await populateAssignees();
  bindPriorityButtons();
  await fillEdit(taskId);
}

function createHeader(onClose) {
  const header = document.createElement("div");
  header.classList.add("task-editor_header");

  const btn = document.createElement("button");
  btn.className = "close_button_taskModal";
  btn.type = "button";
  btn.innerHTML = icons.close;
  btn.setAttribute("aria-label", "Close");
  btn.dataset.overlayClose = "#taskOverlay";
  btn.addEventListener("click", onClose);

  header.append(btn);
  return header;
}

function createBody() {
  const body = document.createElement("div");
  body.classList.add("task-editor_body");
  body.innerHTML = boardTemplates.editTask;
  return body;
}

function createFooter(onUpdate) {
  const footer = document.createElement("div");
  footer.classList.add("task-editor_footer");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "update-task-btn";
  btn.innerHTML = `OK ${icons.checkwhite}`;
  btn.addEventListener("click", onUpdate);

  footer.append(btn);
  return footer;
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

  const prio = (task.priority || "").toLowerCase();
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

function readTaskFromForm(root = document) {
  const select = sel => root.querySelector(sel);
  const selectAll = sel => [...root.querySelectorAll(sel)];

  const title = select("#taskTitle")?.value.trim();
  const description = select("#taskDescription")?.value.trim();
  const dueDate = select("#taskDueDate")?.value;
  const priority = select(".priority-btn.active")?.dataset.priority;

  const assignees = selectAll('#selected-assignee-avatars [data-uid]').map(a => ({
    uid: a.dataset.uid,
    name: a.dataset.name,
    email: a.dataset.email
  }));

  const subtasks = selectAll("#subtasksList .subtask-item").map(s => ({
    text: s.dataset.text || "",
    done: !!s.querySelector("input")?.checked
  }));

  return { title, description, dueDate, priority, assignees, subtasks, updatedAt: Date.now() };
}

export async function handleUpdate(taskId, root = document) {
  const task = readTaskFromForm(root);
  await updateTask(taskId, task);
  closeTaskOverlay();

}


