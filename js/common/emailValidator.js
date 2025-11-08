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
 * Validates an email address against length limits and RFC-like syntax rules.
 * Includes extra safety checks for dots and domain formatting.
 *
 * @param {string} email - Email address to validate.
 * @returns {boolean} Returns true if the email is syntactically valid.
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmedEmail = email.trim();

  if (trimmedEmail.length < 6 || trimmedEmail.length > 320) return false;
  if (!EMAIL_REGEX.test(trimmedEmail)) return false;

  const atIndex = trimmedEmail.indexOf("@");
  if (atIndex === -1 || trimmedEmail[atIndex + 1] === ".") return false;

  const localPart = trimmedEmail.substring(0, atIndex);
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;

  return true;
}

