/**
 * Add-Task validation with mount/unmount pattern
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
 * Attaches the validation (only active once). Root = document or Modal-Container.
 * Call this function AFTER the Add-Task-HTML is in the DOM.
 * @param {Document|HTMLElement} root - Root element for querySelector
 * @returns {Object} Controller object with updateSubmit() method
 */
export function mountAddTaskValidation(root = document) {
  if (controller) return controller;

  const titleEl = root.querySelector("#taskTitle");
  const dateEl = root.querySelector("#taskDueDate");
  const catEl = root.querySelector("#category");
  const prioGrp = root.querySelector(".priority-buttons");
  const submit = root.querySelector("#taskCreateBtn");

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
      { el: dateEl, events: ["blur", "change"], validateVisible: showDate },
      { el: catEl, events: ["change"], validateVisible: showCat },
    ],
    signal,
  });

  return controller;
}

/**
 * Removes the validation and cleans up event listeners
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
 * Updates the submit button status (Enable/Disable)
 */
export function updateAddTaskValidationButton() {
  return controller?.updateSubmit?.();
}

/**
 * Creates a No-Op controller as fallback
 * @returns {Object} Dummy controller
 */
function makeNoopController() {
  return {
    updateSubmit() {},
    detach() {},
  };
}

/**
 * Attaches the validation for Edit-Task (without category validation)
 * @param {Document|HTMLElement} root - Root element for querySelector
 * @returns {Object} Controller object with updateSubmit() method
 */
export function mountEditTaskValidation(root = document) {
  if (controller) return controller;

  const titleEl = root.querySelector("#taskTitle");
  const dateEl = root.querySelector("#taskDueDate");
  const prioGrp = root.querySelector(".priority-buttons");
  const submit = root.querySelector("#taskSaveBtn");

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
