// import {renderTaskModal} from "../pages/taskModal.js"

let currentDrag = null;

export function enableCardInteractions(card) {
  card.style.touchAction = "auto";

  const HOLD_MS = 300;
  const MOVE_THRESHOLD = 5;
  const MOUSE_DRAG_DELAY = 100;

  let timer = null;
  let startX = 0, startY = 0, startTime = 0;
  let dragging = false;
  let isTouch = false;
  let moved = false;

  const clearHold = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };


  card.addEventListener("pointerdown", (e) => {
    isTouch = e.pointerType === "touch";
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    dragging = false;
    moved = false;


    if (isTouch) {
      timer = setTimeout(() => {
        startDragging(card, e);
        dragging = true;
      }, HOLD_MS);
    } else {
      startDragging(card, e);
      timer = setTimeout(() => { }, MOUSE_DRAG_DELAY);
    }
  });


  card.addEventListener("pointermove", (e) => {
    const movedx = Math.abs(e.clientX - startX);
    const movedy = Math.abs(e.clientY - startY);

    if (!dragging) {

      if (isTouch && (movedx > MOVE_THRESHOLD || movedy > MOVE_THRESHOLD)) {
        moved = true;
        clearHold();
        return;
      }


      if (!isTouch && (movedx > MOVE_THRESHOLD || movedy > MOVE_THRESHOLD)) {
        clearHold();
        dragging = true;
      }
      return;
    }


    moveDragging(card, e);
  });


  card.addEventListener("pointerup", async (e) => {
    clearHold();

    if (dragging) {
      endDragging(card, e);
    } else if (!moved) {

      const holdTime = Date.now() - startTime;
      if (holdTime < HOLD_MS) {
        const id = card.dataset.taskId;
        const task = await loadTask(id);
        renderTaskModal(id, task);
        document.getElementById("taskModal")?.classList.add("active");
      }
    }

    dragging = false;
  });


  card.addEventListener("pointercancel", (e) => {   // CHANGE: (e) + Cleanup
    clearHold();
    if (currentDrag) {
      try { card.releasePointerCapture?.(e.pointerId); } catch { }
      currentDrag.ghost?.remove();
      document.querySelectorAll(".drop_placeholder").forEach(ph => ph.remove());
      card.classList.remove("dragging");
      card.style.touchAction = "auto";
      currentDrag = null;
    }
    dragging = false;
    moved = false;
  });
}



function startDragging(card, e) {
  const rect = card.getBoundingClientRect();
  const originColumn = card.closest(".task_column");
  card.setPointerCapture(e.pointerId);
  card.style.touchAction = "none";

  document.body.classList.add('no-select');

  // Ghost erstellen
  const ghost = card.cloneNode(true);
  ghost.classList.add("drag-ghost");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: "none",
    zIndex: 1000,
  });
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  currentDrag = { card, ghost, originColumn, offsetX, offsetY };
  document.body.appendChild(ghost);

  // Platzhalter in andere Spalten erstellen
  const allColumns = document.querySelectorAll(".task_column");
  allColumns.forEach(col => {
    if (col !== originColumn) {
      const ph = document.createElement("div");
      ph.className = "drop_placeholder";
      ph.style.height = `${rect.height}px`;
      col.querySelector(".task_space")?.appendChild(ph);
    }
  });

  card.classList.add("dragging");
}


function moveDragging(card, e) {
  if (!currentDrag) return;

  const { ghost, offsetX, offsetY } = currentDrag;
  // Ghost an Maus bewegen
  ghost.style.left = `${e.clientX - offsetX}px`;
  ghost.style.top = `${e.clientY - offsetY}px`;

  // Spalte unter Maus bestimmen
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const hoveredCol = el?.closest(".task_column");

  // Platzhalter hervorheben
  document.querySelectorAll(".drop_placeholder").forEach(ph => {
    const col = ph.closest(".task_column");
    ph.classList.toggle("active", col === hoveredCol);
  });
}

function endDragging(card, e) {
  document.body.classList.remove('no-select');
  if (!currentDrag) return;

  const { ghost, originColumn } = currentDrag;
  card.releasePointerCapture(e.pointerId);

  // Drop-Ziel ermitteln
  let el = document.elementFromPoint(e.clientX, e.clientY);
  let targetCol = el?.closest(".task_column");

  // Falls kein Treffer, wähle die nächste Spalte anhand Distanz
  if (!targetCol) {
    const nearestSpace = findNearestSpace(e.clientX, e.clientY);
    targetCol = nearestSpace?.closest(".task_column");
  }

  // Gültigen Drop ausführen
  if (targetCol && targetCol !== originColumn) {
    const space = targetCol.querySelector(".task_space");
    space.appendChild(card);
    card.dataset.status = space.id;
    updateTaskStatus(card.dataset.taskId, space.id);
    console.log(`✅ Task ${card.dataset.taskId} verschoben nach ${space.id}`);
  } else {
    // kein gültiges Ziel → zurück zur Ursprungsspalte
    originColumn.querySelector(".task_space").appendChild(card);
    console.log("↩️ Kein gültiges Ziel – Karte zurückgesetzt");
  }

  // Ghost & Platzhalter entfernen
  document.querySelectorAll('.drag-ghost').forEach(el => el.remove());
  document.querySelectorAll(".drop_placeholder").forEach(e => e.remove());

  // Status & Stile zurücksetzen
  card.classList.remove("dragging");
  card.style.touchAction = "auto";
  document.body.style.cursor = "";
  currentDrag = null;
}


// Helper 

function findNearestSpace(clientX, clientY) {
  const spaces = document.querySelectorAll(".task_space");
  let nearest = null;
  let minDist = Infinity;

  spaces.forEach(space => {
    const rect = space.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const movedx = clientX - cx;
    const movedy = clientY - cy;
    const dist = Math.sqrt(movedx * movedx + movedy * movedy);

    if (dist < minDist) {
      minDist = dist;
      nearest = space;
    }
  });

  return nearest;
}


export async function updateTaskStatus(taskId, newStatus) {
  try {
    const taskRef = ref(db, `tasks/${taskId}`);
    await update(taskRef, { status: newStatus, updatedAt: Date.now() });
    console.log(`Task "${taskId}" erfolgreich auf "${newStatus}" aktualisiert.`);
  } catch (error) {
    console.error(`Fehler beim Aktualisieren von Task "${taskId}":`, error);
  }
}