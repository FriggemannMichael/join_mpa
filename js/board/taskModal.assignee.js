import { getContactsMap } from "./tasks.repo.js";
import { getCurrentUser, colorFromString, getInitials } from "./utils.js";


/**
 * Renders the assignee section in the task modal.
 * Fetches contacts and displays all assigned users.
 * @async
 * @param {Object} task - The task containing assignee data.
 * @returns {Promise<HTMLDivElement>} The created assignee section element.
 */
export async function taskModalAssignees(task) {
  const assigned = document.createElement("div");
  assigned.classList.add("assigned_to_task_overlay");

  const assignedTo = document.createElement("p");
  assignedTo.classList.add("taskModal-label");
  assignedTo.textContent = "Assigned To:";

  const assigneesDiv = document.createElement("div");
  const contacts = await getContactsMap();
  const assigneesArr = Array.isArray(task?.assignees) ? task.assignees : [];
  const user = getCurrentUser();

  renderAssignees(assigneesDiv, assigneesArr, contacts, user);
  assigned.append(assignedTo, assigneesDiv);
  return assigned;
}


/**
 * Renders the list of assignees inside the given container.
 * Displays a dash if no assignees are assigned.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Array<Object>} [assigneesArr=[]] - Array of assigned user objects.
 * @param {Object} [contactsMap={}] - Map of all contacts, keyed by user ID.
 * @param {Object} currentUser - The currently logged-in user.
 * @returns {void}
 */
export function renderAssignees(
  container,
  assigneesArr = [],
  contactsMap = {},
  currentUser
) {
  container.classList.add("assignees");
  container.innerHTML = "";

  if (!assigneesArr.length) { container.textContent = "—"; return; }

  renderAssigneeList(container, assigneesArr, contactsMap, currentUser)
}


/**
 * Renders all assignee rows inside the given container.
 * Creates badges and labels for each assigned user.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Array<Object>} assigneesArr - Array of assignee objects.
 * @param {Object} contactsMap - Map of contacts, keyed by user ID.
 * @param {Object} currentUser - The currently logged-in user.
 * @returns {void}
 */
function renderAssigneeList(container, assigneesArr, contactsMap, currentUser) {
  assigneesArr.forEach((a) => {
    const uid = a?.uid;
    const contact = contactsMap[uid];
    const name = contact?.name || a?.name;
    const isYou = (currentUser && uid === currentUser.uid) || (a?.email && a.email === currentUser.email);
    const color = colorFromString(name);
    const initials = getInitials(name);
    const badge = createBadge(initials, name, color)
    const label = createLabel(isYou, name)

    const row = document.createElement("div");
    row.className = "assignee_row";
    row.append(badge, label);

    container.append(row);
  });
}


/**
 * Creates a colored badge element for an assignee.
 * Displays user initials and name tooltip.
 * @param {string} initials - The user's initials to display.
 * @param {string} name - The full name of the assignee.
 * @param {string} color - The background color for the badge.
 * @returns {HTMLSpanElement} The created badge element.
 */
function createBadge(initials, name, color) {
  const badge = document.createElement("span");
  badge.className = "assignee_badge";
  badge.textContent = initials;
  badge.title = name;
  badge.style.backgroundColor = color;
  badge.setAttribute("aria-label", `Assignee ${name}`);
  return badge
}


/**
 * Creates a label element for an assignee.
 * Marks the current user with "(You)" if applicable.
 * @param {boolean} isYou - Whether the assignee is the current user.
 * @param {string} name - The assignee's display name.
 * @returns {HTMLSpanElement} The created label element.
 */
function createLabel(isYou, name) {
  const label = document.createElement("span");
  label.className = "assignee_label";
  label.textContent = isYou ? `${name} (You)` : name;
  return label;
}

