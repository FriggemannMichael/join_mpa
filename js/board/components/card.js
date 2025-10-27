import { buildAssigneeGroup } from "./assignees.js";
import { buildPriority } from "./priority.js";
import { buildSubtaskProgress } from "./subtasks.js";
import { enableCardInteractions } from "../dnd/dragdrop.js";



/**
 * Builds and returns a task card element for the board.
 * Includes category, description, and footer sections.
 * @param {Object} task - The task object containing task details.
 * @param {string} task.id - Unique task ID.
 * @param {string} [task.category] - Task category key or class.
 * @param {string} [task.categoryLabel] - Human-readable category label.
 * @returns {HTMLElement} The fully constructed task card element.
 */
export function buildTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task_card";
  card.dataset.taskId = task.id;

  const type = document.createElement("div");
  type.id = "taskType";
  type.classList.add("task_category", task.category);
  type.textContent = task.categoryLabel || task.category || "Task";
  card.append(type);

  buildTaskCardDescription(card, task)

  buildTaskCardFooter(card, task)

  return card;
}


/**
 * Builds and appends the description section of a task card.
 * Includes the title, description text, and optional subtask progress.
 * @param {HTMLElement} card - The parent task card element to append to.
 * @param {Object} task - The task object containing description data.
 * @param {string} task.title - Task title displayed in the header.
 * @param {string} [task.description] - Optional task description text.
 * @param {Array<Object>} [task.subtasks] - Optional list of subtasks for progress display.
 * @returns {void}
 */
function buildTaskCardDescription(card, task) {
  const descriptionSection = document.createElement("section");
  descriptionSection.className = "task_card_description";
  const title = document.createElement("h5");
  title.className = "task_header";
  title.textContent = task.title;
  const description = document.createElement("span");
  description.className = "task_description";
  description.textContent = task.description || "";
  descriptionSection.append(title, description);
  card.append(descriptionSection);

  const progress = buildSubtaskProgress(task.subtasks);
  if (progress) card.append(progress);
}


/**
 * Builds and appends the footer section of a task card.
 * Displays assignees, priority, and enables card interactions.
 * @param {HTMLElement} card - The parent task card element to append the footer to.
 * @param {Object} task - The task object containing footer details.
 * @param {Array<Object>} [task.assignees] - Optional list of assigned users.
 * @param {string} [task.priority] - Priority level of the task (e.g., "urgent", "medium", "low").
 * @returns {void}
 */
function buildTaskCardFooter(card, task) {
  const footer = document.createElement("div");
  footer.className = "footer_task_card";
  footer.append(buildAssigneeGroup(task), buildPriority(task.priority));
  card.append(footer);
  enableCardInteractions(card);
}
