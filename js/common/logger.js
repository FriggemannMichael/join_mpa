/**
 * Central logging module for structured application logging
 * @module logger
 */

/**
 * Log levels for different message types
 * @readonly
 * @enum {string}
 */
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};


/**
 * Configuration for the logger
 */
const config = {
  enabled: true,
  minLevel: LogLevel.INFO,
  includeTimestamp: true,
  includeModuleName: true
};


/**
 * Formats a log message with optional metadata
 * @param {string} level - The log level
 * @param {string} module - The module name
 * @param {string} message - The log message
 * @param {*} [data] - Optional data to log
 * @returns {string} Formatted log message
 */
function formatMessage(level, module, message, data) {
  const parts = [];

  if (config.includeTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  parts.push(`[${level}]`);

  if (config.includeModuleName && module) {
    parts.push(`[${module}]`);
  }

  parts.push(message);

  return parts.join(' ');
}


/**
 * Internal logging function
 * @param {string} level - The log level
 * @param {string} module - The module name
 * @param {string} message - The log message
 * @param {*} [data] - Optional data to log
 * @param {Function} consoleFn - The console function to use
 */
function log(level, module, message, data, consoleFn) {
  if (!config.enabled) return;

  const formattedMessage = formatMessage(level, module, message);

  if (data !== undefined) {
    consoleFn(formattedMessage, data);
  } else {
    consoleFn(formattedMessage);
  }
}


/**
 * Logs an error message
 * @param {string} module - The module name
 * @param {string} message - The error message
 * @param {Error|*} [error] - Optional error object or additional data
 * @example
 * logError('AuthService', 'Failed to authenticate user', error);
 */
export function logError(module, message, error) {
  log(LogLevel.ERROR, module, message, error, console.error);
}


/**
 * Logs a warning message
 * @param {string} module - The module name
 * @param {string} message - The warning message
 * @param {*} [data] - Optional additional data
 * @example
 * logWarning('Layout', 'profileIcon not found');
 */
export function logWarning(module, message, data) {
  log(LogLevel.WARN, module, message, data, console.warn);
}


/**
 * Logs an informational message
 * @param {string} module - The module name
 * @param {string} message - The info message
 * @param {*} [data] - Optional additional data
 * @example
 * logInfo('ContactCache', 'Contact list refreshed', { count: 42 });
 */
export function logInfo(module, message, data) {
  log(LogLevel.INFO, module, message, data, console.log);
}


/**
 * Logs a debug message
 * @param {string} module - The module name
 * @param {string} message - The debug message
 * @param {*} [data] - Optional additional data
 * @example
 * logDebug('Validation', 'Field validated', { field: 'email', valid: true });
 */
export function logDebug(module, message, data) {
  log(LogLevel.DEBUG, module, message, data, console.log);
}


/**
 * Configures the logger
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enabled] - Enable/disable logging
 * @param {string} [options.minLevel] - Minimum log level to display
 * @param {boolean} [options.includeTimestamp] - Include timestamp in logs
 * @param {boolean} [options.includeModuleName] - Include module name in logs
 */
export function configureLogger(options) {
  Object.assign(config, options);
}
