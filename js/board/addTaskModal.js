import {
    // --- Assignees ---
    populateAssignees,
    buildAssigneeOptions,
    renderAssigneeDropdown,
    bindAssigneeEvents,
    updateAssigneeSelection,
    setAssigneeLoading,

    // --- Priorität ---
    bindPriorityButtons,
    setActivePriority,

    // --- Subtasks ---
    addSubtask,
    renderSubtasks,
    createSubtaskElement,
    deleteSubtask,
    editSubtask,
    saveSubtaskEdit,
    cancelSubtaskEdit,
    clearSubtaskInput,
    initSubtaskInput,

    // --- Form ---
    readValue,
    readActivePriority,
    bindActionButtons,

    // subtasks,
    setSubtasksFrom
} from '../pages/add-task.js';
import { boardTemplates } from "./board-templates.js";
import { closeTaskOverlay, ScrollLock } from "./utils.js"


function renderAddTaskModal() {
    const section = document.getElementById("taskModal");
    section.classList.add("add_task_overlay");

    section.innerHTML = boardTemplates.addTask;
    section.addEventListener("click", (e) => {
        if (e.target.closest("#closeAddTask")) {
            closeTaskOverlay();
        }
    });
}

export async function initAddTask() {
    ScrollLock.set()
    await renderAddTaskModal()
    await populateAssignees();
    bindPriorityButtons();
    bindActionButtons();
    initSubtaskInput();
}





