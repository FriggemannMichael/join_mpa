
import { renderTaskModal } from "../modals/taskModal.view.js"
import { db } from "../../common/firebase.js";
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { loadTask } from "../services/tasks.repo.js"


let currentDrag = null;


/**
 * Enables drag and pointer interactions for a task card.
 * Sets up touch behavior and pointer event listeners for drag and drop.
 * @param {HTMLElement} card - The task card element to enable interactions on.
 * @returns {void}
 */
export function enableCardInteractions(card) {
  const HOLD_MS = 300;
  const MOVE_THRESHOLD = 5;
  const s = initDragState();

  card.addEventListener("pointerdown", (e) => onDown(card, e, s, HOLD_MS));
  card.addEventListener("pointermove", (e) => onMove(card, e, s, MOVE_THRESHOLD), { passive: false });
  card.addEventListener("pointerup",    (e) => onUp(card, e, s, HOLD_MS));
  card.addEventListener("pointercancel",(e) => onUp(card, e, s, HOLD_MS));
}


/**
 * Initializes and returns the default drag state object.
 * Used to track pointer position, timing, and drag status.
 * @returns {Object} The initial drag state with default values.
 */
function initDragState() {
  return {
    timer: null,
    startX: 0, startY: 0, startTime: 0,
    dragging: false, moved: false,
    isTouch: false, isPointerDown: false,
    pointerId: null,
  };
}


/**
 * Handles the pointer down event on a task card.
 * Initializes drag state and starts the hold timer for touch interactions.
 * @param {HTMLElement} card - The task card element being interacted with.
 * @param {PointerEvent} e - The pointer down event.
 * @param {Object} s - The current drag state object.
 * @param {number} HOLD_MS - The hold duration (in ms) before drag starts.
 * @returns {void}
 */
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

  // Kein globales Touch-Blocking hier – Scrollen bleibt möglich
  if (s.isTouch) startHoldTimer(card, e, s, HOLD_MS);
}


/**
 * Handles pointer movement during drag interactions.
 * Starts or updates dragging once the movement threshold is exceeded.
 * @param {HTMLElement} card - The task card element being dragged.
 * @param {PointerEvent} e - The pointer move event.
 * @param {Object} s - The current drag state object.
 * @param {number} THRESHOLD - Minimum distance in pixels before dragging starts.
 * @returns {void}
 */
function onMove(card, e, s, THRESHOLD) {
  if (!samePointer(e, s)) return;
  if (!s.isTouch && e.buttons === 0) return;

  const moved = exceededThreshold(e, s, THRESHOLD);

  if (!s.dragging) {
    // Touch: Scroll erlauben, kein preventDefault
    if (s.isTouch && moved) {
      s.moved = true;
      clearHoldTimer(s);
      return;
    }
    // Maus: direktes Draggen nach Schwellwert
    if (!s.isTouch && moved) {
      startDrag(card, e, s);
      if (e.cancelable) e.preventDefault();
      return;
    }
    return;
  }

  // Nur während Drag native Gesten blockieren
  if (e.cancelable) e.preventDefault();
  moveDragging(card, e);
}


/**
 * Handles the pointer up event after a drag or tap.
 * Ends dragging or opens the modal if a quick tap is detected.
 * @async
 * @param {HTMLElement} card - The task card element that was interacted with.
 * @param {PointerEvent} e - The pointer up event.
 * @param {Object} s - The current drag state object.
 * @param {number} HOLD_MS - Hold duration used to distinguish between tap and drag.
 * @returns {Promise<void>}
 */
async function onUp(card, e, s, HOLD_MS) {
  clearHoldTimer(s);

  if (s.dragging) {
    endDragging(card, e);
  } else if (!s.moved && isTap(s, HOLD_MS)) {
    await openModal(card);
  }

  resetPointerState(card, e, s);
}


/**
 * Starts a hold timer to trigger dragging after a delay.
 * Used for touch interactions before initiating a drag.
 * @param {HTMLElement} card - The task card element being interacted with.
 * @param {PointerEvent} e - The pointer down event.
 * @param {Object} s - The current drag state object.
 * @param {number} HOLD_MS - Delay in milliseconds before starting drag.
 * @returns {void}
 */
function startHoldTimer(card, e, s, HOLD_MS) {
  clearHoldTimer(s);
  s.timer = setTimeout(() => {
    if (!s.isPointerDown || s.pointerId !== e.pointerId) return;
    startDrag(card, e, s);
  }, HOLD_MS);
}


/**
 * Clears the active hold timer in the drag state.
 * @param {Object} s - The current drag state object.
 * @returns {void}
 */
function clearHoldTimer(s) {
  if (s.timer) { clearTimeout(s.timer); s.timer = null; }
}


/**
 * Checks if the event belongs to the same active pointer.
 * @param {PointerEvent} e - The current pointer event.
 * @param {Object} s - The current drag state object.
 * @returns {boolean} True if the pointer IDs match, otherwise false.
 */
function samePointer(e, s) {
  return s.isPointerDown && e.pointerId === s.pointerId;
}


