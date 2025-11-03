/**
 * Profile-Seite für Benutzereinstellungen
 * @module profile
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initProfilePage();

/**
 * Initialisiert die Profile-Seite mit Authentication-Check und Layout-Setup
 */
async function initProfilePage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
}
