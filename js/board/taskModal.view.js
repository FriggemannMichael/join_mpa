import { taskModalEventlistener } from "./taskModal.events.js";
import { taskModalAssignees } from "./taskModal.assignee.js";
import { taskModalSubtask } from "./taskModal.subtasks.js";
import { icons } from "../common/svg-template.js";
import { closeTaskOverlay, ScrollLock, formatDate } from "./utils.js";


export async function renderTaskModal(id, task = {}) {
  ScrollLock.set();
  const overlay = document.getElementById("taskOverlay");
  const section = document.getElementById("taskModal");
  section.classList.add("task-overlay");
  section.dataset.taskId = id;
  const h2 = document.createElement("h2");
  h2.textContent = task.title;

  const scrollableSection = await createScrollableSection (task, h2, id) 

  section.replaceChildren(
    taskModalHeader(task.categoryLabel, task.category),
    scrollableSection,
    taskModalEditDelete(task, id)
  );

  taskModalEventlistener(overlay, section);
}


async function createScrollableSection (task, h2, id) {
const scrollableSection = document.createElement("div");
  scrollableSection.classList.add("taskModal-main");
  scrollableSection.append(
    h2,
    taskModalDescription(task.description),
    taskModalDueDate(task.dueDate),
    taskModalPriority(task.priority),
    await taskModalAssignees(task, id),
    await taskModalSubtask(task, id)
  );
  return scrollableSection;
}


function taskModalHeader(categoryLabel, category) {
  const head = document.createElement("div");
  head.className = "header-task-overlay";

  const cat = document.createElement("div");
  cat.className = `task_category ${category}`;
  cat.textContent = categoryLabel;

  const btn = createCloseBtn()

  head.append(cat, btn);
  return head;
}


function createCloseBtn() {
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
  return btn;
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
  value.textContent = formatDate(dueDate);

  formatDate

  div.append(label, value);
  return div;
}

function taskModalPriority(priority) {
  const priorityDiv = document.createElement("div");
  priorityDiv.classList.add("priority");

  const priorityP = document.createElement("p");
  priorityP.classList.add("taskModal-label");
  priorityP.textContent = "Priority:";

  const prioritySpan = createPrioritySpan(priority)

  priorityDiv.append(priorityP, prioritySpan);

  return priorityDiv;
}

function createPrioritySpan(priority) {

  const prioritySpan = document.createElement("span");
  const formatted = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  prioritySpan.textContent = formatted;

  const icon = document.createElement("img");
  icon.classList.add("priority-icon");
  icon.alt = `${priority}`;
  icon.src = `../img/icon/prio-${priority.toLowerCase()}.svg`;

  prioritySpan.append(icon);
  return prioritySpan;
}


function taskModalEditDelete(task, id) {
  const footer = document.createElement("div");
  footer.classList.add("footer_taskModal");

  const editBtn = createEditBtn(id)

  const deleteBtn = createDeleteBtn(id)

  const separator = createSeparator()

  footer.append(deleteBtn, separator, editBtn);
  return footer;
}

function createEditBtn(id) {
  const editBtn = document.createElement("button");
  editBtn.classList.add("edit-task-btn");
  editBtn.type = "button";
  editBtn.innerHTML = icons.edit + "<span>Edit</span>";
  editBtn.dataset.action = "edit";
  editBtn.dataset.taskId = id;
  return editBtn;
}

function createDeleteBtn(id) {
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-task-btn");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  deleteBtn.innerHTML = icons.delete + "<span>Delete</span>";
  deleteBtn.dataset.taskId = id;
  return deleteBtn;
}

function createSeparator() {
  const separator = document.createElement("span");
  separator.className = "separator-task-toolbar";
  separator.setAttribute("aria-hidden", "true");
  separator.innerHTML = "|";
  return separator;
}
