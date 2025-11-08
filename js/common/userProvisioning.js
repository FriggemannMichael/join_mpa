import { auth } from "./firebase.js";
import { loadFirebaseDatabase } from "./database.js";

const RETRY_LIMIT = 3;
const RETRY_DELAY = 250;
const activeUids = new Set();


/**
 * Provisions the currently authenticated user in the database.
 * Ensures corresponding user and contact entries exist, avoiding duplicate provisioning.
 *
 * @async
 * @returns {Promise<void>} Resolves when the user provisioning process is complete.
 */
export async function provisionActiveUser() {
  const user = auth.currentUser;
  if (!canProvision(user)) return;
  activeUids.add(user.uid);
  try {
    const db = await loadFirebaseDatabase();
    await ensureUserEntry(user, db);
    await ensureContactEntry(user, db);
  } finally {
    activeUids.delete(user.uid);
  }
}


/**
 * Determines whether the given user can be provisioned in the database.
 * Prevents provisioning for guest users or users already being processed.
 *
 * @param {?Object} user - The user object to check, or `null` if no user is authenticated.
 * @param {string} [user.uid] - The unique identifier of the user.
 * @returns {boolean} `true` if the user can be provisioned, otherwise `false`.
 */
function canProvision(user) {
  if (!user) return false;
  if (user.uid === "guest-user") return false;
  return !activeUids.has(user.uid);
}


/**
 * Ensures that a user entry exists in the database.
 * Reads existing data, merges it with the current user payload, and writes updates if necessary.
 *
 * @async
 * @param {Object} user - The authenticated user object containing identifying information.
 * @param {Object} db - The Firebase database instance with ref/getDatabase utilities.
 * @returns {Promise<void>} Resolves once the user entry has been verified or created.
 */
async function ensureUserEntry(user, db) {
  const ref = db.ref(db.getDatabase(), `users/${user.uid}`);
  const existing = await readSnapshot(db, ref);
  const values = buildUserPayload(user, existing);
  await writeWithRetry(db, ref, values);
}


/**
 * Ensures that a contact entry exists for the given user in the database.
 * Reads existing contact data, merges it with the user payload, and writes updates if needed.
 *
 * @async
 * @param {Object} user - The authenticated user object containing identifying information.
 * @param {Object} db - The Firebase database instance with ref/getDatabase utilities.
 * @returns {Promise<void>} Resolves once the contact entry has been verified or created.
 */
async function ensureContactEntry(user, db) {
  const ref = db.ref(db.getDatabase(), `contacts/${user.uid}`);
  const existing = await readSnapshot(db, ref);
  const values = buildContactPayload(user, existing);
  await writeWithRetry(db, ref, values);
}


/**
 * Reads data from a Firebase database reference and returns its value.
 * Safely handles errors and missing data by returning `null` instead.
 *
 * @async
 * @param {Object} db - The Firebase database instance providing the `get` method.
 * @param {Object} ref - The database reference to read from.
 * @returns {Promise<*>} The snapshot value if it exists, otherwise `null`.
 */
async function readSnapshot(db, ref) {
  try {
    const snap = await db.get(ref);
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}


/**
 * Writes data to a Firebase database reference with automatic retry logic.
 * Retries the write operation a limited number of times with incremental delay on failure.
 *
 * @async
 * @param {Object} db - The Firebase database instance providing the `set` method.
 * @param {Object} ref - The database reference where the data should be written.
 * @param {*} values - The data object or value to write to the database.
 * @returns {Promise<void>} Resolves when the data is successfully written or retries are exhausted.
 */
async function writeWithRetry(db, ref, values) {
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      await db.set(ref, values);
      return;
    } catch {
      await delay(RETRY_DELAY * attempt);
    }
  }
}


/**
 * Builds or updates the user payload object for database storage.
 * Merges existing data with current user properties and appends timestamps.
 *
 * @param {Object} user - The authenticated Firebase user object.
 * @param {?Object} existing - The existing user record from the database, if any.
 * @returns {Object} The normalized user payload including timestamps and provider info.
 */
function buildUserPayload(user, existing) {
  const base = existing || {};
  const entry = {
    ...base,
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    provider: readProvider(user),
  };
  return withTimestamps(entry, existing);
}


