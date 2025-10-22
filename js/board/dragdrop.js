import { renderTaskModal } from "./taskModal.js"
import { db } from "../common/firebase.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { loadTask } from "./utils.js"

let currentDrag = null;

export function enableCardInteractions(card) {
  const MOBILE_BREAKPOINT = 900;
  const updateTouchAction = () => {
    const isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    card.style.touchAction = isMobileView ? "none" : "auto";
    card.style.webkitUserSelect = isMobileView ? "none" : "auto";
  };
  updateTouchAction();
  window.addEventListener("resize", updateTouchAction);

  const HOLD_MS = 300;
  const MOVE_THRESHOLD = 5;

  const s = initDragState();

  card.addEventListener("pointerdown", (e) => onDown(card, e, s, HOLD_MS));
  card.addEventListener("pointermove", (e) => onMove(card, e, s, MOVE_THRESHOLD));
  card.addEventListener("pointerup", (e) => onUp(card, e, s, HOLD_MS));
  card.addEventListener("pointercancel", (e) => onUp(card, e, s, HOLD_MS));
}

/* ----------------- Helpers ----------------- */
function initDragState() {
  return {
    timer: null,
    startX: 0, startY: 0, startTime: 0,
    dragging: false, moved: false,
    isTouch: false, isPointerDown: false,
    pointerId: null,
  };
}

function onDown(card, e, s, HOLD_MS) {
  if (e.pointerType === "mouse" && e.button !== 0) return;

  s.isTouch = e.pointerType === "touch";
  s.startX = e.clientX;
  s.startY = e.clientY;
  s.startTime = Date.now();
  s.dragging = false;
  s.moved = false;
  s.isPointerDown = true;
  s.pointerId = e.pointerId;

  if (s.isTouch || window.innerWidth < 900) {
    card.setPointerCapture(e.pointerId);
    card.style.touchAction = "none";
  }
  if (s.isTouch) startHoldTimer(card, e, s, HOLD_MS);
}

function onMove(card, e, s, THRESHOLD) {
  if (!samePointer(e, s)) return;
  if (!s.isTouch && e.buttons === 0) return;
  if (s.isTouch && e.cancelable) e.preventDefault();

  if (!s.dragging) {
    if (s.isTouch && exceededThreshold(e, s, THRESHOLD)) {
      s.moved = true;
      clearHoldTimer(s);
      return;
    }
    if (!s.isTouch && exceededThreshold(e, s, THRESHOLD)) {
      startDrag(card, e, s);
      return;
    }
    return;
  }

  if (e.cancelable) e.preventDefault();
  moveDragging(card, e);
}

async function onUp(card, e, s, HOLD_MS) {
  clearHoldTimer(s);

  if (s.dragging) {
    endDragging(card, e);
  } else if (!s.moved && isTap(s, HOLD_MS)) {
    await openModal(card);
  }

  resetPointerState(card, e, s);
}

function startHoldTimer(card, e, s, HOLD_MS) {
  clearHoldTimer(s);
  s.timer = setTimeout(() => {
    if (!s.isPointerDown || s.pointerId !== e.pointerId) return;
    startDrag(card, e, s);
  }, HOLD_MS);
}

function clearHoldTimer(s) {
  if (s.timer) { clearTimeout(s.timer); s.timer = null; }
}

function samePointer(e, s) {
  return s.isPointerDown && e.pointerId === s.pointerId;
}

function exceededThreshold(e, s, t) {
  return Math.abs(e.clientX - s.startX) > t || Math.abs(e.clientY - s.startY) > t;
}

function isTap(s, HOLD_MS) {
  return Date.now() - s.startTime < HOLD_MS;
}

function startDrag(card, e, s) {
  startDragging(card, e);
  clearHoldTimer(s);
  s.dragging = true;
}

function resetPointerState(card, e, s) {
  try { card.releasePointerCapture?.(e.pointerId); } catch { }
  s.dragging = false;
  s.moved = false;
  s.isPointerDown = false;
  s.pointerId = null;

  if (window.innerWidth >= 900) {
    card.style.touchAction = "auto";
    card.style.webkitUserSelect = "auto";
  }
}

async function openModal(card) {
  const id = card.dataset.taskId;
  const task = await loadTask(id);
  await renderTaskModal(id, task);
}




function startDragging(card, e) {
  const rect = card.getBoundingClientRect();
  const originColumn = card.closest(".task_column");
  card.setPointerCapture(e.pointerId);
  card.style.touchAction = "none";
  document.body.classList.add('no-select');
  const ghost = buildGhost(card, rect);
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  currentDrag = { card, ghost, originColumn, offsetX, offsetY };
  document.body.appendChild(ghost);
  buildPlaceholders(originColumn, rect.height);
  card.classList.add("dragging");
}

function moveDragging(card, e) {
  if (!currentDrag) return;

  const { ghost, offsetX, offsetY } = currentDrag;
  ghost.style.left = `${e.clientX - offsetX}px`;
  ghost.style.top = `${e.clientY - offsetY}px`;

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const hoveredCol = el?.closest(".task_column");

  document.querySelectorAll(".task_column").forEach(col => {
    col.classList.toggle("active", col === hoveredCol);
  });
  autoScrollOnEdge(e);
}

function endDragging(card, e) {
  document.body.classList.remove('no-select');
  document.querySelectorAll(".task_column.active").forEach(col => { col.classList.remove("active"); });
  const { originColumn } = currentDrag;
  card.releasePointerCapture(e.pointerId);

  let el = document.elementFromPoint(e.clientX, e.clientY);
  let targetCol = el?.closest(".task_column");

  if (!targetCol) {
    const nearestSpace = findNearestSpace(e.clientX, e.clientY);
    targetCol = nearestSpace?.closest(".task_column");
  }

  if (targetCol && targetCol !== originColumn) {
    const space = targetCol.querySelector(".task_space");
    updateTaskStatus(card.dataset.taskId, space.id);
  }
  deleteDragSettings(card);
}

function buildGhost(card, rect) {
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
  return ghost;
}

function buildPlaceholders(originColumn, height) {
  document.querySelectorAll(".task_column").forEach(col => {
    if (col !== originColumn) {
      const dropPh = document.createElement("div");
      dropPh.className = "drop_placeholder";
      dropPh.style.height = `${height}px`;
      col.querySelector(".task_space")?.appendChild(dropPh);
    }
  });
}

function deleteDragSettings(card) {
  document.querySelectorAll(".drag-ghost").forEach(n => n.remove());
  document.querySelectorAll(".drop_placeholder").forEach(n => n.remove());
  card.classList.remove("dragging");

  if (window.innerWidth >= 900) {
    card.style.touchAction = "auto";
  }
  document.body.style.cursor = "";
  currentDrag = null;
}


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
  const taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, { status: newStatus, updatedAt: Date.now() });
}

function autoScrollOnEdge(e) {
  const SCROLL_ZONE = 80;
  const SCROLL_SPEED = 15;

  const { clientY } = e;
  const vh = window.innerHeight;

  if (clientY < SCROLL_ZONE) {
    window.scrollBy({ top: -SCROLL_SPEED, behavior: "instant" });
  } else if (clientY > vh - SCROLL_ZONE) {
    window.scrollBy({ top: SCROLL_SPEED, behavior: "instant" });
  }
}