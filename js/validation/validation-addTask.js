import { byId } from "./valdiation-ui.js";
import { bindForm } from "./form-binder.js";
import {
  validateMinLengthEl,
  validateRequiredEl,
  validateDateNotPastEl,
  validatePriorityGroup,
} from "./validation-fields.js";


export function initAddTaskValidation() {
  const titleEl = byId("taskTitle");
  const dateEl  = byId("taskDueDate");
  const catEl   = byId("category");
  const prioGrp = document.querySelector(".priority-buttons");
  const submit  = byId("taskCreateBtn");

  const showTitle = () => validateMinLengthEl(titleEl, 3, "Title", { show: true });
  const showDate  = () => validateDateNotPastEl(dateEl, "Due date", { show: true });
  const showCat   = () => validateRequiredEl(catEl, "Category", { show: true });

  const validateAllSilent = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title", { show: false });
    const okDate  = validateDateNotPastEl(dateEl, "Due date", { show: true });
    const okCat   = validateRequiredEl(catEl, "Category", { show: true });
    const okPrio  = validatePriorityGroup(prioGrp, "Priority", { show: true });
    return okTitle && okDate && okCat && okPrio;
  };

  return bindForm({
    submitBtn: submit,
    validateAllSilent,
    fields: [
      { el: titleEl, events: ["blur"],    validateVisible: showTitle },
      { el: dateEl,  events: ["blur"],    validateVisible: showDate  },
      { el: catEl,   events: ["change"],  validateVisible: showCat   },
    ],
  });
}

export const controller = initAddTaskValidation();
