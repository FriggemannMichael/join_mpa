/**
 * Settings-Seite für Anwendungseinstellungen
 * @module settings
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initSettingsPage();

/**
 * Initialisiert die Settings-Seite mit Authentication-Check und Layout-Setup
 */
async function initSettingsPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
}
