/**
 * @module alertService
 * @description Global alert service for displaying feedback messages to users.
 */

import { icons } from "./svg-template.js";

/**
 * Displays a styled alert message to the user.
 * Creates a temporary DOM element with animation that auto-removes after specified duration.
 *
 * @param {string} type - Alert type: 'created', 'updated', 'deleted', 'signUp', 'createContact', 'error'.
 * @param {number} [ms=1800] - Duration before the alert disappears in milliseconds.
 * @param {string} [customMessage] - Optional custom message to override default text.
 * @param {Function} [onComplete] - Optional callback function to execute after alert is removed.
 * @returns {void}
 */
export function showAlert(
  type,
  ms = 1800,
  customMessage = null,
  onComplete = null
) {
  const alert = document.createElement("div");
  alert.className = "alert task-added";
  document.body.append(alert);

  const texts = {
    created: `Task added to board ${icons.board} `,
    updated: "Task updated successfully",
    deleted: "Task deleted from board",
    signUp: "You Signed Up successfully",
    createContact: "Contact successfully created",
    error: "An error occurred",
  };

  alert.innerHTML = customMessage || texts[type] || texts.error;
  if (type === "created") alert.classList.add("center");
  if (type === "error") alert.classList.add("error");

  requestAnimationFrame(() => alert.classList.add("visible"));

  clearTimeout(alert.t);
  alert.t = setTimeout(() => {
    alert.classList.remove("visible", "center");
    alert.remove();
    if (onComplete) onComplete();
  }, ms);
}
