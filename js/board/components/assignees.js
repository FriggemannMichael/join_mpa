import { colorFromString, getInitials } from "../utils.js";


/**
 * Builds and returns an assignee group element for a task card.
 * Displays up to three avatars and a "+N" indicator for remaining assignees.
 * @param {Object} [task={}] - The task object containing assignee data.
 * @param {Array<Object>} [task.assignees] - List of assigned users for the task.
 * @returns {HTMLDivElement} The created assignee group container element.
 */
export function buildAssigneeGroup(task = {}) {
  const wrap = document.createElement("div"); wrap.className = "assignees";
  wrap.setAttribute("aria-label", "assignees");
  const ul = document.createElement("ul"); ul.className = "avatar-group";
  ul.setAttribute("role", "list");
  const list = getAssignees(task), shown = list.slice(0, 3), rest = Math.max(0, list.length - 3);
  shown.forEach(a => {
    const name = a?.name;
    const li = document.createElement("li"); li.className = "task-card-avatar"; li.title = name;
    li.textContent = getInitials(name || "");
    li.style.background = colorFromString(name || "");
    ul.append(li);});
  if (rest) { const more = document.createElement("li"); more.className = "task-card-avatar more"; more.textContent = `+${rest}`; ul.append(more); }
  wrap.append(ul); return wrap;
}


/**
 * Normalizes and returns the assignee list from a task object.
 * Supports multiple data formats for backward compatibility.
 * @param {Object} [task={}] - The task object that may contain assignee data.
 * @param {Array<Object>|Object} [task.assignees|task.assignee] - Possible assignee fields in the task.
 * @returns {Array<Object>} A normalized array of assignee objects.
 */

function getAssignees(task = {}) {
  if (Array.isArray(task.assignees)) return task.assignees;
  if (Array.isArray(task.assignee)) return task.assignee;
  if (task.assignee && typeof task.assignee === "object") return [task.assignee];
  return [];
}