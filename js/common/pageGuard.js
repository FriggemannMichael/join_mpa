/**
 * Page Guard service for authentication-based access control
 * @module pageGuard
 */

import { authReady, getActiveUser } from "./authService.js";

/**
 * Protects a page from unauthenticated access
 * @param {string} redirect URL for redirection when authentication is missing
 * @returns {Promise<boolean>} True if user is authenticated
 */
export async function guardPage(redirect) {
  await authReady;
  const user = getActiveUser();
  if (user) return true;
  if (redirect) window.location.href = redirect;
  return false;
}

/**
 * Redirects authenticated users to a target page
 * @param {string} target Target URL for redirection
 */
export async function redirectIfAuthenticated(target) {
  await authReady;
  if (getActiveUser()) window.location.href = target;
}
