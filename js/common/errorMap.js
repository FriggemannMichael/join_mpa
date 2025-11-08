const errorMessages = {
  "auth/invalid-email": "Invalid email address",
  "auth/user-disabled": "User account disabled",
  "auth/user-not-found": "User not found",
  "auth/wrong-password": "Wrong password",
  "auth/too-many-requests": "Too many attempts – please try again later",
  "auth/email-already-in-use": "Email already in use",
  "auth/weak-password": "Password is too weak (min. 6 characters)",
};


/**
 * Maps a Firebase authentication error to a human-readable message.
 * Falls back to a default text if the error code is unknown or missing.
 *
 * @param {{ code?: string }} err - Firebase error object containing an error code.
 * @returns {string} A user-friendly error message.
 */
export function mapFirebaseError(err) {
  if (!err || !err.code) return "Unknown error";
  return errorMessages[err.code] || "Login failed";
}
