import { byId } from "./valdiation-ui.js";
import { bindForm } from "./form-binder.js";
import {
  validateMinLengthEl,
  validateRequiredEl,
  validateDateNotPastEl,
  validatePriorityGroup,
} from "./validation-fields.js";

// Globaler Controller, der von überall aktualisiert werden kann
export let controller = null;

export function initAddTaskValidation() {
  const titleEl = byId("taskTitle");
  const dateEl = byId("taskDueDate");
  const catEl = byId("category");
  const prioGrp = document.querySelector(".priority-buttons");
  const submit = byId("taskCreateBtn");

  if (!titleEl || !dateEl || !catEl || !submit) {
    console.warn(
      "initAddTaskValidation: Erforderliche Elemente nicht gefunden"
    );
    return null;
  }

  const showTitle = () =>
    validateMinLengthEl(titleEl, 3, "Title", { show: true });
  const showDate = () =>
    validateDateNotPastEl(dateEl, "Due date", { show: true });
  const showCat = () => validateRequiredEl(catEl, "Category", { show: true });

  const validateAllSilent = () => {
    const okTitle = validateMinLengthEl(titleEl, 3, "Title", { show: false });
    const okDate = validateDateNotPastEl(dateEl, "Due date", { show: true });
    const okCat = validateRequiredEl(catEl, "Category", { show: true });
    const okPrio = validatePriorityGroup(prioGrp, "Priority", { show: true });
    return okTitle && okDate && okCat && okPrio;
  };

  const newController = bindForm({
    submitBtn: submit,
    validateAllSilent,
    fields: [
      { el: titleEl, events: ["blur"], validateVisible: showTitle },
      { el: dateEl, events: ["blur"], validateVisible: showDate },
      { el: catEl, events: ["change"], validateVisible: showCat },
    ],
  });

  // Aktualisiere den globalen Controller
  controller = newController;
  return newController;
}
