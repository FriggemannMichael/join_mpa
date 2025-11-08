/**
 * Example: Migration from logger.js to errorLogger.js
 * This file shows the before/after comparison for integrating errorLogger
 */

// ============================================================================
// BEFORE: Using logger.js
// ============================================================================

/*
import { logError } from "../common/logger.js";

async function deleteSelectedContact() {
  try {
    await removeContactFromFirebase();
    clearContactDetail();
    hideContactOverlay();
    showAlert("deleteContact");
    closeContactDetailOverlay();
  } catch (error) {
    logError("ContactCache", "Error deleting contact", error);
  }
}
*/

// ============================================================================
// AFTER: Using errorLogger.js
// ============================================================================

import errorLogger from "../common/errorLogger.js";

/**
 * Example 1: Enhanced error logging in try-catch
 * Now includes context about the operation and contact ID
 */
async function deleteSelectedContact(contactId) {
  try {
    await executeContactDeletion(contactId);
    finalizeContactDeletion();
  } catch (error) {
    logContactDeletionError(error, contactId);
    showAlert("deleteContactError");
  }
}

/**
 * Removes the contact from persistence.
 * @param {string} contactId
 * @returns {Promise<void>}
 */
async function executeContactDeletion(contactId) {
  await removeContactFromFirebase(contactId);
}

/**
 * Applies UI updates after successful deletion.
 */
function finalizeContactDeletion() {
  clearContactDetail();
  hideContactOverlay();
  showAlert("deleteContact");
  closeContactDetailOverlay();
}

/**
 * Records deletion failures with context.
 * @param {Error} error
 * @param {string} contactId
 */
function logContactDeletionError(error, contactId) {
  errorLogger.capture(error, buildDeletionErrorPayload(contactId));
}

/**
 * Creates deletion error payload metadata.
 * @param {string} contactId
 * @returns {Object}
 */
