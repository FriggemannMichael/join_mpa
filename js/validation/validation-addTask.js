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
  controller = bindForm(buildAddTaskFormConfig(context, handlers, signal));
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
  controller = bindForm(buildEditTaskFormConfig(context, handlers, signal));
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
 * Builds form config for the "Add Task" form, defining
 * validation logic, field events, and silent validator.
 *
 * @param {Object} context - Contains form elements and submit button.
 * @param {Object} handlers - Visible validation handlers.
 * @param {AbortSignal} [signal] - Optional abort signal.
 * @returns {Object} Config object for bindForm.
 */
function buildAddTaskFormConfig(context, handlers, signal) {
  const fields = buildAddTaskFields(context, handlers);
  return {
    submitBtn: context.submitBtn,
    validateAllSilent: createAddTaskSilentValidator(context),
    fields,
    signal,
  };
}

/**
 * Builds field configuration for Add Task form.
 * @param {Object} c - Context with form elements.
 * @param {Object} h - Validation handler functions.
 * @returns {Array<Object>} Field configuration list.
 */
function buildAddTaskFields(c, h) {
  return [
    { el: c.titleEl, events: ["blur"], validateVisible: h.showTitle },
    { el: c.dateEl, events: ["blur", "change"], validateVisible: h.showDate },
    { el: c.category, events: ["change"], validateVisible: h.showCategory },
  ];
}


/**
 * Builds form config for the Edit Task form.
 * @param {EditTaskContext} context - Form elements and submit button.
 * @param {EditTaskHandlers} handlers - Visible validation handlers.
 * @param {AbortSignal} [signal] - Optional abort signal.
 * @returns {{submitBtn:HTMLElement, validateAllSilent:() => boolean, fields:Array, signal?:AbortSignal}}
 */
function buildEditTaskFormConfig(context, handlers, signal) {
  const fields = buildEditTaskFields(context, handlers);
  return {
    submitBtn: context.submitBtn,
    validateAllSilent: createEditSilentValidator(context),
    fields,
    signal,
  };
}


/**
 * Builds field configuration for Edit Task.
 * @param {EditTaskContext} c - Context with form elements.
 * @param {EditTaskHandlers} h - Visible validators for fields.
 * @returns {{el:HTMLElement, events:string[], validateVisible:() => boolean}[]}
 */
function buildEditTaskFields(c, h) {
  return [
    { el: c.titleEl, events: ["blur"], validateVisible: h.showTitle },
    { el: c.dateEl, events: ["blur"], validateVisible: h.showDate },
  ];
}


/**
 * Creates a silent validator for the Add Task form.
 * Runs all field validations without showing visible messages.
 *
 * @param {Object} context - References to all task form elements.
 * @param {HTMLElement} context.titleEl
 * @param {HTMLElement} context.dateEl
 * @param {HTMLElement} context.category
 * @param {HTMLElement} context.prioGroup
 * @returns {() => boolean} Function that validates all fields silently.
 */
function createAddTaskSilentValidator(context) {
  return () => {
    const v = (fn) => fn(); // shorthand runner
    return (
      v(() => validateMinLengthEl(context.titleEl, 3, "Title", { show: false })) &&
      v(() => validateDateNotPastEl(context.dateEl, "Due date", { show: false })) &&
      v(() => validateRequiredEl(context.category, "Category", { show: false })) &&
      v(() => validatePriorityGroup(context.prioGroup, "Priority", { show: false }))
    );
  };
}


/**
 * Creates silent validator for edit-task form
 * @param {{titleEl:HTMLElement,dateEl:HTMLElement,prioGroup:HTMLElement}} context
 * @returns {Function}
 */
function createEditSilentValidator(context) {
  return () => {
    const validTitle = validateMinLengthEl(context.titleEl, 3, "Title", {
      show: false,
    });
    const validDate = validateDateNotPastEl(context.dateEl, "Due date", {
      show: false,
    });
    const validPriority = validatePriorityGroup(context.prioGroup, "Priority", {
      show: false,
    });
    return validTitle && validDate && validPriority;
  };
}