/**
 * Builds or updates the contact payload object for database storage.
 * Combines existing contact data with current user information and timestamps.
 *
 * @param {Object} user - The authenticated Firebase user object.
 * @param {?Object} existing - The existing contact record from the database, if any.
 * @returns {Object} The normalized contact payload including name, color, and initials.
 */
function buildContactPayload(user, existing) {
  const base = existing || {};
  const entry = {
    ...base,
    uid: user.uid,
    name: readName(user),
    email: user.email || "",
    phone: base.phone || "",
    color: pickColor(user.uid),
    initials: buildInitials(readName(user)),
  };
  return withTimestamps(entry, existing);
}


/**
 * Extracts the authentication provider ID from a Firebase user object.
 * Defaults to `"password"` if no provider information is available.
 *
 * @param {Object} user - The Firebase user object containing provider data.
 * @returns {string} The provider ID (e.g., `"google.com"`, `"password"`).
 */
function readProvider(user) {
  const provider = user.providerData?.[0]?.providerId;
  return provider || "password";
}


/**
 * Derives a readable name from the given user object.
 * Uses the display name if available, otherwise falls back to the email prefix.
 *
 * @param {Object} user - The Firebase user object containing user details.
 * @returns {string} The derived name or an empty string if unavailable.
 */
function readName(user) {
  if (user.displayName) return user.displayName;
  if (!user.email) return "";
  return user.email.split("@")[0];
}


/**
 * Adds or updates timestamp fields on a database entry.
 * Sets `createdAt` when the entry is new and always updates `updatedAt`.
 *
 * @param {Object} entry - The data object to augment with timestamps.
 * @param {?Object} existing - The existing database record, if any.
 * @returns {Object} The entry object including timestamp properties.
 */
function withTimestamps(entry, existing) {
  if (!existing) entry.createdAt = Date.now();
  entry.updatedAt = Date.now();
  return entry;
}


/**
 * Generates a consistent color based on a user's UID.
 * Converts a hash of the UID into an HSL color and returns it as a HEX string.
 *
 * @param {string} uid - The unique user identifier used to generate a color.
 * @returns {string} A HEX color string derived from the UID hash.
 */
function pickColor(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return hslToHex(hash % 360, 65, 55);
}


/**
 * Builds a set of initials from a given name string.
 * Extracts the first letter of up to two name parts and returns them in uppercase.
 *
 * @param {string} name - The full name to derive initials from.
 * @returns {string} The generated initials (e.g., "JD" for "John Doe").
 */
function buildInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
}


/**
 * Converts an HSL color value to a HEX color string.
 * Uses helper functions to compute RGB channels from hue, saturation, and lightness.
 *
 * @param {number} h - Hue value in degrees (0–360).
 * @param {number} s - Saturation percentage (0–100).
 * @param {number} l - Lightness percentage (0–100).
 * @returns {string} The corresponding HEX color string (e.g., "#3fa2cc").
 */
function hslToHex(h, s, l) {
  const sat = s / 100;
  const lig = l / 100;
  const f = (n) => computeChannel(n, h, sat, lig);
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}


/**
 * Computes a single RGB color channel value from HSL components.
 * Used internally by {@link hslToHex} to convert hue, saturation, and lightness to RGB.
 *
 * @param {number} n - Channel offset (0, 8, or 4) used in the HSL-to-RGB conversion.
 * @param {number} h - Hue value in degrees (0–360).
 * @param {number} s - Saturation value (0–1 range).
 * @param {number} l - Lightness value (0–1 range).
 * @returns {number} The computed RGB channel intensity (0–1 range).
 */
function computeChannel(n, h, s, l) {
  const k = (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
}


/**
 * Converts a normalized RGB channel value (0–1) to a two-digit HEX string.
 *
 * @param {number} value - The normalized RGB channel value (0–1 range).
 * @returns {string} The two-character HEX representation (e.g., "ff" for 1 or "00" for 0).
 */
function toHex(value) {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, "0");
}


/**
 * Delays execution for a specified number of milliseconds.
 * Useful for retry logic or timing control in async operations.
 *
 * @async
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} Resolves after the specified delay.
 */
async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
