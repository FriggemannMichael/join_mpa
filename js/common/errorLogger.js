/**
 * Central Error Logging Service
 * Provides structured error logging with context, offline support, and optional Sentry integration
 * @module errorLogger
 */

import { logError, logWarning, logInfo } from './logger.js';


/**
 * Error severity levels
 * @readonly
 * @enum {string}
 */
const ErrorSeverity = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};


/**
 * Configuration for the error logger
 */
const config = {
  enabled: true,
  useSentry: false, // Set to true when Sentry is configured
  sentryDsn: null,
  useLocalStorage: true,
  maxLocalStorageEntries: 100,
  localStorageKey: 'errorLogs',
  environment: 'production'
};


/**
 * Queue for offline error logs
 * @type {Array<Object>}
 */
let errorQueue = [];


/**
 * Initialize the error logger
 * Loads existing error logs from localStorage if available
 */
function initialize() {
  if (config.useLocalStorage) {
    loadFromLocalStorage();
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}


/**
 * Load error logs from localStorage
 */
function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(config.localStorageKey);
    if (stored) {
      errorQueue = JSON.parse(stored);
      logInfo('ErrorLogger', `Loaded ${errorQueue.length} error logs from localStorage`);
    }
  } catch (error) {
    console.error('Failed to load error logs from localStorage:', error);
  }
}


/**
 * Saves recent error logs to localStorage.
 * Applies size limits and handles quota errors gracefully.
 *
 * @returns {void}
 */
function saveToLocalStorage() {
  if (!config.useLocalStorage) return;
  try {
    persistLogs(getRecentLogs());
  } catch (error) {
    handleStorageError(error);
  }
}


/**
 * Returns the most recent logs limited by config.
 * @returns {Array} Recent error logs.
 */
function getRecentLogs() {
  return errorQueue.slice(-config.maxLocalStorageEntries);
}


/**
 * Writes provided logs to localStorage.
 * @param {Array} logs - Logs to persist.
 */
function persistLogs(logs) {
  localStorage.setItem(config.localStorageKey, JSON.stringify(logs));
}


/**
 * Handles quota or unexpected storage errors.
 * @param {Error} error - Thrown storage error.
 */
function handleStorageError(error) {
  console.error("Failed to save error logs to localStorage:", error);
  if (error.name !== "QuotaExceededError") return;
  errorQueue = errorQueue.slice(-50);
  try {
    persistLogs(errorQueue);
  } catch (retryError) {
    console.error("Failed to save even after clearing logs:", retryError);
  }
}


/**
 * Handle online event - attempt to send queued errors
 */
function handleOnline() {
  logInfo('ErrorLogger', 'Connection restored, attempting to send queued errors');
  if (config.useSentry && errorQueue.length > 0) {
    sendQueuedErrors();
  }
}


/**
 * Handle offline event
 */
function handleOffline() {
  logWarning('ErrorLogger', 'Connection lost, errors will be queued locally');
}


/**
 * Send queued errors to remote service (Sentry)
 */
async function sendQueuedErrors() {
  if (!config.useSentry || !window.navigator.onLine) return;

  const errors = [...errorQueue];
  errorQueue = [];

  for (const errorData of errors) {
    try {
      await sendToSentry(errorData);
    } catch (error) {
      // Re-queue failed errors
      errorQueue.push(errorData);
      logError('ErrorLogger', 'Failed to send queued error', error);
    }
  }

  saveToLocalStorage();
}


/**
 * Send error to Sentry
 * @param {Object} errorData - Error data to send
 * @returns {Promise<void>}
 */
async function sendToSentry(errorData) {
  if (!config.sentryDsn) {
    throw new Error('Sentry DSN not configured');
  }

  // TODO: Implement actual Sentry integration when Sentry is added
  // For now, this is a placeholder that would use Sentry SDK
  logInfo('ErrorLogger', 'Sentry integration not yet implemented', errorData);
}


/**
 * Create error data object with context
 * @param {Error|string} error - The error object or message
 * @param {Object} context - Additional context information
 * @returns {Object} Structured error data
 */
function createErrorData(error, context = {}) {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    severity: context.severity || ErrorSeverity.ERROR,
    module: context.module || 'Unknown',
    user: context.user || null,
    url: window.location.href,
    userAgent: navigator.userAgent,
    environment: config.environment,
    tags: context.tags || {},
    extra: context.extra || {},
    breadcrumbs: context.breadcrumbs || []
  };
  return errorData;
}


/**
 * Captures an error, logs it, persists locally, and optionally sends to Sentry.
 *
 * @param {unknown} error - Any thrown value or Error instance.
 * @param {{ module?: string } } [context={}] - Optional metadata (e.g., source module).
 * @returns {string|null} Returns the generated error id, or null if disabled.
 */
