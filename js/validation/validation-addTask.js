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
  const context = getAddTaskContext(root);
  if (!context) return setFallbackController();
  const signal = prepareValidationAbort();
  const handlers = createAddTaskVisibleHandlers(context);
  bindPriorityGroup(context.prioGroup, handlers.showPriority, signal);
  controller = bindForm(
    buildAddTaskFormConfig(context, handlers, signal)
  );
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
  const context = getEditTaskContext(root);
  if (!context) return setFallbackController();
  const signal = prepareValidationAbort();
  const handlers = createEditVisibleHandlers(context);
  bindPriorityGroup(context.prioGroup, handlers.showPriority, signal);
  controller = bindForm(
    buildEditTaskFormConfig(context, handlers, signal)
  );
  return controller;
}

/**
 * Provides add-task DOM references
 * @param {Document|HTMLElement} root
 * @returns {{titleEl:HTMLElement,dateEl:HTMLElement,category:HTMLElement,prioGroup:HTMLElement,submitBtn:HTMLElement}|null}
 */
function getAddTaskContext(root) {
  const titleEl = root.querySelector("#taskTitle");
  const dateEl = root.querySelector("#taskDueDate");
  const category = root.querySelector("#category");
  const prioGroup = root.querySelector(".priority-buttons");
  const submitBtn = root.querySelector("#taskCreateBtn");
  if (!titleEl || !dateEl || !category || !prioGroup || !submitBtn) return null;
  return { titleEl, dateEl, category, prioGroup, submitBtn };
}

/**
 * Provides edit-task DOM references
 * @param {Document|HTMLElement} root
 * @returns {{titleEl:HTMLElement,dateEl:HTMLElement,prioGroup:HTMLElement,submitBtn:HTMLElement}|null}
 */
function getEditTaskContext(root) {
  const titleEl = root.querySelector("#taskTitle");
  const dateEl = root.querySelector("#taskDueDate");
  const prioGroup = root.querySelector(".priority-buttons");
  const submitBtn = root.querySelector("#taskSaveBtn");
  if (!titleEl || !dateEl || !prioGroup || !submitBtn) return null;
  return { titleEl, dateEl, prioGroup, submitBtn };
}

/**
 * Initializes no-op controller fallback
 * @returns {Object}
 */
function setFallbackController() {
  controller = makeNoopController();
  return controller;
}

/**
 * Prepares abort controller for validation listeners
 * @returns {AbortSignal}
 */
function prepareValidationAbort() {
  abortCtrl?.abort?.();
  abortCtrl = new AbortController();
  return abortCtrl.signal;
}

/**
 * Builds visible validation handlers for add-task form
 * @param {{titleEl:HTMLElement,dateEl:HTMLElement,category:HTMLElement,prioGroup:HTMLElement}} context
 * @returns {{showTitle:Function,showDate:Function,showCategory:Function,showPriority:Function}}
 */
function createAddTaskVisibleHandlers(context) {
  return {
    showTitle: () =>
      validateMinLengthEl(context.titleEl, 3, "Title", { show: true }),
    showDate: () =>
      validateDateNotPastEl(context.dateEl, "Due date", { show: true }),
    showCategory: () =>
      validateRequiredEl(context.category, "Category", { show: true }),
    showPriority: () =>
      validatePriorityGroup(context.prioGroup, "Priority", { show: true }),
  };
}

/**
 * Builds visible validation handlers for edit-task form
 * @param {{titleEl:HTMLElement,dateEl:HTMLElement,prioGroup:HTMLElement}} context
 * @returns {{showTitle:Function,showDate:Function,showPriority:Function}}
 */
function createEditVisibleHandlers(context) {
  return {
    showTitle: () =>
      validateMinLengthEl(context.titleEl, 3, "Title", { show: true }),
    showDate: () =>
      validateDateNotPastEl(context.dateEl, "Due date", { show: true }),
    showPriority: () =>
      validatePriorityGroup(context.prioGroup, "Priority", { show: true }),
  };
}

/**
 * Registers priority button validation
 * @param {HTMLElement} group
 * @param {Function} showPriority
 * @param {AbortSignal} signal
 */
function bindPriorityGroup(group, showPriority, signal) {
  group.addEventListener(
    "click",
    (event) => handlePriorityClick(event, showPriority),
    { signal }
  );
}

/**
 * Handles priority clicks to trigger validation
 * @param {MouseEvent} event
 * @param {Function} showPriority
 */
function handlePriorityClick(event, showPriority) {
  if (!event.target.closest(".priority-btn")) return;
  showPriority();
  controller?.updateSubmit?.();
}

/**
 * Builds form config for add-task validation
 * @param {Object} context
 * @param {Object} handlers
 * @param {AbortSignal} signal
 * @returns {Object}
 */
function buildAddTaskFormConfig(context, handlers, signal) {
  return {
    submitBtn: context.submitBtn,
    validateAllSilent: createAddTaskSilentValidator(context),
    fields: [
      { el: context.titleEl, events: ["blur"], validateVisible: handlers.showTitle },
      { el: context.dateEl, events: ["blur", "change"], validateVisible: handlers.showDate },
      { el: context.category, events: ["change"], validateVisible: handlers.showCategory },
    ],
    signal,
  };
}

/**
 * Builds form config for edit-task validation
 * @param {Object} context
 * @param {Object} handlers
 * @param {AbortSignal} signal
 * @returns {Object}
 */
function buildEditTaskFormConfig(context, handlers, signal) {
  return {
    submitBtn: context.submitBtn,
    validateAllSilent: createEditSilentValidator(context),
    fields: [
      { el: context.titleEl, events: ["blur"], validateVisible: handlers.showTitle },
      { el: context.dateEl, events: ["blur"], validateVisible: handlers.showDate },
    ],
    signal,
  };
}

/**
 * Creates silent validator for add-task form
 * @param {{titleEl:HTMLElement,dateEl:HTMLElement,category:HTMLElement,prioGroup:HTMLElement}} context
 * @returns {Function}
 */
function createAddTaskSilentValidator(context) {
  return () => {
    const validTitle = validateMinLengthEl(context.titleEl, 3, "Title", { show: false });
    const validDate = validateDateNotPastEl(context.dateEl, "Due date", { show: false });
    const validCategory = validateRequiredEl(context.category, "Category", { show: false });
    const validPriority = validatePriorityGroup(context.prioGroup, "Priority", { show: false });
    return validTitle && validDate && validCategory && validPriority;
  };
}

/**
 * Creates silent validator for edit-task form
 * @param {{titleEl:HTMLElement,dateEl:HTMLElement,prioGroup:HTMLElement}} context
 * @returns {Function}
 */
function createEditSilentValidator(context) {
  return () => {
    const validTitle = validateMinLengthEl(context.titleEl, 3, "Title", { show: false });
    const validDate = validateDateNotPastEl(context.dateEl, "Due date", { show: false });
    const validPriority = validatePriorityGroup(context.prioGroup, "Priority", { show: false });
    return validTitle && validDate && validPriority;
  };
}
