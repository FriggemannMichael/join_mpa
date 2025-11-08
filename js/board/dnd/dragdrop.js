import {openModal, updateTaskIfMoved} from "./dragdrop.handlers.js"
import {setupTouchBehavior, applyDragStyles, buildGhost, buildPlaceholders,cleanupDragStyles, findDropTarget, autoScrollOnEdge, resetPointerState} from "./dragdrop.ui.js"

let currentDrag = null;


/**
 * Enables drag and pointer interactions for a task card.
 * @param {HTMLElement} card - The task card element to enable interactions on.
 * @returns {void}
 */
export function enableCardInteractions(card) {
  setupTouchBehavior(card);
  bindPointerEvents(card);
}


/**
 * Binds pointer event listeners for drag and drop.
 * @param {HTMLElement} card - The task card element.
 * @returns {void}
 */
function bindPointerEvents(card) {
  const HOLD_MS = 300;
  const MOVE_THRESHOLD = 5;
  const s = initDragState();

  card.addEventListener("pointerdown", (e) => onDown(card, e, s, HOLD_MS));
  card.addEventListener("pointermove", (e) =>
    onMove(card, e, s, MOVE_THRESHOLD)
  );
  card.addEventListener("pointerup", (e) => onUp(card, e, s, HOLD_MS));
  card.addEventListener("pointercancel", (e) => onUp(card, e, s, HOLD_MS));
}


/**
 * Initializes and returns the default drag state object.
 * Used to track pointer position, timing, and drag status.
 * @returns {Object} The initial drag state with default values.
 */
function initDragState() {
  return {
    timer: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    dragging: false,
    moved: false,
    isTouch: false,
    isPointerDown: false,
    pointerId: null,
  };
}


/**
 * Handles the pointer down event on a task card.
 * @param {HTMLElement} card - The task card element being interacted with.
 * @param {PointerEvent} e - The pointer down event.
 * @param {Object} s - The current drag state object.
 * @param {number} HOLD_MS - The hold duration (in ms) before drag starts.
 * @returns {void}
 */
function onDown(card, e, s, HOLD_MS) {
  if (e.pointerType === "mouse" && e.button !== 0) return;

  initializeDragState(e, s);
  handleTouchDown(card, e, s, HOLD_MS);
}


/**
 * Initializes the drag state with pointer event data.
 * @param {PointerEvent} e - The pointer event.
 * @param {Object} s - The drag state object.
 * @returns {void}
 */
function initializeDragState(e, s) {
  s.isTouch = e.pointerType === "touch";
  s.startX = e.clientX;
  s.startY = e.clientY;
  s.startTime = Date.now();
  s.dragging = false;
  s.moved = false;
  s.isPointerDown = true;
  s.pointerId = e.pointerId;
}


/**
 * Handles touch-specific pointer down behavior.
 * @param {HTMLElement} card - The task card element.
 * @param {PointerEvent} e - The pointer event.
 * @param {Object} s - The drag state object.
 * @param {number} HOLD_MS - Hold duration in ms.
 * @returns {void}
 */
function handleTouchDown(card, e, s, HOLD_MS) {
  if (s.isTouch || window.innerWidth < 900) {
    card.setPointerCapture(e.pointerId);
    card.style.touchAction = "none";
  }
  if (s.isTouch) startHoldTimer(card, e, s, HOLD_MS);
}


/**
 * Handles pointer movement during drag interactions.
 * @param {HTMLElement} card - The task card element being dragged.
 * @param {PointerEvent} e - The pointer move event.
 * @param {Object} s - The current drag state object.
 * @param {number} THRESHOLD - Minimum distance in pixels before dragging starts.
 * @returns {void}
 */
function onMove(card, e, s, THRESHOLD) {
  if (!samePointer(e, s)) return;
  if (!s.isTouch && e.buttons === 0) return;
  if (s.isTouch && e.cancelable) e.preventDefault();

  if (!s.dragging) {
    handlePreDragMovement(card, e, s, THRESHOLD);
    return;
  }

  if (e.cancelable) e.preventDefault();
  moveDragging(card, e);
}


/**
 * Handles pointer movement before drag has started.
 * @param {HTMLElement} card - The task card element.
 * @param {PointerEvent} e - The pointer event.
 * @param {Object} s - The drag state object.
 * @param {number} THRESHOLD - Movement threshold.
 * @returns {void}
 */
function handlePreDragMovement(card, e, s, THRESHOLD) {
  if (s.isTouch && exceededThreshold(e, s, THRESHOLD)) {
    s.moved = true;
    clearHoldTimer(s);
    return;
  }
  if (!s.isTouch && exceededThreshold(e, s, THRESHOLD)) {
    startDrag(card, e, s);
  }
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
  if (s.timer) {
    clearTimeout(s.timer);
    s.timer = null;
  }
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
  return (
    Math.abs(e.clientX - s.startX) > t || Math.abs(e.clientY - s.startY) > t
  );
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

  document.querySelectorAll(".no_task_to_do").forEach((el) => {
    el.style.display = "none";
  });
}


/**
 * Starts the visual drag process for a task card.
 * @param {HTMLElement} card - The task card element being dragged.
 * @param {PointerEvent} e - The pointer event that initiated the drag.
 * @returns {void}
 */
function startDragging(card, e) {
  const rect = card.getBoundingClientRect();
  const originColumn = card.closest(".task_column");

  applyDragStyles(card, e);
  createGhostElement(card, e, rect, originColumn);
  buildPlaceholders(originColumn, rect.height);
  card.classList.add("dragging");
}


/**
 * Creates and displays the ghost element for dragging.
 * @param {HTMLElement} card - The task card.
 * @param {PointerEvent} e - The pointer event.
 * @param {DOMRect} rect - The card bounding rectangle.
 * @param {HTMLElement} originColumn - The origin column.
 * @returns {void}
 */
function createGhostElement(card, e, rect, originColumn) {
  const ghost = buildGhost(card, rect);
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  currentDrag = { card, ghost, originColumn, offsetX, offsetY };
  document.body.appendChild(ghost);
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

  document.querySelectorAll(".task_column").forEach((col) => {
    col.classList.toggle("active", col === hoveredCol);
  });
  autoScrollOnEdge(e);
}


/**
 * Ends the drag operation and updates task placement.
 * @param {HTMLElement} card - The dragged task card element.
 * @param {PointerEvent} e - The pointer up event that ends the drag.
 * @returns {void}
 */
function endDragging(card, e) {
  cleanupDragStyles();
  const { originColumn } = currentDrag;
  card.releasePointerCapture(e.pointerId);

  const targetCol = findDropTarget(e);
  updateTaskIfMoved(card, targetCol, originColumn);
  deleteDragSettings(card);
}


/**
 * Cleans up all drag-related elements and resets styles.
 * Removes ghost nodes, placeholders, and restores the card’s default state.
 * @param {HTMLElement} card - The task card element to reset.
 * @returns {void}
 */
function deleteDragSettings(card) {
  document.querySelectorAll(".drag-ghost").forEach((n) => n.remove());
  document.querySelectorAll(".drop_placeholder").forEach((n) => n.remove());

  card.classList.remove("dragging");
  card.style.cursor = "";

  if (window.innerWidth >= 900) {
    card.style.touchAction = "auto";
  }
  document.body.style.cursor = "";
  currentDrag = null;
}