/**
 * Checks if the pointer movement exceeds the defined threshold.
 * @param {PointerEvent} e - The current pointer event.
 * @param {Object} s - The current drag state object.
 * @param {number} t - The movement threshold in pixels.
 * @returns {boolean} True if the movement exceeds the threshold.
 */
function exceededThreshold(e, s, t) {
  return Math.abs(e.clientX - s.startX) > t || Math.abs(e.clientY - s.startY) > t;
}


/**
 * Determines if the pointer interaction should be treated as a tap.
 * @param {Object} s - The current drag state object.
 * @param {number} HOLD_MS - The hold duration in milliseconds.
 * @returns {boolean} True if the press was shorter than the hold threshold.
 */
function isTap(s, HOLD_MS) {
  return Date.now() - s.startTime < HOLD_MS;
}


/**
 * Starts the drag operation for the given card.
 * Clears any active timers and updates the drag state.
 * @param {HTMLElement} card - The task card element being dragged.
 * @param {PointerEvent} e - The initiating pointer event.
 * @param {Object} s - The current drag state object.
 * @returns {void}
 */
function startDrag(card, e, s) {
  startDragging(card, e);
  clearHoldTimer(s);
  s.dragging = true;

  card.style.touchAction = "none";
  card.style.webkitUserSelect = "none";

  document.querySelectorAll(".no_task_to_do").forEach(el => {
    el.style.display = "none";
  });
}


/**
 * Resets the pointer and drag state after interaction ends.
 * Releases pointer capture and restores default touch settings.
 * @param {HTMLElement} card - The task card element being reset.
 * @param {PointerEvent} e - The pointer event triggering the reset.
 * @param {Object} s - The current drag state object.
 * @returns {void}
 */
function resetPointerState(card, e, s) {
  card.releasePointerCapture?.(e.pointerId);
  s.dragging = false;
  s.moved = false;
  s.isPointerDown = false;
  s.pointerId = null;

  card.style.removeProperty("touch-action");
  card.style.removeProperty("webkit-user-select");
}


/**
 * Opens the task modal for the given card.
 * Loads the task data and renders the modal view.
 * @async
 * @param {HTMLElement} card - The task card element that was tapped or clicked.
 * @returns {Promise<void>}
 */
async function openModal(card) {
  const id = card.dataset.taskId;
  const task = await loadTask(id);
  await renderTaskModal(id, task);
}


/**
 * Starts the visual drag process for a task card.
 * Creates a ghost element, sets initial offsets, and prepares placeholders.
 * @param {HTMLElement} card - The task card element being dragged.
 * @param {PointerEvent} e - The pointer event that initiated the drag.
 * @returns {void}
 */
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


/**
 * Updates the dragged card's ghost position during movement.
 * Highlights the hovered column and triggers edge scrolling if needed.
 * @param {HTMLElement} card - The task card element being dragged.
 * @param {PointerEvent} e - The pointer move event.
 * @returns {void}
 */
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


/**
 * Ends the drag operation and updates task placement.
 * Determines the target column, updates task status, and cleans up drag state.
 * @param {HTMLElement} card - The dragged task card element.
 * @param {PointerEvent} e - The pointer up event that ends the drag.
 * @returns {void}
 */
function endDragging(card, e) {
  document.body.classList.remove('no-select');
  document.querySelectorAll(".task_column.active").forEach(col => { col.classList.remove("active"); });
  document.querySelectorAll(".no_task_to_do").forEach(el => { el.style.display = ""; });
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


/**
 * Creates and styles a ghost clone of the dragged card.
 * Used for visual feedback during drag operations.
 * @param {HTMLElement} card - The original task card being dragged.
 * @param {DOMRect} rect - The bounding rectangle of the original card.
 * @returns {HTMLElement} The created ghost element.
 */
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


/**
 * Builds and inserts drop placeholders in all task columns.
 * Creates visual targets for drag-and-drop except in the origin column.
 * @param {HTMLElement} originColumn - The column where the drag started.
 * @param {number} height - The height of the dragged card used for placeholders.
 * @returns {void}
 */
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


/**
 * Cleans up all drag-related elements and resets styles.
 * Removes ghost nodes, placeholders, and restores the card’s default state.
 * @param {HTMLElement} card - The task card element to reset.
 * @returns {void}
 */
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



/**
 * Finds the nearest task space element to the given pointer position.
 * Calculates distances to all spaces and returns the closest one.
 * @param {number} clientX - The pointer's X position in the viewport.
 * @param {number} clientY - The pointer's Y position in the viewport.
 * @returns {HTMLElement|null} The nearest task space element, or null if none found.
 */
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


/**
 * Updates the status of a task in the database.
 * Sets the new status and updates the timestamp.
 * @async
 * @param {string} taskId - The ID of the task to update.
 * @param {string} newStatus - The new status value for the task.
 * @returns {Promise<void>}
 */
export async function updateTaskStatus(taskId, newStatus) {
  const taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, { status: newStatus, updatedAt: Date.now() });
}


/**
 * Automatically scrolls the window when dragging near screen edges.
 * Triggers smooth upward or downward scrolling based on pointer position.
 * @param {PointerEvent} e - The pointer move event.
 * @returns {void}
 */
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