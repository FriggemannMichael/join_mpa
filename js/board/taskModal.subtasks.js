import { updateSubtaskDone } from "./tasks.repo.js";



export function taskModalSubtask(task, taskId) {
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : [];
  if (!subtasks.length) return document.createDocumentFragment();

  const wrap = document.createElement("div");
  wrap.className = "subtask_task_overlay";

  const head = document.createElement("div");
  head.className = "subtask_header_task_overlay";
  head.innerHTML = `<span class="taskModal-label">Subtasks</span>`;

  const list = createSubtaskList(taskId, subtasks);

  wrap.append(head, list);
  return wrap;
}


function createSubtaskList(taskId, subtasks) {
  const list = document.createElement("ul");
  list.className = "subtask_list";

  const frag = document.createDocumentFragment();
  subtasks.forEach((s, i) => frag.append(createSubtaskItem(s, taskId, i)));
  list.append(frag);
  return list;
}


function createSubtaskItem(subtask, taskId, index) {
  const item = document.createElement("li");
  item.className = "subtask_item";

  const checkbox = createSubtaskCheckbox(taskId, index, subtask)

  const label = createSubtaskLabel(subtask, checkbox)

  handleSubtaskToggle(checkbox, item, taskId, index);

  if (checkbox.checked) item.classList.add("done");
  item.append(checkbox, label);

  return item;
}

function createSubtaskCheckbox(taskId, index, subtask) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `sub-${taskId}-${index}`;
  checkbox.checked = !!subtask.done;
  return checkbox;
}

function createSubtaskLabel(subtask, checkbox) {
  const label = document.createElement("label");
  label.textContent = subtask?.text || "";
  label.htmlFor = checkbox.id;
  return label;
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