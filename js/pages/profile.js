/**
 * Profile page for user settings
 * @module profile
 */

import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";

initProfilePage();

/**
 * Initializes the profile page with authentication check and layout setup
 */
async function initProfilePage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
}
