import { db } from "../common/firebase.js";
import { ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

export async function loadTask(id) {
  const root = ref(db);
  const snap = await get(child(root, `tasks/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}


export async function renderTaskModal(id, task = {}) {
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

  const contacts = await getContactsMap();
  const assigneesArr = normAssignees(task); // aus task.assignees[] oder task.assignee
  renderAssignees(assigneesDiv, assigneesArr, contacts);

  assigned.append(assignedTo, assigneesDiv);





  // Subtasks
  // const subtaskEl = document.createElement("div");
  // subtaskEl.classList.add("subtask_task_overlay");
  // const subtaskHead = document.createElement("div");
  // subtaskHead.classList.add("subtask_header_task_overlay");
  // subtaskHead.textContent = "Subtasks";
  // const subtaskCon = document.createElement("ul");
  // if (Array.isArray(subtasks) && subtasks.length) {
  //   subtasks.forEach(s => {
  //     const li = document.createElement("li");
  //     li.textContent = s?.text || String(s);
  //     subtaskCon.appendChild(li);
  //   });
  // } else {
  //   const li = document.createElement("li");
  //   li.textContent = "Keine Subtasks";
  //   subtaskCon.appendChild(li);
  // }
  // subtaskEl.append(subtaskHead, subtaskCon);

const subtaskWrap = document.createElement("div");
  subtaskWrap.classList.add("subtask_task_overlay");

  const subtaskList = document.createElement("ul");
  subtaskList.className = "subtask_list";

  const normalized = normalizeSubtasks(task);

  if (normalized.length) {
    // Header mit Fortschritt
    const headRow = document.createElement("div");
    headRow.className = "subtask_header_task_overlay";
    headRow.innerHTML = `
      <div class="subtask_title_row">
        <span>Subtasks</span>
        <span class="subtask_count"></span>
      </div>
      <div class="subtask_progress"><div class="subtask_progress_fill"></div></div>
    `;

    // Items
    normalized.forEach((s, idx) => {
      const li = document.createElement("li");
      li.className = "subtask_item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!s.done;

      const label = document.createElement("label");
      label.textContent = s?.text || String(s);

      li.append(cb, label);
      if (cb.checked) li.classList.add("done");

      // Nur toggelbar, wenn NICHT readonly (also echtes Array-Feld in DB)
      if (!s._readonly) {
        cb.addEventListener("change", async () => {
          await updateSubtaskDone(id, idx, cb.checked);
          li.classList.toggle("done", cb.checked);
          updateProgress(subtaskWrap);
        });
      } else {
        // read-only: Checkbox deaktivieren
        cb.disabled = true;
      }

      subtaskList.appendChild(li);
    });

    subtaskWrap.append(headRow, subtaskList);
    updateProgress(subtaskWrap);
  } else {
    const subtaskHead = document.createElement("div");
    subtaskHead.classList.add("subtask_header_task_overlay");
    subtaskHead.textContent = "Subtasks";
    const empty = document.createElement("ul");
    const li = document.createElement("li");
    li.textContent = "Keine Subtasks";
    empty.appendChild(li);
    subtaskWrap.append(subtaskHead, empty);
  }

  // Progress neu berechnen (lokal)
  function updateProgress(rootEl) {
    const items = [...rootEl.querySelectorAll(".subtask_item")];
    const done = items.filter(i => i.classList.contains("done")).length;
    const total = Math.max(items.length, 1);
    const bar = rootEl.querySelector(".subtask_progress");
    const fill = bar?.querySelector(".subtask_progress_fill");
    const count = rootEl.querySelector(".subtask_count");
    if (fill) fill.style.width = `${(done / total) * 100}%`;
    if (count) count.textContent = `${done}/${total}`;
  }

  // 
  // 
  // 
  // 
  // 


  section.replaceChildren(
    head,
    h2,
    descriptionDiv,
    dueDateDiv,
    priorityDiv,
    assigned,
    // subtaskEl
    subtaskWrap
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


function initials(str="") {
  const s = (str.name || str).toString();
  const parts = s.trim().split(/\s+/);
  const ini = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return ini.toUpperCase() || (str.email?.[0] || "?").toUpperCase();
}

function colorFromString(s="") {
  // stabile, aber simple Farbgenerierung
  let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))|0;
  h = Math.abs(h) % 360;
  return `hsl(${h} 70% 45%)`;
}




// testbereich

let __contactsCache = null;

async function getContactsMap() {
  if (__contactsCache) return __contactsCache;
  const snap = await get(child(ref(db), "contacts"));
  __contactsCache = snap.exists() ? snap.val() : {};
  return __contactsCache;
}

function normAssignees(task) {
  // akzeptiert: task.assignees = [ {id,name,email}, ... ] ODER task.assignee = {id,name,email}
  if (Array.isArray(task.assignees) && task.assignees.length) return task.assignees;
  if (task.assignee && (task.assignee.id || task.assignee.name || task.assignee.email)) return [task.assignee];
  return [];
}

function initialsFrom(str = "") {
  const s = String(str).trim();
  if (!s) return "?";
  const parts = s.split(/\s+/);
  const ini = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (ini || s[0]).toUpperCase();
}

function renderAssignees(container, assigneesArr, contactsMap) {
  container.classList.add("assignees");
  container.innerHTML = "";

  if (!assigneesArr.length) {
    container.textContent = "—";
    return;
  }

  assigneesArr.forEach(a => {
    const uid = a?.id || a?.uid || "";
    const contact = uid ? contactsMap[uid] : null;

    const name = contact?.name || a?.name || a?.displayName || a?.email || "Unbekannt";
    const badge = document.createElement("span");
    badge.className = "assignee_badge";

    // Farbe/Initialen bevorzugt aus contacts
    const color = contact?.color || "#6c7ae0";
    const ini = contact?.initials || initialsFrom(name);

    badge.textContent = ini;
    badge.title = name;
    badge.style.backgroundColor = color;

    // optional: zusätzlicher Text neben Badge
    const label = document.createElement("span");
    label.className = "assignee_label";
    label.textContent = name;

    const row = document.createElement("div");
    row.className = "assignee_row";
    row.append(badge, label);

    container.appendChild(row);
  });
}

// Subtasks: bevorzugt Array [{text,done}], sonst string "a,b,c" -> read-only
function normalizeSubtasks(task) {
  if (Array.isArray(task.subtasks)) return task.subtasks;
  if (Array.isArray(task.subtask)) return task.subtask; // falls schon Array
  if (typeof task.subtask === "string" && task.subtask.trim()) {
    return task.subtask.split(",").map(s => ({ text: s.trim(), done: false, _readonly: true }));
  }
  return [];
}

async function updateSubtaskDone(taskId, index, done) {
  const path = `tasks/${taskId}/subtasks/${index}/done`;
  await update(ref(db), { [path]: !!done, [`tasks/${taskId}/updatedAt`]: Date.now() });
}