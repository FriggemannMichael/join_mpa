import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initSettingsPage();

async function initSettingsPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
}
