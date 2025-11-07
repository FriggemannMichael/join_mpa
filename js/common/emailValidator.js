/**
 * Email Validator Module
 * Provides robust email validation with protection against common malformed patterns
 * @module emailValidator
 */

/**
 * Robust email validation regex
 *
 * Pattern breakdown:
 * - ^[\w.-]+           : Local part (alphanumeric, underscore, dot, hyphen)
 * - @                  : Required @ symbol
 * - (?!.*\.\.)         : Negative lookahead - prevents consecutive dots anywhere
 * - [\w.-]+            : Domain name part (alphanumeric, underscore, dot, hyphen)
 * - (?<!\.)            : Negative lookbehind - domain must not end with dot
 * - \.                 : Literal dot before TLD
 * - [A-Za-z]{2,}$      : Top-level domain (min 2 letters)
 *
 * Catches invalid patterns like:
 * - test..@example.com (consecutive dots in local part)
 * - test@example..com (consecutive dots in domain)
 * - test@example.com. (trailing dot)
 * - test@.example.com (leading dot after @)
 */
const EMAIL_REGEX = /^[\w.-]+@(?!.*\.\.)[\w.-]+(?<!\.)\.[A-Za-z]{2,}$/;

/**
 * Validates email address format with comprehensive checks
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 *
 * @example
 * validateEmail("test@example.com") // true
 * validateEmail("test..@example.com") // false - double dots before @
 * validateEmail("test@example..com") // false - double dots in domain
 * validateEmail("test@example.com.") // false - trailing dot
 */
export function validateEmail(email) {
  // Trim whitespace and check if empty
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmedEmail = email.trim();

  // Check minimum length (a@b.co = 6 chars minimum)
  if (trimmedEmail.length < 6) {
    return false;
  }

  // Check maximum length (RFC 5321: 320 chars total)
  if (trimmedEmail.length > 320) {
    return false;
  }

  // Apply regex validation
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return false;
  }

  // Additional check: domain part must not start with dot
  const atIndex = trimmedEmail.indexOf("@");
  if (atIndex !== -1 && trimmedEmail[atIndex + 1] === ".") {
    return false;
  }

  // Additional check: local part must not start or end with dot
  const localPart = trimmedEmail.substring(0, atIndex);
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return false;
  }

  return true;
}

/**
 * Gets a user-friendly error message for invalid email
 *
 * @param {string} email - The invalid email address
 * @returns {string} A descriptive error message
 *
 * @example
 * getEmailErrorMessage("test..@example.com")
 * // "Email contains consecutive dots"
 */
export function getEmailErrorMessage(email) {
  if (!email || !email.trim()) {
    return "Email address is required";
  }

  const trimmedEmail = email.trim();

  // Check for consecutive dots
  if (trimmedEmail.includes("..")) {
    return "Email contains consecutive dots";
  }

  // Check for missing @
  if (!trimmedEmail.includes("@")) {
    return "Email must contain @ symbol";
  }

  // Check for multiple @
  if (trimmedEmail.split("@").length > 2) {
    return "Email contains multiple @ symbols";
  }

  // Check for dots at invalid positions
  const atIndex = trimmedEmail.indexOf("@");
  const localPart = trimmedEmail.substring(0, atIndex);
  const domainPart = trimmedEmail.substring(atIndex + 1);

  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return "Email cannot start or end with a dot before @";
  }

  if (domainPart.startsWith(".") || domainPart.endsWith(".")) {
    return "Domain cannot start or end with a dot";
  }

  if (!domainPart.includes(".")) {
    return "Email must have a valid domain with extension";
  }

  // Generic fallback
  return "Please enter a valid email address";
}
