
/**
 * Sets up touch action behavior for mobile and desktop views.
 * @param {HTMLElement} card - The task card element.
 * @returns {void}
 */
export function setupTouchBehavior(card) {
    const MOBILE_BREAKPOINT = 900;
    const updateTouchAction = () => {
        const isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
        card.style.touchAction = isMobileView ? "none" : "auto";
        card.style.webkitUserSelect = isMobileView ? "none" : "auto";
    };
    updateTouchAction();
    window.addEventListener("resize", updateTouchAction);
}


/**
 * Applies visual drag styles to the card and body.
 * @param {HTMLElement} card - The task card.
 * @param {PointerEvent} e - The pointer event.
 * @returns {void}
 */
export function applyDragStyles(card, e) {
    card.setPointerCapture(e.pointerId);
    card.style.touchAction = "none";
    card.style.cursor = "grabbing";
    document.body.classList.add("no-select");
    document.body.style.cursor = "grabbing";
}


/**
 * Creates and styles a ghost clone of the dragged card.
 * Used for visual feedback during drag operations.
 * @param {HTMLElement} card - The original task card being dragged.
 * @param {DOMRect} rect - The bounding rectangle of the original card.
 * @returns {HTMLElement} The created ghost element.
 */
export function buildGhost(card, rect) {
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
export function buildPlaceholders(originColumn, height) {
    document.querySelectorAll(".task_column").forEach((col) => {
        if (col !== originColumn) {
            const dropPh = document.createElement("div");
            dropPh.className = "drop_placeholder";
            dropPh.style.height = `${height}px`;
            col.querySelector(".task_space")?.appendChild(dropPh);
        }
    });
}


/**
 * Cleans up all visual drag styles from the page.
 * @returns {void}
 */
export function cleanupDragStyles() {
    document.body.classList.remove("no-select");
    document.querySelectorAll(".task_column.active").forEach((col) => {
        col.classList.remove("active");
    });
    document.querySelectorAll(".no_task_to_do").forEach((el) => {
        el.style.display = "";
    });
}


/**
 * Finds the drop target column for the dragged card.
 * @param {PointerEvent} e - The pointer event.
 * @returns {HTMLElement|null} The target column or null.
 */
export function findDropTarget(e) {
  let el = document.elementFromPoint(e.clientX, e.clientY);
  let targetCol = el?.closest(".task_column");

  if (!targetCol) {
    const nearestSpace = findNearestSpace(e.clientX, e.clientY);
    targetCol = nearestSpace?.closest(".task_column");
  }

  return targetCol;
}


/**
 * Finds the nearest task space element to the given pointer position.
 * @param {number} clientX - The pointer's X position in the viewport.
 * @param {number} clientY - The pointer's Y position in the viewport.
 * @returns {HTMLElement|null} The nearest task space element, or null if none found.
 */
function findNearestSpace(clientX, clientY) {
  const spaces = document.querySelectorAll(".task_space");
  let nearest = null;
  let minDist = Infinity;

  spaces.forEach((space) => {
    const dist = calculateDistanceToSpace(space, clientX, clientY);
    if (dist < minDist) {
      minDist = dist;
      nearest = space;
    }
  });

  return nearest;
}


/**
 * Calculates the distance from a point to the center of a space element.
 * @param {HTMLElement} space - The space element.
 * @param {number} clientX - X position.
 * @param {number} clientY - Y position.
 * @returns {number} The distance in pixels.
 */
function calculateDistanceToSpace(space, clientX, clientY) {
  const rect = space.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const movedx = clientX - cx;
  const movedy = clientY - cy;
  return Math.sqrt(movedx * movedx + movedy * movedy);
}


/**
 * Automatically scrolls the window when dragging near screen edges.
 * Triggers smooth upward or downward scrolling based on pointer position.
 * @param {PointerEvent} e - The pointer move event.
 * @returns {void}
 */
export function autoScrollOnEdge(e) {
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


/**
 * Resets the pointer and drag state after interaction ends.
 * Releases pointer capture and restores default touch settings.
 * @param {HTMLElement} card - The task card element being reset.
 * @param {PointerEvent} e - The pointer event triggering the reset.
 * @param {Object} s - The current drag state object.
 * @returns {void}
 */
export function resetPointerState(card, e, s) {
  try {
    card.releasePointerCapture?.(e.pointerId);
    s.dragging = false;
    s.moved = false;
    s.isPointerDown = false;
    s.pointerId = null;

    if (window.innerWidth >= 900) {
      card.style.touchAction = "auto";
      card.style.webkitUserSelect = "auto";
    }
  } catch {}
}