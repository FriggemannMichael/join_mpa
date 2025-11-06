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

  const $ = (sel) => (root.querySelector ? root.querySelector(sel) : document.querySelector(sel));
  const titleEl = root.getElementById ? root.getElementById("taskTitle") : byId("taskTitle");
  const dateEl  = root.getElementById ? root.getElementById("taskDueDate") : byId("taskDueDate");
  const catEl   = root.getElementById ? root.getElementById("category") : byId("category");
  const prioGrp = $(".priority-buttons");
  const submit  = root.getElementById ? root.getElementById("taskCreateBtn") : byId("taskCreateBtn");

  if (!titleEl || !dateEl || !catEl || !prioGrp || !submit) {
    controller = makeNoopController();
    return controller;
  }

  abortCtrl = new AbortController();
  const signal = abortCtrl.signal;

  const showTitle = () => validateMinLengthEl(titleEl, 3, "Title",    { show: true });
  const showDate  = () => validateDateNotPastEl(dateEl,  "Due date",  { show: true });
  const showCat   = () => validateRequiredEl(catEl,      "Category",  { show: true });
  const showPrio  = () => validatePriorityGroup(prioGrp, "Priority",  { show: true });

  prioGrp.addEventListener("click", (e) => {
    if (e.target.closest(".priority-btn")) {
      showPrio();
      controller?.updateSubmit?.();
    }
  }, { signal });

  const validateAllSilent = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title",    { show: false });
    const okDate  = validateDateNotPastEl(dateEl,  "Due date",  { show: true });
    const okCat   = validateRequiredEl(catEl,      "Category",  { show: true });
    const okPrio  = validatePriorityGroup(prioGrp, "Priority",  { show: true });
    return okTitle && okDate && okCat && okPrio;
  };

  controller = bindForm({
    submitBtn: submit,
    validateAllSilent,
    fields: [
      { el: titleEl, events: ["blur"],   validateVisible: showTitle },
      { el: dateEl,  events: ["blur"],   validateVisible: showDate  },
      { el: catEl,   events: ["change"], validateVisible: showCat   },
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
    updateSubmit() {},
    detach() {},
  };
}
