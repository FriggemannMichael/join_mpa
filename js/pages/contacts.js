import { bootLayout } from "../common/layout.js";
import { guardPage } from "../common/pageGuard.js";
import { loadAndRenderContacts } from "../contacts/repo.js";
import { bindModalControls } from "../contacts/modals.js";
import { closeContactDetailOverlay, initEditDeleteRespMenu, insertCloseBtn } from "../contacts/overlay.js";


/**
 * Initializes the Contacts page.
 * Checks authentication, loads layout and contact data,
 * and binds all modal and interaction controls.
 * 
 * @async
 * @returns {Promise<void>} Resolves when the contacts page is fully initialized.
 */
async function initContactsPage() {
  const allowed = await guardPage("./index.html");
  if (!allowed) return;
  await bootLayout();
  await loadAndRenderContacts();
  bindModalControls();
  document.querySelector(".contact-detail-section .close-detail")
    ?.addEventListener("click", closeContactDetailOverlay);
  initEditDeleteRespMenu();
  insertCloseBtn();
}

initContactsPage();
