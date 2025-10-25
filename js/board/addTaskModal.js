import { populateAssignees, bindPriorityButtons, initSubtaskInput, bindActionButtons } from '../pages/add-task.js';
import { boardTemplates } from "./board-templates.js";
import { closeTaskOverlay, ScrollLock } from "./utils.js"


/**
 * Renders the "Add Task" modal using the predefined board template.
 * Injects the modal into the DOM and binds the close button event.
 * @returns {void}
 */
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


/**
 * Initializes the "Add Task" modal and its interactive components.
 * Locks scrolling, renders the modal, and binds all related handlers.
 * @async
 * @returns {Promise<void>}
 */
export async function initAddTask() {
    ScrollLock.set()
    await renderAddTaskModal()
    await populateAssignees();
    bindPriorityButtons();
    bindActionButtons();
    initSubtaskInput();
}





