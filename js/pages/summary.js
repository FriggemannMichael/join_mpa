import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { getActiveUser } from "../common/authService.js";

initSummaryPage();

async function initSummaryPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  renderGreeting();
}

function renderGreeting() {
  const nameField = document.getElementById("greeting__name");
  const textField = document.getElementById("greeting__text");
  if (!nameField || !textField) return;
  nameField.textContent = resolveUserName();
  textField.textContent = buildGreetingPrefix();
}

function resolveUserName() {
  const user = getActiveUser();
  if (!user) return "Guest";
  if (user.displayName && user.displayName.trim())
    return user.displayName.trim();
  if (user.email) return user.email.split("@")[0];
  return "Guest";
}

function buildGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}