function buildDeletionErrorPayload(contactId) {
  return {
    module: "ContactCache",
    tags: {
      feature: "contacts",
      action: "delete",
      critical: true,
    },
    extra: {
      contactId,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Example 2: API call with comprehensive error logging
 */
async function loadContactsFromApi() {
  try {
    const response = await fetchContactsResponse();
    return await response.json();
  } catch (error) {
    logContactLoadError(error);
    return [];
  }
}

/**
 * Fetches contacts API response and validates status.
 * @returns {Promise<Response>}
 */
async function fetchContactsResponse() {
  const response = await fetch("/api/contacts");
  if (response.ok) return response;
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

/**
 * Logs API load errors with metadata.
 * @param {Error} error
 */
function logContactLoadError(error) {
  errorLogger.capture(error, buildLoadErrorPayload());
}

/**
 * Builds payload for contact load failures.
 * @returns {Object}
 */
function buildLoadErrorPayload() {
  return {
    module: "ContactCache",
    severity: errorLogger.ErrorSeverity.ERROR,
    tags: { feature: "contacts", action: "load", endpoint: "/api/contacts" },
    extra: {
      endpoint: "/api/contacts",
      method: "GET",
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Example 3: Validation errors (less severe)
 */
function validateContactData(data) {
  if (
    !ensureContactField(
      data,
      "email",
      "Contact email is required",
      buildEmailValidationExtra
    )
  ) {
    return false;
  }
  if (!ensureContactField(data, "name", "Contact name is required"))
    return false;
  return true;
}

/**
 * Ensures a contact field is present or logs a warning.
 * @param {Object} data
 * @param {string} field
 * @param {string} message
 * @param {Function} [extraFactory]
 * @returns {boolean}
 */
function ensureContactField(data, field, message, extraFactory) {
  if (data[field]) return true;
  const extra = extraFactory ? extraFactory(data) : undefined;
  errorLogger.captureMessage(message, buildValidationPayload(field, extra));
  return false;
}

/**
 * Creates validation payload metadata.
 * @param {string} field
 * @param {Object} [extra]
 * @returns {Object}
 */
function buildValidationPayload(field, extra) {
  return {
    module: "ContactCache",
    severity: errorLogger.ErrorSeverity.WARNING,
    tags: {
      feature: "contacts",
      action: "validate",
      field,
    },
    extra: extra ?? undefined,
  };
}

/**
 * Provides sanitized validation extra data for email field.
 * @param {Object} data
 * @returns {Object}
 */
function buildEmailValidationExtra(data) {
  return { data: { name: data.name } };
}

/**
 * Example 4: Using breadcrumbs for debugging flow
 */
async function updateContact(contactId, newData) {
  addUpdateStartBreadcrumb(contactId);
  try {
    validateContactForUpdate(newData);
    await persistContactUpdate(contactId, newData);
    addUpdateSuccessBreadcrumb(contactId);
    return true;
  } catch (error) {
    captureContactUpdateError(error, contactId, newData);
    return false;
  }
}

/**
 * Adds initial breadcrumb for contact updates.
 * @param {string} contactId
 */
function addUpdateStartBreadcrumb(contactId) {
  errorLogger.addBreadcrumb({
    message: "User started contact update",
    category: "user-action",
    level: "info",
    data: { contactId },
  });
}

/**
 * Validates contact data and records breadcrumb.
 * @param {Object} newData
 */
function validateContactForUpdate(newData) {
  errorLogger.addBreadcrumb({
    message: "Validating contact data",
    category: "validation",
    level: "info",
  });
  if (validateContactData(newData)) return;
  throw new Error("Invalid contact data");
}

/**
 * Persists contact update and records breadcrumb.
 * @param {string} contactId
 * @param {Object} newData
 * @returns {Promise<void>}
 */
async function persistContactUpdate(contactId, newData) {
  errorLogger.addBreadcrumb({
    message: "Updating contact in Firebase",
    category: "database",
    level: "info",
    data: { contactId },
  });
  await updateContactInFirebase(contactId, newData);
}

/**
 * Adds success breadcrumb for contact updates.
 * @param {string} contactId
 */
function addUpdateSuccessBreadcrumb(contactId) {
  errorLogger.addBreadcrumb({
    message: "Contact updated successfully",
    category: "database",
    level: "info",
    data: { contactId },
  });
}

/**
 * Captures contact update failures.
 * @param {Error} error
 * @param {string} contactId
 * @param {Object} newData
 */
function captureContactUpdateError(error, contactId, newData) {
  errorLogger.capture(error, buildUpdateErrorPayload(contactId, newData));
}

/**
 * Builds update error payload metadata.
 * @param {string} contactId
 * @param {Object} newData
 * @returns {Object}
 */
function buildUpdateErrorPayload(contactId, newData) {
  return {
    module: "ContactCache",
    tags: {
      feature: "contacts",
      action: "update",
    },
    extra: {
      contactId,
      dataKeys: Object.keys(newData),
    },
  };
}

/**
 * Example 5: Setting user context after login
 */
function onUserLogin(user) {
  errorLogger.setUser({
    id: user.uid,
    email: user.email,
    username: user.displayName,
  });

  errorLogger.captureMessage("User logged in successfully", {
    module: "AuthService",
    severity: errorLogger.ErrorSeverity.INFO,
    tags: {
      feature: "auth",
      action: "login",
    },
  });
}

/**
 * Example 6: Handling multiple error scenarios
 */
async function saveContact(contactData) {
  try {
    ensureContactIsValid(contactData);
    await ensureContactNotDuplicate(contactData);
    await saveContactToFirebase(contactData);
    return { success: true };
  } catch (error) {
    logContactSaveError(error, contactData);
    return { success: false, error: error.message };
  }
}

/**
 * Ensures contact data passes validation.
 * @param {Object} contactData
 */
function ensureContactIsValid(contactData) {
  if (validateContactData(contactData)) return;
  throw new Error("Validation failed");
}

/**
 * Prevents saving duplicate contacts.
 * @param {Object} contactData
 * @returns {Promise<void>}
 */
async function ensureContactNotDuplicate(contactData) {
  const exists = await checkContactExists(contactData.email);
  if (!exists) return;
  logDuplicateContactWarning(contactData.email);
  throw new Error("Contact with this email already exists");
}

/**
 * Records duplicate contact warning message.
 * @param {string} email
 */
function logDuplicateContactWarning(email) {
  errorLogger.captureMessage("Duplicate contact email detected", {
    module: "ContactCache",
    severity: errorLogger.ErrorSeverity.WARNING,
    tags: {
      feature: "contacts",
      action: "save",
      validation: "duplicate",
    },
    extra: {
      email,
    },
  });
}

/**
 * Logs contact save errors with severity.
 * @param {Error} error
 * @param {Object} contactData
 */
function logContactSaveError(error, contactData) {
  const severity = determineContactSaveSeverity(error);
  errorLogger.capture(error, buildSaveErrorPayload(contactData, severity));
}

/**
 * Determines severity for contact save errors.
 * @param {Error} error
 * @returns {string}
 */
function determineContactSaveSeverity(error) {
  return error.message.includes("Validation")
    ? errorLogger.ErrorSeverity.WARNING
    : errorLogger.ErrorSeverity.ERROR;
}

/**
 * Builds payload for contact save errors.
 * @param {Object} contactData
 * @param {string} severity
 * @returns {Object}
 */
function buildSaveErrorPayload(contactData, severity) {
  return {
    module: "ContactCache",
    severity,
    tags: { feature: "contacts", action: "save" },
    extra: buildSaveExtraFlags(contactData),
  };
}

/**
 * Builds extra payload flags for contact save errors.
 * @param {Object} contactData
 * @returns {Object}
 */
function buildSaveExtraFlags(contactData) {
  return {
    hasName: !!contactData.name,
    hasEmail: !!contactData.email,
    hasPhone: !!contactData.phone,
  };
}

/**
 * Example 7: Handling offline scenarios
 */
async function syncContacts() {
  if (!navigator.onLine) return reportOfflineSync();
  try {
    const contacts = await fetchContactsFromServer();
    await storeContactsLocally(contacts);
    return { success: true };
  } catch (error) {
    logSyncError(error);
    return { success: false, reason: "error" };
  }
}

/**
 * Reports offline sync scenarios.
 * @returns {{success:boolean,reason:string}}
 */
function reportOfflineSync() {
  errorLogger.captureMessage("Cannot sync contacts - device is offline", {
    module: "ContactCache",
    severity: errorLogger.ErrorSeverity.INFO,
    tags: {
      feature: "contacts",
      action: "sync",
      offline: true,
    },
  });
  return { success: false, reason: "offline" };
}

/**
 * Logs synchronization errors.
 * @param {Error} error
 */
function logSyncError(error) {
  errorLogger.capture(error, buildSyncErrorPayload());
}

/**
 * Builds payload for synchronization failures.
 * @returns {Object}
 */
function buildSyncErrorPayload() {
  return {
    module: "ContactCache",
    tags: {
      feature: "contacts",
      action: "sync",
      online: true,
    },
  };
}

/**
 * Example 8: Fatal errors (app-breaking)
 */
async function initializeApp() {
  try {
    await initializeFirebase();
    await loadEssentialData();
  } catch (error) {
    logFatalStartupError(error);
    showFatalErrorPage();
  }
}

/**
 * Logs fatal startup failures.
 * @param {Error} error
 */
function logFatalStartupError(error) {
  errorLogger.capture(error, buildFatalErrorPayload());
}

/**
 * Builds payload for fatal errors.
 * @returns {Object}
 */
function buildFatalErrorPayload() {
  return {
    module: "App",
    severity: errorLogger.ErrorSeverity.FATAL,
    tags: { feature: "initialization", action: "startup", critical: true },
    extra: {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
  };
}

// ============================================================================
// Helper functions (placeholders for examples)
// ============================================================================

async function removeContactFromFirebase(contactId) {
  // Implementation
}

async function updateContactInFirebase(contactId, data) {
  // Implementation
}

async function saveContactToFirebase(data) {
  // Implementation
}

async function checkContactExists(email) {
  // Implementation
  return false;
}

async function fetchContactsFromServer() {
  // Implementation
  return [];
}

async function storeContactsLocally(contacts) {
  // Implementation
}

async function initializeFirebase() {
  // Implementation
}

async function loadEssentialData() {
  // Implementation
}

function clearContactDetail() {
  // Implementation
}

function hideContactOverlay() {
  // Implementation
}

function showAlert(type) {
  // Implementation
}

function closeContactDetailOverlay() {
  // Implementation
}

function showFatalErrorPage() {
  // Implementation
}

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

export {
  deleteSelectedContact,
  loadContactsFromApi,
  validateContactData,
  updateContact,
  onUserLogin,
  saveContact,
  syncContacts,
  initializeApp,
};
