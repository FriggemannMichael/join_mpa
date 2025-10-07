import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initProfilePage();

async function initProfilePage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
}
