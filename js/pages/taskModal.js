export async function loadTask(id) {
  const root = ref(db);
  const snap = await get(child(root, `tasks/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}


export function renderTaskModal(id, task = {}) {
  const {
    title = "",
    description = "",
    category = "General",
    priority = "medium",
    subtasks = [],
    assignees = [],
    status = "todo",
    dueDate = ""
  } = task;

  const section = document.getElementById("taskModal");
  section.dataset.taskId = id;

  const head = document.createElement("div");
  head.classList.add("header-task-overlay");

  const taskCategory = document.createElement("div");
  taskCategory.classList.add("task_category");
  taskCategory.textContent = category;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "×";
  closeBtn.classList.add("close_button");
  closeBtn.dataset.overlayClose = "#taskOverlay"; // FIX: korrektes data-Attribut

  head.append(taskCategory, closeBtn);

  const h2 = document.createElement("h2");
  h2.textContent = title;

  const descriptionDiv = document.createElement("div");
  descriptionDiv.textContent = description;
  descriptionDiv.classList.add("task_description_overlay");

  // Due date
  const dueDateDiv = document.createElement("div");
  dueDateDiv.classList.add("due_date_task_overlay");
  const dueLabel = document.createElement("p");
  dueLabel.textContent = "Due date:";
  const dueVal = document.createElement("span");
  if (dueDate) {
    const d = new Date(dueDate);
    dueVal.textContent = isNaN(d) ? dueDate : d.toLocaleDateString("de-DE");
  } else {
    dueVal.textContent = "-";
  }
  dueDateDiv.append(dueLabel, dueVal);

  // Priority
  const priorityDiv = document.createElement("div");
  priorityDiv.classList.add("priority");
  const priorityP = document.createElement("p");
  priorityP.textContent = "Priority:";
  const prioritySpan = document.createElement("span");
  prioritySpan.textContent = priority; // FIX: Variable benutzen
  priorityDiv.append(priorityP, prioritySpan);

  // Assignees
  const assigned = document.createElement("div");
  assigned.classList.add("assigned_to_task_overlay");
  const assignedTo = document.createElement("p");
  assignedTo.textContent = "Assigned To:";
  const assigneesDiv = document.createElement("div");
  if (Array.isArray(assignees) && assignees.length) {
    assignees.forEach(a => {
      const badge = document.createElement("span");
      badge.className = "assignee_badge";
      badge.textContent = a?.name || a?.email || a || "?";
      assigneesDiv.appendChild(badge);
    });
  } else {
    assigneesDiv.textContent = "—";
  }
  assigned.append(assignedTo, assigneesDiv);

  // Subtasks
  const subtaskEl = document.createElement("div");
  subtaskEl.classList.add("subtask_task_overlay");
  const subtaskHead = document.createElement("div");
  subtaskHead.classList.add("subtask_header_task_overlay");
  subtaskHead.textContent = "Subtasks";
  const subtaskCon = document.createElement("ul");
  if (Array.isArray(subtasks) && subtasks.length) {
    subtasks.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s?.text || String(s);
      subtaskCon.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "Keine Subtasks";
    subtaskCon.appendChild(li);
  }
  subtaskEl.append(subtaskHead, subtaskCon);

  section.replaceChildren(
    head,
    h2,
    descriptionDiv,
    dueDateDiv,
    priorityDiv,
    assigned,
    subtaskEl
  );
  return section;
}