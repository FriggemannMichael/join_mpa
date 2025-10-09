import { db } from "../common/firebase.js";
import { ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

  const overlay = document.getElementById("taskOverlay");        // äußerer Wrapper (Backdrop-Klick-Ziel)
  const backdrop = overlay?.querySelector(".backdrop_overlay");


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

  if (overlay && !overlay.dataset.bound) {
    const onBackdropClick = (e) => {
      // Klick direkt auf Overlay-Wrapper ODER expliziten Backdrop schließt
      if (e.target === overlay || e.target === backdrop) closeOverlay();
    };

    const onKeydown = (e) => {
      if (e.key === "Escape") closeOverlay();
    };

    // nur einmal binden
    overlay.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeydown);
    overlay.dataset.bound = "1";

    // Cleanup beim Schließen
    overlay._cleanup = () => {
      overlay.removeEventListener("click", onBackdropClick);
      document.removeEventListener("keydown", onKeydown);
      delete overlay.dataset.bound;
    };
  }

  // Klicks im Inhalt sollen NICHT das Overlay schließen
  section.addEventListener("click", (e) => e.stopPropagation());

  // Close-Button schließt immer
  closeBtn.addEventListener("click", () => closeOverlay());

  // Aktivieren (für CSS-Animationen wie .overlay.active)
  overlay?.classList.add("active");

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("active");
    return section;
  }
}





// für später wichtig (classes)

function toClassName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}