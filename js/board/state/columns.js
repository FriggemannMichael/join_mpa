
/**
 * Defines board columns and their UI settings.
 * @returns {Record<string, {id: string, emptyText: string}>}
 */
export function buildColumnsConfig() {
  return {
    toDo:        { id: "toDo",        emptyText: "No task To do" },
    inProgress:  { id: "inProgress",  emptyText: "No task in progress" },
    awaitFeedback:{ id: "awaitFeedback", emptyText: "No task await Feedback" },
    done:        { id: "done",        emptyText: "No task Done" },
  };
}


/**
 * Groups all tasks by their status property.
 * Returns an object where each key is a status and its value is an array of tasks.
 * @param {Array<Object>} tasks - Array of task objects to group.
 * @returns {Object<string, Array<Object>>} An object mapping each status to its task list.
 */
export function groupTasksByStatus(tasks) {
  return tasks.reduce((acc, task) => {
    const status = task.status || "toDo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {});
}


