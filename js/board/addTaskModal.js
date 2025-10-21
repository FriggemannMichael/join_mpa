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


function renderAddTaskModal() {
    const section = document.getElementById("taskModal");
    section.classList.add("add_task_overlay");

    section.innerHTML = boardTemplates.addTask;
}

export async function initAddTask() {
    await renderAddTaskModal()
    await populateAssignees();
    bindPriorityButtons();
    bindActionButtons();
    initSubtaskInput();
}



