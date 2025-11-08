/**
 * Calculates key task metrics for the summary dashboard.
 * @param {Array<Object>} tasks - The list of task objects to analyze.
 * @returns {{
 *   todo: number,
 *   done: number,
 *   inProgress: number,
 *   awaitingFeedback: number,
 *   urgent: number,
 *   total: number,
 *   upcomingDeadline: string|null
 * }} The computed metrics.
 */
export function calculateTaskMetrics(tasks) {
  return {
    todo: countTasksByStatus(tasks, "toDo"),
    done: countTasksByStatus(tasks, "done"),
    inProgress: countTasksByStatus(tasks, "inProgress"),
    awaitingFeedback: countTasksByStatus(tasks, "awaitFeedback"),
    urgent: countTasksByPriority(tasks, "urgent"),
    total: tasks.length,
    upcomingDeadline: findUpcomingDeadline(tasks),
  };
}


/**
 * Counts tasks by status.
 * @param {Array<Object>} tasks - Task list.
 * @param {string} status - Status to filter by.
 * @returns {number} Count of matching tasks.
 */
function countTasksByStatus(tasks, status) {
  return tasks.filter((t) => t.status === status).length;
}




/**
 * Counts tasks by priority.
 * @param {Array<Object>} tasks - Task list.
 * @param {string} priority - Priority to filter by.
 * @returns {number} Count of matching tasks.
 */
function countTasksByPriority(tasks, priority) {
  return tasks.filter((t) => t.priority === priority).length;
}


/**
 * Finds the next upcoming task deadline from a list of tasks.
 * Filters out past due dates, sorts by the nearest upcoming one, and formats the result.
 *
 * @param {Array<Object>} tasks - The list of task objects to search through.
 * @param {string} [tasks[].dueDate] - The due date of the task in ISO or date-parsable format.
 * @returns {string|null} The formatted upcoming deadline date, or `null` if none exist.
 */
function findUpcomingDeadline(tasks) {
  const now = new Date();
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  if (upcomingTasks.length === 0) return null;
  return formatDeadlineDate(upcomingTasks[0].dueDate);
}


/**
 * Formats a date string into a readable "Month Day, Year" format (e.g., "November 8, 2025").
 *
 * @param {string} dateString - A date in ISO or any valid date-parsable format.
 * @returns {string} The formatted date string in U.S. English locale.
 */
function formatDeadlineDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}