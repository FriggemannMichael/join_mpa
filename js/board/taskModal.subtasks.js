import { updateSubtaskDone } from "./tasks.repo.js";


/**
 * Creates the subtask section for the task modal.
 * Renders a header and list of subtasks for the given task.
 * @param {Object} task - The task containing subtasks.
 * @param {string} taskId - ID of the task.
 * @returns {HTMLElement|DocumentFragment} The created subtask section or an empty fragment if none exist.
 */
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


/**
 * Creates a list element containing all subtasks.
 * @param {string} taskId - ID of the parent task.
 * @param {Array<Object>} subtasks - Array of subtasks to render.
 * @returns {HTMLUListElement} The created list element containing all subtask items.
 */
function createSubtaskList(taskId, subtasks) {
  const list = document.createElement("ul");
  list.className = "subtask_list";

  const frag = document.createDocumentFragment();
  subtasks.forEach((s, i) => frag.append(createSubtaskItem(s, taskId, i)));
  list.append(frag);
  return list;
}


/**
 * Creates a single subtask list item with checkbox and label.
 * Handles the toggle behavior and visual state.
 * @param {Object} subtask - The subtask data object.
 * @param {string} taskId - ID of the parent task.
 * @param {number} index - Index of the subtask in the list.
 * @returns {HTMLLIElement} The created subtask list item element.
 */
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


/**
 * Creates a checkbox element for a specific subtask.
 * @param {string} taskId - ID of the parent task.
 * @param {number} index - Index of the subtask.
 * @param {Object} subtask - The subtask data containing the done state.
 * @returns {HTMLInputElement} The created checkbox element.
 */
function createSubtaskCheckbox(taskId, index, subtask) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `sub-${taskId}-${index}`;
  checkbox.checked = !!subtask.done;
  return checkbox;
}


/**
 * Creates a label element for a subtask checkbox.
 * @param {Object} subtask - The subtask data containing the label text.
 * @param {HTMLInputElement} checkbox - The checkbox element this label is linked to.
 * @returns {HTMLLabelElement} The created label element.
 */
function createSubtaskLabel(subtask, checkbox) {
  const label = document.createElement("label");
  label.textContent = subtask?.text || "";
  label.htmlFor = checkbox.id;
  return label;
}


/**
 * Handles the toggle behavior of a subtask checkbox.
 * Updates the visual state and saves the change to the database.
 * @param {HTMLInputElement} checkbox - The checkbox element for the subtask.
 * @param {HTMLLIElement} item - The subtask list item element.
 * @param {string} taskId - ID of the parent task.
 * @param {number} index - Index of the subtask within the list.
 * @returns {void}
 */
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