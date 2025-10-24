import { getContactsMap } from "./tasks.repo.js";
import { getCurrentUser, colorFromString, getInitials } from "./utils.js";

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


function createBadge(initials, name, color) {
  const badge = document.createElement("span");
  badge.className = "assignee_badge";
  badge.textContent = initials;
  badge.title = name;
  badge.style.backgroundColor = color;
  badge.setAttribute("aria-label", `Assignee ${name}`);
  return badge
}


function createLabel(isYou, name) {
  const label = document.createElement("span");
  label.className = "assignee_label";
  label.textContent = isYou ? `${name} (You)` : name;
  return label;
}

