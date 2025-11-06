// validation/validation-addTask.js
import { byId } from "./valdiation-ui.js";
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

  const showTitle = () => validateMinLengthEl(titleEl, 3, "Title", { show: true });
  const showDate = () => validateDateNotPastEl(dateEl, "Due date", { show: true });
  const showCat = () => validateRequiredEl(catEl, "Category", { show: true });
  const showPrio = () => validatePriorityGroup(prioGrp, "Priority", { show: true });

  prioGrp.addEventListener("click", (e) => {
    if (e.target.closest(".priority-btn")) {
      showPrio();
      controller?.updateSubmit?.();
    }
  }, { signal });

  const validateAllSilent = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title", { show: false });
    const okDate = validateDateNotPastEl(dateEl, "Due date", { show: true });
    const okCat = validateRequiredEl(catEl, "Category", { show: true });
    const okPrio = validatePriorityGroup(prioGrp, "Priority", { show: true });
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


export function unmountAddTaskValidation() {
  controller?.detach?.();
  controller = null;

  if (abortCtrl) {
    abortCtrl.abort();
    abortCtrl = null;
  }
}

export function updateAddTaskValidationButton() {
  return controller?.updateSubmit?.();
}

function makeNoopController() {
  return {
    updateSubmit() { },
    detach() { },
  };
}



export function mountEditTaskValidation() {
  if (controller) return controller;

  const titleEl = document.getElementById("taskTitle");
  const dateEl = document.getElementById("taskDueDate");
  const prioGrp = document.querySelector(".priority-buttons");
  const submit = document.getElementById("taskSaveBtn") ;

  if (!titleEl || !dateEl || !prioGrp || !submit) {
    controller = makeNoopController();
    return controller;
  }

  abortCtrl = new AbortController();
  const signal = abortCtrl.signal;


  const showTitle = () => validateMinLengthEl(titleEl, 3, "Title", { show: true });
  const showDate = () => validateDateNotPastEl(dateEl, "Due date", { show: true });

  const validateAll = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title", { show: false });
    const okDate = validateDateNotPastEl(dateEl, "Due date", { show: true });
    const okPrio = validatePriorityGroup(prioGrp, "Priority", { show: true });
    return okTitle && okDate && okPrio;
  };

  controller = bindForm({
    submitBtn: submit,
    validateAllSilent: validateAll,
    fields: [
      { el: titleEl, events: ["blur"], validateVisible: showTitle },
      { el: dateEl, events: ["blur"], validateVisible: showDate },
    ],
    signal,
  });

  return controller;
}