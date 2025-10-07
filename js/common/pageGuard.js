import { authReady, getActiveUser } from "./authService.js";

export async function guardPage(redirect) {
  await authReady;
  const user = getActiveUser();
  if (user) return true;
  if (redirect) window.location.href = redirect;
  return false;
}

export async function redirectIfAuthenticated(target) {
  await authReady;
  if (getActiveUser()) window.location.href = target;
}