export function capture(error, context = {}) {
  if (!config.enabled) return null;
  const { errorData, errorId } = buildAndLogError(error, context);
  queueAndPersist(errorData);
  maybeSendToSentry(errorData);
  return errorId;
}


/**
 * Creates error payload, assigns id, and writes an error log entry.
 * @param {unknown} error
 * @param {{ module?: string }} context
 * @returns {{ errorData: any, errorId: string }}
 */
function buildAndLogError(error, context) {
  const errorData = createErrorData(error, context);
  const errorId = generateErrorId();
  errorData.id = errorId;
  const module = context.module || "ErrorLogger";
  logError(module, errorData.message, error instanceof Error ? error : errorData);
  return { errorData, errorId };
}


/**
 * Enqueues error and saves recent entries to localStorage.
 * @param {any} errorData
 * @returns {void}
 */
function queueAndPersist(errorData) {
  errorQueue.push(errorData);
  saveToLocalStorage();
}


/**
 * Sends error to Sentry when enabled and online.
 * @param {any} errorData
 * @returns {void}
 */
function maybeSendToSentry(errorData) {
  if (!(config.useSentry && window.navigator.onLine)) return;
  sendToSentry(errorData).catch((err) =>
    logWarning("ErrorLogger", "Failed to send to Sentry", err)
  );
}


/**
 * Capture an exception (alias for capture with ERROR severity)
 * @param {Error} error - The error to capture
 * @param {Object} [context={}] - Additional context information
 * @returns {string} Error ID
 */
export function captureException(error, context = {}) {
  return capture(error, { ...context, severity: ErrorSeverity.ERROR });
}


/**
 * Capture a message (for non-exception errors)
 * @param {string} message - The message to capture
 * @param {Object} [context={}] - Additional context information
 * @returns {string} Error ID
 */
export function captureMessage(message, context = {}) {
  return capture(message, { ...context, severity: context.severity || ErrorSeverity.INFO });
}


/**
 * Add a breadcrumb for error context tracking
 * @param {Object} breadcrumb - Breadcrumb data
 * @param {string} breadcrumb.message - Breadcrumb message
 * @param {string} [breadcrumb.category] - Breadcrumb category
 * @param {string} [breadcrumb.level] - Log level
 * @param {Object} [breadcrumb.data] - Additional data
 */
export function addBreadcrumb(breadcrumb) {
  // This would integrate with Sentry's breadcrumb system
  // For now, just log it
  logInfo('ErrorLogger', 'Breadcrumb added', breadcrumb);
}


/**
 * Set user context for error reporting
 * @param {Object} user - User information
 * @param {string} [user.id] - User ID
 * @param {string} [user.email] - User email
 * @param {string} [user.username] - Username
 */
export function setUser(user) {
  config.currentUser = user;
  logInfo('ErrorLogger', 'User context set', { userId: user.id });
}


/**
 * Configure the error logger
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enabled] - Enable/disable error logging
 * @param {boolean} [options.useSentry] - Enable Sentry integration
 * @param {string} [options.sentryDsn] - Sentry DSN
 * @param {boolean} [options.useLocalStorage] - Enable localStorage fallback
 * @param {number} [options.maxLocalStorageEntries] - Max entries to store
 * @param {string} [options.environment] - Environment name
 *
 * @example
 * errorLogger.configure({
 *   useSentry: true,
 *   sentryDsn: 'https://[key]@sentry.io/[project]',
 *   environment: 'production'
 * });
 */
export function configure(options) {
  Object.assign(config, options);

  if (config.useSentry && config.sentryDsn) {
    logInfo('ErrorLogger', 'Sentry integration configured');
    // TODO: Initialize Sentry SDK here when added
  }
}


/**
 * Get all logged errors from localStorage
 * @returns {Array<Object>} Array of error logs
 */
export function getErrorLogs() {
  return [...errorQueue];
}


/**
 * Clear all error logs from localStorage
 */
export function clearErrorLogs() {
  errorQueue = [];
  if (config.useLocalStorage) {
    localStorage.removeItem(config.localStorageKey);
  }
  logInfo('ErrorLogger', 'Error logs cleared');
}


/**
 * Generate a unique error ID
 * @returns {string} Unique error ID
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}


/**
 * Export error logs as JSON for debugging
 * @returns {string} JSON string of error logs
 */
export function exportLogs() {
  return JSON.stringify(errorQueue, null, 2);
}

initialize();

export { ErrorSeverity };

export default {
  capture,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  configure,
  getErrorLogs,
  clearErrorLogs,
  exportLogs,
  ErrorSeverity
};
