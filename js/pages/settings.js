/**
 * Settings page for application settings
 * @module settings
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initSettingsPage();

/**
 * Initializes the settings page with authentication check and layout setup
 */
async function initSettingsPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
}
