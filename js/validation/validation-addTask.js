/**
 * Add-Task Validierung mit mount/unmount Pattern
 * @module validation-addTask
 */

import { bindForm } from "./form-binder.js";
import {
  validateMinLengthEl,
  validateRequiredEl,
  validateDateNotPastEl,
  validatePriorityGroup,
} from "./validation-fields.js";

let controller = null;
let abortCtrl = null;

/**
 * Hängt die Validierung an (nur einmal aktiv). Root = document oder Modal-Container.
 * Rufe diese Funktion NACHDEM das Add-Task-HTML im DOM ist.
 * @param {Document|HTMLElement} root - Root-Element für querySelector
 * @returns {Object} Controller-Objekt mit updateSubmit() Methode
 */
export function mountAddTaskValidation(root = document) {
  if (controller) return controller;

  const titleEl = root.getElementById("taskTitle");
  const dateEl = root.getElementById("taskDueDate");
  const catEl = root.getElementById("category");
  const prioGrp = root.querySelector(".priority-buttons");
  const submit = root.getElementById("taskCreateBtn");

  if (!titleEl || !dateEl || !catEl || !prioGrp || !submit) {
    controller = makeNoopController();
    return controller;
  }

  abortCtrl = new AbortController();
  const signal = abortCtrl.signal;

  const showTitle = () =>
    validateMinLengthEl(titleEl, 3, "Title", { show: true });
  const showDate = () =>
    validateDateNotPastEl(dateEl, "Due date", { show: true });
  const showCat = () => validateRequiredEl(catEl, "Category", { show: true });
  const showPrio = () =>
    validatePriorityGroup(prioGrp, "Priority", { show: true });

  prioGrp.addEventListener(
    "click",
    (e) => {
      if (e.target.closest(".priority-btn")) {
        showPrio();
        controller?.updateSubmit?.();
      }
    },
    { signal }
  );

  const validateAllSilent = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title", { show: false });
    const okDate = validateDateNotPastEl(dateEl, "Due date", { show: false });
    const okCat = validateRequiredEl(catEl, "Category", { show: false });
    const okPrio = validatePriorityGroup(prioGrp, "Priority", { show: false });
    return okTitle && okDate && okCat && okPrio;
  };

  controller = bindForm({
    submitBtn: submit,
    validateAllSilent,
    fields: [
      { el: titleEl, events: ["blur"], validateVisible: showTitle },
      { el: dateEl, events: ["blur"], validateVisible: showDate },
      { el: catEl, events: ["change"], validateVisible: showCat },
    ],
    signal,
  });

  return controller;
}

/**
 * Entfernt die Validierung und räumt Event-Listener auf
 */
export function unmountAddTaskValidation() {
  controller?.detach?.();
  controller = null;

  if (abortCtrl) {
    abortCtrl.abort();
    abortCtrl = null;
  }
}

/**
 * Aktualisiert den Submit-Button Status (Enable/Disable)
 */
export function updateAddTaskValidationButton() {
  return controller?.updateSubmit?.();
}

/**
 * Erstellt einen No-Op Controller als Fallback
 * @returns {Object} Dummy-Controller
 */
function makeNoopController() {
  return {
    updateSubmit() {},
    detach() {},
  };
}

/**
 * Hängt die Validierung für Edit-Task an (ohne Category-Validierung)
 * @param {Document|HTMLElement} root - Root-Element für querySelector
 * @returns {Object} Controller-Objekt mit updateSubmit() Methode
 */
export function mountEditTaskValidation(root = document) {
  if (controller) return controller;

  const titleEl = root.getElementById("taskTitle");
  const dateEl = root.getElementById("taskDueDate");
  const prioGrp = root.querySelector(".priority-buttons");
  const submit = root.getElementById("taskSaveBtn");

  if (!titleEl || !dateEl || !prioGrp || !submit) {
    controller = makeNoopController();
    return controller;
  }

  abortCtrl = new AbortController();
  const signal = abortCtrl.signal;

  const showTitle = () =>
    validateMinLengthEl(titleEl, 3, "Title", { show: true });
  const showDate = () =>
    validateDateNotPastEl(dateEl, "Due date", { show: true });
  const showPrio = () =>
    validatePriorityGroup(prioGrp, "Priority", { show: true });

  prioGrp.addEventListener(
    "click",
    (e) => {
      if (e.target.closest(".priority-btn")) {
        showPrio();
        controller?.updateSubmit?.();
      }
    },
    { signal }
  );

  const validateAllSilent = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title", { show: false });
    const okDate = validateDateNotPastEl(dateEl, "Due date", { show: false });
    const okPrio = validatePriorityGroup(prioGrp, "Priority", { show: false });
    return okTitle && okDate && okPrio;
  };

  controller = bindForm({
    submitBtn: submit,
    validateAllSilent,
    fields: [
      { el: titleEl, events: ["blur"], validateVisible: showTitle },
      { el: dateEl, events: ["blur"], validateVisible: showDate },
    ],
    signal,
  });

  return controller;
}
